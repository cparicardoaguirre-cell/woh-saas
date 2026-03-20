import { compareWithExcel, getExcelMetricsForPeriod } from '@/lib/reports'
import { appConfig } from '@/lib/data'
import { currency, pct } from '@/lib/format'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

const THRESHOLD = 1.00 // flag differences > $1.00

export default function ComparePage() {
  const period = appConfig.currentPeriod
  const comparison = compareWithExcel(period)

  const diffs = comparison.filter(
    (r) => r.diffs.revenueToDate > THRESHOLD || r.diffs.costToDate > THRESHOLD || r.diffs.billedToDate > THRESHOLD
  )
  const matches = comparison.filter(
    (r) => r.diffs.revenueToDate <= THRESHOLD && r.diffs.costToDate <= THRESHOLD && r.diffs.billedToDate <= THRESHOLD
  )

  const totalJobs = comparison.length
  const matchRate = totalJobs > 0 ? matches.length / totalJobs : 0

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Comparison: SaaS Engine vs. Excel</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Period: December 31, 2024 &nbsp;·&nbsp; Showing differences &gt; ${THRESHOLD.toFixed(2)}
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-1 pt-4 px-4">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Total Jobs Compared</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-2xl font-bold">{totalJobs}</div>
          </CardContent>
        </Card>
        <Card className="border-green-200">
          <CardHeader className="pb-1 pt-4 px-4">
            <CardTitle className="text-xs font-medium text-green-700 uppercase tracking-wide">Exact Matches</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-2xl font-bold text-green-700">{matches.length}</div>
            <div className="text-xs text-muted-foreground">{pct(matchRate)} match rate</div>
          </CardContent>
        </Card>
        <Card className="border-amber-200">
          <CardHeader className="pb-1 pt-4 px-4">
            <CardTitle className="text-xs font-medium text-amber-700 uppercase tracking-wide">Differences Found</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-2xl font-bold text-amber-700">{diffs.length}</div>
            <div className="text-xs text-muted-foreground">Need investigation</div>
          </CardContent>
        </Card>
      </div>

      {diffs.length > 0 && (
        <div className="mb-8">
          <h2 className="text-base font-semibold mb-3 text-amber-700">Jobs with Differences</h2>
          <Card className="border-amber-200">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="bg-amber-50 border-b">
                    <tr>
                      <th className="text-left py-2 px-3 font-semibold">Job #</th>
                      <th className="text-left py-2 px-3 font-semibold">Description</th>
                      <th className="text-right py-2 px-3 font-semibold" colSpan={2}>Revenue to Date</th>
                      <th className="text-right py-2 px-3 font-semibold">Δ Revenue</th>
                      <th className="text-right py-2 px-3 font-semibold" colSpan={2}>Cost to Date</th>
                      <th className="text-right py-2 px-3 font-semibold">Δ Cost</th>
                      <th className="text-right py-2 px-3 font-semibold" colSpan={2}>Billed to Date</th>
                      <th className="text-right py-2 px-3 font-semibold">Δ Billed</th>
                    </tr>
                    <tr className="bg-amber-50 text-[10px] text-muted-foreground">
                      <th colSpan={2}></th>
                      <th className="text-right py-1 px-3">SaaS</th>
                      <th className="text-right py-1 px-3">Excel</th>
                      <th></th>
                      <th className="text-right py-1 px-3">SaaS</th>
                      <th className="text-right py-1 px-3">Excel</th>
                      <th></th>
                      <th className="text-right py-1 px-3">SaaS</th>
                      <th className="text-right py-1 px-3">Excel</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {diffs.map((r) => (
                      <tr key={r.jobNumber} className="border-b hover:bg-amber-50/50">
                        <td className="py-2 px-3 font-mono">{r.jobNumber}</td>
                        <td className="py-2 px-3 max-w-[160px] truncate" title={r.jobDescription}>{r.jobDescription}</td>
                        <td className="text-right tabular-nums py-2 px-3">{currency(r.our.revenueToDate)}</td>
                        <td className="text-right tabular-nums py-2 px-3 text-muted-foreground">{currency(r.excel.revenueToDate)}</td>
                        <td className={`text-right tabular-nums py-2 px-3 font-medium ${r.diffs.revenueToDate > THRESHOLD ? 'text-amber-600' : 'text-green-600'}`}>
                          {r.diffs.revenueToDate > 0.01 ? currency(r.diffs.revenueToDate) : '✓'}
                        </td>
                        <td className="text-right tabular-nums py-2 px-3">{currency(r.our.costToDate)}</td>
                        <td className="text-right tabular-nums py-2 px-3 text-muted-foreground">{currency(r.excel.costToDate)}</td>
                        <td className={`text-right tabular-nums py-2 px-3 font-medium ${r.diffs.costToDate > THRESHOLD ? 'text-amber-600' : 'text-green-600'}`}>
                          {r.diffs.costToDate > 0.01 ? currency(r.diffs.costToDate) : '✓'}
                        </td>
                        <td className="text-right tabular-nums py-2 px-3">{currency(r.our.billedToDate)}</td>
                        <td className="text-right tabular-nums py-2 px-3 text-muted-foreground">{currency(r.excel.billedToDate)}</td>
                        <td className={`text-right tabular-nums py-2 px-3 font-medium ${r.diffs.billedToDate > THRESHOLD ? 'text-amber-600' : 'text-green-600'}`}>
                          {r.diffs.billedToDate > 0.01 ? currency(r.diffs.billedToDate) : '✓'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {matches.length > 0 && (
        <div>
          <h2 className="text-base font-semibold mb-3 text-green-700">
            Matching Jobs ({matches.length}) — All figures within ${THRESHOLD.toFixed(2)}
          </h2>
          <Card className="border-green-200">
            <CardContent className="p-0">
              <table className="w-full text-xs">
                <thead className="bg-green-50 border-b">
                  <tr>
                    <th className="text-left py-2 px-3 font-semibold">Job #</th>
                    <th className="text-left py-2 px-3 font-semibold">Description</th>
                    <th className="text-right py-2 px-3 font-semibold">Revenue to Date</th>
                    <th className="text-right py-2 px-3 font-semibold">Cost to Date</th>
                    <th className="text-right py-2 px-3 font-semibold">Billed to Date</th>
                    <th className="text-right py-2 px-3 font-semibold">% Complete</th>
                    <th className="text-center py-2 px-3 font-semibold">Match</th>
                  </tr>
                </thead>
                <tbody>
                  {matches.map((r) => (
                    <tr key={r.jobNumber} className="border-b hover:bg-green-50/50">
                      <td className="py-1.5 px-3 font-mono text-muted-foreground">{r.jobNumber}</td>
                      <td className="py-1.5 px-3 max-w-xs truncate" title={r.jobDescription}>{r.jobDescription}</td>
                      <td className="text-right tabular-nums py-1.5 px-3">{currency(r.our.revenueToDate)}</td>
                      <td className="text-right tabular-nums py-1.5 px-3">{currency(r.our.costToDate)}</td>
                      <td className="text-right tabular-nums py-1.5 px-3">{currency(r.our.billedToDate)}</td>
                      <td className="text-right tabular-nums py-1.5 px-3">{pct(r.our.pctComplete)}</td>
                      <td className="text-center py-1.5 px-3 text-green-600 font-bold">✓</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
