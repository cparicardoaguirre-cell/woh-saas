'use client'

import * as React from 'react'
import type { DbJobDataEntry, DbJob } from '@/lib/db-types'
import type { JobPeriodMetrics } from '@/lib/types'
import { currency, pct } from '@/lib/format'
import { updateJobDataEntry, initializePeriod } from './actions'
import { PeriodSelector } from '@/components/period-selector'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'

// ─── Status options ─────────────────────────────────────────────────────────

const STATUSES = [
  'In Progress',
  'Completed',
  'Paused',
  'Inactive',
  'Out of Report',
] as const

// ─── Props ──────────────────────────────────────────────────────────────────

interface JobDataClientProps {
  entries: DbJobDataEntry[]
  jobs: DbJob[]
  metrics: JobPeriodMetrics[]
  periods: string[]
  currentPeriod: string
  companyName: string
}

// ─── Component ──────────────────────────────────────────────────────────────

export function JobDataClient({
  entries,
  jobs,
  metrics,
  periods,
  currentPeriod,
  companyName,
}: JobDataClientProps) {
  const [initDate, setInitDate] = React.useState('')
  const [initializing, setInitializing] = React.useState(false)
  const [saving, setSaving] = React.useState<string | null>(null)

  // Build a lookup map: jobNumber -> metrics
  const metricsMap = React.useMemo(() => {
    const m = new Map<number, JobPeriodMetrics>()
    for (const metric of metrics) {
      m.set(metric.jobNumber, metric)
    }
    return m
  }, [metrics])

  // ── Initialize Period ──────────────────────────────────────────────────────

  async function handleInitialize() {
    const period = initDate || currentPeriod
    if (!period) {
      toast.error('Please enter a valid period date (YYYY-MM-DD)')
      return
    }
    setInitializing(true)
    try {
      const result = await initializePeriod(period)
      if (result.success) {
        toast.success(`Period initialized: ${result.created} entries created`)
      } else {
        toast.error(result.error)
      }
    } catch {
      toast.error('An unexpected error occurred')
    } finally {
      setInitializing(false)
    }
  }

  // ── Inline Update ──────────────────────────────────────────────────────────

  async function handleFieldChange(
    entry: DbJobDataEntry,
    field: 'status' | 'pct_of_desired_cost' | 'desired_cost_to_complete',
    value: string
  ) {
    setSaving(entry.id)
    try {
      const formData = new FormData()
      formData.set('job_id', entry.job_id)
      formData.set('data_period', entry.data_period)

      // Set all three fields — use the new value for the changed field,
      // keep the existing values for the other two.
      if (field === 'status') {
        formData.set('status', value)
      } else {
        formData.set('status', entry.status)
      }

      if (field === 'pct_of_desired_cost') {
        formData.set('pct_of_desired_cost', value)
      } else {
        formData.set(
          'pct_of_desired_cost',
          entry.pct_of_desired_cost != null ? String(entry.pct_of_desired_cost) : ''
        )
      }

      if (field === 'desired_cost_to_complete') {
        formData.set('desired_cost_to_complete', value)
      } else {
        formData.set(
          'desired_cost_to_complete',
          entry.desired_cost_to_complete != null ? String(entry.desired_cost_to_complete) : ''
        )
      }

      const result = await updateJobDataEntry(entry.id, formData)
      if (!result.success) {
        toast.error(result.error)
      }
    } catch {
      toast.error('Failed to save')
    } finally {
      setSaving(null)
    }
  }

  // ── Empty State ────────────────────────────────────────────────────────────

  if (entries.length === 0) {
    return (
      <div className="p-8">
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold">Job Data</h1>
            <p className="text-sm text-muted-foreground mt-1">{companyName}</p>
          </div>
          <PeriodSelector periods={periods} currentPeriod={currentPeriod} />
        </div>

        <Card className="max-w-lg mx-auto mt-12">
          <CardHeader>
            <CardTitle className="text-base">No entries for this period</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Initialize a new period to create job data entries for all active jobs.
              This will create one entry per job with default &quot;In Progress&quot; status.
            </p>
            <div className="flex items-end gap-3">
              <div className="flex-1">
                <label
                  htmlFor="init-period"
                  className="text-xs font-medium text-muted-foreground mb-1 block"
                >
                  Period Date (YYYY-MM-DD)
                </label>
                <Input
                  id="init-period"
                  type="date"
                  value={initDate || currentPeriod}
                  onChange={(e) => setInitDate(e.target.value)}
                  placeholder="2024-12-31"
                />
              </div>
              <Button onClick={handleInitialize} disabled={initializing}>
                {initializing ? 'Initializing...' : 'Initialize Period'}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              {jobs.length} active job{jobs.length !== 1 ? 's' : ''} will be initialized.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // ── Data Table ─────────────────────────────────────────────────────────────

  return (
    <div className="p-8">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">Job Data</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {companyName} &middot; {entries.length} entr{entries.length !== 1 ? 'ies' : 'y'} for
            period ending {currentPeriod.split('-')[0]}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <PeriodSelector periods={periods} currentPeriod={currentPeriod} />
          <div className="flex items-end gap-2">
            <div>
              <label
                htmlFor="init-period-top"
                className="text-xs font-medium text-muted-foreground mb-1 block"
              >
                New Period
              </label>
              <Input
                id="init-period-top"
                type="date"
                value={initDate}
                onChange={(e) => setInitDate(e.target.value)}
                className="w-[150px]"
                placeholder="2025-12-31"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleInitialize}
              disabled={initializing || !initDate}
            >
              {initializing ? 'Initializing...' : 'Initialize Period'}
            </Button>
          </div>
        </div>
      </div>

      <div className="rounded-lg border overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left py-2.5 px-3 font-medium text-gray-700 whitespace-nowrap">
                Job #
              </th>
              <th className="text-left py-2.5 px-3 font-medium text-gray-700 whitespace-nowrap">
                Description
              </th>
              <th className="text-left py-2.5 px-3 font-medium text-gray-700 whitespace-nowrap">
                Owner
              </th>
              <th className="text-left py-2.5 px-3 font-medium text-gray-700 whitespace-nowrap">
                Status
              </th>
              <th className="text-right py-2.5 px-3 font-medium text-gray-700 whitespace-nowrap">
                % of Desired Cost
              </th>
              <th className="text-right py-2.5 px-3 font-medium text-gray-700 whitespace-nowrap">
                Desired Cost to Complete
              </th>
              <th className="text-right py-2.5 px-3 font-medium text-gray-700 whitespace-nowrap">
                Revenue Earned
              </th>
              <th className="text-right py-2.5 px-3 font-medium text-gray-700 whitespace-nowrap">
                Cost to Date
              </th>
              <th className="text-right py-2.5 px-3 font-medium text-gray-700 whitespace-nowrap">
                Gross Profit
              </th>
              <th className="text-right py-2.5 px-3 font-medium text-gray-700 whitespace-nowrap">
                % Complete
              </th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => {
              const jobNum = entry.job_number ?? 0
              const m = metricsMap.get(jobNum)
              const isSaving = saving === entry.id

              return (
                <tr
                  key={entry.id}
                  className={`border-b hover:bg-gray-50 transition-colors ${isSaving ? 'opacity-60' : ''}`}
                >
                  {/* Job # — read-only */}
                  <td className="py-2 px-3 tabular-nums font-medium">{jobNum}</td>

                  {/* Description — read-only */}
                  <td className="py-2 px-3 max-w-[200px] truncate" title={entry.job_description ?? ''}>
                    {entry.job_description ?? ''}
                  </td>

                  {/* Owner — read-only */}
                  <td className="py-2 px-3 whitespace-nowrap">{entry.owner_name ?? ''}</td>

                  {/* Status — editable select */}
                  <td className="py-1 px-2">
                    <select
                      className="rounded-md border border-gray-300 bg-white px-2 py-1 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 w-full min-w-[120px]"
                      defaultValue={entry.status}
                      onChange={(e) => handleFieldChange(entry, 'status', e.target.value)}
                      disabled={isSaving}
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </td>

                  {/* % of Desired Cost — editable number */}
                  <td className="py-1 px-2">
                    <input
                      type="number"
                      step="0.01"
                      className="w-[100px] rounded-md border border-gray-300 bg-white px-2 py-1 text-sm text-right tabular-nums focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      defaultValue={entry.pct_of_desired_cost ?? ''}
                      onBlur={(e) =>
                        handleFieldChange(entry, 'pct_of_desired_cost', e.target.value)
                      }
                      disabled={isSaving}
                    />
                  </td>

                  {/* Desired Cost to Complete — editable number */}
                  <td className="py-1 px-2">
                    <input
                      type="number"
                      step="0.01"
                      className="w-[140px] rounded-md border border-gray-300 bg-white px-2 py-1 text-sm text-right tabular-nums focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      defaultValue={entry.desired_cost_to_complete ?? ''}
                      onBlur={(e) =>
                        handleFieldChange(entry, 'desired_cost_to_complete', e.target.value)
                      }
                      disabled={isSaving}
                    />
                  </td>

                  {/* Revenue Earned — read-only computed */}
                  <td className="py-2 px-3 text-right tabular-nums">
                    {m ? currency(m.revenueEarnedToDate) : '\u2014'}
                  </td>

                  {/* Cost to Date — read-only computed */}
                  <td className="py-2 px-3 text-right tabular-nums">
                    {m ? currency(m.costToDate) : '\u2014'}
                  </td>

                  {/* Gross Profit — read-only computed */}
                  <td
                    className={`py-2 px-3 text-right tabular-nums ${m && m.grossProfitToDate < 0 ? 'text-red-600' : ''}`}
                  >
                    {m ? currency(m.grossProfitToDate) : '\u2014'}
                  </td>

                  {/* % Complete — read-only computed */}
                  <td className="py-2 px-3 text-right tabular-nums">
                    {m ? pct(m.pctComplete) : '\u2014'}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-muted-foreground mt-4">
        Edit Status, % of Desired Cost, or Desired Cost to Complete inline. Computed columns
        (Revenue, Cost, Gross Profit, % Complete) update automatically after saving.
      </p>
    </div>
  )
}
