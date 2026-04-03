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
import type { DbCost } from '@/lib/db-types'

interface ColumnsOptions {
  onEdit: (cost: DbCost) => void
  onDelete: (cost: DbCost) => void
}

export function getCostColumns({ onEdit, onDelete }: ColumnsOptions): ColumnDef<DbCost, unknown>[] {
  return [
    {
      accessorKey: 'job_number',
      header: 'Job #',
      cell: ({ row }) => <span className="font-mono">{row.original.job_number}</span>,
    },
    {
      accessorKey: 'job_description',
      header: 'Description',
      cell: ({ row }) => (
        <span className="max-w-[160px] truncate block" title={row.original.job_description ?? ''}>
          {row.original.job_description ?? '--'}
        </span>
      ),
    },
    {
      accessorKey: 'supplier_name',
      header: 'Supplier',
      cell: ({ row }) => (
        <span className="max-w-[120px] truncate block text-muted-foreground" title={row.original.supplier_name ?? ''}>
          {row.original.supplier_name ?? '--'}
        </span>
      ),
    },
    {
      accessorKey: 'invoice_number',
      header: 'Invoice #',
      cell: ({ row }) => (
        <span className="font-mono">{row.original.invoice_number ?? '--'}</span>
      ),
    },
    {
      accessorKey: 'date',
      header: 'Date',
      cell: ({ row }) => (
        <span className="text-muted-foreground">{formatDate(row.original.date)}</span>
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
        const cost = row.original
        return (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={<Button variant="ghost" size="icon-xs" />}
            >
              <MoreHorizontal className="size-4" />
              <span className="sr-only">Open menu</span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(cost)}>
                <Pencil className="size-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem variant="destructive" onClick={() => onDelete(cost)}>
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
