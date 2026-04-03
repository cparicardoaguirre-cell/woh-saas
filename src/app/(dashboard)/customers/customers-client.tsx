"use client"

import * as React from "react"
import type { DbCustomer } from "@/lib/db-types"
import { DataTable } from "@/components/data-table"
import { getColumns } from "./columns"
import { CustomerForm } from "./customer-form"
import { deleteCustomer } from "./actions"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface CustomersClientProps {
  customers: DbCustomer[]
}

export function CustomersClient({ customers }: CustomersClientProps) {
  const [formOpen, setFormOpen] = React.useState(false)
  const [editingCustomer, setEditingCustomer] = React.useState<DbCustomer | null>(null)
  const [deletingCustomer, setDeletingCustomer] = React.useState<DbCustomer | null>(null)
  const [deleteLoading, setDeleteLoading] = React.useState(false)

  function handleEdit(customer: DbCustomer) {
    setEditingCustomer(customer)
    setFormOpen(true)
  }

  function handleNew() {
    setEditingCustomer(null)
    setFormOpen(true)
  }

  async function handleDelete() {
    if (!deletingCustomer) return
    setDeleteLoading(true)

    try {
      const result = await deleteCustomer(deletingCustomer.id)
      if (result.success) {
        toast.success("Customer deleted")
      } else {
        toast.error(result.error)
      }
    } catch {
      toast.error("Something went wrong")
    } finally {
      setDeleteLoading(false)
      setDeletingCustomer(null)
    }
  }

  const columns = React.useMemo(
    () => getColumns({ onEdit: handleEdit, onDelete: setDeletingCustomer }),
    []
  )

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Customers / Owners</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {customers.length} customer{customers.length !== 1 ? "s" : ""} registered
        </p>
      </div>

      <DataTable
        columns={columns}
        data={customers}
        searchPlaceholder="Search customers..."
        searchColumn="name"
        toolbar={
          <Button onClick={handleNew} size="sm">
            <Plus className="size-4" data-icon="inline-start" />
            Add Customer
          </Button>
        }
      />

      {/* Create / Edit dialog */}
      <CustomerForm
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open)
          if (!open) setEditingCustomer(null)
        }}
        customer={editingCustomer}
      />

      {/* Delete confirmation */}
      <AlertDialog
        open={!!deletingCustomer}
        onOpenChange={(open) => {
          if (!open) setDeletingCustomer(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Customer</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{" "}
              <strong>{deletingCustomer?.name}</strong>? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteLoading}
            >
              {deleteLoading ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
