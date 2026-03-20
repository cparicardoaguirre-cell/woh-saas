import { getAllReportData } from '@/lib/reports'
import { appConfig } from '@/lib/data'
import { currency, pct } from '@/lib/format'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function Schedule1Page() {
  const { schedule1 } = getAllReportData()
  const { companyName } = appConfig

  const rows = [
    { label: 'Contracts Completed', data: schedule1.completed },
    { label: 'Contracts in Progress', data: schedule1.inProgress },
  ]

  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-6">
        <div className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Financial Schedule</div>
        <h1 className="text-xl font-bold">{companyName}</h1>
        <h2 className="text-lg font-semibold text-gray-700 mt-1">Schedule 1 — Earnings from Contracts</h2>
        <p className="text-sm text-muted-foreground mt-1">For the year ended December 31, 2024</p>
      </div>

      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left py-3 px-4 font-semibold text-gray-700 w-1/2">Category</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-700">Revenue Earned</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-700">Cost of Revenues</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-700">Gross Profit (Loss)</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-700">GP %</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ label, data }) => (
                <tr key={label} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4">{label}</td>
                  <td className="text-right tabular-nums py-3 px-4">{currency(data.revenue)}</td>
                  <td className="text-right tabular-nums py-3 px-4">{currency(data.cost)}</td>
                  <td className={`text-right tabular-nums py-3 px-4 ${data.grossProfit < 0 ? 'text-red-600' : ''}`}>
                    {currency(data.grossProfit)}
                  </td>
                  <td className="text-right tabular-nums py-3 px-4 text-muted-foreground">
                    {data.revenue > 0 ? pct(data.grossProfit / data.revenue) : '—'}
                  </td>
                </tr>
              ))}
              <tr className="bg-gray-50 font-bold border-t-2">
                <td className="py-3 px-4">Total</td>
                <td className="text-right tabular-nums py-3 px-4">{currency(schedule1.total.revenue)}</td>
                <td className="text-right tabular-nums py-3 px-4">{currency(schedule1.total.cost)}</td>
                <td className={`text-right tabular-nums py-3 px-4 ${schedule1.total.grossProfit < 0 ? 'text-red-600' : ''}`}>
                  {currency(schedule1.total.grossProfit)}
                </td>
                <td className="text-right tabular-nums py-3 px-4">
                  {schedule1.total.revenue > 0 ? pct(schedule1.total.grossProfit / schedule1.total.revenue) : '—'}
                </td>
              </tr>
            </tbody>
          </table>
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground mt-4">
        * Revenue recognized using the percentage-of-completion method (ASC 606).
        Current period = amounts earned in fiscal year 2024.
      </p>
    </div>
  )
}
