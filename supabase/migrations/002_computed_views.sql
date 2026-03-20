-- ============================================================
-- WoH SaaS — Computed Views (replaces Excel formulas)
-- Percentage-of-completion revenue recognition (ASC 606)
-- ============================================================

-- ── Job Period Metrics View ───────────────────────────────────────────────────
-- One row per job per reporting period, all metrics computed from source tables.
-- This is the SQL equivalent of the Excel "Job Data" sheet.

CREATE OR REPLACE VIEW job_period_metrics AS
WITH

-- Approved & pending change orders per job per period
co_totals AS (
  SELECT
    jde.id                AS entry_id,
    jde.job_id,
    jde.data_period,
    COALESCE(SUM(co.amount) FILTER (WHERE co.approved AND co.date <= jde.data_period), 0) AS approved_cos,
    COALESCE(SUM(co.amount) FILTER (WHERE NOT co.approved AND co.date <= jde.data_period), 0) AS pending_cos
  FROM job_data_entries jde
  LEFT JOIN change_orders co ON co.job_id = jde.job_id AND co.company_id = jde.company_id
  GROUP BY jde.id, jde.job_id, jde.data_period
),

-- Costs to date and prior year costs per job per period
cost_totals AS (
  SELECT
    jde.id                AS entry_id,
    jde.job_id,
    jde.data_period,
    COALESCE(SUM(c.amount) FILTER (WHERE c.date <= jde.data_period), 0)  AS cost_to_date,
    COALESCE(SUM(c.amount) FILTER (WHERE c.date <= (jde.data_period - INTERVAL '1 year')::DATE), 0) AS cost_prior_years
  FROM job_data_entries jde
  LEFT JOIN costs c ON c.job_id = jde.job_id AND c.company_id = jde.company_id
  GROUP BY jde.id, jde.job_id, jde.data_period
),

-- Billings to date and prior year billings
billing_totals AS (
  SELECT
    jde.id                AS entry_id,
    jde.job_id,
    jde.data_period,
    COALESCE(SUM(b.amount) FILTER (WHERE b.date <= jde.data_period), 0)  AS billed_to_date,
    COALESCE(SUM(b.amount) FILTER (WHERE b.date <= (jde.data_period - INTERVAL '1 year')::DATE), 0) AS billed_prior_years
  FROM job_data_entries jde
  LEFT JOIN billings b ON b.job_id = jde.job_id AND b.company_id = jde.company_id
  GROUP BY jde.id, jde.job_id, jde.data_period
),

-- Collections to date per job
collection_totals AS (
  SELECT
    jde.id                AS entry_id,
    jde.job_id,
    jde.data_period,
    COALESCE(SUM(col.amount) FILTER (WHERE col.payment_date <= jde.data_period), 0) AS collected_to_date
  FROM job_data_entries jde
  LEFT JOIN collections col ON col.job_id = jde.job_id AND col.company_id = jde.company_id
  GROUP BY jde.id, jde.job_id, jde.data_period
),

-- Prior period row lookup for accurate prior-year revenue
prior_period_rev AS (
  SELECT DISTINCT ON (jde.job_id, jde.data_period)
    jde.id                AS entry_id,
    jde.job_id,
    jde.data_period,
    -- Find the most recent prior period row
    prior_jde.revenue_earned_to_date  AS prior_revenue,
    prior_jde.cost_to_date            AS prior_cost,
    prior_jde.billed_to_date          AS prior_billed
  FROM job_data_entries jde
  -- Self-join: prior period = latest entry before current data_period
  LEFT JOIN LATERAL (
    SELECT
      jde2.id,
      ct2.cost_to_date,
      bt2.billed_to_date,
      -- We need the computed revenue from the prior row — stored in a helper CTE
      -- For now, we'll compute it inline (simplified)
      ct2.cost_to_date AS revenue_earned_to_date  -- placeholder, overridden below
    FROM job_data_entries jde2
    JOIN cost_totals ct2 ON ct2.entry_id = jde2.id
    JOIN billing_totals bt2 ON bt2.entry_id = jde2.id
    WHERE jde2.job_id = jde.job_id
      AND jde2.data_period < jde.data_period
    ORDER BY jde2.data_period DESC
    LIMIT 1
  ) prior_jde ON TRUE
),

-- Base computation
base AS (
  SELECT
    jde.id,
    jde.company_id,
    jde.job_id,
    jde.data_period,
    jde.status,
    jde.pct_of_desired_cost,
    jde.desired_cost_to_complete,

    j.job_number,
    j.description         AS job_description,
    j.original_contract_amount,
    j.retainage_pct,
    j.automatic_retainage,
    j.contract_date,
    j.completed_date,
    j.municipality_id,
    owner_c.name          AS owner_name,
    cust_c.name           AS customer_name,

    ct.cost_to_date,
    ct.cost_prior_years,
    bt.billed_to_date,
    bt.billed_prior_years,
    cot.collected_to_date,
    cot2.approved_cos,
    cot2.pending_cos,

    -- Derived contract amounts
    j.original_contract_amount + cot2.approved_cos                             AS actual_contract_amount,
    j.original_contract_amount + cot2.approved_cos + cot2.pending_cos          AS projected_contract_amount

  FROM job_data_entries jde
  JOIN jobs j ON j.id = jde.job_id
  LEFT JOIN customers owner_c ON owner_c.id = j.owner_id
  LEFT JOIN customers cust_c  ON cust_c.id  = j.customer_id
  JOIN cost_totals    ct   ON ct.entry_id  = jde.id
  JOIN billing_totals bt   ON bt.entry_id  = jde.id
  JOIN collection_totals cot ON cot.entry_id = jde.id
  JOIN co_totals      cot2 ON cot2.entry_id = jde.id
),

