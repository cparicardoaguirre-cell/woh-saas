# WoH SaaS: Supabase Schema Gap Analysis (April 2026)

## 1. Frontend Data Requirements vs. Schema Support

Based on the React report pages, the following fields are missing or not supported by the current database schema and views:

### Schedule 1 & Schedule 2 (Financial Schedules)
* **Gap:** `gross_profit_current_period` is missing explicitly from the `SELECT` list in the `job_period_metrics` view, though its components exist.
* **Critical Gap:** `revenue_prior_years` is hardcoded to `0::NUMERIC` in the view (with a comment "app fills this"). This makes native DB-level filtering, sorting, or server-side pagination impossible for `revenue_current_period`, which is currently miscalculated in the DB as `revenue_earned_to_date - 0`.

### Schedule 3 (Contracts in Progress)
* **Gap:** While it pulls `contractAssets` and `contractLiability` correctly, the current period revenue relies on the flawed calculation mentioned above. 

### Metodo Alterno (Alternative Method of Accounting - PR Specific)
* **Structural Gap:** The frontend expects `retainageCollectedCurrentPeriod`, `retainageAmountCurrentPeriod`, and `adjustedRevenue`. The DB only tracks `retainage_amount_to_date` and total `collected_to_date`. There is no flag in the `collections` table to distinguish retainage payments from regular AR payments, making it impossible to compute `retainageCollectedCurrentPeriod` accurately.

### Note 7 (Backlog Analysis)
* **Structural Gap:** The frontend expects a period-over-period backlog rollforward: `priorBacklog`, `newContracts` (additions in the period), and `coAdjustments` (change orders approved in the period). The view only exposes lifetime `projected_contract_amount` and `approved_cos` to date. It lacks the temporal boundaries required to isolate current period contract additions and modifications.

---

## 2. Incorrect or Missing Computed Views

### Incorrect: `job_period_metrics` (`002_computed_views.sql`)
1. **Unused CTE (`prior_period_rev`):** The view goes through the trouble of computing the prior period's revenue using a complex `LEFT JOIN LATERAL` CTE, but it **never joins this CTE** into the `base` calculation. This renders the CTE useless and breaks the prior-year revenue figures.
2. **Current Period Calculations:** Due to the missing join, `revenue_current_period` and `cost_current_period` do not actually deduct the prior year amounts. 

### Missing: `metodo_alterno_metrics`
* There is no dedicated view to handle the PR tax "Alternative Method" (Método Alterno) computations, which require tracking the specific delta of uncollected retainage to adjust GAAP revenue to Tax revenue.

### Missing: `backlog_rollforward`
* There is no view isolating contract additions (`contract_date` within `data_period`) and change orders (`co.date` within `data_period`) to produce the Note 7 rollforward.

---

## 3. Required Additional Migrations

To resolve these gaps, the following migrations are required:

1. **`004_fix_job_period_metrics.sql`**
   * Update the `job_period_metrics` view to correctly join `prior_period_rev`.
   * Pull `prior_revenue`, `prior_cost`, and `prior_billed` into the main `SELECT` to replace the hardcoded `0::NUMERIC`.
   * Add `gross_profit_current_period` to the `SELECT` list.

2. **`005_retainage_tracking.sql`**
   * `ALTER TABLE collections ADD COLUMN is_retainage BOOLEAN DEFAULT FALSE;`
   * This allows the system to distinguish between regular AR collections and retainage collections.

3. **`006_metodo_alterno_view.sql`**
   * Create a new view that calculates `retainage_amount_current_period` and `retainage_collected_current_period` using the new flag.
   * Compute `adjustedRevenue` (GAAP Revenue - Change in Uncollected Retainage).

4. **`007_backlog_rollforward_view.sql`**
   * Create a new view `job_backlog_rollforward` that filters `jobs` and `change_orders` by comparing their dates against the `data_period` to output `new_contracts` and `co_adjustments` strictly for the reporting period.

---

## 4. Deep Research Verification (ASC 606 & PR Requirements)

### ASC 606 vs. SOP 81-1 (SSAP 91)
* **Terminology Alignment:** SOP 81-1 (and its UK equivalent SSAP 91) utilized "Costs and Estimated Earnings in Excess of Billings." Under **ASC 606** (IFRS 15), this is replaced by the "Over Time" revenue recognition model. The schema correctly implements ASC 606 terminology by explicitly using **`contract_assets`** and **`contract_liability`** rather than the legacy terms.
* **Input Method:** The view's calculation of `applied_pct_of_cost` (`cost_to_date / projected_contract_amount`) perfectly aligns with the ASC 606 "Input Method" for measuring progress toward satisfying a performance obligation.

### Puerto Rico Specifics (Nota 6 & Nota 7 / Método Alterno)
* **Nota 6 (Cost & Estimated Earnings):** Standard GAAP disclosure. The schema correctly nets contract assets and liabilities at the job level.
* **Nota 7 (Backlog):** Standard disclosure for construction entities showing remaining performance obligations. 
* **Método Alterno (Alternative Method):** The Puerto Rico Internal Revenue Code allows qualifying contractors to use an alternative method of accounting for income tax purposes. This method typically defers the recognition of revenue associated with retainage until the right to receive it is unconditional or it is collected. The frontend's expectation of `retainageCollectedCurrentPeriod` and `adjustedRevenue` is completely accurate for PR tax compliance (Schedule L / Schedule M-1 adjustments on the PR Corporate Return). The proposed migration `005` and `006` are critical to support this PR-specific tax requirement.