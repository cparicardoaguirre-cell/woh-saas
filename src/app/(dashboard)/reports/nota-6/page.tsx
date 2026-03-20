import { getAllReportData } from '@/lib/reports'
import { appConfig } from '@/lib/data'
import { currency } from '@/lib/format'
import { Card, CardContent } from '@/components/ui/card'

export default function Nota6Page() {
  const { nota6 } = getAllReportData()
  const { companyName } = appConfig

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-6">
        <div className="text-xs text-muted-foreground uppercase tracking-widest mb-1">GAAP Disclosure</div>
        <h1 className="text-xl font-bold">{companyName}</h1>
        <h2 className="text-lg font-semibold text-gray-700 mt-1">Nota 6 — Cost and Estimated Earnings on Contracts in Progress</h2>
        <p className="text-sm text-muted-foreground mt-1">As of December 31, 2024</p>
      </div>

      <Card className="mb-6">
        <CardContent className="p-6">
          <table className="w-full text-sm">
            <tbody>
              <tr className="border-b">
                <td className="py-3">Cost incurred on contracts in progress to date</td>
                <td className="text-right tabular-nums py-3 font-medium">{currency(nota6.costIncurred)}</td>
              </tr>
              <tr className="border-b">
                <td className="py-3">Estimated earnings to date</td>
                <td className="text-right tabular-nums py-3 font-medium">{currency(nota6.estimatedEarnings)}</td>
              </tr>
              <tr className="border-b-2 font-semibold">
                <td className="py-3">Contract revenue earned to date</td>
                <td className="text-right tabular-nums py-3">{currency(nota6.revenueEarned)}</td>
              </tr>
              <tr className="border-b">
                <td className="py-3 pl-4 text-muted-foreground">Less: Billings to date</td>
                <td className="text-right tabular-nums py-3 text-muted-foreground">({currency(nota6.billingsToDate)})</td>
              </tr>
              <tr className="font-semibold border-b-2">
                <td className="py-3">Contract revenue adjustment</td>
                <td className={`text-right tabular-nums py-3 ${nota6.difference < 0 ? 'text-red-600' : ''}`}>
                  {currency(Math.abs(nota6.difference))}
                </td>
              </tr>
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <h3 className="font-semibold text-sm mb-4">Balance Sheet Classification (ASC 606)</h3>
          <table className="w-full text-sm">
            <tbody>
              <tr className="border-b">
                <td className="py-3">
                  <div>Contract Assets</div>
                  <div className="text-xs text-muted-foreground">Revenue earned in excess of billings</div>
                </td>
                <td className="text-right tabular-nums py-3 font-medium text-green-700">{currency(nota6.contractAssets)}</td>
              </tr>
              <tr className="border-b">
                <td className="py-3">
                  <div>Contract Liabilities</div>
                  <div className="text-xs text-muted-foreground">Billings in excess of revenue earned</div>
                </td>
                <td className="text-right tabular-nums py-3 font-medium text-red-600">{currency(nota6.contractLiability)}</td>
              </tr>
              <tr className="font-bold border-t-2">
                <td className="py-3">Net</td>
                <td className={`text-right tabular-nums py-3 ${nota6.net < 0 ? 'text-red-600' : 'text-green-700'}`}>
                  {currency(Math.abs(nota6.net))}
                  <span className="text-xs font-normal text-muted-foreground ml-1">
                    {nota6.net >= 0 ? 'net asset' : 'net liability'}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  )
}
