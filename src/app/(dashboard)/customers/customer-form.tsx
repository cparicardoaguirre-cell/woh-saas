"use client"

import * as React from "react"
import type { DbCustomer } from "@/lib/db-types"
import { createCustomer, updateCustomer } from "./actions"
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

interface CustomerFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  customer?: DbCustomer | null
}

export function CustomerForm({ open, onOpenChange, customer }: CustomerFormProps) {
  const [pending, setPending] = React.useState(false)
  const isEditing = !!customer

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setPending(true)

    const formData = new FormData(e.currentTarget)

    try {
      const result = isEditing
        ? await updateCustomer(customer!.id, formData)
        : await createCustomer(formData)

      if (result.success) {
        toast.success(isEditing ? "Customer updated" : "Customer created")
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
          <DialogTitle>{isEditing ? "Edit Customer" : "New Customer"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the customer details below."
              : "Fill in the details to create a new customer."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid gap-4">
          {/* Name — required */}
          <div className="grid gap-1.5">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              name="name"
              required
              defaultValue={customer?.name ?? ""}
              placeholder="Customer / Owner name"
            />
          </div>

          {/* Contact Name */}
          <div className="grid gap-1.5">
            <Label htmlFor="contact_name">Contact Name</Label>
            <Input
              id="contact_name"
              name="contact_name"
              defaultValue={customer?.contact_name ?? ""}
              placeholder="Primary contact"
            />
          </div>

          {/* Phone & Email */}
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-1.5">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                defaultValue={customer?.phone ?? ""}
                placeholder="(787) 555-0000"
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                defaultValue={customer?.email ?? ""}
                placeholder="email@example.com"
              />
            </div>
          </div>

          {/* Address1 */}
          <div className="grid gap-1.5">
            <Label htmlFor="address1">Address Line 1</Label>
            <Input
              id="address1"
              name="address1"
              defaultValue={customer?.address1 ?? ""}
              placeholder="Street address"
            />
          </div>

          {/* Address2 */}
          <div className="grid gap-1.5">
            <Label htmlFor="address2">Address Line 2</Label>
            <Input
              id="address2"
              name="address2"
              defaultValue={customer?.address2 ?? ""}
              placeholder="Suite, unit, etc."
            />
          </div>

          {/* City, State, ZIP */}
          <div className="grid grid-cols-3 gap-4">
            <div className="grid gap-1.5">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                name="city"
                defaultValue={customer?.city ?? ""}
                placeholder="City"
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="state">State</Label>
              <Input
                id="state"
                name="state"
                defaultValue={customer?.state ?? ""}
                placeholder="PR"
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="zip">ZIP</Label>
              <Input
                id="zip"
                name="zip"
                defaultValue={customer?.zip ?? ""}
                placeholder="00901"
              />
            </div>
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
