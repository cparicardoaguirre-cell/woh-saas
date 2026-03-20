// ─── Master Data Types ──────────────────────────────────────────────────────

export interface Customer {
  Owner: string
  Phone: string | null
  Address1: string | null
  Address2: string | null
  City: string | null
  State: string | null
  ZIP: string | null
  EMAIL: string | null
  'Contact Name': string | null
}

export interface Job {
  'Job #': number
  'Job Description': string
  Owner: string
  Customer: string
  'Contract Date': string | null
  'Completed Date': string | null
  Retainage: number | null
  'Automatic Retainage': string | null
  County: string | null
  'Original Contract Amount': number | null
  'Approved Change Orders': number | null
  'Actual Contract Amount': number | null
  'Change Order/Additions Pending Final Approval': number | null
  'Projected Contact Amount': number | null
  'Revenue Earned to Date': number | null
  'Billed to Date': number | null
  Status: string | null
}

export interface ChangeOrder {
  'Job Number': number
  'Job Description': string
  'Change Order Number': number
  Date: string
  Approved: 'YES' | 'NO'
  Amount: number
  'Original Contract Amount': number | null
  'Approved Change Orders': number | null
  'Actual Contract Amount': number | null
  'Change Order/Additions Pending Final Approval': number | null
  'Projected Contract Amount': number | null
  'Revenue Earned to Date': number | null
  'Billed To Date': number | null
  'Contract Date': string | null
  'Completed Date': string | null
  UniqueCO: string | null
  Status: string | null
}

export interface Billing {
  Customer: string
  'Bill Number': number
  Date: string
  'Job Number': number
  'Job Description': string
  'Bill Description': string | null
  Type: string | null
  Qty: number | null
  Price: number | null
  Amount: number | null
  'Projected Contract Amount': number | null
  '% Completed': number | null
  Status: string | null
  'Bill Payments': number | null
  'Bill Balance': number | null
  'Customer Billed To Date': number | null
  'Job Billed To Date': number | null
  'Customer Collected To Date': number | null
  'Job Collected To Date': number | null
  'Cutomer AR': number | null
  'Job AR': number | null
  UniqueBill: string | null
}

export interface Collection {
  Customer: string
  'Job Number': number
  'Bill Number': number
  'Payment Date': string
  'Ref.': string | null
  'Payment Method': string | null
  Amount: number | null
  Billed: number | null
  'Bill Balance': number | null
  'Job Balance': number | null
  'Customer Job Collection': number | null
  'Customer Balance': number | null
}

export interface Cost {
  'Job Number': number
  'Job Description': string
  Supplier: string | null
  'Invoice Number': number | string | null
  Date: string
  Type: string | null
  Qty: number | null
  Price: number | null
  Amount: number | null
  '% Completed': number | null
  Status: string | null
  'Job Gross Profit Percentage': number | null
  'Job Gross Profit': number | null
  'Job Cost': number | null
  'Job Supplier Cost': number | null
  'Supplier Cost': number | null
  'Job Payments': number | null
  'Job Supplier Payments': number | null
  'Supplier Payments': number | null
  'Job AP Balance': number | null
  'Job Supplier AP Balance': number | null
  'Supplier AP Balance': number | null
  UniqueSupplierInvoice: string | null
  UniqueJobSupplier: string | null
}

export interface Payment {
  'Job Number': number
  Supplier: string | null
  'Invoice Number': number | string | null
  'Payment Date': string
  'Payment Method': string | null
  Type: string | null
  Amount: number | null
  'Job Payments': number | null
  'Job AP Balance': number | null
  'Supplier Job Balance': number | null
  'Supplier Balance': number | null
  UniqueJobSupplier: string | null
}

// ─── Job Data (computed per job per period) ──────────────────────────────────

export type JobStatus = 'In Progress' | 'Completed' | 'Paused' | 'Inactive' | 'Out of Report'

export interface JobDataRow {
  // Manual entry
  'Job #': number
  'Data Period': string
  Status: JobStatus
  '% of Desired Cost': number | null
  'Desired Cost to Complete': number | null

  // Lookups from Job
  Owner: string | null
  Customer: string | null
  'Job Description': string | null
  'Contract Date': string | null
  'Completed Date': string | null
  County: string | null
  'Original Contract Amount': number | null

  // Change orders
  'Approved Change Orders': number
  'Actual Contract Amount': number
  'CHANGE ORDER/ADDITIONS PENDING FINAL APPROVAL': number
  'Projected Contract Amount': number

  // Revenue (% of completion)
  'Revenue Earned to Date': number
  'Revenue Earned Prior Years': number

  // Costs
  'Cost of Construction to Date': number
  'Cost of Construction Prior Years': number

  // Gross Profit
  'Gross Profit to Date': number
  'Gross Profit Recognized Prior Years': number
  'Gross Profit Current Period': number

  // Billings
  'Progress Billings to Date': number
  'Progress Billings Prior Years': number

  // Contract Assets/Liabilities (ASC 606)
  'Contract Assets': number
  'Contract Liability': number

  // Cost to Complete
  'Cost to Complete': number
  'Total Cost': number

  // Retainage
  'Retainage percent': number | null
  'Automatic Retainage': string | null
  'Retainage Amount To Date': number
  'Total Collected To Date': number
  'Retainage Collected To Date': number
  'Retainage Receivable': number

  // Completion metrics
  '% Completed': number
  'OriginalAmount>0': boolean
  UniqueYearJob: string
  DuplicatedYearJob: number
  'Alternative Project Number': string | null
  'Applied % of Cost': number
}

// ─── Computed metrics for reports ────────────────────────────────────────────

export interface JobPeriodMetrics {
  jobNumber: number
  jobDescription: string
  owner: string
  customer: string
  contractDate: string | null
  completedDate: string | null
  county: string | null
  dataPeriod: string
  status: JobStatus

  originalContractAmount: number
  approvedChangeOrders: number
  pendingChangeOrders: number
  projectedContractAmount: number
  actualContractAmount: number

  revenueEarnedToDate: number
  revenuePriorYears: number
  revenueCurrentPeriod: number

  costToDate: number
  costPriorYears: number
  costCurrentPeriod: number

  grossProfitToDate: number
  grossProfitPriorYears: number
  grossProfitCurrentPeriod: number

  billedToDate: number
  billedPriorYears: number
  billedCurrentPeriod: number

  contractAssets: number
  contractLiability: number

  costToComplete: number
  totalCost: number

  retainagePct: number
  retainageAmountToDate: number
  retainageCollectedToDate: number
  retainageReceivable: number

  pctComplete: number
  appliedPctOfCost: number

  desiredCostToComplete: number | null
  pctOfDesiredCost: number | null

  alternativeProjectNumber: string | null
}

// ─── Config ───────────────────────────────────────────────────────────────────

export interface AppConfig {
  companyName: string
  currentPeriod: string     // ISO date
  priorPeriod1: string
  priorPeriod2: string
  priorPeriod3: string
  periodsShown: number      // 1-4
  isProprietorship: boolean
}
