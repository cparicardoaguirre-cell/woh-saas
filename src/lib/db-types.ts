/**
 * WoH SaaS — Database Row Types & Mappers
 *
 * Defines TypeScript types matching the Supabase schema (snake_case)
 * and mapper functions to convert to the Excel-style types used by engine.ts.
 */

import type {
  Customer,
  Job,
  ChangeOrder,
  Billing,
  Collection,
  Cost,
  Payment,
  JobDataRow,
  JobStatus,
} from './types'

// ─── Database Row Types ─────────────────────────────────────────────────────

export interface DbCompany {
  id: string
  organization_id: string
  name: string
  is_proprietorship: boolean
  created_at: string
}

export interface DbReportingPeriod {
  id: string
  company_id: string
  period_date: string       // ISO date "YYYY-MM-DD"
  qty_months: number
  is_current: boolean
  created_at: string
}

export interface DbMunicipality {
  id: number
  name: string
}

export interface DbCustomer {
  id: string
  company_id: string
  name: string
  phone: string | null
  address1: string | null
  address2: string | null
  city: string | null
  state: string | null
  zip: string | null
  email: string | null
  contact_name: string | null
  created_at: string
}

export interface DbSupplier {
  id: string
  company_id: string
  name: string
  phone: string | null
  address1: string | null
  address2: string | null
  city: string | null
  state: string | null
  zip: string | null
  email: string | null
  contact_name: string | null
  created_at: string
}

export interface DbJob {
  id: string
  company_id: string
  job_number: number
  description: string
  owner_id: string | null
  customer_id: string | null
  contract_date: string | null
  completed_date: string | null
  retainage_pct: number
  automatic_retainage: boolean
  municipality_id: number | null
  original_contract_amount: number
  created_at: string
  // Joined fields (populated by query)
  owner_name?: string | null
  customer_name?: string | null
  municipality_name?: string | null
}

export interface DbChangeOrder {
  id: string
  company_id: string
  job_id: string
  co_number: number
  date: string
  approved: boolean
  amount: number
  created_at: string
  // Joined fields
  job_number?: number
  job_description?: string
}

export interface DbBilling {
  id: string
  company_id: string
  job_id: string
  customer_id: string | null
  bill_number: number
  date: string
  description: string | null
  type: string | null
  qty: number | null
  price: number | null
  amount: number
  created_at: string
  // Joined fields
  customer_name?: string | null
  job_number?: number
  job_description?: string
}

export interface DbCollection {
  id: string
  company_id: string
  customer_id: string | null
  job_id: string
  billing_id: string | null
  payment_date: string
  reference: string | null
  payment_method: string | null
  amount: number
  created_at: string
  // Joined fields
  customer_name?: string | null
  job_number?: number
  bill_number?: number | null
}

export interface DbCost {
  id: string
  company_id: string
  job_id: string
  supplier_id: string | null
  invoice_number: string | null
  date: string
  type: string | null
  qty: number | null
  price: number | null
  amount: number
  created_at: string
  // Joined fields
  supplier_name?: string | null
  job_number?: number
  job_description?: string
}

export interface DbPayment {
  id: string
  company_id: string
  job_id: string
  supplier_id: string | null
  invoice_number: string | null
  payment_date: string
  payment_method: string | null
  type: string | null
  amount: number
  created_at: string
  // Joined fields
  supplier_name?: string | null
  job_number?: number
}

export interface DbJobDataEntry {
  id: string
  company_id: string
  job_id: string
  data_period: string       // ISO date "YYYY-MM-DD"
  status: string
  pct_of_desired_cost: number | null
  desired_cost_to_complete: number | null
  created_at: string
  // Joined fields
  job_number?: number
  job_description?: string
  owner_name?: string | null
  customer_name?: string | null
}

// ─── Mapper Functions ───────────────────────────────────────────────────────

/**
 * Map a DbCustomer row to the Excel-style Customer type.
 * The Excel type uses "Owner" as the customer name field.
 */
export function mapDbCustomerToExcel(row: DbCustomer): Customer {
  return {
    Owner: row.name,
    Phone: row.phone,
    Address1: row.address1,
    Address2: row.address2,
    City: row.city,
    State: row.state,
    ZIP: row.zip,
    EMAIL: row.email,
    'Contact Name': row.contact_name,
  }
}

/**
 * Map a DbJob row to the Excel-style Job type.
 * Computed fields (Approved Change Orders, Revenue Earned, etc.) are set to null/0
 * because they are calculated by the engine, not stored in the jobs table.
 */
export function mapDbJobToExcel(row: DbJob): Job {
  return {
    'Job #': row.job_number,
    'Job Description': row.description,
    Owner: row.owner_name ?? '',
    Customer: row.customer_name ?? '',
    'Contract Date': row.contract_date,
    'Completed Date': row.completed_date,
    Retainage: row.retainage_pct,
    'Automatic Retainage': row.automatic_retainage ? 'YES' : 'NO',
    County: row.municipality_name ?? null,
    'Original Contract Amount': row.original_contract_amount,
    // Computed fields — populated by engine, not DB
    'Approved Change Orders': null,
    'Actual Contract Amount': null,
    'Change Order/Additions Pending Final Approval': null,
    'Projected Contact Amount': null,
    'Revenue Earned to Date': null,
    'Billed to Date': null,
    Status: null,
  }
}

/**
 * Map a DbChangeOrder row to the Excel-style ChangeOrder type.
 * Computed fields are set to null because the engine calculates them.
 */
