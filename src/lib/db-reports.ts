/**
 * WoH SaaS — Live Report Generation from Supabase
 *
 * Async version of reports.ts that queries Supabase for live data instead of
 * reading from static JSON files. The existing reports.ts remains as-is for
 * the /compare page (Excel validation).
 *
 * Flow:
 *   1. Query all transactions from Supabase (jobs, billings, costs, collections, change orders, payments)
 *   2. Query job_data_entries for the given period (and prior period)
 *   3. Map everything to Excel-style types via db-types.ts mappers
 *   4. Feed into engine.ts computation functions
 *   5. Aggregate into schedule/note outputs
 */

import {
  getJobs,
  getChangeOrders,
  getBillings,
  getCollections,
  getCosts,
  getPayments,
  getJobDataEntriesForPeriod,
  getAppConfig,
} from './db'

import {
  mapDbJobToExcel,
  mapDbChangeOrderToExcel,
  mapDbBillingToExcel,
  mapDbCollectionToExcel,
  mapDbCostToExcel,
  mapDbPaymentToExcel,
} from './db-types'

import type { DbJob, DbJobDataEntry } from './db-types'

import {
  computeJobPeriodMetrics,
  computeSchedule1,
  computeSchedule2,
  computeSchedule3,
  computeNota6,
  computeNoteD,
  computeMetodoAlterno,
} from './engine'

import type { JobPeriodMetrics, JobStatus } from './types'

// ─── Return type for getAllReportDataLive ──────────────────────────────────

