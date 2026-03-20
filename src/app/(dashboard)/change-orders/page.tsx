import { changeOrders } from '@/lib/data'
import { currency, formatDate } from '@/lib/format'
import { Card, CardContent } from '@/components/ui/card'

export default function ChangeOrdersPage() {
  const active = changeOrders.filter((co) => co['Job Number'])

  const totalApproved = active
    .filter((co) => co.Approved === 'YES')
    .reduce((a, co) => a + (co.Amount ?? 0), 0)
  const totalPending = active
    .filter((co) => co.Approved !== 'YES')
    .reduce((a, co) => a + (co.Amount ?? 0), 0)

  return (
    <div className="p-8">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">Change Orders</h1>
          <p className="text-sm text-muted-foreground mt-1">{active.length} change orders</p>
        </div>
        <div className="flex gap-4 text-sm">
          <div className="text-right">
            <div className="text-xs text-muted-foreground uppercase tracking-wide">Approved</div>
            <div className="font-bold text-green-700">{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(totalApproved)}</div>
          </div>
          <div className="text-right">
            <div className="text-xs text-muted-foreground uppercase tracking-wide">Pending</div>
            <div className="font-bold text-amber-600">{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(totalPending)}</div>
          </div>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-right py-2 px-3 font-semibold">Job #</th>
                  <th className="text-left py-2 px-3 font-semibold">Job Description</th>
                  <th className="text-right py-2 px-3 font-semibold">CO #</th>
                  <th className="text-right py-2 px-3 font-semibold">Date</th>
                  <th className="text-center py-2 px-3 font-semibold">Approved</th>
                  <th className="text-right py-2 px-3 font-semibold">Amount</th>
                  <th className="text-right py-2 px-3 font-semibold">Original Contract</th>
                  <th className="text-right py-2 px-3 font-semibold">Projected Amount</th>
                </tr>
              </thead>
              <tbody>
                {active.map((co, i) => (
                  <tr key={i} className="border-b hover:bg-gray-50">
                    <td className="text-right py-2 px-3 font-mono">{co['Job Number']}</td>
                    <td className="py-2 px-3 max-w-[200px] truncate" title={co['Job Description']}>{co['Job Description']}</td>
                    <td className="text-right py-2 px-3 font-mono">{co['Change Order Number']}</td>
                    <td className="text-right py-2 px-3 text-muted-foreground">{formatDate(co.Date)}</td>
                    <td className="text-center py-2 px-3">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${co.Approved === 'YES' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>
                        {co.Approved}
                      </span>
                    </td>
                    <td className={`text-right tabular-nums py-2 px-3 font-medium ${(co.Amount ?? 0) < 0 ? 'text-red-600' : ''}`}>
                      {currency(co.Amount)}
                    </td>
                    <td className="text-right tabular-nums py-2 px-3 text-muted-foreground">{currency(co['Original Contract Amount'])}</td>
                    <td className="text-right tabular-nums py-2 px-3">{currency(co['Projected Contract Amount'])}</td>
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
