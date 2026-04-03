'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { periodLabel } from '@/lib/format'

interface PeriodSelectorProps {
  periods: string[]
  currentPeriod: string
}

export function PeriodSelector({ periods, currentPeriod }: PeriodSelectorProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('period', e.target.value)
    router.push(`${pathname}?${params.toString()}`)
  }

  if (periods.length <= 1) return null

  return (
    <div className="inline-flex items-center gap-2 print:hidden">
      <label htmlFor="period-select" className="text-sm text-muted-foreground">
        Period:
      </label>
      <select
        id="period-select"
        value={currentPeriod}
        onChange={handleChange}
        className="rounded-md border border-gray-300 bg-white px-2 py-1 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
      >
        {periods.map((p) => (
          <option key={p} value={p}>
            {periodLabel(p)}
          </option>
        ))}
      </select>
    </div>
  )
}