export function mapDbChangeOrderToExcel(row: DbChangeOrder): ChangeOrder {
  return {
    'Job Number': row.job_number ?? 0,
    'Job Description': row.job_description ?? '',
    'Change Order Number': row.co_number,
    Date: row.date,
    Approved: row.approved ? 'YES' : 'NO',
    Amount: row.amount,
    // Computed fields — populated by engine
    'Original Contract Amount': null,
    'Approved Change Orders': null,
    'Actual Contract Amount': null,
    'Change Order/Additions Pending Final Approval': null,
    'Projected Contract Amount': null,
    'Revenue Earned to Date': null,
    'Billed To Date': null,
    'Contract Date': null,
    'Completed Date': null,
    UniqueCO: row.job_number != null ? `${row.job_number}-${row.co_number}` : null,
    Status: null,
  }
}

/**
 * Map a DbBilling row to the Excel-style Billing type.
 * Computed fields are set to null because the engine calculates them.
 */
export function mapDbBillingToExcel(row: DbBilling): Billing {
  return {
    Customer: row.customer_name ?? '',
    'Bill Number': row.bill_number,
    Date: row.date,
    'Job Number': row.job_number ?? 0,
    'Job Description': row.job_description ?? '',
    'Bill Description': row.description,
    Type: row.type,
    Qty: row.qty,
    Price: row.price,
    Amount: row.amount,
    // Computed fields — populated by engine
    'Projected Contract Amount': null,
    '% Completed': null,
    Status: null,
    'Bill Payments': null,
    'Bill Balance': null,
    'Customer Billed To Date': null,
    'Job Billed To Date': null,
    'Customer Collected To Date': null,
    'Job Collected To Date': null,
    'Cutomer AR': null,
    'Job AR': null,
    UniqueBill: row.job_number != null ? `${row.job_number}-${row.bill_number}` : null,
  }
}

/**
 * Map a DbCollection row to the Excel-style Collection type.
 * Computed fields are set to null because the engine calculates them.
 */
export function mapDbCollectionToExcel(row: DbCollection): Collection {
  return {
    Customer: row.customer_name ?? '',
    'Job Number': row.job_number ?? 0,
    'Bill Number': row.bill_number ?? 0,
    'Payment Date': row.payment_date,
    'Ref.': row.reference,
    'Payment Method': row.payment_method,
    Amount: row.amount,
    // Computed fields — populated by engine
    Billed: null,
    'Bill Balance': null,
    'Job Balance': null,
    'Customer Job Collection': null,
    'Customer Balance': null,
  }
}

/**
 * Map a DbCost row to the Excel-style Cost type.
 * Computed fields are set to null because the engine calculates them.
 */
export function mapDbCostToExcel(row: DbCost): Cost {
  return {
    'Job Number': row.job_number ?? 0,
    'Job Description': row.job_description ?? '',
    Supplier: row.supplier_name ?? null,
    'Invoice Number': row.invoice_number,
    Date: row.date,
    Type: row.type,
    Qty: row.qty,
    Price: row.price,
    Amount: row.amount,
    // Computed fields — populated by engine
    '% Completed': null,
    Status: null,
    'Job Gross Profit Percentage': null,
    'Job Gross Profit': null,
    'Job Cost': null,
    'Job Supplier Cost': null,
    'Supplier Cost': null,
    'Job Payments': null,
    'Job Supplier Payments': null,
    'Supplier Payments': null,
    'Job AP Balance': null,
    'Job Supplier AP Balance': null,
    'Supplier AP Balance': null,
    UniqueSupplierInvoice: row.supplier_name && row.invoice_number
      ? `${row.supplier_name}-${row.invoice_number}`
      : null,
    UniqueJobSupplier: row.job_number != null && row.supplier_name
      ? `${row.job_number}-${row.supplier_name}`
      : null,
  }
}

/**
 * Map a DbPayment row to the Excel-style Payment type.
 * Computed fields are set to null because the engine calculates them.
 */
export function mapDbPaymentToExcel(row: DbPayment): Payment {
  return {
    'Job Number': row.job_number ?? 0,
    Supplier: row.supplier_name ?? null,
    'Invoice Number': row.invoice_number,
    'Payment Date': row.payment_date,
    'Payment Method': row.payment_method,
    Type: row.type,
    Amount: row.amount,
    // Computed fields — populated by engine
    'Job Payments': null,
    'Job AP Balance': null,
    'Supplier Job Balance': null,
    'Supplier Balance': null,
    UniqueJobSupplier: row.job_number != null && row.supplier_name
      ? `${row.job_number}-${row.supplier_name}`
      : null,
  }
}

/**
 * Map a DbJobDataEntry row to a partial Excel-style JobDataRow.
 * Only the manual-entry and lookup fields are populated; the engine
 * computes all derived fields (revenue, cost to date, gross profit, etc.).
 */
export function mapDbJobDataEntryToExcel(row: DbJobDataEntry): Partial<JobDataRow> {
  return {
    'Job #': row.job_number ?? 0,
    'Data Period': row.data_period,
    Status: row.status as JobStatus,
    '% of Desired Cost': row.pct_of_desired_cost,
    'Desired Cost to Complete': row.desired_cost_to_complete,
    // Lookup fields from joined job data
    Owner: row.owner_name ?? null,
    Customer: row.customer_name ?? null,
    'Job Description': row.job_description ?? null,
  }
}
