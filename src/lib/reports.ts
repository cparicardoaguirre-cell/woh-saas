/**
 * Builds all report datasets from the extracted seed data (job_data.json).
 *
 * In production this would query the database. For comparison, we use
 * the Excel-computed values directly from job_data.json so we can verify
 * that our TypeScript engine matches, then switch to live computations.
 */

import { jobDataRows, appConfig, billings, costs, collections, changeOrders, jobs, jobsByNumber } from './data'
import { computeJobPeriodMetrics, computeSchedule1, computeSchedule2, computeSchedule3, computeNota6, computeNoteD, computeMetodoAlterno } from './engine'
import type { JobPeriodMetrics, JobDataRow } from './types'

/**
 * Returns JobPeriodMetrics for all jobs at the given period.
 * Uses the Excel-extracted rows as input and re-computes everything from
 * source transaction data so results can be compared to the Excel values.
 */
export function getMetricsForPeriod(period: string): JobPeriodMetrics[] {
  const periodRows = jobDataRows.filter((r) => r['Data Period'] === period)
  const priorPeriod = appConfig.priorPeriod1 // default prior period

  return periodRows
    .filter((r) => r.Status !== 'Out of Report')
    .map((row) => {
      const job = jobsByNumber.get(row['Job #'])
      if (!job) return null

      return computeJobPeriodMetrics({
        job,
        dataPeriod: period,
        priorPeriod,
        status: row.Status as JobPeriodMetrics['status'],
        pctOfDesiredCost: row['% of Desired Cost'],
        desiredCostToComplete: row['Desired Cost to Complete'],
        changeOrders,
        billings,
        collections,
        costs,
        payments: [],
      })
    })
    .filter((m): m is JobPeriodMetrics => m !== null)
}

/**
 * Returns the raw Excel-extracted metrics for a period (for comparison).
 * These are the values the Excel computed directly.
 */
export function getExcelMetricsForPeriod(period: string): JobDataRow[] {
  return jobDataRows.filter(
    (r) => r['Data Period'] === period && r.Status !== 'Out of Report'
  )
}

/**
 * All report data for the current period — computed by our TypeScript engine.
 */
export function getAllReportData(period: string = appConfig.currentPeriod) {
  const metrics = getMetricsForPeriod(period)
  const priorMetrics = getMetricsForPeriod(appConfig.priorPeriod1)

  const schedule1 = computeSchedule1(metrics)
  const schedule2 = computeSchedule2(metrics)
  const schedule3 = computeSchedule3(metrics)
  const nota6 = computeNota6(metrics)
  const metodoAlterno = computeMetodoAlterno(metrics)

  // Approximate CO adjustments for Note D
  const coAdjustments = changeOrders
    .filter((co) => co.Date > appConfig.priorPeriod1 && co.Date <= period)
    .reduce((acc, co) => acc + (co.Amount ?? 0), 0)

  const newJobs = metrics.filter((m) => {
    const job = jobsByNumber.get(m.jobNumber)
    return job?.['Contract Date'] && job['Contract Date'] > appConfig.priorPeriod1
  })

  const noteD = computeNoteD(metrics, priorMetrics, newJobs, coAdjustments)

  return { metrics, schedule1, schedule2, schedule3, nota6, noteD, metodoAlterno }
}

/**
 * Side-by-side comparison: our computed values vs. Excel's for a given period.
 * Returns rows where there is a meaningful difference.
 */
export function compareWithExcel(period: string = appConfig.currentPeriod) {
  const computed = getMetricsForPeriod(period)
  const excel = getExcelMetricsForPeriod(period)

  const excelByJob = new Map(excel.map((r) => [r['Job #'], r]))

  return computed.map((m) => {
    const ex = excelByJob.get(m.jobNumber)
    if (!ex) return null

    const diff = (our: number, their: number | null | undefined) =>
      Math.abs((our ?? 0) - (their ?? 0))

    return {
      jobNumber: m.jobNumber,
      jobDescription: m.jobDescription,
      period,
      our: {
        revenueToDate: m.revenueEarnedToDate,
        costToDate: m.costToDate,
        grossProfitToDate: m.grossProfitToDate,
        revenueCurrentPeriod: m.revenueCurrentPeriod,
        billedToDate: m.billedToDate,
        contractAssets: m.contractAssets,
        contractLiability: m.contractLiability,
        pctComplete: m.pctComplete,
        appliedPct: m.appliedPctOfCost,
      },
      excel: {
        revenueToDate: ex['Revenue Earned to Date'],
        costToDate: ex['Cost of Construction to Date'],
        grossProfitToDate: ex['Gross Profit to Date'],
        revenueCurrentPeriod: ex['Gross Profit Current Period'],
        billedToDate: ex['Progress Billings to Date'],
        contractAssets: ex['Contract Assets'],
        contractLiability: ex['Contract Liability'],
        pctComplete: ex['% Completed'],
        appliedPct: ex['Applied % of Cost'],
      },
      diffs: {
        revenueToDate: diff(m.revenueEarnedToDate, ex['Revenue Earned to Date']),
        costToDate: diff(m.costToDate, ex['Cost of Construction to Date']),
        grossProfitToDate: diff(m.grossProfitToDate, ex['Gross Profit to Date']),
        billedToDate: diff(m.billedToDate, ex['Progress Billings to Date']),
      },
    }
  }).filter((r): r is NonNullable<typeof r> => r !== null)
}
