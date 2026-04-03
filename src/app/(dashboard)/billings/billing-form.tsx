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
import { createBilling, updateBilling, deleteBilling } from './actions'
import type { DbBilling, DbJob, DbCustomer } from '@/lib/db-types'

const BILLING_TYPES = ['Labor', 'Equipment Cost', 'Material Cost', 'Subcontractors', 'Other'] as const

interface BillingFormProps {
  jobs: DbJob[]
  customers: DbCustomer[]
  billing?: DbBilling | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function BillingForm({ jobs, customers, billing, open, onOpenChange }: BillingFormProps) {
  const isEditing = !!billing
  const [isPending, setIsPending] = React.useState(false)

  const [qty, setQty] = React.useState<string>(billing?.qty?.toString() ?? '')
  const [price, setPrice] = React.useState<string>(billing?.price?.toString() ?? '')
  const [amount, setAmount] = React.useState<string>(billing?.amount?.toString() ?? '')

  // Reset form state when billing changes
  React.useEffect(() => {
    setQty(billing?.qty?.toString() ?? '')
    setPrice(billing?.price?.toString() ?? '')
    setAmount(billing?.amount?.toString() ?? '')
  }, [billing])

  // Auto-compute amount when qty and price are filled
  React.useEffect(() => {
    const q = parseFloat(qty)
    const p = parseFloat(price)
    if (!isNaN(q) && !isNaN(p) && q > 0 && p > 0) {
      setAmount((q * p).toFixed(2))
    }
  }, [qty, price])

  async function handleSubmit(formData: FormData) {
    setIsPending(true)
    try {
      const result = isEditing
        ? await updateBilling(billing!.id, formData)
        : await createBilling(formData)

      if (result.success) {
        toast.success(isEditing ? 'Billing updated' : 'Billing created')
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
          <DialogTitle>{isEditing ? 'Edit Billing' : 'New Billing'}</DialogTitle>
          <DialogDescription>
            {isEditing ? 'Update the billing record details.' : 'Create a new billing record.'}
          </DialogDescription>
        </DialogHeader>

        <form action={handleSubmit} className="grid gap-4">
          {/* Customer */}
          <div className="grid gap-1.5">
            <Label htmlFor="customer_id">Customer</Label>
            <Select name="customer_id" defaultValue={billing?.customer_id ?? undefined}>
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
            <Select name="job_id" defaultValue={billing?.job_id ?? undefined} required>
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

          <div className="grid grid-cols-2 gap-4">
            {/* Bill Number */}
            <div className="grid gap-1.5">
              <Label htmlFor="bill_number">Bill Number *</Label>
              <Input
                name="bill_number"
                type="number"
                required
                defaultValue={billing?.bill_number ?? ''}
                placeholder="e.g. 1"
              />
            </div>

            {/* Date */}
            <div className="grid gap-1.5">
              <Label htmlFor="date">Date *</Label>
              <Input
                name="date"
                type="date"
                required
                defaultValue={billing?.date ?? ''}
              />
            </div>
          </div>

          {/* Description */}
          <div className="grid gap-1.5">
            <Label htmlFor="description">Description</Label>
            <Input
              name="description"
              defaultValue={billing?.description ?? ''}
              placeholder="Billing description"
            />
          </div>

          {/* Type */}
          <div className="grid gap-1.5">
            <Label htmlFor="type">Type</Label>
            <Select name="type" defaultValue={billing?.type ?? undefined}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select type..." />
              </SelectTrigger>
              <SelectContent>
                {BILLING_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-3 gap-4">
            {/* Qty */}
            <div className="grid gap-1.5">
              <Label htmlFor="qty">Qty</Label>
              <Input
                name="qty"
                type="number"
                step="any"
                value={qty}
                onChange={(e) => setQty(e.target.value)}
                placeholder="0"
              />
            </div>

            {/* Price */}
            <div className="grid gap-1.5">
              <Label htmlFor="price">Price</Label>
              <Input
                name="price"
                type="number"
                step="any"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0.00"
              />
            </div>

            {/* Amount */}
            <div className="grid gap-1.5">
              <Label htmlFor="amount">Amount *</Label>
              <Input
                name="amount"
                type="number"
                step="any"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
              />
            </div>
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

interface DeleteBillingDialogProps {
  billing: DbBilling | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DeleteBillingDialog({ billing, open, onOpenChange }: DeleteBillingDialogProps) {
  const [isPending, setIsPending] = React.useState(false)

  async function handleDelete() {
    if (!billing) return
    setIsPending(true)
    try {
      const result = await deleteBilling(billing.id)
      if (result.success) {
        toast.success('Billing deleted')
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
          <DialogTitle>Delete Billing</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete billing #{billing?.bill_number}? This action cannot be undone.
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
