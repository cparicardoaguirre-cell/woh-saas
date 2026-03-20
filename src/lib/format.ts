/** Currency and number formatting utilities */

function toNum(value: unknown): number | null {
  if (value === null || value === undefined) return null
  const n = Number(value)
  return isFinite(n) ? n : null
}

export function currency(value: unknown, decimals = 0): string {
  const n = toNum(value)
  if (n === null) return '—'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(n)
}

export function pct(value: unknown, decimals = 1): string {
  const n = toNum(value)
  if (n === null) return '—'
  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(n)
}

export function num(value: unknown, decimals = 0): string {
  const n = toNum(value)
  if (n === null) return '—'
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(n)
}

export function formatDate(iso: unknown): string {
  if (!iso || typeof iso !== 'string') return '—'
  const parts = iso.split('-')
  if (parts.length < 2) return iso
  const [year, month, day] = parts
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const mIdx = parseInt(month) - 1
  return `${months[mIdx] ?? month} ${parseInt(day ?? '1')}, ${year}`
}

export function periodLabel(iso: unknown): string {
  if (!iso || typeof iso !== 'string') return '—'
  return `December 31, ${iso.split('-')[0]}`
}
