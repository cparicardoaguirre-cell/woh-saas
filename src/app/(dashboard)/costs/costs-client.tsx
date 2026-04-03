'use client'

import * as React from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DataTable } from '@/components/data-table'
import { getCostColumns } from './columns'
import { CostForm, DeleteCostDialog } from './cost-form'
import type { DbCost, DbJob } from '@/lib/db-types'

interface CostsClientProps {
  costs: DbCost[]
  jobs: DbJob[]
}

export function CostsClient({ costs, jobs }: CostsClientProps) {
  const [formOpen, setFormOpen] = React.useState(false)
  const [editCost, setEditCost] = React.useState<DbCost | null>(null)
  const [deleteCost, setDeleteCost] = React.useState<DbCost | null>(null)

  const columns = React.useMemo(
    () =>
      getCostColumns({
        onEdit: (cost) => {
          setEditCost(cost)
          setFormOpen(true)
        },
        onDelete: (cost) => {
          setDeleteCost(cost)
        },
      }),
    []
  )

  return (
    <>
      <DataTable
        columns={columns}
        data={costs}
        searchPlaceholder="Search costs..."
        toolbar={
          <Button
            onClick={() => {
              setEditCost(null)
              setFormOpen(true)
            }}
          >
            <Plus className="size-4" data-icon="inline-start" />
            New Cost
          </Button>
        }
      />

      <CostForm
        jobs={jobs}
        cost={editCost}
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open)
          if (!open) setEditCost(null)
        }}
      />

      <DeleteCostDialog
        cost={deleteCost}
        open={!!deleteCost}
        onOpenChange={(open) => {
          if (!open) setDeleteCost(null)
        }}
      />
    </>
  )
}