export interface ReportData {
  metrics: JobPeriodMetrics[]
  schedule1: ReturnType<typeof computeSchedule1>
  schedule2: ReturnType<typeof computeSchedule2>
  schedule3: ReturnType<typeof computeSchedule3>
  nota6: ReturnType<typeof computeNota6>
  noteD: ReturnType<typeof computeNoteD>
  metodoAlterno: ReturnType<typeof computeMetodoAlterno>
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Build a map of job_number -> DbJob for fast lookups.
 */
function buildJobMap(dbJobs: DbJob[]): Map<number, DbJob> {
  return new Map(dbJobs.map((j) => [j.job_number, j]))
}

/**
 * Build a map of job_number -> DbJobDataEntry for a set of entries (one period).
 */
function buildEntryByJobNumber(entries: DbJobDataEntry[]): Map<number, DbJobDataEntry> {
  return new Map(entries.map((e) => [e.job_number ?? 0, e]))
}

// ─── Core Functions ──────────────────────────────────────────────────────────

/**
 * Returns JobPeriodMetrics for all jobs at the given period.
 *
 * Queries Supabase for all transaction data and the job_data_entries for
 * the specified period, maps to Excel-style types, and computes metrics
 * using the engine.
 */
export async function getMetricsForPeriodLive(
  companyId: string,
  period: string
): Promise<JobPeriodMetrics[]> {
  // Fetch the app config to determine the prior period
  const config = await getAppConfig(companyId)
  const priorPeriod = config.priorPeriod1

  // Fetch all data in parallel
  const [
    dbJobs,
    dbChangeOrders,
    dbBillings,
    dbCollections,
    dbCosts,
    dbPayments,
    periodEntries,
    priorEntries,
  ] = await Promise.all([
    getJobs(companyId),
    getChangeOrders(companyId),
    getBillings(companyId),
    getCollections(companyId),
    getCosts(companyId),
    getPayments(companyId),
    getJobDataEntriesForPeriod(companyId, period),
    getJobDataEntriesForPeriod(companyId, priorPeriod),
  ])

  // Build lookup maps
  const jobMap = buildJobMap(dbJobs)
  const priorEntryMap = buildEntryByJobNumber(priorEntries)

  // Map all transactions to Excel-style types
  const changeOrders = dbChangeOrders.map(mapDbChangeOrderToExcel)
  const billings = dbBillings.map(mapDbBillingToExcel)
  const collections = dbCollections.map(mapDbCollectionToExcel)
  const costs = dbCosts.map(mapDbCostToExcel)
  const payments = dbPayments.map(mapDbPaymentToExcel)

  // Compute metrics for each active job data entry in this period
  return periodEntries
    .filter((entry) => entry.status !== 'Out of Report')
    .map((entry) => {
      const jobNumber = entry.job_number ?? 0
      const dbJob = jobMap.get(jobNumber)
      if (!dbJob) return null

      const job = mapDbJobToExcel(dbJob)

      // Look up the prior period entry for accurate prior-years revenue/cost
      const priorEntry = priorEntryMap.get(jobNumber)

      // Build priorPeriodRow from the prior period's computed metrics.
      // Since we only store status/pctOfDesiredCost/desiredCostToComplete in
      // job_data_entries (not computed values), we need to re-compute the prior
      // period's metrics to get the prior-year revenue/cost/billed/grossProfit.
      //
      // For the first implementation, when a prior entry exists we recursively
      // compute by running the engine for that entry. To avoid infinite recursion,
      // the prior period computation does NOT itself look up a prior-prior row.
      let priorPeriodRow: {
        revenueEarnedToDate: number
        costToDate: number
        billedToDate: number
        grossProfitToDate: number
      } | null = null

      if (priorEntry) {
        // Compute the prior period's metrics inline (no further recursion)
        const priorMetrics = computeJobPeriodMetrics({
          job,
          dataPeriod: priorPeriod,
          priorPeriod: config.priorPeriod2,
          status: priorEntry.status as JobStatus,
          pctOfDesiredCost: priorEntry.pct_of_desired_cost,
          desiredCostToComplete: priorEntry.desired_cost_to_complete,
          priorPeriodRow: null, // no further recursion
          changeOrders,
          billings,
          collections,
          costs,
          payments,
        })

        priorPeriodRow = {
          revenueEarnedToDate: priorMetrics.revenueEarnedToDate,
          costToDate: priorMetrics.costToDate,
          billedToDate: priorMetrics.billedToDate,
          grossProfitToDate: priorMetrics.grossProfitToDate,
        }
      }

      return computeJobPeriodMetrics({
        job,
        dataPeriod: period,
        priorPeriod,
        status: entry.status as JobStatus,
        pctOfDesiredCost: entry.pct_of_desired_cost,
        desiredCostToComplete: entry.desired_cost_to_complete,
        priorPeriodRow,
        changeOrders,
        billings,
        collections,
        costs,
        payments,
      })
    })
    .filter((m): m is JobPeriodMetrics => m !== null)
}

/**
 * All report data for a company at a given period — computed live from Supabase.
 *
 * Returns the same shape as reports.ts's getAllReportData(), but fetched
 * asynchronously from the database instead of static JSON.
 */
export async function getAllReportDataLive(
  companyId: string,
  period?: string
): Promise<ReportData> {
  const config = await getAppConfig(companyId)
  const currentPeriod = period ?? config.currentPeriod
  const priorPeriod = config.priorPeriod1

  // Fetch all data in parallel
  const [
    dbJobs,
    dbChangeOrders,
    dbBillings,
    dbCollections,
    dbCosts,
    dbPayments,
    currentEntries,
    priorEntries,
  ] = await Promise.all([
    getJobs(companyId),
    getChangeOrders(companyId),
    getBillings(companyId),
    getCollections(companyId),
    getCosts(companyId),
    getPayments(companyId),
    getJobDataEntriesForPeriod(companyId, currentPeriod),
    getJobDataEntriesForPeriod(companyId, priorPeriod),
  ])

  // Build lookup maps
  const jobMap = buildJobMap(dbJobs)
  const priorEntryMap = buildEntryByJobNumber(priorEntries)

  // Map all transactions to Excel-style types once
  const changeOrders = dbChangeOrders.map(mapDbChangeOrderToExcel)
  const billings = dbBillings.map(mapDbBillingToExcel)
  const collections = dbCollections.map(mapDbCollectionToExcel)
  const costs = dbCosts.map(mapDbCostToExcel)
  const payments = dbPayments.map(mapDbPaymentToExcel)

  // ── Helper: compute metrics for a set of job data entries at a period ──

  function computeMetricsForEntries(
    entries: DbJobDataEntry[],
    dataPeriod: string,
    entryPriorPeriod: string,
    priorMap: Map<number, DbJobDataEntry> | null
  ): JobPeriodMetrics[] {
    return entries
      .filter((entry) => entry.status !== 'Out of Report')
      .map((entry) => {
        const jobNumber = entry.job_number ?? 0
        const dbJob = jobMap.get(jobNumber)
        if (!dbJob) return null

        const job = mapDbJobToExcel(dbJob)

        // Build the prior period row if we have prior entry data
        let priorPeriodRow: {
          revenueEarnedToDate: number
          costToDate: number
          billedToDate: number
          grossProfitToDate: number
        } | null = null

        if (priorMap) {
          const priorEntry = priorMap.get(jobNumber)
          if (priorEntry) {
            const priorMetrics = computeJobPeriodMetrics({
              job,
              dataPeriod: entryPriorPeriod,
              priorPeriod: config.priorPeriod2,
              status: priorEntry.status as JobStatus,
              pctOfDesiredCost: priorEntry.pct_of_desired_cost,
              desiredCostToComplete: priorEntry.desired_cost_to_complete,
              priorPeriodRow: null,
              changeOrders,
              billings,
              collections,
              costs,
              payments,
            })

            priorPeriodRow = {
              revenueEarnedToDate: priorMetrics.revenueEarnedToDate,
              costToDate: priorMetrics.costToDate,
              billedToDate: priorMetrics.billedToDate,
              grossProfitToDate: priorMetrics.grossProfitToDate,
            }
          }
        }

        return computeJobPeriodMetrics({
          job,
          dataPeriod,
          priorPeriod: entryPriorPeriod,
          status: entry.status as JobStatus,
          pctOfDesiredCost: entry.pct_of_desired_cost,
          desiredCostToComplete: entry.desired_cost_to_complete,
          priorPeriodRow,
          changeOrders,
          billings,
          collections,
          costs,
          payments,
        })
      })
      .filter((m): m is JobPeriodMetrics => m !== null)
  }

  // ── Compute current and prior period metrics ──

  const metrics = computeMetricsForEntries(
    currentEntries,
    currentPeriod,
    priorPeriod,
    priorEntryMap
  )

  const priorMetrics = computeMetricsForEntries(
    priorEntries,
    priorPeriod,
    config.priorPeriod2,
    null // no prior-prior lookup
  )

  // ── Aggregate into report schedules/notes ──

  const schedule1 = computeSchedule1(metrics)
  const schedule2 = computeSchedule2(metrics)
  const schedule3 = computeSchedule3(metrics)
  const nota6 = computeNota6(metrics)
  const metodoAlterno = computeMetodoAlterno(metrics)

  // Note D — change order adjustments within the period
  const coAdjustments = dbChangeOrders
    .filter((co) => co.date > priorPeriod && co.date <= currentPeriod)
    .reduce((acc, co) => acc + (co.amount ?? 0), 0)

  // Identify new jobs (contracted after the prior period)
  const newJobs = metrics.filter((m) => {
    const dbJob = jobMap.get(m.jobNumber)
    return dbJob?.contract_date && dbJob.contract_date > priorPeriod
  })

  const noteD = computeNoteD(metrics, priorMetrics, newJobs, coAdjustments)

  return { metrics, schedule1, schedule2, schedule3, nota6, noteD, metodoAlterno }
}
