import { jobs } from '@/lib/data'
import { currency, formatDate, pct } from '@/lib/format'
import { Card, CardContent } from '@/components/ui/card'

const statusColor: Record<string, string> = {
  YES: 'bg-green-100 text-green-800',
  NO: 'bg-gray-100 text-gray-600',
}

export default function JobsPage() {
  const activeJobs = jobs.filter((j) => j['Job Description'] && j['Job #'])

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Jobs / Projects</h1>
        <p className="text-sm text-muted-foreground mt-1">{activeJobs.length} projects registered</p>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-gray-50 border-b sticky top-0">
                <tr>
                  <th className="text-left py-2 px-3 font-semibold">Job #</th>
                  <th className="text-left py-2 px-3 font-semibold">Description</th>
                  <th className="text-left py-2 px-3 font-semibold">Customer</th>
                  <th className="text-left py-2 px-3 font-semibold">County</th>
                  <th className="text-right py-2 px-3 font-semibold">Contract Date</th>
                  <th className="text-right py-2 px-3 font-semibold">Completed Date</th>
                  <th className="text-right py-2 px-3 font-semibold">Original Amount</th>
                  <th className="text-right py-2 px-3 font-semibold">Projected Amount</th>
                  <th className="text-right py-2 px-3 font-semibold">Revenue Earned</th>
                  <th className="text-right py-2 px-3 font-semibold">Billed to Date</th>
                  <th className="text-right py-2 px-3 font-semibold">Retainage</th>
                  <th className="text-center py-2 px-3 font-semibold">Auto-Ret.</th>
                </tr>
              </thead>
              <tbody>
                {activeJobs.map((job) => (
                  <tr key={job['Job #']} className="border-b hover:bg-gray-50">
                    <td className="py-2 px-3 font-mono font-medium">{job['Job #']}</td>
                    <td className="py-2 px-3 max-w-[200px] truncate" title={job['Job Description']}>
                      {job['Job Description']}
                    </td>
                    <td className="py-2 px-3 max-w-[160px] truncate text-muted-foreground" title={job.Customer ?? ''}>
                      {job.Customer}
                    </td>
                    <td className="py-2 px-3 text-muted-foreground">{job.County ?? '—'}</td>
                    <td className="text-right py-2 px-3 text-muted-foreground">{formatDate(job['Contract Date'])}</td>
                    <td className="text-right py-2 px-3 text-muted-foreground">{formatDate(job['Completed Date'])}</td>
                    <td className="text-right tabular-nums py-2 px-3">{currency(job['Original Contract Amount'])}</td>
                    <td className="text-right tabular-nums py-2 px-3">{currency(job['Projected Contact Amount'])}</td>
                    <td className="text-right tabular-nums py-2 px-3 text-blue-700">{currency(job['Revenue Earned to Date'])}</td>
                    <td className="text-right tabular-nums py-2 px-3">{currency(job['Billed to Date'])}</td>
                    <td className="text-right tabular-nums py-2 px-3">
                      {job.Retainage != null ? pct(job.Retainage) : '—'}
                    </td>
                    <td className="text-center py-2 px-3">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${statusColor[job['Automatic Retainage'] ?? 'NO'] ?? ''}`}>
                        {job['Automatic Retainage'] ?? 'NO'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
