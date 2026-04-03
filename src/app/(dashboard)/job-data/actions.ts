'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { getCompanyForUser } from '@/lib/db'

type ActionResult = { success: true; id: string } | { success: false; error: string }
type BatchResult = { success: true; created: number } | { success: false; error: string }

const VALID_STATUSES = [
  'In Progress',
  'Completed',
  'Paused',
  'Inactive',
  'Out of Report',
]

export async function createJobDataEntry(formData: FormData): Promise<ActionResult> {
  const company = await getCompanyForUser()
  if (!company) return { success: false, error: 'Not authenticated or no company found' }

  const job_id = formData.get('job_id') as string
  const data_period = formData.get('data_period') as string

  if (!job_id || !data_period) {
    return { success: false, error: 'Job and data period are required' }
  }

  const status = (formData.get('status') as string) || 'In Progress'
  if (!VALID_STATUSES.includes(status)) {
    return { success: false, error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` }
  }

  const pct_raw = formData.get('pct_of_desired_cost') as string
  const pct_of_desired_cost = pct_raw ? Number(pct_raw) : null
  const ctc_raw = formData.get('desired_cost_to_complete') as string
  const desired_cost_to_complete = ctc_raw ? Number(ctc_raw) : null

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('job_data_entries')
    .insert({
      company_id: company.id,
      job_id,
      data_period,
      status,
      pct_of_desired_cost,
      desired_cost_to_complete,
    })
    .select('id')
    .single()

  if (error) {
    console.error('createJobDataEntry error:', error.message)
    return { success: false, error: error.message }
  }

  revalidatePath('/job-data')
  return { success: true, id: data.id }
}

export async function updateJobDataEntry(id: string, formData: FormData): Promise<ActionResult> {
  const company = await getCompanyForUser()
  if (!company) return { success: false, error: 'Not authenticated or no company found' }

  const job_id = formData.get('job_id') as string
  const data_period = formData.get('data_period') as string

  if (!job_id || !data_period) {
    return { success: false, error: 'Job and data period are required' }
  }

  const status = (formData.get('status') as string) || 'In Progress'
  if (!VALID_STATUSES.includes(status)) {
    return { success: false, error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` }
  }

  const pct_raw = formData.get('pct_of_desired_cost') as string
  const pct_of_desired_cost = pct_raw ? Number(pct_raw) : null
  const ctc_raw = formData.get('desired_cost_to_complete') as string
  const desired_cost_to_complete = ctc_raw ? Number(ctc_raw) : null

  const supabase = await createClient()

  const { error } = await supabase
    .from('job_data_entries')
    .update({
      job_id,
      data_period,
      status,
      pct_of_desired_cost,
      desired_cost_to_complete,
    })
    .eq('id', id)
    .eq('company_id', company.id)

  if (error) {
    console.error('updateJobDataEntry error:', error.message)
    return { success: false, error: error.message }
  }

  revalidatePath('/job-data')
  return { success: true, id }
}

export async function deleteJobDataEntry(id: string): Promise<ActionResult> {
  const company = await getCompanyForUser()
  if (!company) return { success: false, error: 'Not authenticated or no company found' }

  const supabase = await createClient()

  const { error } = await supabase
    .from('job_data_entries')
    .delete()
    .eq('id', id)
    .eq('company_id', company.id)

  if (error) {
    console.error('deleteJobDataEntry error:', error.message)
    return { success: false, error: error.message }
  }

  revalidatePath('/job-data')
  return { success: true, id }
}

/**
 * Initialize a new reporting period by creating job_data_entries for ALL
 * active jobs that don't already have an entry for the given period.
 *
 * Also creates a reporting_period record if one doesn't exist for this date.
 */
export async function initializePeriod(period: string): Promise<BatchResult> {
  const company = await getCompanyForUser()
  if (!company) return { success: false, error: 'Not authenticated or no company found' }

  if (!period) {
    return { success: false, error: 'Period date is required (YYYY-MM-DD)' }
  }

  const supabase = await createClient()

  // 1. Ensure a reporting_period record exists for this date
  const { data: existingPeriod } = await supabase
    .from('reporting_periods')
    .select('id')
    .eq('company_id', company.id)
    .eq('period_date', period)
    .single()

  if (!existingPeriod) {
    const { error: periodError } = await supabase
      .from('reporting_periods')
      .insert({
        company_id: company.id,
        period_date: period,
        qty_months: 12,
        is_current: true,
      })

    if (periodError) {
      console.error('initializePeriod — reporting_period insert error:', periodError.message)
      return { success: false, error: periodError.message }
    }

    // Mark any other periods as not current
    await supabase
      .from('reporting_periods')
      .update({ is_current: false })
      .eq('company_id', company.id)
      .neq('period_date', period)
  }

  // 2. Get all jobs for this company
  const { data: jobs, error: jobsError } = await supabase
    .from('jobs')
    .select('id')
    .eq('company_id', company.id)

  if (jobsError) {
    console.error('initializePeriod — jobs fetch error:', jobsError.message)
    return { success: false, error: jobsError.message }
  }

  if (!jobs || jobs.length === 0) {
    return { success: true, created: 0 }
  }

  // 3. Get existing entries for this period so we can skip them
  const { data: existingEntries, error: entriesError } = await supabase
    .from('job_data_entries')
    .select('job_id')
    .eq('company_id', company.id)
    .eq('data_period', period)

  if (entriesError) {
    console.error('initializePeriod — entries fetch error:', entriesError.message)
    return { success: false, error: entriesError.message }
  }

  const existingJobIds = new Set((existingEntries ?? []).map((e) => e.job_id))

  // 4. Build insert rows for jobs that don't already have an entry
  const newEntries = jobs
    .filter((job) => !existingJobIds.has(job.id))
    .map((job) => ({
      company_id: company.id,
      job_id: job.id,
      data_period: period,
      status: 'In Progress',
      pct_of_desired_cost: null,
      desired_cost_to_complete: null,
    }))

  if (newEntries.length === 0) {
    revalidatePath('/job-data')
    return { success: true, created: 0 }
  }

  const { error: insertError } = await supabase
    .from('job_data_entries')
    .insert(newEntries)

  if (insertError) {
    console.error('initializePeriod — batch insert error:', insertError.message)
    return { success: false, error: insertError.message }
  }

  revalidatePath('/job-data')
  return { success: true, created: newEntries.length }
}
