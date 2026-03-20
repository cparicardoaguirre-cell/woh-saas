import { billings } from '@/lib/data'
import { currency, formatDate, pct } from '@/lib/format'
import { Card, CardContent } from '@/components/ui/card'

export default function BillingsPage() {
  const activeBillings = billings.filter((b) => b.Customer && b['Job Number'])

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Billings</h1>
        <p className="text-sm text-muted-foreground mt-1">{activeBillings.length} billing records</p>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left py-2 px-3 font-semibold">Customer</th>
                  <th className="text-right py-2 px-3 font-semibold">Bill #</th>
                  <th className="text-right py-2 px-3 font-semibold">Date</th>
                  <th className="text-right py-2 px-3 font-semibold">Job #</th>
                  <th className="text-left py-2 px-3 font-semibold">Description</th>
                  <th className="text-left py-2 px-3 font-semibold">Type</th>
                  <th className="text-right py-2 px-3 font-semibold">Amount</th>
                  <th className="text-right py-2 px-3 font-semibold">Bill Payments</th>
                  <th className="text-right py-2 px-3 font-semibold">Balance</th>
                  <th className="text-right py-2 px-3 font-semibold">% Completed</th>
                  <th className="text-left py-2 px-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {activeBillings.map((b, i) => (
                  <tr key={i} className="border-b hover:bg-gray-50">
                    <td className="py-2 px-3 max-w-[140px] truncate" title={b.Customer}>{b.Customer}</td>
                    <td className="text-right py-2 px-3 font-mono">{b['Bill Number']}</td>
                    <td className="text-right py-2 px-3 text-muted-foreground">{formatDate(b.Date)}</td>
                    <td className="text-right py-2 px-3 font-mono">{b['Job Number']}</td>
                    <td className="py-2 px-3 max-w-[160px] truncate text-muted-foreground" title={b['Bill Description'] ?? ''}>
                      {b['Bill Description'] ?? b['Job Description']}
                    </td>
                    <td className="py-2 px-3 text-muted-foreground">{b.Type ?? '—'}</td>
                    <td className="text-right tabular-nums py-2 px-3">{currency(b.Amount)}</td>
                    <td className="text-right tabular-nums py-2 px-3 text-green-700">{currency(b['Bill Payments'])}</td>
                    <td className={`text-right tabular-nums py-2 px-3 font-medium ${(b['Bill Balance'] ?? 0) > 0 ? 'text-amber-600' : ''}`}>
                      {currency(b['Bill Balance'])}
                    </td>
                    <td className="text-right tabular-nums py-2 px-3">
                      {b['% Completed'] != null ? pct(b['% Completed']) : '—'}
                    </td>
                    <td className="py-2 px-3">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                        b.Status === 'Completed' ? 'bg-green-100 text-green-800' :
                        b.Status === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {b.Status ?? '—'}
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
