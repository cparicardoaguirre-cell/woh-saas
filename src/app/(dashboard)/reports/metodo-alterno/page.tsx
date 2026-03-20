import { getAllReportData } from '@/lib/reports'
import { appConfig } from '@/lib/data'
import { currency } from '@/lib/format'
import { Card, CardContent } from '@/components/ui/card'

export default function MetodoAlternoPage() {
  const { metodoAlterno } = getAllReportData()
  const { companyName } = appConfig

  const totals = {
    revenue: metodoAlterno.reduce((a, r) => a + r.revenueCurrentPeriod, 0),
    retainageCollected: metodoAlterno.reduce((a, r) => a + r.retainageCollectedCurrentPeriod, 0),
    retainageAmount: metodoAlterno.reduce((a, r) => a + r.retainageAmountCurrentPeriod, 0),
    adjustedRevenue: metodoAlterno.reduce((a, r) => a + r.adjustedRevenue, 0),
    cost: metodoAlterno.reduce((a, r) => a + r.costCurrentPeriod, 0),
    grossProfit: metodoAlterno.reduce((a, r) => a + r.grossProfit, 0),
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <div className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Método Alterno — Puerto Rico</div>
        <h1 className="text-xl font-bold">{companyName}</h1>
        <h2 className="text-lg font-semibold text-gray-700 mt-1">Método Alterno de Reconocimiento de Ingresos</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Para el año terminado el 31 de diciembre de 2024 &nbsp;·&nbsp; {metodoAlterno.length} contratos
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
                  <th className="text-right py-2 px-3 font-semibold">Revenue Current Period</th>
                  <th className="text-right py-2 px-3 font-semibold">Retainage Collected</th>
                  <th className="text-right py-2 px-3 font-semibold">Retainage Amount</th>
                  <th className="text-right py-2 px-3 font-semibold">Adjusted Revenue</th>
                  <th className="text-right py-2 px-3 font-semibold">Cost Current Period</th>
                  <th className="text-right py-2 px-3 font-semibold">Gross Profit</th>
                </tr>
              </thead>
              <tbody>
                {metodoAlterno.map((row) => (
                  <tr key={row.jobNumber} className="border-b hover:bg-gray-50">
                    <td className="py-2 px-3 font-mono text-muted-foreground">{row.jobNumber}</td>
                    <td className="py-2 px-3 max-w-xs truncate" title={row.jobDescription}>{row.jobDescription}</td>
                    <td className="text-right tabular-nums py-2 px-3">{currency(row.revenueCurrentPeriod)}</td>
                    <td className="text-right tabular-nums py-2 px-3">{row.retainageCollectedCurrentPeriod > 0 ? currency(row.retainageCollectedCurrentPeriod) : '—'}</td>
                    <td className="text-right tabular-nums py-2 px-3">{row.retainageAmountCurrentPeriod > 0 ? currency(row.retainageAmountCurrentPeriod) : '—'}</td>
                    <td className="text-right tabular-nums py-2 px-3 font-medium">{currency(row.adjustedRevenue)}</td>
                    <td className="text-right tabular-nums py-2 px-3">{currency(row.costCurrentPeriod)}</td>
                    <td className={`text-right tabular-nums py-2 px-3 font-medium ${row.grossProfit < 0 ? 'text-red-600' : ''}`}>
                      {currency(row.grossProfit)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-100 border-t-2 font-semibold">
                <tr>
                  <td className="py-2 px-3" colSpan={2}>Total — {metodoAlterno.length} contratos</td>
                  <td className="text-right tabular-nums py-2 px-3">{currency(totals.revenue)}</td>
                  <td className="text-right tabular-nums py-2 px-3">{currency(totals.retainageCollected)}</td>
                  <td className="text-right tabular-nums py-2 px-3">{currency(totals.retainageAmount)}</td>
                  <td className="text-right tabular-nums py-2 px-3">{currency(totals.adjustedRevenue)}</td>
                  <td className="text-right tabular-nums py-2 px-3">{currency(totals.cost)}</td>
                  <td className="text-right tabular-nums py-2 px-3">{currency(totals.grossProfit)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
