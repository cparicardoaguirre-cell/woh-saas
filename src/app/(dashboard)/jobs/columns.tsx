"use client"

import type { ColumnDef } from "@tanstack/react-table"
import type { DbJob } from "@/lib/db-types"
import { currency, formatDate, pct } from "@/lib/format"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreHorizontalIcon, PencilIcon, TrashIcon } from "lucide-react"

// ─── Column Factory ─────────────────────────────────────────────────────────

interface ColumnOptions {
  onEdit: (job: DbJob) => void
  onDelete: (id: string) => void
}

export function getColumns({ onEdit, onDelete }: ColumnOptions): ColumnDef<DbJob>[] {
  return [
    {
      accessorKey: "job_number",
      header: "Job #",
      cell: ({ row }) => (
        <span className="font-mono font-medium">{row.getValue("job_number")}</span>
      ),
      enableSorting: true,
    },
    {
      accessorKey: "description",
      header: "Description",
      cell: ({ row }) => (
        <span className="max-w-[220px] truncate block" title={row.getValue("description")}>
          {row.getValue("description")}
        </span>
      ),
      enableSorting: true,
    },
    {
      accessorKey: "owner_name",
      header: "Owner",
      cell: ({ row }) => (
        <span className="text-muted-foreground max-w-[160px] truncate block">
          {row.getValue("owner_name") ?? "—"}
        </span>
      ),
      enableSorting: false,
    },
    {
      accessorKey: "customer_name",
      header: "Customer",
      cell: ({ row }) => (
        <span className="text-muted-foreground max-w-[160px] truncate block">
          {row.getValue("customer_name") ?? "—"}
        </span>
      ),
      enableSorting: false,
    },
    {
      accessorKey: "municipality_name",
      header: "County",
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          {row.getValue("municipality_name") ?? "—"}
        </span>
      ),
      enableSorting: false,
    },
    {
      accessorKey: "contract_date",
      header: "Contract Date",
      cell: ({ row }) => (
        <span className="text-muted-foreground text-right block">
          {formatDate(row.getValue("contract_date"))}
        </span>
      ),
      enableSorting: true,
    },
    {
      accessorKey: "completed_date",
      header: "Completed Date",
      cell: ({ row }) => (
        <span className="text-muted-foreground text-right block">
          {formatDate(row.getValue("completed_date"))}
        </span>
      ),
      enableSorting: true,
    },
    {
      accessorKey: "original_contract_amount",
      header: "Original Amount",
      cell: ({ row }) => (
        <span className="tabular-nums text-right block">
          {currency(row.getValue("original_contract_amount"))}
        </span>
      ),
      enableSorting: true,
    },
    {
      accessorKey: "retainage_pct",
      header: "Retainage %",
      cell: ({ row }) => (
        <span className="tabular-nums text-right block">
          {pct(row.getValue("retainage_pct"))}
        </span>
      ),
      enableSorting: true,
    },
    {
      accessorKey: "automatic_retainage",
      header: "Auto Ret.",
      cell: ({ row }) => {
        const value = row.getValue("automatic_retainage") as boolean
        return (
          <span
            className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-medium ${
              value
                ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
            }`}
          >
            {value ? "Yes" : "No"}
          </span>
        )
      },
      enableSorting: false,
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => {
        const job = row.original
        return (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant="ghost" size="icon-xs" />
              }
            >
              <MoreHorizontalIcon />
              <span className="sr-only">Open menu</span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(job)}>
                <PencilIcon />
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onClick={() => onDelete(job.id)}
              >
                <TrashIcon />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
      enableSorting: false,
    },
  ]
}
