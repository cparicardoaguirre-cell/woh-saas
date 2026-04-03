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
import { createCost, updateCost, deleteCost } from './actions'
import type { DbCost, DbJob } from '@/lib/db-types'

const COST_TYPES = ['Labor', 'Equipment Cost', 'Material Cost', 'Subcontractors', 'Other'] as const

interface CostFormProps {
  jobs: DbJob[]
  cost?: DbCost | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CostForm({ jobs, cost, open, onOpenChange }: CostFormProps) {
  const isEditing = !!cost
  const [isPending, setIsPending] = React.useState(false)

  const [qty, setQty] = React.useState<string>(cost?.qty?.toString() ?? '')
  const [price, setPrice] = React.useState<string>(cost?.price?.toString() ?? '')
  const [amount, setAmount] = React.useState<string>(cost?.amount?.toString() ?? '')

  // Reset form state when cost changes
  React.useEffect(() => {
    setQty(cost?.qty?.toString() ?? '')
    setPrice(cost?.price?.toString() ?? '')
    setAmount(cost?.amount?.toString() ?? '')
  }, [cost])

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
        ? await updateCost(cost!.id, formData)
        : await createCost(formData)

      if (result.success) {
        toast.success(isEditing ? 'Cost updated' : 'Cost created')
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
          <DialogTitle>{isEditing ? 'Edit Cost' : 'New Cost'}</DialogTitle>
          <DialogDescription>
            {isEditing ? 'Update the cost record details.' : 'Create a new cost record.'}
          </DialogDescription>
        </DialogHeader>

        <form action={handleSubmit} className="grid gap-4">
          {/* Job */}
          <div className="grid gap-1.5">
            <Label htmlFor="job_id">Job *</Label>
            <Select name="job_id" defaultValue={cost?.job_id ?? undefined} required>
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

          {/* Supplier (text input since supplier table may not be populated) */}
          <div className="grid gap-1.5">
            <Label htmlFor="supplier_id">Supplier</Label>
            <Input
              name="supplier_id"
              defaultValue={cost?.supplier_id ?? ''}
              placeholder="Supplier name or ID"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Invoice Number */}
            <div className="grid gap-1.5">
              <Label htmlFor="invoice_number">Invoice Number</Label>
              <Input
                name="invoice_number"
                defaultValue={cost?.invoice_number ?? ''}
                placeholder="e.g. INV-001"
              />
            </div>

            {/* Date */}
            <div className="grid gap-1.5">
              <Label htmlFor="date">Date *</Label>
              <Input
                name="date"
                type="date"
                required
                defaultValue={cost?.date ?? ''}
              />
            </div>
          </div>

          {/* Type */}
          <div className="grid gap-1.5">
            <Label htmlFor="type">Type</Label>
            <Select name="type" defaultValue={cost?.type ?? undefined}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select type..." />
              </SelectTrigger>
              <SelectContent>
                {COST_TYPES.map((t) => (
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

interface DeleteCostDialogProps {
  cost: DbCost | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DeleteCostDialog({ cost, open, onOpenChange }: DeleteCostDialogProps) {
  const [isPending, setIsPending] = React.useState(false)

  async function handleDelete() {
    if (!cost) return
    setIsPending(true)
    try {
      const result = await deleteCost(cost.id)
      if (result.success) {
        toast.success('Cost deleted')
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
          <DialogTitle>Delete Cost</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this cost record? This action cannot be undone.
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
