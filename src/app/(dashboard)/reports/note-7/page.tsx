import { getAllReportData } from '@/lib/reports'
import { appConfig } from '@/lib/data'
import { currency } from '@/lib/format'
import { Card, CardContent } from '@/components/ui/card'

export default function Note7Page() {
  const { noteD } = getAllReportData()
  const { companyName, currentPeriod, priorPeriod1 } = appConfig

  const priorLabel = `December 31, ${priorPeriod1.slice(0, 4)}`
  const currentLabel = `December 31, ${currentPeriod.slice(0, 4)}`

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-6">
        <div className="text-xs text-muted-foreground uppercase tracking-widest mb-1">GAAP Disclosure</div>
        <h1 className="text-xl font-bold">{companyName}</h1>
        <h2 className="text-lg font-semibold text-gray-700 mt-1">Note D — Backlog Analysis</h2>
        <p className="text-sm text-muted-foreground mt-1">For the year ended {currentLabel}</p>
      </div>

      <Card>
        <CardContent className="p-6">
          <p className="text-sm text-muted-foreground mb-6">
            The following schedule represents the Company&apos;s contract backlog — the remaining revenue
            to be recognized on contracts not yet completed:
          </p>
          <table className="w-full text-sm">
            <tbody>
              <tr className="border-b">
                <td className="py-3">Backlog Balance — {priorLabel}</td>
                <td className="text-right tabular-nums py-3 font-medium">{currency(noteD.priorBacklog)}</td>
              </tr>
              <tr className="border-b">
                <td className="py-3 pl-4 text-muted-foreground">New contracts and change orders — additions</td>
                <td className="text-right tabular-nums py-3">{currency(noteD.newContracts)}</td>
              </tr>
              {noteD.coAdjustments !== 0 && (
                <tr className="border-b">
                  <td className="py-3 pl-4 text-muted-foreground">Change order adjustments</td>
                  <td className="text-right tabular-nums py-3">{currency(noteD.coAdjustments)}</td>
                </tr>
              )}
              <tr className="border-b font-medium">
                <td className="py-3">Subtotal</td>
                <td className="text-right tabular-nums py-3">{currency(noteD.subtotal)}</td>
              </tr>
              <tr className="border-b">
                <td className="py-3 pl-4 text-muted-foreground">Less: Revenue earned during the year</td>
                <td className="text-right tabular-nums py-3 text-muted-foreground">({currency(noteD.revenueEarned)})</td>
              </tr>
              <tr className="font-bold border-t-2 bg-gray-50">
                <td className="py-3 pl-1 rounded-l">Backlog Balance — {currentLabel}</td>
                <td className="text-right tabular-nums py-3 text-blue-700 rounded-r">{currency(noteD.endingBacklog)}</td>
              </tr>
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  )
}
