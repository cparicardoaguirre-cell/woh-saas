"use client"

import * as React from "react"
import type { DbJob, DbCustomer, DbMunicipality } from "@/lib/db-types"
import { deleteJob } from "./actions"
import { getColumns } from "./columns"
import { JobForm } from "./job-form"
import { DataTable } from "@/components/data-table"
import { Button } from "@/components/ui/button"
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
import { PlusIcon } from "lucide-react"
import { toast } from "sonner"

// ─── Props ──────────────────────────────────────────────────────────────────

interface JobsClientProps {
  jobs: DbJob[]
  customers: DbCustomer[]
  municipalities: DbMunicipality[]
}

// ─── Component ──────────────────────────────────────────────────────────────

export function JobsClient({ jobs, customers, municipalities }: JobsClientProps) {
  // Dialog state
  const [formOpen, setFormOpen] = React.useState(false)
  const [editingJob, setEditingJob] = React.useState<DbJob | null>(null)

  // Delete confirmation state
  const [deleteId, setDeleteId] = React.useState<string | null>(null)
  const [deleting, setDeleting] = React.useState(false)

  // Handlers passed into column definitions
  const handleEdit = React.useCallback((job: DbJob) => {
    setEditingJob(job)
    setFormOpen(true)
  }, [])

  const handleDeleteRequest = React.useCallback((id: string) => {
    setDeleteId(id)
  }, [])

  // Build columns with callbacks
  const columns = React.useMemo(
    () => getColumns({ onEdit: handleEdit, onDelete: handleDeleteRequest }),
    [handleEdit, handleDeleteRequest]
  )

  // Create new job
  function handleAdd() {
    setEditingJob(null)
    setFormOpen(true)
  }

  // Confirm delete
  async function handleDeleteConfirm() {
    if (!deleteId) return
    setDeleting(true)
    try {
      const result = await deleteJob(deleteId)
      if (result.success) {
        toast.success("Job deleted")
      } else {
        toast.error(result.error)
      }
    } catch {
      toast.error("An unexpected error occurred")
    } finally {
      setDeleting(false)
      setDeleteId(null)
    }
  }

  return (
    <div className="p-8">
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Jobs / Projects</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {jobs.length} project{jobs.length !== 1 ? "s" : ""} registered
        </p>
      </div>

      {/* Data table with toolbar */}
      <DataTable
        columns={columns}
        data={jobs}
        searchPlaceholder="Search jobs..."
        searchColumn="description"
        toolbar={
          <Button onClick={handleAdd}>
            <PlusIcon data-icon="inline-start" />
            Add Job
          </Button>
        }
      />

      {/* Create / Edit Dialog */}
      <JobForm
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open)
          if (!open) setEditingJob(null)
        }}
        job={editingJob}
        customers={customers}
        municipalities={municipalities}
      />

      {/* Delete Confirmation */}
      <AlertDialog
        open={deleteId !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteId(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Job</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this job? This action cannot be
              undone. All related billings, costs, and change orders may be
              affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={deleting}
            >
              {deleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
