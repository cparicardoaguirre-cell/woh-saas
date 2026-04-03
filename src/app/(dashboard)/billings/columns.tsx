'use client'

import { type ColumnDef } from '@tanstack/react-table'
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { currency, formatDate } from '@/lib/format'
import type { DbBilling } from '@/lib/db-types'

interface ColumnsOptions {
  onEdit: (billing: DbBilling) => void
  onDelete: (billing: DbBilling) => void
}

export function getBillingColumns({ onEdit, onDelete }: ColumnsOptions): ColumnDef<DbBilling, unknown>[] {
  return [
    {
      accessorKey: 'customer_name',
      header: 'Customer',
      cell: ({ row }) => (
        <span className="max-w-[140px] truncate block" title={row.original.customer_name ?? ''}>
          {row.original.customer_name ?? '--'}
        </span>
      ),
    },
    {
      accessorKey: 'bill_number',
      header: 'Bill #',
      cell: ({ row }) => <span className="font-mono">{row.original.bill_number}</span>,
    },
    {
      accessorKey: 'date',
      header: 'Date',
      cell: ({ row }) => (
        <span className="text-muted-foreground">{formatDate(row.original.date)}</span>
      ),
    },
    {
      accessorKey: 'job_number',
      header: 'Job #',
      cell: ({ row }) => <span className="font-mono">{row.original.job_number}</span>,
    },
    {
      accessorKey: 'description',
      header: 'Description',
      cell: ({ row }) => (
        <span className="max-w-[160px] truncate block text-muted-foreground" title={row.original.description ?? ''}>
          {row.original.description ?? '--'}
        </span>
      ),
    },
    {
      accessorKey: 'type',
      header: 'Type',
      cell: ({ row }) => (
        <span className="text-muted-foreground">{row.original.type ?? '--'}</span>
      ),
    },
    {
      accessorKey: 'qty',
      header: 'Qty',
      cell: ({ row }) => (
        <span className="tabular-nums">{row.original.qty ?? '--'}</span>
      ),
    },
    {
      accessorKey: 'price',
      header: 'Price',
      cell: ({ row }) => (
        <span className="tabular-nums">{row.original.price != null ? currency(row.original.price, 2) : '--'}</span>
      ),
    },
    {
      accessorKey: 'amount',
      header: 'Amount',
      cell: ({ row }) => (
        <span className="tabular-nums font-medium">{currency(row.original.amount)}</span>
      ),
    },
    {
      id: 'actions',
      header: '',
      enableSorting: false,
      cell: ({ row }) => {
        const billing = row.original
        return (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={<Button variant="ghost" size="icon-xs" />}
            >
              <MoreHorizontal className="size-4" />
              <span className="sr-only">Open menu</span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(billing)}>
                <Pencil className="size-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem variant="destructive" onClick={() => onDelete(billing)}>
                <Trash2 className="size-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]
}
