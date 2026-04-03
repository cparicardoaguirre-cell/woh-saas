'use client'

import * as React from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DataTable } from '@/components/data-table'
import { getBillingColumns } from './columns'
import { BillingForm, DeleteBillingDialog } from './billing-form'
import type { DbBilling, DbJob, DbCustomer } from '@/lib/db-types'

interface BillingsClientProps {
  billings: DbBilling[]
  jobs: DbJob[]
  customers: DbCustomer[]
}

export function BillingsClient({ billings, jobs, customers }: BillingsClientProps) {
  const [formOpen, setFormOpen] = React.useState(false)
  const [editBilling, setEditBilling] = React.useState<DbBilling | null>(null)
  const [deleteBilling, setDeleteBilling] = React.useState<DbBilling | null>(null)

  const columns = React.useMemo(
    () =>
      getBillingColumns({
        onEdit: (billing) => {
          setEditBilling(billing)
          setFormOpen(true)
        },
        onDelete: (billing) => {
          setDeleteBilling(billing)
        },
      }),
    []
  )

  return (
    <>
      <DataTable
        columns={columns}
        data={billings}
        searchPlaceholder="Search billings..."
        toolbar={
          <Button
            onClick={() => {
              setEditBilling(null)
              setFormOpen(true)
            }}
          >
            <Plus className="size-4" data-icon="inline-start" />
            New Billing
          </Button>
        }
      />

      <BillingForm
        jobs={jobs}
        customers={customers}
        billing={editBilling}
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open)
          if (!open) setEditBilling(null)
        }}
      />

      <DeleteBillingDialog
        billing={deleteBilling}
        open={!!deleteBilling}
        onOpenChange={(open) => {
          if (!open) setDeleteBilling(null)
        }}
      />
    </>
  )
}
