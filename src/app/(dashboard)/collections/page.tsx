import { getCompanyForUser, getCollections, getJobs, getCustomers, getBillings } from '@/lib/db'
import { currency } from '@/lib/format'
import { redirect } from 'next/navigation'
import { CollectionsClient } from './collections-client'

export default async function CollectionsPage() {
  const company = await getCompanyForUser()
  if (!company) redirect('/login')

  const [collections, jobs, customers, billings] = await Promise.all([
    getCollections(company.id),
    getJobs(company.id),
    getCustomers(company.id),
    getBillings(company.id),
  ])

  const totalCollected = collections.reduce((sum, c) => sum + (c.amount ?? 0), 0)

  return (
    <div className="p-8">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">Collections</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {collections.length} collection record{collections.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="text-right">
          <div className="text-xs text-muted-foreground uppercase tracking-wide">Total Collected</div>
          <div className="font-bold text-lg">{currency(totalCollected)}</div>
        </div>
      </div>

      <CollectionsClient
        collections={collections}
        jobs={jobs}
        customers={customers}
        billings={billings}
      />
    </div>
  )
}
