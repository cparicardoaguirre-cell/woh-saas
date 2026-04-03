'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { getCompanyForUser } from '@/lib/db'

type ActionResult = { success: true; id: string } | { success: false; error: string }

export async function createJob(formData: FormData): Promise<ActionResult> {
  const company = await getCompanyForUser()
  if (!company) return { success: false, error: 'Not authenticated or no company found' }

  const job_number = Number(formData.get('job_number'))
  const description = formData.get('description') as string

  if (!job_number || !description) {
    return { success: false, error: 'Job number and description are required' }
  }

  const owner_id = (formData.get('owner_id') as string) || null
  const customer_id = (formData.get('customer_id') as string) || null
  const contract_date = (formData.get('contract_date') as string) || null
  const completed_date = (formData.get('completed_date') as string) || null
  const retainage_pct = Number(formData.get('retainage_pct')) || 0
  const automatic_retainage = formData.get('automatic_retainage') === 'true'
  const municipality_id_raw = formData.get('municipality_id') as string
  const municipality_id = municipality_id_raw ? Number(municipality_id_raw) : null
  const original_contract_amount = Number(formData.get('original_contract_amount')) || 0

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('jobs')
    .insert({
      company_id: company.id,
      job_number,
      description,
      owner_id,
      customer_id,
      contract_date,
      completed_date,
      retainage_pct,
      automatic_retainage,
      municipality_id,
      original_contract_amount,
    })
    .select('id')
    .single()

  if (error) {
    console.error('createJob error:', error.message)
    return { success: false, error: error.message }
  }

  revalidatePath('/jobs')
  return { success: true, id: data.id }
}

export async function updateJob(id: string, formData: FormData): Promise<ActionResult> {
  const company = await getCompanyForUser()
  if (!company) return { success: false, error: 'Not authenticated or no company found' }

  const job_number = Number(formData.get('job_number'))
  const description = formData.get('description') as string

  if (!job_number || !description) {
    return { success: false, error: 'Job number and description are required' }
  }

  const owner_id = (formData.get('owner_id') as string) || null
  const customer_id = (formData.get('customer_id') as string) || null
  const contract_date = (formData.get('contract_date') as string) || null
  const completed_date = (formData.get('completed_date') as string) || null
  const retainage_pct = Number(formData.get('retainage_pct')) || 0
  const automatic_retainage = formData.get('automatic_retainage') === 'true'
  const municipality_id_raw = formData.get('municipality_id') as string
  const municipality_id = municipality_id_raw ? Number(municipality_id_raw) : null
  const original_contract_amount = Number(formData.get('original_contract_amount')) || 0

  const supabase = await createClient()

  const { error } = await supabase
    .from('jobs')
    .update({
      job_number,
      description,
      owner_id,
      customer_id,
      contract_date,
      completed_date,
      retainage_pct,
      automatic_retainage,
      municipality_id,
      original_contract_amount,
    })
    .eq('id', id)
    .eq('company_id', company.id)

  if (error) {
    console.error('updateJob error:', error.message)
    return { success: false, error: error.message }
  }

  revalidatePath('/jobs')
  return { success: true, id }
}

export async function deleteJob(id: string): Promise<ActionResult> {
  const company = await getCompanyForUser()
  if (!company) return { success: false, error: 'Not authenticated or no company found' }

  const supabase = await createClient()

  const { error } = await supabase
    .from('jobs')
    .delete()
    .eq('id', id)
    .eq('company_id', company.id)

  if (error) {
    console.error('deleteJob error:', error.message)
    return { success: false, error: error.message }
  }

  revalidatePath('/jobs')
  return { success: true, id }
}
