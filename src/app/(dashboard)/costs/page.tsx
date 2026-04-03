import { getCompanyForUser, getCosts, getJobs } from '@/lib/db'
import { currency } from '@/lib/format'
import { redirect } from 'next/navigation'
import { CostsClient } from './costs-client'

export default async function CostsPage() {
  const company = await getCompanyForUser()
  if (!company) redirect('/login')

  const [costs, jobs] = await Promise.all([
    getCosts(company.id),
    getJobs(company.id),
  ])

  const totalCost = costs.reduce((sum, c) => sum + (c.amount ?? 0), 0)

  return (
    <div className="p-8">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">Costs</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {costs.length} cost record{costs.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="text-right">
          <div className="text-xs text-muted-foreground uppercase tracking-wide">Total Costs</div>
          <div className="font-bold text-lg">{currency(totalCost)}</div>
        </div>
      </div>

      <CostsClient costs={costs} jobs={jobs} />
    </div>
  )
}
