'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { getCompanyForUser } from '@/lib/db'

type ActionResult = { success: true; id: string } | { success: false; error: string }

export async function createCustomer(formData: FormData): Promise<ActionResult> {
  const company = await getCompanyForUser()
  if (!company) return { success: false, error: 'Not authenticated or no company found' }

  const name = formData.get('name') as string
  if (!name) {
    return { success: false, error: 'Customer name is required' }
  }

  const phone = (formData.get('phone') as string) || null
  const address1 = (formData.get('address1') as string) || null
  const address2 = (formData.get('address2') as string) || null
  const city = (formData.get('city') as string) || null
  const state = (formData.get('state') as string) || null
  const zip = (formData.get('zip') as string) || null
  const email = (formData.get('email') as string) || null
  const contact_name = (formData.get('contact_name') as string) || null

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('customers')
    .insert({
      company_id: company.id,
      name,
      phone,
      address1,
      address2,
      city,
      state,
      zip,
      email,
      contact_name,
    })
    .select('id')
    .single()

  if (error) {
    console.error('createCustomer error:', error.message)
    return { success: false, error: error.message }
  }

  revalidatePath('/customers')
  return { success: true, id: data.id }
}

export async function updateCustomer(id: string, formData: FormData): Promise<ActionResult> {
  const company = await getCompanyForUser()
  if (!company) return { success: false, error: 'Not authenticated or no company found' }

  const name = formData.get('name') as string
  if (!name) {
    return { success: false, error: 'Customer name is required' }
  }

  const phone = (formData.get('phone') as string) || null
  const address1 = (formData.get('address1') as string) || null
  const address2 = (formData.get('address2') as string) || null
  const city = (formData.get('city') as string) || null
  const state = (formData.get('state') as string) || null
  const zip = (formData.get('zip') as string) || null
  const email = (formData.get('email') as string) || null
  const contact_name = (formData.get('contact_name') as string) || null

  const supabase = await createClient()

  const { error } = await supabase
    .from('customers')
    .update({
      name,
      phone,
      address1,
      address2,
      city,
      state,
      zip,
      email,
      contact_name,
    })
    .eq('id', id)
    .eq('company_id', company.id)

  if (error) {
    console.error('updateCustomer error:', error.message)
    return { success: false, error: error.message }
  }

  revalidatePath('/customers')
  return { success: true, id }
}

export async function deleteCustomer(id: string): Promise<ActionResult> {
  const company = await getCompanyForUser()
  if (!company) return { success: false, error: 'Not authenticated or no company found' }

  const supabase = await createClient()

  const { error } = await supabase
    .from('customers')
    .delete()
    .eq('id', id)
    .eq('company_id', company.id)

  if (error) {
    console.error('deleteCustomer error:', error.message)
    return { success: false, error: error.message }
  }

  revalidatePath('/customers')
  return { success: true, id }
}
