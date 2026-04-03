'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { getCompanyForUser } from '@/lib/db'

type ActionResult = { success: true; id: string } | { success: false; error: string }

export async function createBilling(formData: FormData): Promise<ActionResult> {
  const company = await getCompanyForUser()
  if (!company) return { success: false, error: 'Not authenticated or no company found' }

  const job_id = formData.get('job_id') as string
  const bill_number = Number(formData.get('bill_number'))
  const date = formData.get('date') as string
  const amount = Number(formData.get('amount'))

  if (!job_id || !bill_number || !date) {
    return { success: false, error: 'Job, bill number, and date are required' }
  }
  if (isNaN(amount)) {
    return { success: false, error: 'Amount must be a valid number' }
  }

  const customer_id = (formData.get('customer_id') as string) || null
  const description = (formData.get('description') as string) || null
  const type = (formData.get('type') as string) || null
  const qty_raw = formData.get('qty') as string
  const qty = qty_raw ? Number(qty_raw) : null
  const price_raw = formData.get('price') as string
  const price = price_raw ? Number(price_raw) : null

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('billings')
    .insert({
      company_id: company.id,
      job_id,
      customer_id,
      bill_number,
      date,
      description,
      type,
      qty,
      price,
      amount,
    })
    .select('id')
    .single()

  if (error) {
    console.error('createBilling error:', error.message)
    return { success: false, error: error.message }
  }

  revalidatePath('/billings')
  return { success: true, id: data.id }
}

export async function updateBilling(id: string, formData: FormData): Promise<ActionResult> {
  const company = await getCompanyForUser()
  if (!company) return { success: false, error: 'Not authenticated or no company found' }

  const job_id = formData.get('job_id') as string
  const bill_number = Number(formData.get('bill_number'))
  const date = formData.get('date') as string
  const amount = Number(formData.get('amount'))

  if (!job_id || !bill_number || !date) {
    return { success: false, error: 'Job, bill number, and date are required' }
  }
  if (isNaN(amount)) {
    return { success: false, error: 'Amount must be a valid number' }
  }

  const customer_id = (formData.get('customer_id') as string) || null
  const description = (formData.get('description') as string) || null
  const type = (formData.get('type') as string) || null
  const qty_raw = formData.get('qty') as string
  const qty = qty_raw ? Number(qty_raw) : null
  const price_raw = formData.get('price') as string
  const price = price_raw ? Number(price_raw) : null

  const supabase = await createClient()

  const { error } = await supabase
    .from('billings')
    .update({
      job_id,
      customer_id,
      bill_number,
      date,
      description,
      type,
      qty,
      price,
      amount,
    })
    .eq('id', id)
    .eq('company_id', company.id)

  if (error) {
    console.error('updateBilling error:', error.message)
    return { success: false, error: error.message }
  }

  revalidatePath('/billings')
  return { success: true, id }
}

export async function deleteBilling(id: string): Promise<ActionResult> {
  const company = await getCompanyForUser()
  if (!company) return { success: false, error: 'Not authenticated or no company found' }

  const supabase = await createClient()

  const { error } = await supabase
    .from('billings')
    .delete()
    .eq('id', id)
    .eq('company_id', company.id)

  if (error) {
    console.error('deleteBilling error:', error.message)
    return { success: false, error: error.message }
  }

  revalidatePath('/billings')
  return { success: true, id }
}
