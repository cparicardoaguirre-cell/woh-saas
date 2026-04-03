"use client"

import type { ColumnDef } from "@tanstack/react-table"
import type { DbChangeOrder } from "@/lib/db-types"
import { currency, formatDate } from "@/lib/format"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react"

interface ColumnsOptions {
  onEdit: (co: DbChangeOrder) => void
  onDelete: (co: DbChangeOrder) => void
}

export function getColumns({ onEdit, onDelete }: ColumnsOptions): ColumnDef<DbChangeOrder>[] {
  return [
    {
      accessorKey: "job_number",
      header: "Job #",
      enableSorting: true,
      cell: ({ row }) => (
        <span className="font-mono font-medium">{row.original.job_number ?? "—"}</span>
      ),
    },
    {
      accessorKey: "job_description",
      header: "Job Description",
      enableSorting: false,
      cell: ({ row }) => (
        <span
          className="max-w-[200px] truncate block text-muted-foreground"
          title={row.original.job_description ?? ""}
        >
          {row.original.job_description ?? "—"}
        </span>
      ),
    },
    {
      accessorKey: "co_number",
      header: "CO #",
      enableSorting: true,
      cell: ({ row }) => (
        <span className="font-mono">{row.original.co_number}</span>
      ),
    },
    {
      accessorKey: "date",
      header: "Date",
      enableSorting: true,
      cell: ({ row }) => (
        <span className="text-muted-foreground">{formatDate(row.original.date)}</span>
      ),
    },
    {
      accessorKey: "approved",
      header: "Approved",
      enableSorting: false,
      cell: ({ row }) => {
        const approved = row.original.approved
        return (
          <span
            className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-medium ${
              approved
                ? "bg-green-100 text-green-800"
                : "bg-amber-100 text-amber-800"
            }`}
          >
            {approved ? "Yes" : "No"}
          </span>
        )
      },
    },
    {
      accessorKey: "amount",
      header: "Amount",
      enableSorting: true,
      cell: ({ row }) => {
        const amt = row.original.amount
        return (
          <span
            className={`tabular-nums font-medium ${amt < 0 ? "text-red-600" : ""}`}
          >
            {currency(amt)}
          </span>
        )
      },
    },
    {
      id: "actions",
      enableSorting: false,
      cell: ({ row }) => {
        const co = row.original
        return (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={<Button variant="ghost" size="icon-xs" />}
            >
              <MoreHorizontal className="size-4" />
              <span className="sr-only">Actions</span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(co)}>
                <Pencil className="size-3.5" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onClick={() => onDelete(co)}>
                <Trash2 className="size-3.5" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]
}
