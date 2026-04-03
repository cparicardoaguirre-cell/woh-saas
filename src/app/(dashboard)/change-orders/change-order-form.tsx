"use client"

import * as React from "react"
import type { DbChangeOrder, DbJob } from "@/lib/db-types"
import { createChangeOrder, updateChangeOrder } from "./actions"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface ChangeOrderFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  changeOrder?: DbChangeOrder | null
  jobs: DbJob[]
}

export function ChangeOrderForm({
  open,
  onOpenChange,
  changeOrder,
  jobs,
}: ChangeOrderFormProps) {
  const [pending, setPending] = React.useState(false)
  const [jobId, setJobId] = React.useState<string>("")
  const [approved, setApproved] = React.useState(false)
  const isEditing = !!changeOrder

  // Reset form state when dialog opens with new data
  React.useEffect(() => {
    if (open) {
      setJobId(changeOrder?.job_id ?? "")
      setApproved(changeOrder?.approved ?? false)
    }
  }, [open, changeOrder])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setPending(true)

    const formData = new FormData(e.currentTarget)
    // Inject controlled values that aren't in native form elements
    formData.set("job_id", jobId)
    formData.set("approved", approved ? "true" : "false")

    try {
      const result = isEditing
        ? await updateChangeOrder(changeOrder!.id, formData)
        : await createChangeOrder(formData)

      if (result.success) {
        toast.success(isEditing ? "Change order updated" : "Change order created")
        onOpenChange(false)
      } else {
        toast.error(result.error)
      }
    } catch {
      toast.error("Something went wrong")
    } finally {
      setPending(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Change Order" : "New Change Order"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the change order details below."
              : "Fill in the details to create a new change order."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid gap-4">
          {/* Job selector */}
          <div className="grid gap-1.5">
            <Label>Job *</Label>
            <Select value={jobId} onValueChange={(val) => setJobId(val ?? "")} required>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a job" />
              </SelectTrigger>
              <SelectContent>
                {jobs.map((job) => (
                  <SelectItem key={job.id} value={job.id}>
                    #{job.job_number} — {job.description}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* CO Number & Date */}
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-1.5">
              <Label htmlFor="co_number">CO Number *</Label>
              <Input
                id="co_number"
                name="co_number"
                type="number"
                required
                min={1}
                defaultValue={changeOrder?.co_number ?? ""}
                placeholder="1"
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="date">Date *</Label>
              <Input
                id="date"
                name="date"
                type="date"
                required
                defaultValue={changeOrder?.date ?? ""}
              />
            </div>
          </div>

          {/* Amount */}
          <div className="grid gap-1.5">
            <Label htmlFor="amount">Amount *</Label>
            <Input
              id="amount"
              name="amount"
              type="number"
              step="0.01"
              required
              defaultValue={changeOrder?.amount ?? ""}
              placeholder="0.00"
            />
          </div>

          {/* Approved checkbox */}
          <div className="flex items-center gap-2">
            <Checkbox
              id="approved"
              checked={approved}
              onCheckedChange={(val) => setApproved(val === true)}
            />
            <Label htmlFor="approved" className="cursor-pointer">
              Approved
            </Label>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={pending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving..." : isEditing ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
