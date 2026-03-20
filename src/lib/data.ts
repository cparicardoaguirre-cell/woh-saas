import type { Customer, Job, ChangeOrder, Billing, Collection, Cost, Payment, JobDataRow, AppConfig } from './types'

// These imports work server-side in Next.js App Router
import customersRaw from '@/data/customers.json'
import jobsRaw from '@/data/jobs.json'
import changeOrdersRaw from '@/data/change_orders.json'
import billingsRaw from '@/data/billings.json'
import collectionsRaw from '@/data/collections.json'
import costsRaw from '@/data/costs.json'
import paymentsRaw from '@/data/payments.json'
import jobDataRaw from '@/data/job_data.json'
import configRaw from '@/data/config.json'

export const customers = customersRaw as unknown as Customer[]
export const jobs = jobsRaw as unknown as Job[]
export const changeOrders = changeOrdersRaw as unknown as ChangeOrder[]
export const billings = billingsRaw as unknown as Billing[]
export const collections = collectionsRaw as unknown as Collection[]
export const costs = costsRaw as unknown as Cost[]
export const payments = paymentsRaw as unknown as Payment[]
export const jobDataRows = jobDataRaw as unknown as JobDataRow[]

// ─── Config ───────────────────────────────────────────────────────────────────

const raw = configRaw as Record<string, unknown>

export const appConfig: AppConfig = {
  companyName: (raw.CompanyName as string) ?? 'DFM Contractors, LLC.',
  currentPeriod: (raw.CurrentEndingPeriod as string) ?? '2024-12-31',
  priorPeriod1: (raw.PriorEndedPeriod as string) ?? '2023-12-31',
  priorPeriod2: (raw.Prior2Period as string) ?? '2022-12-31',
  priorPeriod3: (raw.Prior3Period as string) ?? '2021-12-31',
  periodsShown: Number(raw.ListPeriodShown ?? 1),
  isProprietorship: String(raw.IsProprietorship ?? 'No').toLowerCase() === 'yes',
}

// ─── Lookup helpers ───────────────────────────────────────────────────────────

/** Returns the JobDataRow for a job at the given period, or undefined */
export function getJobDataAt(jobNumber: number, period: string): JobDataRow | undefined {
  return jobDataRows.find(
    (r) => r['Job #'] === jobNumber && r['Data Period'] === period
  )
}

/** Returns the latest JobDataRow for a job (most recent period) */
export function getLatestJobData(jobNumber: number): JobDataRow | undefined {
  return jobDataRows
    .filter((r) => r['Job #'] === jobNumber)
    .sort((a, b) => b['Data Period'].localeCompare(a['Data Period']))[0]
}

/** All unique periods present in job_data, sorted ascending */
export const allPeriods: string[] = [
  ...new Set(jobDataRows.map((r) => r['Data Period'])),
].sort()

/** All unique job numbers in job_data */
export const allJobNumbers: number[] = [
  ...new Set(jobDataRows.map((r) => r['Job #'])),
].sort((a, b) => a - b)

/** Map of job# → Job master record */
export const jobsByNumber = new Map<number, Job>(
  jobs.map((j) => [j['Job #'], j])
)
