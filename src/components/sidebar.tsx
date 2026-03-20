'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const nav = [
  {
    group: 'Overview',
    items: [
      { href: '/', label: 'Dashboard' },
      { href: '/compare', label: 'Comparison vs Excel' },
    ],
  },
  {
    group: 'Master Data',
    items: [
      { href: '/jobs', label: 'Jobs / Projects' },
      { href: '/customers', label: 'Customers' },
      { href: '/change-orders', label: 'Change Orders' },
    ],
  },
  {
    group: 'Transactions',
    items: [
      { href: '/billings', label: 'Billings' },
      { href: '/collections', label: 'Collections' },
      { href: '/costs', label: 'Costs' },
    ],
  },
  {
    group: 'Financial Reports',
    items: [
      { href: '/reports/schedule-1', label: 'Schedule 1 — Earnings' },
      { href: '/reports/schedule-2', label: 'Schedule 2 — Completed' },
      { href: '/reports/schedule-3', label: 'Schedule 3 — In Progress' },
      { href: '/reports/nota-6', label: 'Nota 6 — Contract Assets' },
      { href: '/reports/note-7', label: 'Note D — Backlog' },
      { href: '/reports/metodo-alterno', label: 'Método Alterno' },
    ],
  },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-64 shrink-0 border-r bg-white h-screen overflow-y-auto sticky top-0">
      <div className="p-5 border-b">
        <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-0.5">WoH System</div>
        <div className="font-bold text-sm leading-tight">DFM Contractors, LLC.</div>
        <div className="text-xs text-muted-foreground mt-1">Period: Dec 31, 2024</div>
      </div>
      <nav className="p-3 space-y-4">
        {nav.map((group) => (
          <div key={group.group}>
            <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground px-2 mb-1">
              {group.group}
            </div>
            <ul className="space-y-0.5">
              {group.items.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      'block text-sm px-2 py-1.5 rounded-md transition-colors',
                      pathname === item.href
                        ? 'bg-blue-50 text-blue-700 font-medium'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    )}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  )
}
