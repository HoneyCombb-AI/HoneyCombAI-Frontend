"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import axios from "axios"
import { Building2, Globe, LinkedinIcon, MapPin, Map } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import { toast } from "sonner"

const companySchema = z.object({
  companyName: z.string().min(1, "Company name is required"),
  companyWebsite: z.string().min(1, "Company website is required").url("Please enter a valid URL"),
  linkedinUrl: z.string()
    .trim()
    .url("Please enter a valid LinkedIn URL")
    .refine((url) => url.includes("linkedin.com"), {
      message: "Please enter a valid LinkedIn URL"
    })
    .optional()
    .or(z.literal("")),
  city: z.string().trim().optional(),
  state: z.string().trim().optional(),
  country: z.string().trim().optional(),
})

type CompanyFormData = z.infer<typeof companySchema>

interface AddCompanyDrawerProps {
  onSubmit?: (data: CompanyFormData) => void
  children?: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
  direction?: "left" | "right"
}

const customDrawerStyles = {
  width: '32vw',
  maxWidth: '35vw'
};

export function AddCompanyDrawer({ onSubmit, children, open: controlledOpen, onOpenChange, direction = "right" }: AddCompanyDrawerProps) {
  const [internalOpen, setInternalOpen] = React.useState(false)
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen
  const setOpen = onOpenChange || setInternalOpen
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<CompanyFormData>({
    resolver: zodResolver(companySchema),
  })

  const onFormSubmit = async (data: CompanyFormData) => {
    try {
      const response = await axios.post('/api/companies/create', data)
      console.log("data", data)
      if (response.data.success) {
        onSubmit?.(response.data.company)
        reset()
        toast.success(`Company ${data.companyName} created successfully!`)
        setOpen(false)
      } else {
        toast.error(response.data.error || "Failed to create company")
      }
    } catch (error: unknown) {
      console.error("Error submitting form:", error)
      if (error && typeof error === 'object' && 'response' in error && 
          error.response && typeof error.response === 'object' && 'data' in error.response &&
          error.response.data && typeof error.response.data === 'object' && 'error' in error.response.data) {
        toast.error(String(error.response.data.error))
      } else {
        toast.error("Something went wrong. Please try again.")
      }
    }
  }

  return (
    <Drawer direction={direction} open={open} onOpenChange={setOpen}>
      {children && (
        <DrawerTrigger asChild>
          {children}
        </DrawerTrigger>
      )}
      <DrawerContent style={customDrawerStyles}>
        <div className="mx-auto w-full h-screen flex flex-col">
          <DrawerHeader className="sticky top-0 bg-white z-10 border-b">
            <DrawerTitle>Add New Company</DrawerTitle>
            <p className="text-sm text-muted-foreground">
              Add a new company to your organization. Fill in the company details below.
            </p>
          </DrawerHeader>
          <form onSubmit={handleSubmit(onFormSubmit)} className="flex flex-col flex-1 overflow-y-auto">
            <div className="px-6 py-4 space-y-6 flex-1 flex flex-col justify-between">
              <div className="space-y-6">
                <div className="space-y-2">
                  <label htmlFor="companyName" className="flex items-center gap-2 text-sm font-medium">
                    <Building2 className="h-4 w-4" />
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
                  <label htmlFor="companyWebsite" className="flex items-center gap-2 text-sm font-medium">
                    <Globe className="h-4 w-4" />
                    Company Website *
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

                <div className="space-y-2">
                  <label htmlFor="linkedinUrl" className="flex items-center gap-2 text-sm font-medium">
                    <LinkedinIcon className="h-4 w-4 text-[#0A66C2]" />
                    LinkedIn URL
                  </label>
                  <Input
                    id="linkedinUrl"
                    type="url"
                    placeholder="https://linkedin.com/company/company-name"
                    {...register("linkedinUrl")}
                    aria-invalid={!!errors.linkedinUrl}
                  />
                  {errors.linkedinUrl && (
                    <p className="text-sm text-destructive">{errors.linkedinUrl.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label htmlFor="city" className="flex items-center gap-2 text-sm font-medium">
                    <Building2 className="h-4 w-4" />
                    City
                  </label>
                  <Input
                    id="city"
                    placeholder="Enter city"
                    {...register("city")}
                    aria-invalid={!!errors.city}
                  />
                  {errors.city && (
                    <p className="text-sm text-destructive">{errors.city.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label htmlFor="state" className="flex items-center gap-2 text-sm font-medium">
                    <Map className="h-4 w-4" />
                    State
                  </label>
                  <Input
                    id="state"
                    placeholder="Enter state"
                    {...register("state")}
                    aria-invalid={!!errors.state}
                  />
                  {errors.state && (
                    <p className="text-sm text-destructive">{errors.state.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label htmlFor="country" className="flex items-center gap-2 text-sm font-medium">
                    <MapPin className="h-4 w-4" />
                    Country
                  </label>
                  <Input
                    id="country"
                    placeholder="Enter country"
                    {...register("country")}
                    aria-invalid={!!errors.country}
                  />
                  {errors.country && (
                    <p className="text-sm text-destructive">{errors.country.message}</p>
                  )}
                </div>
              </div>

              <div className="px-0 pt-4 border-t bg-white">
                <div className="flex gap-3 justify-end">
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Adding..." : "Save"}
                  </Button>
                </div>
              </div>
            </div>
          </form>
        </div>
      </DrawerContent>
    </Drawer>
  )
}