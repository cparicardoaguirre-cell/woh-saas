import { customers } from '@/lib/data'
import { Card, CardContent } from '@/components/ui/card'

export default function CustomersPage() {
  const active = customers.filter((c) => c.Owner)

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Customers / Owners</h1>
        <p className="text-sm text-muted-foreground mt-1">{active.length} customers registered</p>
      </div>

      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left py-2 px-4 font-semibold">Name</th>
                <th className="text-left py-2 px-4 font-semibold">Contact</th>
                <th className="text-left py-2 px-4 font-semibold">Phone</th>
                <th className="text-left py-2 px-4 font-semibold">Email</th>
                <th className="text-left py-2 px-4 font-semibold">City</th>
                <th className="text-left py-2 px-4 font-semibold">State</th>
              </tr>
            </thead>
            <tbody>
              {active.map((c, i) => (
                <tr key={i} className="border-b hover:bg-gray-50">
                  <td className="py-2 px-4 font-medium max-w-[240px] truncate" title={c.Owner}>{c.Owner}</td>
                  <td className="py-2 px-4 text-muted-foreground">{c['Contact Name'] ?? '—'}</td>
                  <td className="py-2 px-4 text-muted-foreground font-mono text-xs">{c.Phone ?? '—'}</td>
                  <td className="py-2 px-4 text-muted-foreground text-xs">{c.EMAIL ?? '—'}</td>
                  <td className="py-2 px-4 text-muted-foreground">{c.City ?? '—'}</td>
                  <td className="py-2 px-4 text-muted-foreground">{c.State ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  )
}
