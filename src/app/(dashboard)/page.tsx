import { getAllReportData } from '@/lib/reports'
import { appConfig } from '@/lib/data'
import { currency, pct } from '@/lib/format'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function DashboardPage() {
  const { schedule1, schedule2, schedule3, nota6 } = getAllReportData()

  const kpis = [
    {
      label: 'Total Revenue (Current Period)',
      value: currency(schedule1.total.revenue),
      sub: 'Earned — % of completion',
    },
    {
      label: 'Total Cost (Current Period)',
      value: currency(schedule1.total.cost),
      sub: 'Cost of revenues earned',
    },
    {
      label: 'Gross Profit (Current Period)',
      value: currency(schedule1.total.grossProfit),
      sub: pct(schedule1.total.revenue > 0 ? schedule1.total.grossProfit / schedule1.total.revenue : 0) + ' margin',
    },
    {
      label: 'Completed Contracts',
      value: String(schedule2.length),
      sub: currency(schedule2.reduce((a, m) => a + m.revenueCurrentPeriod, 0)) + ' revenue',
    },
    {
      label: 'Contracts in Progress',
      value: String(schedule3.length),
      sub: currency(schedule3.reduce((a, m) => a + m.projectedContractAmount, 0)) + ' projected',
    },
    {
      label: 'Contract Assets (ASC 606)',
      value: currency(nota6.contractAssets),
      sub: 'Revenue earned > billed',
    },
    {
      label: 'Contract Liabilities',
      value: currency(nota6.contractLiability),
      sub: 'Billed > revenue earned',
    },
    {
      label: 'Retainage Receivable',
      value: currency(
        [...schedule2, ...schedule3].reduce((a, m) => a + m.retainageReceivable, 0)
      ),
      sub: 'Outstanding retainage',
    },
  ]

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">{appConfig.companyName}</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Period ending December 31, 2024 &nbsp;·&nbsp; Work on Hand Summary
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {kpis.map((kpi) => (
          <Card key={kpi.label}>
            <CardHeader className="pb-1 pt-4 px-4">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                {kpi.label}
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="text-xl font-bold text-gray-900">{kpi.value}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{kpi.sub}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Schedule 1 Summary */}
        <Card className="col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Schedule 1 — Earnings from Contracts</CardTitle>
          </CardHeader>
          <CardContent>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-xs text-muted-foreground uppercase">
                  <th className="text-left py-1.5 font-medium">Category</th>
                  <th className="text-right py-1.5 font-medium">Revenue</th>
                  <th className="text-right py-1.5 font-medium">Cost</th>
                  <th className="text-right py-1.5 font-medium">Gross Profit</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="py-2">Contracts Completed</td>
                  <td className="text-right tabular-nums">{currency(schedule1.completed.revenue)}</td>
                  <td className="text-right tabular-nums">{currency(schedule1.completed.cost)}</td>
                  <td className="text-right tabular-nums">{currency(schedule1.completed.grossProfit)}</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2">Contracts in Progress</td>
                  <td className="text-right tabular-nums">{currency(schedule1.inProgress.revenue)}</td>
                  <td className="text-right tabular-nums">{currency(schedule1.inProgress.cost)}</td>
                  <td className="text-right tabular-nums">{currency(schedule1.inProgress.grossProfit)}</td>
                </tr>
                <tr className="font-semibold bg-gray-50">
                  <td className="py-2 pl-1 rounded-l">Total</td>
                  <td className="text-right tabular-nums">{currency(schedule1.total.revenue)}</td>
                  <td className="text-right tabular-nums">{currency(schedule1.total.cost)}</td>
                  <td className="text-right tabular-nums">{currency(schedule1.total.grossProfit)}</td>
                </tr>
              </tbody>
            </table>
          </CardContent>
        </Card>

        {/* Nota 6 Summary */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Nota 6 — Contracts in Progress</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2">
            {[
              ['Cost incurred to date', nota6.costIncurred],
              ['Estimated earnings', nota6.estimatedEarnings],
              ['Revenue earned to date', nota6.revenueEarned],
              ['Less: Billings to date', -nota6.billingsToDate],
              ['Difference', nota6.difference],
            ].map(([label, val]) => (
              <div key={String(label)} className="flex justify-between items-center">
                <span className="text-muted-foreground text-xs">{label}</span>
                <span className={`tabular-nums font-medium ${Number(val) < 0 ? 'text-red-600' : ''}`}>
                  {currency(Number(val))}
                </span>
              </div>
            ))}
            <div className="border-t pt-2 mt-2 space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Contract Assets</span>
                <span className="tabular-nums text-green-700 font-medium">{currency(nota6.contractAssets)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Contract Liabilities</span>
                <span className="tabular-nums text-red-600 font-medium">{currency(nota6.contractLiability)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
