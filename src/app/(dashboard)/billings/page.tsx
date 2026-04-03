import { getCompanyForUser, getBillings, getJobs, getCustomers } from '@/lib/db'
import { currency } from '@/lib/format'
import { redirect } from 'next/navigation'
import { BillingsClient } from './billings-client'

export default async function BillingsPage() {
  const company = await getCompanyForUser()
  if (!company) redirect('/login')

  const [billings, jobs, customers] = await Promise.all([
    getBillings(company.id),
    getJobs(company.id),
    getCustomers(company.id),
  ])

  const totalAmount = billings.reduce((sum, b) => sum + (b.amount ?? 0), 0)

  return (
    <div className="p-8">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">Billings</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {billings.length} billing record{billings.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="text-right">
          <div className="text-xs text-muted-foreground uppercase tracking-wide">Total Billed</div>
          <div className="font-bold text-lg">{currency(totalAmount)}</div>
        </div>
      </div>

      <BillingsClient billings={billings} jobs={jobs} customers={customers} />
    </div>
  )
}
