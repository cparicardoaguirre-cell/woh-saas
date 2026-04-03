/**
 * WoH SaaS — Supabase Data Access Layer
 *
 * Replaces the static JSON imports in data.ts with live Supabase queries.
 * All functions are async and scoped by company_id.
 */

import { createClient } from './supabase/server'
import type { AppConfig } from './types'
import type {
  DbCompany,
  DbCustomer,
  DbSupplier,
  DbJob,
  DbChangeOrder,
  DbBilling,
  DbCollection,
  DbCost,
  DbPayment,
  DbJobDataEntry,
  DbReportingPeriod,
  DbMunicipality,
} from './db-types'

// ─── Auth / Company Resolution ──────────────────────────────────────────────

/**
 * Get the company for the currently authenticated user.
 *
 * Logic:
 * 1. Get the current user from Supabase auth
 * 2. Find their organization membership
 * 3. Find the first company in that organization
 */
export async function getCompanyForUser(): Promise<DbCompany | null> {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return null

  // Find ALL organization memberships for this user
  const { data: memberships, error: memberError } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user.id)

  if (memberError || !memberships || memberships.length === 0) return null

  // Find the first company across any of the user's organizations
  const orgIds = memberships.map(m => m.organization_id)
  const { data: company, error: companyError } = await supabase
    .from('companies')
    .select('*')
    .in('organization_id', orgIds)
    .limit(1)
    .single()

  if (companyError || !company) return null

  return company as DbCompany
}

// ─── Master Data ────────────────────────────────────────────────────────────

/**
 * Get all customers for a company.
 */
export async function getCustomers(companyId: string): Promise<DbCustomer[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .eq('company_id', companyId)
    .order('name')

  if (error) {
    console.error('getCustomers error:', error.message)
    return []
  }

  return (data ?? []) as DbCustomer[]
}

/**
 * Get all jobs for a company, with owner name, customer name, and municipality
 * name joined from their respective tables.
 */
export async function getJobs(companyId: string): Promise<DbJob[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('jobs')
    .select(`
      *,
      owner:customers!jobs_owner_id_fkey ( name ),
      customer:customers!jobs_customer_id_fkey ( name ),
      municipality:municipalities!jobs_municipality_id_fkey ( name )
    `)
    .eq('company_id', companyId)
    .order('job_number')

  if (error) {
    console.error('getJobs error:', error.message)
    return []
  }

  return (data ?? []).map((row: Record<string, unknown>) => {
    const owner = row.owner as { name: string } | null
    const customer = row.customer as { name: string } | null
    const municipality = row.municipality as { name: string } | null

    return {
      ...row,
      owner_name: owner?.name ?? null,
      customer_name: customer?.name ?? null,
      municipality_name: municipality?.name ?? null,
      // Remove the nested relation objects
      owner: undefined,
      customer: undefined,
      municipality: undefined,
    } as unknown as DbJob
  })
}

/**
 * Get all change orders for a company, with job number and description joined.
 */
export async function getChangeOrders(companyId: string): Promise<DbChangeOrder[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('change_orders')
    .select(`
      *,
      job:jobs!change_orders_job_id_fkey ( job_number, description )
    `)
    .eq('company_id', companyId)
    .order('date')

  if (error) {
    console.error('getChangeOrders error:', error.message)
    return []
  }

  return (data ?? []).map((row: Record<string, unknown>) => {
    const job = row.job as { job_number: number; description: string } | null

    return {
      ...row,
      job_number: job?.job_number ?? 0,
      job_description: job?.description ?? '',
      job: undefined,
    } as unknown as DbChangeOrder
  })
}

/**
 * Get all suppliers for a company.
 */
export async function getSuppliers(companyId: string): Promise<DbSupplier[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('suppliers')
    .select('*')
    .eq('company_id', companyId)
    .order('name')

  if (error) {
    console.error('getSuppliers error:', error.message)
    return []
  }

  return (data ?? []) as DbSupplier[]
}

/**
 * Get all Puerto Rico municipalities (not scoped by company).
 */
export async function getMunicipalities(): Promise<DbMunicipality[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('municipalities')
    .select('*')
    .order('name')

  if (error) {
    console.error('getMunicipalities error:', error.message)
    return []
  }

  return (data ?? []) as DbMunicipality[]
}

// ─── Transactions ───────────────────────────────────────────────────────────

/**
 * Get all billings for a company, with customer name, job number, and
 * job description joined.
 */
