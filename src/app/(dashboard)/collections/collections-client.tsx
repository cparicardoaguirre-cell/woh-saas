'use client'

import * as React from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DataTable } from '@/components/data-table'
import { getCollectionColumns } from './columns'
import { CollectionForm, DeleteCollectionDialog } from './collection-form'
import type { DbCollection, DbJob, DbCustomer, DbBilling } from '@/lib/db-types'

interface CollectionsClientProps {
  collections: DbCollection[]
  jobs: DbJob[]
  customers: DbCustomer[]
  billings: DbBilling[]
}

export function CollectionsClient({ collections, jobs, customers, billings }: CollectionsClientProps) {
  const [formOpen, setFormOpen] = React.useState(false)
  const [editCollection, setEditCollection] = React.useState<DbCollection | null>(null)
  const [deleteCollection, setDeleteCollection] = React.useState<DbCollection | null>(null)

  const columns = React.useMemo(
    () =>
      getCollectionColumns({
        onEdit: (collection) => {
          setEditCollection(collection)
          setFormOpen(true)
        },
        onDelete: (collection) => {
          setDeleteCollection(collection)
        },
      }),
    []
  )

  return (
    <>
      <DataTable
        columns={columns}
        data={collections}
        searchPlaceholder="Search collections..."
        toolbar={
          <Button
            onClick={() => {
              setEditCollection(null)
              setFormOpen(true)
            }}
          >
            <Plus className="size-4" data-icon="inline-start" />
            New Collection
          </Button>
        }
      />

      <CollectionForm
        jobs={jobs}
        customers={customers}
        billings={billings}
        collection={editCollection}
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open)
          if (!open) setEditCollection(null)
        }}
      />

      <DeleteCollectionDialog
        collection={deleteCollection}
        open={!!deleteCollection}
        onOpenChange={(open) => {
          if (!open) setDeleteCollection(null)
        }}
      />
    </>
  )
}
