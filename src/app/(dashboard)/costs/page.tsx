import { costs } from '@/lib/data'
import { currency, formatDate, pct } from '@/lib/format'
import { Card, CardContent } from '@/components/ui/card'

export default function CostsPage() {
  const active = costs.filter((c) => c['Job Number'])

  const total = active.reduce((a, c) => a + (c.Amount ?? 0), 0)

  return (
    <div className="p-8">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">Costs</h1>
          <p className="text-sm text-muted-foreground mt-1">{active.length} cost records</p>
        </div>
        <div className="text-right">
          <div className="text-xs text-muted-foreground uppercase tracking-wide">Total Costs</div>
          <div className="font-bold text-lg">{currency(total)}</div>
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
                  <th className="text-left py-2 px-3 font-semibold">Supplier</th>
                  <th className="text-right py-2 px-3 font-semibold">Invoice #</th>
                  <th className="text-right py-2 px-3 font-semibold">Date</th>
                  <th className="text-left py-2 px-3 font-semibold">Type</th>
                  <th className="text-right py-2 px-3 font-semibold">Amount</th>
                  <th className="text-right py-2 px-3 font-semibold">Job Cost</th>
                  <th className="text-right py-2 px-3 font-semibold">AP Balance</th>
                  <th className="text-right py-2 px-3 font-semibold">% Complete</th>
                  <th className="text-left py-2 px-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {active.map((c, i) => (
                  <tr key={i} className="border-b hover:bg-gray-50">
                    <td className="text-right py-2 px-3 font-mono">{c['Job Number']}</td>
                    <td className="py-2 px-3 max-w-[160px] truncate" title={c['Job Description']}>{c['Job Description']}</td>
                    <td className="py-2 px-3 max-w-[120px] truncate text-muted-foreground" title={c.Supplier ?? ''}>{c.Supplier ?? '—'}</td>
                    <td className="text-right py-2 px-3 font-mono">{c['Invoice Number'] ?? '—'}</td>
                    <td className="text-right py-2 px-3 text-muted-foreground">{formatDate(c.Date)}</td>
                    <td className="py-2 px-3 text-muted-foreground">{c.Type ?? '—'}</td>
                    <td className="text-right tabular-nums py-2 px-3 font-medium">{currency(c.Amount)}</td>
                    <td className="text-right tabular-nums py-2 px-3 text-muted-foreground">{currency(c['Job Cost'])}</td>
                    <td className={`text-right tabular-nums py-2 px-3 ${(c['Job AP Balance'] ?? 0) > 0 ? 'text-amber-600 font-medium' : ''}`}>
                      {currency(c['Job AP Balance'])}
                    </td>
                    <td className="text-right tabular-nums py-2 px-3">
                      {c['% Completed'] != null ? pct(c['% Completed']) : '—'}
                    </td>
                    <td className="py-2 px-3">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                        c.Status === 'Completed' ? 'bg-green-100 text-green-800' :
                        c.Status === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {c.Status ?? '—'}
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
