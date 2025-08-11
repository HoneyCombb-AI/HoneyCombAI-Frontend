"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

const companySchema = z.object({
  companyName: z.string().min(1, "Company name is required"),
  companyWebsite: z.string().url("Please enter a valid URL").optional().or(z.literal("")),
})

type CompanyFormData = z.infer<typeof companySchema>

interface AddCompanyDialogProps {
  onSubmit?: (data: CompanyFormData) => void
  children?: React.ReactNode
}

export function AddCompanyDialog({ onSubmit, children }: AddCompanyDialogProps) {
  const [open, setOpen] = React.useState(false)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<CompanyFormData>({
    resolver: zodResolver(companySchema),
  })

  const onFormSubmit = (data: CompanyFormData) => {
    try {
      onSubmit?.(data)
      reset()
      setOpen(false)
    } catch (error) {
      console.error("Error submitting form:", error)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || <Button>Add Company</Button>}
      </DialogTrigger>
      <DialogContent className="w-full">
        <DialogHeader>
          <DialogTitle>Add New Company</DialogTitle>
          <DialogDescription>
            Add a new company to your organization. Fill in the company details below.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="companyName" className="text-sm font-medium">
              Company Name *
            </label>
            <Input
              id="companyName"
              placeholder="Enter company name"
              {...register("companyName")}
              aria-invalid={!!errors.companyName}
            />
            {errors.companyName && (
              <p className="text-sm text-destructive">{errors.companyName.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <label htmlFor="companyWebsite" className="text-sm font-medium">
              Company Website
            </label>
            <Input
              id="companyWebsite"
              type="url"
              placeholder="https://example.com"
              {...register("companyWebsite")}
              aria-invalid={!!errors.companyWebsite}
            />
            {errors.companyWebsite && (
              <p className="text-sm text-destructive">{errors.companyWebsite.message}</p>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Adding..." : "Add Company"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}