export async function getBillings(companyId: string): Promise<DbBilling[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('billings')
    .select(`
      *,
      customer:customers!billings_customer_id_fkey ( name ),
      job:jobs!billings_job_id_fkey ( job_number, description )
    `)
    .eq('company_id', companyId)
    .order('date')

  if (error) {
    console.error('getBillings error:', error.message)
    return []
  }

  return (data ?? []).map((row: Record<string, unknown>) => {
    const customer = row.customer as { name: string } | null
    const job = row.job as { job_number: number; description: string } | null

    return {
      ...row,
      customer_name: customer?.name ?? null,
      job_number: job?.job_number ?? 0,
      job_description: job?.description ?? '',
      customer: undefined,
      job: undefined,
    } as unknown as DbBilling
  })
}

/**
 * Get all collections (AR payments) for a company, with customer name,
 * job number, and bill number joined.
 */
export async function getCollections(companyId: string): Promise<DbCollection[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('collections')
    .select(`
      *,
      customer:customers!collections_customer_id_fkey ( name ),
      job:jobs!collections_job_id_fkey ( job_number ),
      billing:billings!collections_billing_id_fkey ( bill_number )
    `)
    .eq('company_id', companyId)
    .order('payment_date')

  if (error) {
    console.error('getCollections error:', error.message)
    return []
  }

  return (data ?? []).map((row: Record<string, unknown>) => {
    const customer = row.customer as { name: string } | null
    const job = row.job as { job_number: number } | null
    const billing = row.billing as { bill_number: number } | null

    return {
      ...row,
      customer_name: customer?.name ?? null,
      job_number: job?.job_number ?? 0,
      bill_number: billing?.bill_number ?? null,
      customer: undefined,
      job: undefined,
      billing: undefined,
    } as unknown as DbCollection
  })
}

/**
 * Get all costs (AP transactions) for a company, with supplier name,
 * job number, and job description joined.
 */
export async function getCosts(companyId: string): Promise<DbCost[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('costs')
    .select(`
      *,
      supplier:suppliers!costs_supplier_id_fkey ( name ),
      job:jobs!costs_job_id_fkey ( job_number, description )
    `)
    .eq('company_id', companyId)
    .order('date')

  if (error) {
    console.error('getCosts error:', error.message)
    return []
  }

  return (data ?? []).map((row: Record<string, unknown>) => {
    const supplier = row.supplier as { name: string } | null
    const job = row.job as { job_number: number; description: string } | null

    return {
      ...row,
      supplier_name: supplier?.name ?? null,
      job_number: job?.job_number ?? 0,
      job_description: job?.description ?? '',
      supplier: undefined,
      job: undefined,
    } as unknown as DbCost
  })
}

/**
 * Get all payments (AP disbursements) for a company, with supplier name
 * and job number joined.
 */
export async function getPayments(companyId: string): Promise<DbPayment[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('payments')
    .select(`
      *,
      supplier:suppliers!payments_supplier_id_fkey ( name ),
      job:jobs!payments_job_id_fkey ( job_number )
    `)
    .eq('company_id', companyId)
    .order('payment_date')

  if (error) {
    console.error('getPayments error:', error.message)
    return []
  }

  return (data ?? []).map((row: Record<string, unknown>) => {
    const supplier = row.supplier as { name: string } | null
    const job = row.job as { job_number: number } | null

    return {
      ...row,
      supplier_name: supplier?.name ?? null,
      job_number: job?.job_number ?? 0,
      supplier: undefined,
      job: undefined,
    } as unknown as DbPayment
  })
}

// ─── Job Data Entries ───────────────────────────────────────────────────────

/**
 * Get all job data entries for a company, with job info joined.
 */
export async function getJobDataEntries(companyId: string): Promise<DbJobDataEntry[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('job_data_entries')
    .select(`
      *,
      job:jobs!job_data_entries_job_id_fkey (
        job_number,
        description,
        owner:customers!jobs_owner_id_fkey ( name ),
        customer:customers!jobs_customer_id_fkey ( name )
      )
    `)
    .eq('company_id', companyId)
    .order('data_period', { ascending: false })

  if (error) {
    console.error('getJobDataEntries error:', error.message)
    return []
  }

  return (data ?? []).map((row: Record<string, unknown>) => {
    const job = row.job as {
      job_number: number
      description: string
      owner: { name: string } | null
      customer: { name: string } | null
    } | null

    return {
      ...row,
      job_number: job?.job_number ?? 0,
      job_description: job?.description ?? '',
      owner_name: job?.owner?.name ?? null,
      customer_name: job?.customer?.name ?? null,
      job: undefined,
    } as unknown as DbJobDataEntry
  })
}

