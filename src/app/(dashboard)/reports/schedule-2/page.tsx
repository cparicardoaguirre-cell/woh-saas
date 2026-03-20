import { getAllReportData } from '@/lib/reports'
import { appConfig } from '@/lib/data'
import { currency, pct } from '@/lib/format'
import { Card, CardContent } from '@/components/ui/card'

export default function Schedule2Page() {
  const { schedule2 } = getAllReportData()
  const { companyName } = appConfig

  const totalRevToDate = schedule2.reduce((a, m) => a + m.revenueEarnedToDate, 0)
  const totalCostToDate = schedule2.reduce((a, m) => a + m.costToDate, 0)
  const totalGPToDate = schedule2.reduce((a, m) => a + m.grossProfitToDate, 0)
  const totalRevCurrent = schedule2.reduce((a, m) => a + m.revenueCurrentPeriod, 0)
  const totalCostCurrent = schedule2.reduce((a, m) => a + m.costCurrentPeriod, 0)
  const totalGPCurrent = schedule2.reduce((a, m) => a + m.grossProfitCurrentPeriod, 0)

  return (
    <div className="p-8">
      <div className="mb-6">
        <div className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Financial Schedule</div>
        <h1 className="text-xl font-bold">{companyName}</h1>
        <h2 className="text-lg font-semibold text-gray-700 mt-1">Schedule 2 — Completed Contracts</h2>
        <p className="text-sm text-muted-foreground mt-1">
          For the year ended December 31, 2024 &nbsp;·&nbsp; {schedule2.length} contracts
        </p>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left py-2 px-3 font-semibold">Job #</th>
                  <th className="text-left py-2 px-3 font-semibold">Description</th>
                  <th className="text-right py-2 px-3 font-semibold">Revenue to Date</th>
                  <th className="text-right py-2 px-3 font-semibold">Cost to Date</th>
                  <th className="text-right py-2 px-3 font-semibold">GP to Date</th>
                  <th className="text-right py-2 px-3 font-semibold">Revenue Prior Yrs</th>
                  <th className="text-right py-2 px-3 font-semibold">Revenue Current</th>
                  <th className="text-right py-2 px-3 font-semibold">Cost Current</th>
                  <th className="text-right py-2 px-3 font-semibold">GP Current</th>
                  <th className="text-right py-2 px-3 font-semibold">GP%</th>
                </tr>
              </thead>
              <tbody>
                {schedule2.map((m) => (
                  <tr key={m.jobNumber} className="border-b hover:bg-gray-50">
                    <td className="py-2 px-3 font-mono text-muted-foreground">{m.jobNumber}</td>
                    <td className="py-2 px-3 max-w-xs truncate" title={m.jobDescription}>{m.jobDescription}</td>
                    <td className="text-right tabular-nums py-2 px-3">{currency(m.revenueEarnedToDate)}</td>
                    <td className="text-right tabular-nums py-2 px-3">{currency(m.costToDate)}</td>
                    <td className={`text-right tabular-nums py-2 px-3 ${m.grossProfitToDate < 0 ? 'text-red-600' : ''}`}>
                      {currency(m.grossProfitToDate)}
                    </td>
                    <td className="text-right tabular-nums py-2 px-3 text-muted-foreground">{currency(m.revenuePriorYears)}</td>
                    <td className="text-right tabular-nums py-2 px-3">{currency(m.revenueCurrentPeriod)}</td>
                    <td className="text-right tabular-nums py-2 px-3">{currency(m.costCurrentPeriod)}</td>
                    <td className={`text-right tabular-nums py-2 px-3 ${m.grossProfitCurrentPeriod < 0 ? 'text-red-600' : ''}`}>
                      {currency(m.grossProfitCurrentPeriod)}
                    </td>
                    <td className="text-right tabular-nums py-2 px-3 text-muted-foreground">
                      {m.revenueCurrentPeriod > 0 ? pct(m.grossProfitCurrentPeriod / m.revenueCurrentPeriod) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-100 border-t-2 font-semibold text-xs">
                <tr>
                  <td className="py-2 px-3" colSpan={2}>Total — {schedule2.length} Contracts</td>
                  <td className="text-right tabular-nums py-2 px-3">{currency(totalRevToDate)}</td>
                  <td className="text-right tabular-nums py-2 px-3">{currency(totalCostToDate)}</td>
                  <td className="text-right tabular-nums py-2 px-3">{currency(totalGPToDate)}</td>
                  <td className="text-right tabular-nums py-2 px-3 text-muted-foreground">—</td>
                  <td className="text-right tabular-nums py-2 px-3">{currency(totalRevCurrent)}</td>
                  <td className="text-right tabular-nums py-2 px-3">{currency(totalCostCurrent)}</td>
                  <td className="text-right tabular-nums py-2 px-3">{currency(totalGPCurrent)}</td>
                  <td className="text-right tabular-nums py-2 px-3">
                    {totalRevCurrent > 0 ? pct(totalGPCurrent / totalRevCurrent) : '—'}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
