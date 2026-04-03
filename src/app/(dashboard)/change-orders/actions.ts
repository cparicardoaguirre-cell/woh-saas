'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { getCompanyForUser } from '@/lib/db'

type ActionResult = { success: true; id: string } | { success: false; error: string }

export async function createChangeOrder(formData: FormData): Promise<ActionResult> {
  const company = await getCompanyForUser()
  if (!company) return { success: false, error: 'Not authenticated or no company found' }

  const job_id = formData.get('job_id') as string
  const co_number = Number(formData.get('co_number'))
  const date = formData.get('date') as string
  const amount = Number(formData.get('amount'))

  if (!job_id || !co_number || !date) {
    return { success: false, error: 'Job, change order number, and date are required' }
  }
  if (isNaN(amount)) {
    return { success: false, error: 'Amount must be a valid number' }
  }

  const approved = formData.get('approved') === 'true'

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('change_orders')
    .insert({
      company_id: company.id,
      job_id,
      co_number,
      date,
      approved,
      amount,
    })
    .select('id')
    .single()

  if (error) {
    console.error('createChangeOrder error:', error.message)
    return { success: false, error: error.message }
  }

  revalidatePath('/change-orders')
  return { success: true, id: data.id }
}

export async function updateChangeOrder(id: string, formData: FormData): Promise<ActionResult> {
  const company = await getCompanyForUser()
  if (!company) return { success: false, error: 'Not authenticated or no company found' }

  const job_id = formData.get('job_id') as string
  const co_number = Number(formData.get('co_number'))
  const date = formData.get('date') as string
  const amount = Number(formData.get('amount'))

  if (!job_id || !co_number || !date) {
    return { success: false, error: 'Job, change order number, and date are required' }
  }
  if (isNaN(amount)) {
    return { success: false, error: 'Amount must be a valid number' }
  }

  const approved = formData.get('approved') === 'true'

  const supabase = await createClient()

  const { error } = await supabase
    .from('change_orders')
    .update({
      job_id,
      co_number,
      date,
      approved,
      amount,
    })
    .eq('id', id)
    .eq('company_id', company.id)

  if (error) {
    console.error('updateChangeOrder error:', error.message)
    return { success: false, error: error.message }
  }

  revalidatePath('/change-orders')
  return { success: true, id }
}

export async function deleteChangeOrder(id: string): Promise<ActionResult> {
  const company = await getCompanyForUser()
  if (!company) return { success: false, error: 'Not authenticated or no company found' }

  const supabase = await createClient()

  const { error } = await supabase
    .from('change_orders')
    .delete()
    .eq('id', id)
    .eq('company_id', company.id)

  if (error) {
    console.error('deleteChangeOrder error:', error.message)
    return { success: false, error: error.message }
  }

  revalidatePath('/change-orders')
  return { success: true, id }
}