-- Revenue recognition (percentage-of-completion)
revenue_calc AS (
  SELECT
    b.*,

    -- Applied % of Cost (the key driver)
    CASE
      WHEN b.status = 'Completed' THEN
        LEAST(1.0, CASE WHEN b.projected_contract_amount > 0
          THEN b.cost_to_date / b.projected_contract_amount ELSE 1.0 END)
      WHEN b.pct_of_desired_cost IS NOT NULL THEN
        CASE
          WHEN b.cost_to_date + COALESCE(b.desired_cost_to_complete, 0)
               > b.projected_contract_amount * b.pct_of_desired_cost
          THEN LEAST(1.0, CASE WHEN b.projected_contract_amount > 0
               THEN (b.cost_to_date + COALESCE(b.desired_cost_to_complete, 0)) / b.projected_contract_amount
               ELSE 0 END)
          ELSE b.pct_of_desired_cost
        END
      ELSE
        LEAST(1.0, CASE WHEN b.projected_contract_amount > 0
          THEN b.cost_to_date / b.projected_contract_amount ELSE 0 END)
    END AS applied_pct_of_cost

  FROM base b
),

-- Revenue earned to date
revenue_final AS (
  SELECT
    r.*,

    -- Revenue Earned to Date
    CASE
      WHEN r.cost_to_date > r.projected_contract_amount THEN r.projected_contract_amount
      WHEN r.applied_pct_of_cost <= 0 THEN 0
      ELSE r.cost_to_date / r.applied_pct_of_cost
    END AS revenue_earned_to_date,

    -- Cost to Complete
    CASE
      WHEN r.status = 'Completed' THEN
        GREATEST(0, r.projected_contract_amount * r.applied_pct_of_cost - r.cost_to_date)
      WHEN r.pct_of_desired_cost IS NULL THEN
        COALESCE(r.desired_cost_to_complete, 0)
      WHEN r.cost_to_date + COALESCE(r.desired_cost_to_complete, 0)
           > r.projected_contract_amount * r.pct_of_desired_cost
      THEN
        GREATEST(0, r.projected_contract_amount * r.applied_pct_of_cost - r.cost_to_date)
      ELSE
        GREATEST(0, r.projected_contract_amount * r.pct_of_desired_cost - r.cost_to_date)
    END AS cost_to_complete

  FROM revenue_calc r
)

SELECT
  rf.id                   AS entry_id,
  rf.company_id,
  rf.job_id,
  rf.job_number,
  rf.job_description,
  rf.data_period,
  rf.status,
  rf.owner_name,
  rf.customer_name,
  rf.contract_date,
  rf.completed_date,
  rf.municipality_id,

  -- Contract amounts
  rf.original_contract_amount,
  rf.approved_cos,
  rf.pending_cos,
  rf.actual_contract_amount,
  rf.projected_contract_amount,

  -- Revenue (current period = to_date minus prior_years; prior_years from prior row)
  rf.revenue_earned_to_date,
  rf.cost_to_date,
  rf.billed_to_date,

  -- These will be enriched by joining with prior period row in the application layer
  -- (prior-year values require a self-join which is done in the app for accuracy)
  0::NUMERIC                              AS revenue_prior_years,   -- app fills this
  rf.cost_prior_years,
  rf.billed_prior_years,

  rf.revenue_earned_to_date - 0           AS revenue_current_period, -- app fills after prior_years
  rf.cost_to_date - rf.cost_prior_years   AS cost_current_period,
  rf.billed_to_date - rf.billed_prior_years AS billed_current_period,

  -- GP
  rf.revenue_earned_to_date - rf.cost_to_date AS gross_profit_to_date,

  -- ASC 606 Contract Assets / Liabilities
  GREATEST(0, rf.revenue_earned_to_date - rf.billed_to_date) AS contract_assets,
  GREATEST(0, rf.billed_to_date - rf.revenue_earned_to_date) AS contract_liability,

  -- Cost to Complete & % Complete
  rf.cost_to_complete,
  rf.cost_to_date + rf.cost_to_complete                       AS total_cost,
  CASE WHEN rf.cost_to_date + rf.cost_to_complete > 0
    THEN rf.cost_to_date / (rf.cost_to_date + rf.cost_to_complete)
    ELSE CASE WHEN rf.status = 'Completed' THEN 1.0 ELSE 0 END
  END                                                          AS pct_complete,

  -- Retainage
  rf.retainage_pct,
  rf.automatic_retainage,
  rf.revenue_earned_to_date * rf.retainage_pct                AS retainage_amount_to_date,
  rf.collected_to_date,
  GREATEST(0, rf.revenue_earned_to_date * rf.retainage_pct)   AS retainage_receivable,

  rf.applied_pct_of_cost,
  rf.pct_of_desired_cost,
  rf.desired_cost_to_complete

FROM revenue_final rf
WHERE rf.status != 'Out of Report';
