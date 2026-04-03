'use client'

import * as React from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { createCollection, updateCollection, deleteCollection } from './actions'
import type { DbCollection, DbJob, DbCustomer, DbBilling } from '@/lib/db-types'

const PAYMENT_METHODS = [
  'CASH',
  'CHECK',
  'ACH',
  'VISA',
  'MasterCard',
  'PayPal',
  'ATH Movil',
] as const

interface CollectionFormProps {
  jobs: DbJob[]
  customers: DbCustomer[]
  billings: DbBilling[]
  collection?: DbCollection | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CollectionForm({
  jobs,
  customers,
  billings,
  collection,
  open,
  onOpenChange,
}: CollectionFormProps) {
  const isEditing = !!collection
  const [isPending, setIsPending] = React.useState(false)

  async function handleSubmit(formData: FormData) {
    setIsPending(true)
    try {
      const result = isEditing
        ? await updateCollection(collection!.id, formData)
        : await createCollection(formData)

      if (result.success) {
        toast.success(isEditing ? 'Collection updated' : 'Collection created')
        onOpenChange(false)
      } else {
        toast.error(result.error)
      }
    } catch {
      toast.error('An unexpected error occurred')
    } finally {
      setIsPending(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Collection' : 'New Collection'}</DialogTitle>
          <DialogDescription>
            {isEditing ? 'Update the collection record details.' : 'Record a new payment received.'}
          </DialogDescription>
        </DialogHeader>

        <form action={handleSubmit} className="grid gap-4">
          {/* Customer */}
          <div className="grid gap-1.5">
            <Label htmlFor="customer_id">Customer</Label>
            <Select name="customer_id" defaultValue={collection?.customer_id ?? undefined}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select customer..." />
              </SelectTrigger>
              <SelectContent>
                {customers.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Job */}
          <div className="grid gap-1.5">
            <Label htmlFor="job_id">Job *</Label>
            <Select name="job_id" defaultValue={collection?.job_id ?? undefined} required>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select job..." />
              </SelectTrigger>
              <SelectContent>
                {jobs.map((j) => (
                  <SelectItem key={j.id} value={j.id}>
                    {j.job_number} - {j.description}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Billing (Bill Number) */}
          <div className="grid gap-1.5">
            <Label htmlFor="billing_id">Bill Number</Label>
            <Select name="billing_id" defaultValue={collection?.billing_id ?? undefined}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select bill..." />
              </SelectTrigger>
              <SelectContent>
                {billings.map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    Bill #{b.bill_number} - {b.customer_name ?? 'Unknown'} ({b.job_number})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Payment Date */}
            <div className="grid gap-1.5">
              <Label htmlFor="payment_date">Payment Date *</Label>
              <Input
                name="payment_date"
                type="date"
                required
                defaultValue={collection?.payment_date ?? ''}
              />
            </div>

            {/* Reference */}
            <div className="grid gap-1.5">
              <Label htmlFor="reference">Reference</Label>
              <Input
                name="reference"
                defaultValue={collection?.reference ?? ''}
                placeholder="e.g. Check #1234"
              />
            </div>
          </div>

          {/* Payment Method */}
          <div className="grid gap-1.5">
            <Label htmlFor="payment_method">Payment Method</Label>
            <Select name="payment_method" defaultValue={collection?.payment_method ?? undefined}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select method..." />
              </SelectTrigger>
              <SelectContent>
                {PAYMENT_METHODS.map((m) => (
                  <SelectItem key={m} value={m}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Amount */}
          <div className="grid gap-1.5">
            <Label htmlFor="amount">Amount *</Label>
            <Input
              name="amount"
              type="number"
              step="any"
              required
              defaultValue={collection?.amount ?? ''}
              placeholder="0.00"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Saving...' : isEditing ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

/* ─── Delete Confirmation ─────────────────────────────────────────────────── */

interface DeleteCollectionDialogProps {
  collection: DbCollection | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DeleteCollectionDialog({ collection, open, onOpenChange }: DeleteCollectionDialogProps) {
  const [isPending, setIsPending] = React.useState(false)

  async function handleDelete() {
    if (!collection) return
    setIsPending(true)
    try {
      const result = await deleteCollection(collection.id)
      if (result.success) {
        toast.success('Collection deleted')
        onOpenChange(false)
      } else {
        toast.error(result.error)
      }
    } catch {
      toast.error('An unexpected error occurred')
    } finally {
      setIsPending(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Delete Collection</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this collection record? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={isPending}>
            {isPending ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
