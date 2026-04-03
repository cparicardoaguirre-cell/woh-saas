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
import type { DbCollection } from '@/lib/db-types'

interface ColumnsOptions {
  onEdit: (collection: DbCollection) => void
  onDelete: (collection: DbCollection) => void
}

export function getCollectionColumns({ onEdit, onDelete }: ColumnsOptions): ColumnDef<DbCollection, unknown>[] {
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
      accessorKey: 'job_number',
      header: 'Job #',
      cell: ({ row }) => <span className="font-mono">{row.original.job_number}</span>,
    },
    {
      accessorKey: 'bill_number',
      header: 'Bill #',
      cell: ({ row }) => (
        <span className="font-mono">{row.original.bill_number ?? '--'}</span>
      ),
    },
    {
      accessorKey: 'payment_date',
      header: 'Payment Date',
      cell: ({ row }) => (
        <span className="text-muted-foreground">{formatDate(row.original.payment_date)}</span>
      ),
    },
    {
      accessorKey: 'reference',
      header: 'Reference',
      cell: ({ row }) => (
        <span className="text-muted-foreground">{row.original.reference ?? '--'}</span>
      ),
    },
    {
      accessorKey: 'payment_method',
      header: 'Payment Method',
      cell: ({ row }) => (
        <span className="text-muted-foreground">{row.original.payment_method ?? '--'}</span>
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
        const collection = row.original
        return (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={<Button variant="ghost" size="icon-xs" />}
            >
              <MoreHorizontal className="size-4" />
              <span className="sr-only">Open menu</span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(collection)}>
                <Pencil className="size-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem variant="destructive" onClick={() => onDelete(collection)}>
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
