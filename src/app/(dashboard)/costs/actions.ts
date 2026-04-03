'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { getCompanyForUser } from '@/lib/db'

type ActionResult = { success: true; id: string } | { success: false; error: string }

export async function createCost(formData: FormData): Promise<ActionResult> {
  const company = await getCompanyForUser()
  if (!company) return { success: false, error: 'Not authenticated or no company found' }

  const job_id = formData.get('job_id') as string
  const date = formData.get('date') as string
  const amount = Number(formData.get('amount'))

  if (!job_id || !date) {
    return { success: false, error: 'Job and date are required' }
  }
  if (isNaN(amount)) {
    return { success: false, error: 'Amount must be a valid number' }
  }

  const supplier_id = (formData.get('supplier_id') as string) || null
  const invoice_number = (formData.get('invoice_number') as string) || null
  const type = (formData.get('type') as string) || null
  const qty_raw = formData.get('qty') as string
  const qty = qty_raw ? Number(qty_raw) : null
  const price_raw = formData.get('price') as string
  const price = price_raw ? Number(price_raw) : null

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('costs')
    .insert({
      company_id: company.id,
      job_id,
      supplier_id,
      invoice_number,
      date,
      type,
      qty,
      price,
      amount,
    })
    .select('id')
    .single()

  if (error) {
    console.error('createCost error:', error.message)
    return { success: false, error: error.message }
  }

  revalidatePath('/costs')
  return { success: true, id: data.id }
}

export async function updateCost(id: string, formData: FormData): Promise<ActionResult> {
  const company = await getCompanyForUser()
  if (!company) return { success: false, error: 'Not authenticated or no company found' }

  const job_id = formData.get('job_id') as string
  const date = formData.get('date') as string
  const amount = Number(formData.get('amount'))

  if (!job_id || !date) {
    return { success: false, error: 'Job and date are required' }
  }
  if (isNaN(amount)) {
    return { success: false, error: 'Amount must be a valid number' }
  }

  const supplier_id = (formData.get('supplier_id') as string) || null
  const invoice_number = (formData.get('invoice_number') as string) || null
  const type = (formData.get('type') as string) || null
  const qty_raw = formData.get('qty') as string
  const qty = qty_raw ? Number(qty_raw) : null
  const price_raw = formData.get('price') as string
  const price = price_raw ? Number(price_raw) : null

  const supabase = await createClient()

  const { error } = await supabase
    .from('costs')
    .update({
      job_id,
      supplier_id,
      invoice_number,
      date,
      type,
      qty,
      price,
      amount,
    })
    .eq('id', id)
    .eq('company_id', company.id)

  if (error) {
    console.error('updateCost error:', error.message)
    return { success: false, error: error.message }
  }

  revalidatePath('/costs')
  return { success: true, id }
}

export async function deleteCost(id: string): Promise<ActionResult> {
  const company = await getCompanyForUser()
  if (!company) return { success: false, error: 'Not authenticated or no company found' }

  const supabase = await createClient()

  const { error } = await supabase
    .from('costs')
    .delete()
    .eq('id', id)
    .eq('company_id', company.id)

  if (error) {
    console.error('deleteCost error:', error.message)
    return { success: false, error: error.message }
  }

  revalidatePath('/costs')
  return { success: true, id }
}
