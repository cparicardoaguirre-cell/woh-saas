import { getCompanyForUser, getAppConfig, getReportingPeriods } from '@/lib/db'
import { getAllReportDataLive } from '@/lib/db-reports'
import { currency, pct, periodLabel } from '@/lib/format'
import { Card, CardContent } from '@/components/ui/card'
import { PeriodSelector } from '@/components/period-selector'
import { PrintButton } from '@/components/print-button'
import { redirect } from 'next/navigation'

const statusColor: Record<string, string> = {
  'In Progress': 'bg-green-100 text-green-800',
  Paused: 'bg-yellow-100 text-yellow-800',
  Inactive: 'bg-gray-100 text-gray-700',
}

export default async function Schedule3Page(
  props: { searchParams: Promise<Record<string, string | string[] | undefined>> }
) {
  const company = await getCompanyForUser()
  if (!company) redirect('/login')

  const config = await getAppConfig(company.id)
  const sp = await props.searchParams
  const period = (sp?.period as string) || config.currentPeriod

  const reportData = await getAllReportDataLive(company.id, period)
  const { schedule3 } = reportData

  const periods = await getReportingPeriods(company.id)
  const periodDates = periods.length > 0
    ? periods.map((p) => p.period_date)
    : [config.currentPeriod, config.priorPeriod1, config.priorPeriod2, config.priorPeriod3].filter(Boolean)

  const totals = {
    projected: schedule3.reduce((a, m) => a + m.projectedContractAmount, 0),
    revenueToDate: schedule3.reduce((a, m) => a + m.revenueEarnedToDate, 0),
    costToDate: schedule3.reduce((a, m) => a + m.costToDate, 0),
    gpToDate: schedule3.reduce((a, m) => a + m.grossProfitToDate, 0),
    billedToDate: schedule3.reduce((a, m) => a + m.billedToDate, 0),
    ctc: schedule3.reduce((a, m) => a + m.costToComplete, 0),
    revenueCurrent: schedule3.reduce((a, m) => a + m.revenueCurrentPeriod, 0),
    costCurrent: schedule3.reduce((a, m) => a + m.costCurrentPeriod, 0),
    gpCurrent: schedule3.reduce((a, m) => a + m.grossProfitCurrentPeriod, 0),
    contractAssets: schedule3.reduce((a, m) => a + m.contractAssets, 0),
    contractLiability: schedule3.reduce((a, m) => a + m.contractLiability, 0),
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <div className="flex items-center justify-between print:hidden">
          <div className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Financial Schedule</div>
          <div className="flex items-center gap-3">
            <PeriodSelector periods={periodDates} currentPeriod={period} />
            <PrintButton />
          </div>
        </div>
        <h1 className="text-xl font-bold">{config.companyName}</h1>
        <h2 className="text-lg font-semibold text-gray-700 mt-1">Schedule 3 — Contracts in Progress</h2>
        <p className="text-sm text-muted-foreground mt-1">
          As of {periodLabel(period)} &nbsp;·&nbsp; {schedule3.length} active contracts
        </p>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left py-2 px-2 font-semibold">Job #</th>
                  <th className="text-left py-2 px-2 font-semibold">Description</th>
                  <th className="text-left py-2 px-2 font-semibold">Status</th>
                  <th className="text-right py-2 px-2 font-semibold">Projected Amt</th>
                  <th className="text-right py-2 px-2 font-semibold">% Done</th>
                  <th className="text-right py-2 px-2 font-semibold">Revenue to Date</th>
                  <th className="text-right py-2 px-2 font-semibold">Cost to Date</th>
                  <th className="text-right py-2 px-2 font-semibold">GP to Date</th>
                  <th className="text-right py-2 px-2 font-semibold">Billed to Date</th>
                  <th className="text-right py-2 px-2 font-semibold">Cost to Complete</th>
                  <th className="text-right py-2 px-2 font-semibold">Rev Current</th>
                  <th className="text-right py-2 px-2 font-semibold">Cost Current</th>
                  <th className="text-right py-2 px-2 font-semibold">GP Current</th>
                  <th className="text-right py-2 px-2 font-semibold">Contract Assets</th>
                  <th className="text-right py-2 px-2 font-semibold">Contract Liab.</th>
                </tr>
              </thead>
              <tbody>
                {schedule3.map((m) => (
                  <tr key={m.jobNumber} className="border-b hover:bg-gray-50">
                    <td className="py-1.5 px-2 font-mono text-muted-foreground">{m.jobNumber}</td>
                    <td className="py-1.5 px-2 max-w-[180px] truncate" title={m.jobDescription}>{m.jobDescription}</td>
                    <td className="py-1.5 px-2">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${statusColor[m.status] ?? 'bg-gray-100 text-gray-700'}`}>
                        {m.status}
                      </span>
                    </td>
                    <td className="text-right tabular-nums py-1.5 px-2">{currency(m.projectedContractAmount)}</td>
                    <td className="text-right tabular-nums py-1.5 px-2">{pct(m.pctComplete)}</td>
                    <td className="text-right tabular-nums py-1.5 px-2">{currency(m.revenueEarnedToDate)}</td>
                    <td className="text-right tabular-nums py-1.5 px-2">{currency(m.costToDate)}</td>
                    <td className={`text-right tabular-nums py-1.5 px-2 ${m.grossProfitToDate < 0 ? 'text-red-600' : ''}`}>
                      {currency(m.grossProfitToDate)}
                    </td>
                    <td className="text-right tabular-nums py-1.5 px-2">{currency(m.billedToDate)}</td>
                    <td className="text-right tabular-nums py-1.5 px-2 text-muted-foreground">{currency(m.costToComplete)}</td>
                    <td className="text-right tabular-nums py-1.5 px-2">{currency(m.revenueCurrentPeriod)}</td>
                    <td className="text-right tabular-nums py-1.5 px-2">{currency(m.costCurrentPeriod)}</td>
                    <td className={`text-right tabular-nums py-1.5 px-2 ${m.grossProfitCurrentPeriod < 0 ? 'text-red-600' : ''}`}>
                      {currency(m.grossProfitCurrentPeriod)}
                    </td>
                    <td className="text-right tabular-nums py-1.5 px-2 text-green-700">{m.contractAssets > 0 ? currency(m.contractAssets) : '—'}</td>
                    <td className="text-right tabular-nums py-1.5 px-2 text-red-600">{m.contractLiability > 0 ? currency(m.contractLiability) : '—'}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-100 border-t-2 font-semibold">
                <tr>
                  <td className="py-2 px-2" colSpan={3}>Total — {schedule3.length} Contracts</td>
                  <td className="text-right tabular-nums py-2 px-2">{currency(totals.projected)}</td>
                  <td></td>
                  <td className="text-right tabular-nums py-2 px-2">{currency(totals.revenueToDate)}</td>
                  <td className="text-right tabular-nums py-2 px-2">{currency(totals.costToDate)}</td>
                  <td className="text-right tabular-nums py-2 px-2">{currency(totals.gpToDate)}</td>
                  <td className="text-right tabular-nums py-2 px-2">{currency(totals.billedToDate)}</td>
                  <td className="text-right tabular-nums py-2 px-2">{currency(totals.ctc)}</td>
                  <td className="text-right tabular-nums py-2 px-2">{currency(totals.revenueCurrent)}</td>
                  <td className="text-right tabular-nums py-2 px-2">{currency(totals.costCurrent)}</td>
                  <td className="text-right tabular-nums py-2 px-2">{currency(totals.gpCurrent)}</td>
                  <td className="text-right tabular-nums py-2 px-2 text-green-700">{currency(totals.contractAssets)}</td>
                  <td className="text-right tabular-nums py-2 px-2 text-red-600">{currency(totals.contractLiability)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
