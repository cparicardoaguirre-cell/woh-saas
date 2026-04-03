"use client"

import * as React from "react"
import type { DbChangeOrder, DbJob } from "@/lib/db-types"
import { currency } from "@/lib/format"
import { DataTable } from "@/components/data-table"
import { getColumns } from "./columns"
import { ChangeOrderForm } from "./change-order-form"
import { deleteChangeOrder } from "./actions"
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

interface ChangeOrdersClientProps {
  changeOrders: DbChangeOrder[]
  jobs: DbJob[]
}

export function ChangeOrdersClient({ changeOrders, jobs }: ChangeOrdersClientProps) {
  const [formOpen, setFormOpen] = React.useState(false)
  const [editingCO, setEditingCO] = React.useState<DbChangeOrder | null>(null)
  const [deletingCO, setDeletingCO] = React.useState<DbChangeOrder | null>(null)
  const [deleteLoading, setDeleteLoading] = React.useState(false)

  // Summary calculations
  const totalApproved = changeOrders
    .filter((co) => co.approved)
    .reduce((sum, co) => sum + (co.amount ?? 0), 0)
  const totalPending = changeOrders
    .filter((co) => !co.approved)
    .reduce((sum, co) => sum + (co.amount ?? 0), 0)

  function handleEdit(co: DbChangeOrder) {
    setEditingCO(co)
    setFormOpen(true)
  }

  function handleNew() {
    setEditingCO(null)
    setFormOpen(true)
  }

  async function handleDelete() {
    if (!deletingCO) return
    setDeleteLoading(true)

    try {
      const result = await deleteChangeOrder(deletingCO.id)
      if (result.success) {
        toast.success("Change order deleted")
      } else {
        toast.error(result.error)
      }
    } catch {
      toast.error("Something went wrong")
    } finally {
      setDeleteLoading(false)
      setDeletingCO(null)
    }
  }

  const columns = React.useMemo(
    () => getColumns({ onEdit: handleEdit, onDelete: setDeletingCO }),
    []
  )

  return (
    <div className="p-8">
      {/* Header with summary cards */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">Change Orders</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {changeOrders.length} change order{changeOrders.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex gap-4 text-sm">
          <div className="rounded-lg border bg-card px-4 py-2 text-right">
            <div className="text-xs text-muted-foreground uppercase tracking-wide">
              Approved
            </div>
            <div className="font-bold text-green-700 tabular-nums">
              {currency(totalApproved)}
            </div>
          </div>
          <div className="rounded-lg border bg-card px-4 py-2 text-right">
            <div className="text-xs text-muted-foreground uppercase tracking-wide">
              Pending
            </div>
            <div className="font-bold text-amber-600 tabular-nums">
              {currency(totalPending)}
            </div>
          </div>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={changeOrders}
        searchPlaceholder="Search change orders..."
        toolbar={
          <Button onClick={handleNew} size="sm">
            <Plus className="size-4" data-icon="inline-start" />
            Add Change Order
          </Button>
        }
      />

      {/* Create / Edit dialog */}
      <ChangeOrderForm
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open)
          if (!open) setEditingCO(null)
        }}
        changeOrder={editingCO}
        jobs={jobs}
      />

      {/* Delete confirmation */}
      <AlertDialog
        open={!!deletingCO}
        onOpenChange={(open) => {
          if (!open) setDeletingCO(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Change Order</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete Change Order #{deletingCO?.co_number}{" "}
              for Job #{deletingCO?.job_number}? This action cannot be undone.
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
