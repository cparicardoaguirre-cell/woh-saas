"use client"

import * as React from "react"
import type { DbJob, DbCustomer, DbMunicipality } from "@/lib/db-types"
import { createJob, updateJob } from "./actions"
import { toast } from "sonner"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Loader2Icon } from "lucide-react"

// ─── Props ──────────────────────────────────────────────────────────────────

interface JobFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  job?: DbJob | null
  customers: DbCustomer[]
  municipalities: DbMunicipality[]
}

// ─── Component ──────────────────────────────────────────────────────────────

export function JobForm({
  open,
  onOpenChange,
  job,
  customers,
  municipalities,
}: JobFormProps) {
  const isEdit = !!job
  const [pending, setPending] = React.useState(false)

  // Local state for controlled select/checkbox fields
  const [ownerId, setOwnerId] = React.useState<string | null>("")
  const [customerId, setCustomerId] = React.useState<string | null>("")
  const [municipalityId, setMunicipalityId] = React.useState<string | null>("")
  const [autoRetainage, setAutoRetainage] = React.useState(false)

  // Reset form state when the dialog opens or the job changes
  React.useEffect(() => {
    if (open) {
      setOwnerId(job?.owner_id ?? "")
      setCustomerId(job?.customer_id ?? "")
      setMunicipalityId(job?.municipality_id != null ? String(job.municipality_id) : "")
      setAutoRetainage(job?.automatic_retainage ?? false)
    }
  }, [open, job])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setPending(true)

    const form = e.currentTarget
    const formData = new FormData(form)

    // Add controlled fields that aren't native inputs
    formData.set("owner_id", ownerId ?? "")
    formData.set("customer_id", customerId ?? "")
    formData.set("municipality_id", municipalityId ?? "")
    formData.set("automatic_retainage", autoRetainage ? "true" : "false")

    // Convert retainage % (0-100 user input) to 0-1 for storage
    const retainageInput = Number(formData.get("retainage_pct_display")) || 0
    formData.set("retainage_pct", String(retainageInput / 100))
    formData.delete("retainage_pct_display")

    try {
      const result = isEdit
        ? await updateJob(job!.id, formData)
        : await createJob(formData)

      if (result.success) {
        toast.success(isEdit ? "Job updated" : "Job created")
        onOpenChange(false)
      } else {
        toast.error(result.error)
      }
    } catch {
      toast.error("An unexpected error occurred")
    } finally {
      setPending(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Job" : "New Job"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update the job details below."
              : "Fill in the details to create a new job."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid gap-4">
          {/* Row: Job Number + Description */}
          <div className="grid grid-cols-[120px_1fr] gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="job_number">Job #</Label>
              <Input
                id="job_number"
                name="job_number"
                type="number"
                required
                defaultValue={job?.job_number ?? ""}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                name="description"
                required
                defaultValue={job?.description ?? ""}
              />
            </div>
          </div>

          {/* Row: Owner + Customer */}
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label>Owner</Label>
              <Select value={ownerId} onValueChange={setOwnerId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select owner" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {customers.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label>Customer</Label>
              <Select value={customerId} onValueChange={setCustomerId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select customer" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {customers.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Municipality */}
          <div className="grid gap-1.5">
            <Label>Municipality</Label>
            <Select value={municipalityId} onValueChange={setMunicipalityId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select municipality" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">None</SelectItem>
                {municipalities.map((m) => (
                  <SelectItem key={m.id} value={String(m.id)}>
                    {m.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Row: Contract Date + Completed Date */}
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="contract_date">Contract Date</Label>
              <Input
                id="contract_date"
                name="contract_date"
                type="date"
                defaultValue={job?.contract_date ?? ""}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="completed_date">Completed Date</Label>
              <Input
                id="completed_date"
                name="completed_date"
                type="date"
                defaultValue={job?.completed_date ?? ""}
              />
            </div>
          </div>

          {/* Row: Amount + Retainage % + Auto Retainage */}
          <div className="grid grid-cols-[1fr_100px_auto] gap-3 items-end">
            <div className="grid gap-1.5">
              <Label htmlFor="original_contract_amount">Original Amount</Label>
              <Input
                id="original_contract_amount"
                name="original_contract_amount"
                type="number"
                step="0.01"
                min="0"
                defaultValue={job?.original_contract_amount ?? ""}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="retainage_pct_display">Ret. %</Label>
              <Input
                id="retainage_pct_display"
                name="retainage_pct_display"
                type="number"
                step="0.1"
                min="0"
                max="100"
                defaultValue={
                  job?.retainage_pct != null
                    ? String(Math.round(job.retainage_pct * 100 * 10) / 10)
                    : ""
                }
              />
            </div>
            <div className="flex items-center gap-2 pb-0.5">
              <Checkbox
                id="auto_retainage"
                checked={autoRetainage}
                onCheckedChange={(checked) =>
                  setAutoRetainage(checked === true)
                }
              />
              <Label htmlFor="auto_retainage" className="text-xs whitespace-nowrap">
                Auto Ret.
              </Label>
            </div>
          </div>

          {/* Footer */}
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending && <Loader2Icon className="animate-spin" />}
              {isEdit ? "Save Changes" : "Create Job"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
