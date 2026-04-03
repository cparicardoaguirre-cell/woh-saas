'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { getCompanyForUser } from '@/lib/db'

type ActionResult = { success: true; id: string } | { success: false; error: string }

export async function createCollection(formData: FormData): Promise<ActionResult> {
  const company = await getCompanyForUser()
  if (!company) return { success: false, error: 'Not authenticated or no company found' }

  const job_id = formData.get('job_id') as string
  const payment_date = formData.get('payment_date') as string
  const amount = Number(formData.get('amount'))

  if (!job_id || !payment_date) {
    return { success: false, error: 'Job and payment date are required' }
  }
  if (isNaN(amount)) {
    return { success: false, error: 'Amount must be a valid number' }
  }

  const customer_id = (formData.get('customer_id') as string) || null
  const billing_id = (formData.get('billing_id') as string) || null
  const reference = (formData.get('reference') as string) || null
  const payment_method = (formData.get('payment_method') as string) || null

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('collections')
    .insert({
      company_id: company.id,
      customer_id,
      job_id,
      billing_id,
      payment_date,
      reference,
      payment_method,
      amount,
    })
    .select('id')
    .single()

  if (error) {
    console.error('createCollection error:', error.message)
    return { success: false, error: error.message }
  }

  revalidatePath('/collections')
  return { success: true, id: data.id }
}

export async function updateCollection(id: string, formData: FormData): Promise<ActionResult> {
  const company = await getCompanyForUser()
  if (!company) return { success: false, error: 'Not authenticated or no company found' }

  const job_id = formData.get('job_id') as string
  const payment_date = formData.get('payment_date') as string
  const amount = Number(formData.get('amount'))

  if (!job_id || !payment_date) {
    return { success: false, error: 'Job and payment date are required' }
  }
  if (isNaN(amount)) {
    return { success: false, error: 'Amount must be a valid number' }
  }

  const customer_id = (formData.get('customer_id') as string) || null
  const billing_id = (formData.get('billing_id') as string) || null
  const reference = (formData.get('reference') as string) || null
  const payment_method = (formData.get('payment_method') as string) || null

  const supabase = await createClient()

  const { error } = await supabase
    .from('collections')
    .update({
      customer_id,
      job_id,
      billing_id,
      payment_date,
      reference,
      payment_method,
      amount,
    })
    .eq('id', id)
    .eq('company_id', company.id)

  if (error) {
    console.error('updateCollection error:', error.message)
    return { success: false, error: error.message }
  }

  revalidatePath('/collections')
  return { success: true, id }
}

export async function deleteCollection(id: string): Promise<ActionResult> {
  const company = await getCompanyForUser()
  if (!company) return { success: false, error: 'Not authenticated or no company found' }

  const supabase = await createClient()

  const { error } = await supabase
    .from('collections')
    .delete()
    .eq('id', id)
    .eq('company_id', company.id)

  if (error) {
    console.error('deleteCollection error:', error.message)
    return { success: false, error: error.message }
  }

  revalidatePath('/collections')
  return { success: true, id }
}
