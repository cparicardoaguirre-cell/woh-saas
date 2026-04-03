"use client"

import type { ColumnDef } from "@tanstack/react-table"
import type { DbCustomer } from "@/lib/db-types"
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
  onEdit: (customer: DbCustomer) => void
  onDelete: (customer: DbCustomer) => void
}

export function getColumns({ onEdit, onDelete }: ColumnsOptions): ColumnDef<DbCustomer>[] {
  return [
    {
      accessorKey: "name",
      header: "Name",
      enableSorting: true,
      cell: ({ row }) => (
        <span className="font-medium max-w-[240px] truncate block" title={row.original.name}>
          {row.original.name}
        </span>
      ),
    },
    {
      accessorKey: "contact_name",
      header: "Contact",
      enableSorting: false,
      cell: ({ row }) => (
        <span className="text-muted-foreground">{row.original.contact_name ?? "—"}</span>
      ),
    },
    {
      accessorKey: "phone",
      header: "Phone",
      enableSorting: false,
      cell: ({ row }) => (
        <span className="text-muted-foreground font-mono text-xs">{row.original.phone ?? "—"}</span>
      ),
    },
    {
      accessorKey: "email",
      header: "Email",
      enableSorting: false,
      cell: ({ row }) => (
        <span className="text-muted-foreground text-xs">{row.original.email ?? "—"}</span>
      ),
    },
    {
      accessorKey: "city",
      header: "City",
      enableSorting: false,
      cell: ({ row }) => (
        <span className="text-muted-foreground">{row.original.city ?? "—"}</span>
      ),
    },
    {
      accessorKey: "state",
      header: "State",
      enableSorting: false,
      cell: ({ row }) => (
        <span className="text-muted-foreground">{row.original.state ?? "—"}</span>
      ),
    },
    {
      accessorKey: "zip",
      header: "Zip",
      enableSorting: false,
      cell: ({ row }) => (
        <span className="text-muted-foreground font-mono text-xs">{row.original.zip ?? "—"}</span>
      ),
    },
    {
      id: "actions",
      enableSorting: false,
      cell: ({ row }) => {
        const customer = row.original
        return (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={<Button variant="ghost" size="icon-xs" />}
            >
              <MoreHorizontal className="size-4" />
              <span className="sr-only">Actions</span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(customer)}>
                <Pencil className="size-3.5" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onClick={() => onDelete(customer)}>
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
