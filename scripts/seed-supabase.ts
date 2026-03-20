/**
 * Seed script: imports DFM Contractors demo data from JSON files into Supabase.
 * Run with: npx tsx scripts/seed-supabase.ts
 *
 * Requires: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { join } from 'path'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !serviceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
})

function loadJson(name: string) {
  return JSON.parse(readFileSync(join('src', 'data', `${name}.json`), 'utf8'))
}

async function seed() {
  console.log('🌱 Starting DFM Contractors seed...\n')

  // ── 1. Create Demo Organization ───────────────────────────────────────────
  const { data: org, error: orgErr } = await supabase
    .from('organizations')
    .upsert({ name: 'CPA Ricardo Aguirre LLC', slug: 'cpa-ricardo-aguirre' }, { onConflict: 'slug' })
    .select().single()
  if (orgErr) throw orgErr
  console.log(`✓ Organization: ${org.name} (${org.id})`)

  // ── 2. Create Demo Company ────────────────────────────────────────────────
  const { data: company, error: compErr } = await supabase
    .from('companies')
    .upsert({ organization_id: org.id, name: 'DFM Contractors, LLC.', is_proprietorship: false },
             { onConflict: 'id' })
    .select().single()
  if (compErr) throw compErr
  console.log(`✓ Company: ${company.name} (${company.id})`)

  const companyId = company.id

  // ── 3. Customers ──────────────────────────────────────────────────────────
  const customersJson = loadJson('customers')
  const customerRows = customersJson
    .filter((c: Record<string, unknown>) => c.Owner)
    .map((c: Record<string, unknown>) => ({
      company_id:   companyId,
      name:         c.Owner,
      phone:        c.Phone,
      address1:     c.Address1,
      address2:     c.Address2,
      city:         c.City,
      state:        c.State,
      zip:          c.ZIP,
      email:        c.EMAIL,
      contact_name: c['Contact Name'],
    }))

  const { data: insertedCustomers, error: custErr } = await supabase
    .from('customers').insert(customerRows).select()
  if (custErr) throw custErr
  console.log(`✓ Customers: ${insertedCustomers.length} inserted`)

  const customersByName = new Map(insertedCustomers.map((c) => [c.name, c.id]))

  // ── 4. Jobs ───────────────────────────────────────────────────────────────
  const jobsJson = loadJson('jobs')
  const jobRows = jobsJson
    .filter((j: Record<string, unknown>) => j['Job #'] && j['Job Description'])
    .map((j: Record<string, unknown>) => ({
      company_id:               companyId,
      job_number:               Number(j['Job #']),
      description:              j['Job Description'],
      owner_id:                 customersByName.get(j.Owner as string) ?? null,
      customer_id:              customersByName.get(j.Customer as string) ?? null,
      contract_date:            j['Contract Date'] ?? null,
      completed_date:           j['Completed Date'] ?? null,
      retainage_pct:            j.Retainage ?? 0,
      automatic_retainage:      j['Automatic Retainage'] === 'YES',
      original_contract_amount: j['Original Contract Amount'] ?? 0,
    }))

  // Batch insert in chunks of 500
  let insertedJobs: { id: string; job_number: number }[] = []
  for (let i = 0; i < jobRows.length; i += 500) {
    const chunk = jobRows.slice(i, i + 500)
    const { data, error } = await supabase.from('jobs').insert(chunk).select('id, job_number')
    if (error) throw error
    insertedJobs = insertedJobs.concat(data)
  }
  console.log(`✓ Jobs: ${insertedJobs.length} inserted`)

  const jobsByNumber = new Map(insertedJobs.map((j) => [j.job_number, j.id]))

  // ── 5. Change Orders ──────────────────────────────────────────────────────
  const cosJson = loadJson('change_orders')
  const coRows = cosJson
    .filter((co: Record<string, unknown>) => co['Job Number'] && co['Change Order Number'])
    .map((co: Record<string, unknown>) => ({
      company_id: companyId,
      job_id:     jobsByNumber.get(Number(co['Job Number'])) ?? null,
      co_number:  Number(co['Change Order Number']),
      date:       co.Date,
      approved:   co.Approved === 'YES',
      amount:     co.Amount ?? 0,
    }))
    .filter((co: Record<string, unknown>) => co.job_id)

  for (let i = 0; i < coRows.length; i += 500) {
    const { error } = await supabase.from('change_orders').insert(coRows.slice(i, i + 500))
    if (error) throw error
  }
  console.log(`✓ Change Orders: ${coRows.length} inserted`)

  // ── 6. Billings ───────────────────────────────────────────────────────────
  const billingsJson = loadJson('billings')
  const billingRows = billingsJson
    .filter((b: Record<string, unknown>) => b['Job Number'] && b['Bill Number'])
    .map((b: Record<string, unknown>) => ({
      company_id:  companyId,
      job_id:      jobsByNumber.get(Number(b['Job Number'])) ?? null,
      customer_id: customersByName.get(b.Customer as string) ?? null,
      bill_number: Number(b['Bill Number']),
      date:        b.Date,
      description: b['Bill Description'],
      type:        b.Type,
      qty:         b.Qty,
      price:       b.Price,
      amount:      b.Amount ?? 0,
    }))
    .filter((b: Record<string, unknown>) => b.job_id)

  for (let i = 0; i < billingRows.length; i += 500) {
    const { error } = await supabase.from('billings').insert(billingRows.slice(i, i + 500))
    if (error) throw error
  }
  console.log(`✓ Billings: ${billingRows.length} inserted`)

  // ── 7. Collections ────────────────────────────────────────────────────────
  const collectionsJson = loadJson('collections')
  const collectionRows = collectionsJson
    .filter((c: Record<string, unknown>) => c['Job Number'])
    .map((c: Record<string, unknown>) => ({
      company_id:     companyId,
      customer_id:    customersByName.get(c.Customer as string) ?? null,
      job_id:         jobsByNumber.get(Number(c['Job Number'])) ?? null,
      payment_date:   c['Payment Date'],
      reference:      c['Ref.'],
      payment_method: c['Payment Method'],
      amount:         c.Amount ?? 0,
    }))
    .filter((c: Record<string, unknown>) => c.job_id)

  for (let i = 0; i < collectionRows.length; i += 500) {
    const { error } = await supabase.from('collections').insert(collectionRows.slice(i, i + 500))
    if (error) throw error
  }
  console.log(`✓ Collections: ${collectionRows.length} inserted`)

  // ── 8. Costs ──────────────────────────────────────────────────────────────
  const costsJson = loadJson('costs')
  const costRows = costsJson
    .filter((c: Record<string, unknown>) => c['Job Number'])
    .map((c: Record<string, unknown>) => ({
      company_id:     companyId,
      job_id:         jobsByNumber.get(Number(c['Job Number'])) ?? null,
      invoice_number: String(c['Invoice Number'] ?? ''),
      date:           c.Date,
      type:           c.Type,
      qty:            c.Qty,
      price:          c.Price,
      amount:         c.Amount ?? 0,
    }))
    .filter((c: Record<string, unknown>) => c.job_id)

  for (let i = 0; i < costRows.length; i += 500) {
    const { error } = await supabase.from('costs').insert(costRows.slice(i, i + 500))
    if (error) throw error
  }
  console.log(`✓ Costs: ${costRows.length} inserted`)

  // ── 9. Job Data Entries ───────────────────────────────────────────────────
  const jobDataJson = loadJson('job_data')
  const entryRows = jobDataJson
    .filter((r: Record<string, unknown>) => r['Job #'] && r['Data Period'])
    .map((r: Record<string, unknown>) => ({
      company_id:               companyId,
      job_id:                   jobsByNumber.get(Number(r['Job #'])) ?? null,
      data_period:              r['Data Period'],
      status:                   r.Status ?? 'In Progress',
      pct_of_desired_cost:      r['% of Desired Cost'] ?? null,
      desired_cost_to_complete: r['Desired Cost to Complete'] ?? null,
    }))
    .filter((r: Record<string, unknown>) => r.job_id)

  for (let i = 0; i < entryRows.length; i += 500) {
    const { error } = await supabase.from('job_data_entries').insert(entryRows.slice(i, i + 500))
    if (error) throw error
  }
  console.log(`✓ Job Data Entries: ${entryRows.length} inserted`)

  console.log('\n✅ Seed complete! DFM Contractors data is in Supabase.')
  console.log(`   Company ID: ${companyId}`)
  console.log(`   Org ID:     ${org.id}`)
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err)
  process.exit(1)
})