/**
 * Get job data entries for a specific period.
 */
export async function getJobDataEntriesForPeriod(
  companyId: string,
  period: string
): Promise<DbJobDataEntry[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('job_data_entries')
    .select(`
      *,
      job:jobs!job_data_entries_job_id_fkey (
        job_number,
        description,
        owner:customers!jobs_owner_id_fkey ( name ),
        customer:customers!jobs_customer_id_fkey ( name )
      )
    `)
    .eq('company_id', companyId)
    .eq('data_period', period)
    .order('created_at')

  if (error) {
    console.error('getJobDataEntriesForPeriod error:', error.message)
    return []
  }

  return (data ?? []).map((row: Record<string, unknown>) => {
    const job = row.job as {
      job_number: number
      description: string
      owner: { name: string } | null
      customer: { name: string } | null
    } | null

    return {
      ...row,
      job_number: job?.job_number ?? 0,
      job_description: job?.description ?? '',
      owner_name: job?.owner?.name ?? null,
      customer_name: job?.customer?.name ?? null,
      job: undefined,
    } as unknown as DbJobDataEntry
  })
}

// ─── Config ─────────────────────────────────────────────────────────────────

/**
 * Get all reporting periods for a company.
 */
export async function getReportingPeriods(companyId: string): Promise<DbReportingPeriod[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('reporting_periods')
    .select('*')
    .eq('company_id', companyId)
    .order('period_date', { ascending: false })

  if (error) {
    console.error('getReportingPeriods error:', error.message)
    return []
  }

  return (data ?? []) as DbReportingPeriod[]
}

/**
 * Build the AppConfig for a company from its reporting periods.
 *
 * If no reporting_periods exist, falls back to computing periods
 * from distinct data_period values in job_data_entries.
 */
export async function getAppConfig(companyId: string): Promise<AppConfig> {
  const supabase = await createClient()

  // Fetch the company record
  const { data: company, error: companyError } = await supabase
    .from('companies')
    .select('name, is_proprietorship')
    .eq('id', companyId)
    .single()

  if (companyError || !company) {
    // Return a sensible default if the company is not found
    return {
      companyName: 'Unknown Company',
      currentPeriod: new Date().getFullYear() + '-12-31',
      priorPeriod1: (new Date().getFullYear() - 1) + '-12-31',
      priorPeriod2: (new Date().getFullYear() - 2) + '-12-31',
      priorPeriod3: (new Date().getFullYear() - 3) + '-12-31',
      periodsShown: 1,
      isProprietorship: false,
    }
  }

  // Fetch reporting periods sorted descending
  const { data: periods } = await supabase
    .from('reporting_periods')
    .select('period_date, is_current')
    .eq('company_id', companyId)
    .order('period_date', { ascending: false })

  let periodDates: string[] = []

  if (periods && periods.length > 0) {
    // Use reporting_periods table
    // Find the current period first
    const currentPeriod = periods.find((p) => p.is_current)
    if (currentPeriod) {
      // Put current period first, then the rest in descending order
      periodDates = [
        currentPeriod.period_date,
        ...periods
          .filter((p) => p.period_date !== currentPeriod.period_date)
          .map((p) => p.period_date),
      ]
    } else {
      // No period marked as current — use descending order (most recent first)
      periodDates = periods.map((p) => p.period_date)
    }
  } else {
    // Fallback: derive periods from job_data_entries
    const { data: entries } = await supabase
      .from('job_data_entries')
      .select('data_period')
      .eq('company_id', companyId)

    if (entries && entries.length > 0) {
      const uniquePeriods = Array.from(new Set(entries.map((e) => e.data_period)))
      periodDates = uniquePeriods.sort().reverse()
    }
  }

  // Build the config — ensure we always have 4 period slots
  const currentYear = new Date().getFullYear()
  const currentPeriod = periodDates[0] ?? `${currentYear}-12-31`
  const priorPeriod1 = periodDates[1] ?? `${currentYear - 1}-12-31`
  const priorPeriod2 = periodDates[2] ?? `${currentYear - 2}-12-31`
  const priorPeriod3 = periodDates[3] ?? `${currentYear - 3}-12-31`

  // periodsShown is how many periods have data (capped at 4)
  const periodsShown = Math.min(periodDates.length || 1, 4)

  return {
    companyName: (company as { name: string }).name,
    currentPeriod,
    priorPeriod1,
    priorPeriod2,
    priorPeriod3,
    periodsShown,
    isProprietorship: (company as { is_proprietorship: boolean }).is_proprietorship,
  }
}
