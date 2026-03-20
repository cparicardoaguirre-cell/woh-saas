/**
 * WoH Computation Engine
 *
 * Replicates the Excel Job Data table formula logic in TypeScript.
 * All formulas are derived from the analyzed Excel workbook.
 */

import type { Job, ChangeOrder, Billing, Collection, Cost, Payment, JobPeriodMetrics, JobStatus } from './types'

interface EngineInput {
  job: Job
  dataPeriod: string        // ISO date "YYYY-MM-DD"
  priorPeriod: string       // ISO date — prior period end for "prior years" computations
  status: JobStatus
  pctOfDesiredCost?: number | null    // user-entered, e.g. 0.85
  desiredCostToComplete?: number | null // user-entered override

  changeOrders: ChangeOrder[]
  billings: Billing[]
  collections: Collection[]
  costs: Cost[]
  payments: Payment[]
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function sumIf<T>(arr: T[], filter: (item: T) => boolean, value: (item: T) => number): number {
  return arr.reduce((acc, item) => (filter(item) ? acc + (value(item) ?? 0) : acc), 0)
}

function lte(date: string, ceiling: string): boolean {
  return date <= ceiling
}

// ─── Core Engine Function ─────────────────────────────────────────────────────

export function computeJobPeriodMetrics(input: EngineInput): JobPeriodMetrics {
  const {
    job,
    dataPeriod,
    priorPeriod,
    status,
    pctOfDesiredCost,
    desiredCostToComplete,
    changeOrders,
    billings,
    collections,
    costs,
    payments,
  } = input

  const jobNum = job['Job #']
  const originalAmount = job['Original Contract Amount'] ?? 0
  const retainagePct = job['Retainage'] ?? 0
  const autoRetainage = (job['Automatic Retainage'] ?? 'NO') === 'YES'

  // ── Change Orders ──────────────────────────────────────────────────────────

  const approvedChangeOrders = sumIf(
    changeOrders,
    (co) => co['Job Number'] === jobNum && co.Approved === 'YES' && lte(co.Date, dataPeriod),
    (co) => co.Amount
  )

  const pendingChangeOrders = sumIf(
    changeOrders,
    (co) => co['Job Number'] === jobNum && co.Approved !== 'YES' && lte(co.Date, dataPeriod),
    (co) => co.Amount
  )

  const actualContractAmount = originalAmount + approvedChangeOrders
  const projectedContractAmount = actualContractAmount + pendingChangeOrders

  // ── Costs ──────────────────────────────────────────────────────────────────

  const costToDate = sumIf(
    costs,
    (c) => c['Job Number'] === jobNum && lte(c.Date, dataPeriod),
    (c) => c.Amount ?? 0
  )

  const costPriorYears = sumIf(
    costs,
    (c) => c['Job Number'] === jobNum && lte(c.Date, priorPeriod),
    (c) => c.Amount ?? 0
  )

  const costCurrentPeriod = costToDate - costPriorYears

  // ── Applied % of Cost (the key revenue recognition driver) ─────────────────
  //
  //   IF Status = 'Completed':  appliedPct = costToDate / projectedContractAmount
  //   ELSE IF (costToDate + DesiredCTC) > Projected × %OfDesiredCost:
  //       appliedPct = (costToDate + DesiredCTC) / Projected
  //   ELSE:
  //       appliedPct = %OfDesiredCost

  const desiredCTC = desiredCostToComplete ?? 0
  const pctDesired = pctOfDesiredCost ?? null

  let appliedPct: number
  if (status === 'Completed') {
    appliedPct = projectedContractAmount > 0 ? costToDate / projectedContractAmount : 1
  } else if (pctDesired !== null) {
    const threshold = projectedContractAmount * pctDesired
    if (costToDate + desiredCTC > threshold) {
      appliedPct = projectedContractAmount > 0 ? (costToDate + desiredCTC) / projectedContractAmount : 0
    } else {
      appliedPct = pctDesired
    }
  } else {
    // No desired cost input — use simple cost/projected
    appliedPct = projectedContractAmount > 0 ? costToDate / projectedContractAmount : 0
  }

  // Clamp to [0, 1]
  appliedPct = Math.max(0, Math.min(1, appliedPct))

  // ── Revenue Earned to Date ─────────────────────────────────────────────────
  //
  //   IF costToDate > projectedContractAmount → cap at projectedContractAmount
  //   ELSE → (1 + (1 - appliedPct) / appliedPct) × costToDate
  //        = costToDate / appliedPct  (simplified)

  let revenueEarnedToDate: number
  if (costToDate > projectedContractAmount) {
    revenueEarnedToDate = projectedContractAmount
  } else if (appliedPct <= 0) {
    revenueEarnedToDate = 0
  } else {
    revenueEarnedToDate = costToDate / appliedPct
  }

  // ── Revenue Prior Years ────────────────────────────────────────────────────
  // This should be the Revenue Earned from the prior period's job data row.
  // Since we're computing from scratch, we approximate using cost-based formula
  // applied to prior period costs. In production, query the prior period row.

  const appliedPctPrior = projectedContractAmount > 0
    ? Math.min(1, costPriorYears / projectedContractAmount)
    : 0

  let revenuePriorYears: number
  if (costPriorYears > projectedContractAmount) {
    revenuePriorYears = projectedContractAmount
  } else if (appliedPctPrior <= 0) {
    revenuePriorYears = 0
  } else {
    revenuePriorYears = costPriorYears / appliedPctPrior
  }

  const revenueCurrentPeriod = revenueEarnedToDate - revenuePriorYears

  // ── Gross Profit ───────────────────────────────────────────────────────────

  const grossProfitToDate = revenueEarnedToDate - costToDate
  const grossProfitPriorYears = revenuePriorYears - costPriorYears
  const grossProfitCurrentPeriod = revenueCurrentPeriod - costCurrentPeriod

  // ── Billings ───────────────────────────────────────────────────────────────

  const billedToDate = sumIf(
    billings,
    (b) => b['Job Number'] === jobNum && lte(b.Date, dataPeriod),
    (b) => b.Amount ?? 0
  )

  const billedPriorYears = sumIf(
    billings,
    (b) => b['Job Number'] === jobNum && lte(b.Date, priorPeriod),
    (b) => b.Amount ?? 0
  )

  const billedCurrentPeriod = billedToDate - billedPriorYears

  // ── Contract Assets / Liabilities (ASC 606) ───────────────────────────────

  const contractAssets = Math.max(0, revenueEarnedToDate - billedToDate)
  const contractLiability = Math.max(0, billedToDate - revenueEarnedToDate)

  // ── Cost to Complete ───────────────────────────────────────────────────────
  //
  //   IF Completed:  CTC = (Projected × appliedPct) - costToDate
  //   ELSE IF %OfDesiredCost is null: use desiredCTC (manual override)
  //   ELSE IF (cost + DesiredCTC) > (Projected × %ofDesiredCost):
  //       CTC = (Projected × appliedPct) - costToDate
  //   ELSE:
  //       CTC = (Projected × %ofDesiredCost) - costToDate

  let costToComplete: number
  if (status === 'Completed') {
    costToComplete = Math.max(0, projectedContractAmount * appliedPct - costToDate)
  } else if (pctDesired === null || pctDesired === undefined) {
    costToComplete = desiredCTC
  } else {
    const threshold = projectedContractAmount * pctDesired
    if (costToDate + desiredCTC > threshold) {
      costToComplete = Math.max(0, projectedContractAmount * appliedPct - costToDate)
    } else {
      costToComplete = Math.max(0, projectedContractAmount * pctDesired - costToDate)
    }
  }

  const totalCost = costToDate + costToComplete

  // ── % Completed ────────────────────────────────────────────────────────────

  const pctComplete = totalCost > 0 ? costToDate / totalCost : (status === 'Completed' ? 1 : 0)

  // ── Retainage ─────────────────────────────────────────────────────────────

  const retainageAmountToDate = revenueEarnedToDate * retainagePct

  const totalCollected = sumIf(
    collections,
    (c) => c['Job Number'] === jobNum && lte(c['Payment Date'], dataPeriod),
    (c) => c.Amount ?? 0
  )

  let retainageCollectedToDate = 0
  if (autoRetainage) {
    const billedMinusRetainage = projectedContractAmount * (1 - retainagePct)
    if (revenueEarnedToDate >= billedMinusRetainage) {
      retainageCollectedToDate = Math.max(0, totalCollected - billedMinusRetainage)
    } else {
      retainageCollectedToDate = 0
    }
  }

  const retainageReceivable = Math.max(0, retainageAmountToDate - retainageCollectedToDate)

  // ── Alternative Project Number ─────────────────────────────────────────────
  // Pattern: sub-job prefix + "-" + CustomerName + "-" + startYear + " to " + endYear

  const contractYear = job['Contract Date'] ? job['Contract Date'].slice(0, 4) : ''
  const completedYear = job['Completed Date'] ? job['Completed Date'].slice(0, 4) : ''
  const yearRange = contractYear && completedYear && contractYear !== completedYear
    ? `${contractYear} to ${completedYear}`
    : contractYear
  const altProjectNumber = yearRange
    ? `-${job.Customer}-${yearRange}`
    : null

  return {
    jobNumber: jobNum,
    jobDescription: job['Job Description'] ?? '',
    owner: job.Owner ?? '',
    customer: job.Customer ?? '',
    contractDate: job['Contract Date'],
    completedDate: job['Completed Date'],
    county: job.County ?? null,
    dataPeriod,
    status,

    originalContractAmount: originalAmount,
    approvedChangeOrders,
    pendingChangeOrders,
    projectedContractAmount,
    actualContractAmount,

    revenueEarnedToDate,
    revenuePriorYears,
    revenueCurrentPeriod,

    costToDate,
    costPriorYears,
    costCurrentPeriod,

    grossProfitToDate,
    grossProfitPriorYears,
    grossProfitCurrentPeriod,

    billedToDate,
    billedPriorYears,
    billedCurrentPeriod,

    contractAssets,
    contractLiability,

    costToComplete,
    totalCost,

    retainagePct,
    retainageAmountToDate,
    retainageCollectedToDate,
    retainageReceivable,

    pctComplete: Math.max(0, Math.min(1, pctComplete)),
    appliedPctOfCost: appliedPct,

    desiredCostToComplete: desiredCTC || null,
    pctOfDesiredCost: pctDesired,

    alternativeProjectNumber: altProjectNumber,
  }
}

// ─── Report Aggregation Helpers ───────────────────────────────────────────────

/** Aggregate Schedule 1 data from a set of metrics rows */
export function computeSchedule1(metrics: JobPeriodMetrics[]) {
  const completed = metrics.filter((m) => m.status === 'Completed')
  const inProgress = metrics.filter((m) =>
    m.status === 'In Progress' || m.status === 'Paused' || m.status === 'Inactive'
  )

  const sum = (rows: JobPeriodMetrics[], fn: (m: JobPeriodMetrics) => number) =>
    rows.reduce((acc, m) => acc + fn(m), 0)

  const completedRevenue = sum(completed, (m) => m.revenueCurrentPeriod)
  const completedCost = sum(completed, (m) => m.costCurrentPeriod)
  const completedGP = completedRevenue - completedCost

  const inProgressRevenue = sum(inProgress, (m) => m.revenueCurrentPeriod)
  const inProgressCost = sum(inProgress, (m) => m.costCurrentPeriod)
  const inProgressGP = inProgressRevenue - inProgressCost

  return {
    completed: { revenue: completedRevenue, cost: completedCost, grossProfit: completedGP },
    inProgress: { revenue: inProgressRevenue, cost: inProgressCost, grossProfit: inProgressGP },
    total: {
      revenue: completedRevenue + inProgressRevenue,
      cost: completedCost + inProgressCost,
      grossProfit: completedGP + inProgressGP,
    },
  }
}

/** Schedule 2 — completed contracts */
export function computeSchedule2(metrics: JobPeriodMetrics[]) {
  return metrics
    .filter((m) => m.status === 'Completed')
    .sort((a, b) => a.jobNumber - b.jobNumber)
}

/** Schedule 3 — contracts in progress */
export function computeSchedule3(metrics: JobPeriodMetrics[]) {
  return metrics
    .filter((m) =>
      m.status === 'In Progress' || m.status === 'Paused' || m.status === 'Inactive'
    )
    .sort((a, b) => a.jobNumber - b.jobNumber)
}

/** Nota 6 — Cost and Estimated Earnings on Contracts in Progress */
export function computeNota6(metrics: JobPeriodMetrics[]) {
  const active = metrics.filter(
    (m) => m.status === 'In Progress' || m.status === 'Paused' || m.status === 'Inactive'
  )

  const costIncurred = active.reduce((acc, m) => acc + m.costToDate, 0)
  const estimatedEarnings = active.reduce((acc, m) => acc + m.grossProfitToDate, 0)
  const revenueEarned = costIncurred + estimatedEarnings
  const billingsToDate = active.reduce((acc, m) => acc + m.billedToDate, 0)

  const contractAssets = active.reduce((acc, m) => acc + m.contractAssets, 0)
  const contractLiability = active.reduce((acc, m) => acc + m.contractLiability, 0)

  return {
    costIncurred,
    estimatedEarnings,
    revenueEarned,
    billingsToDate,
    difference: revenueEarned - billingsToDate,
    contractAssets,
    contractLiability,
    net: contractAssets - contractLiability,
  }
}

/** Note 7 / Note D — Backlog Analysis */
export function computeNoteD(
  currentMetrics: JobPeriodMetrics[],
  priorMetrics: JobPeriodMetrics[],
  newJobsInPeriod: JobPeriodMetrics[],
  coAdjustments: number
) {
  const priorBacklog = priorMetrics
    .filter((m) => m.status !== 'Completed' && m.status !== 'Out of Report')
    .reduce((acc, m) => acc + (m.projectedContractAmount - m.revenueEarnedToDate), 0)

  const newContracts = newJobsInPeriod.reduce((acc, m) => acc + m.projectedContractAmount, 0)

  const revenueCurrentPeriod = currentMetrics.reduce((acc, m) => acc + m.revenueCurrentPeriod, 0)

  const endingBacklog = priorBacklog + newContracts + coAdjustments - revenueCurrentPeriod

  return {
    priorBacklog: Math.max(0, priorBacklog),
    newContracts,
    coAdjustments,
    subtotal: priorBacklog + newContracts + coAdjustments,
    revenueEarned: revenueCurrentPeriod,
    endingBacklog: Math.max(0, endingBacklog),
  }
}

/** Método Alterno — Alternative income recognition */
export function computeMetodoAlterno(metrics: JobPeriodMetrics[]) {
  return metrics
    .filter((m) => m.status !== 'Out of Report')
    .map((m) => ({
      jobNumber: m.jobNumber,
      jobDescription: m.jobDescription,
      revenueCurrentPeriod: m.revenueCurrentPeriod,
      retainageCollectedCurrentPeriod: m.retainageCollectedToDate, // simplified
      retainageAmountCurrentPeriod: m.retainageAmountToDate,
      adjustedRevenue: m.revenueCurrentPeriod + m.retainageCollectedToDate - m.retainageAmountToDate,
      costCurrentPeriod: m.costCurrentPeriod,
      grossProfit: m.revenueCurrentPeriod + m.retainageCollectedToDate - m.retainageAmountToDate - m.costCurrentPeriod,
    }))
    .filter((row) =>
      Math.abs(row.revenueCurrentPeriod) > 0.01 ||
      Math.abs(row.adjustedRevenue) > 0.01 ||
      Math.abs(row.costCurrentPeriod) > 0.01
    )
    .sort((a, b) => a.jobNumber - b.jobNumber)
}
