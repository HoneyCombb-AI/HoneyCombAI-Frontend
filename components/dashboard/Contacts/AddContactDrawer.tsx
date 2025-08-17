"use client"

import * as React from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import axios from "axios"
import { Building2, User, Briefcase, Mail, Phone, LinkedinIcon, Twitter, Instagram, Globe, Map } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { CompanyListItem } from "@/app/api/companies/list/route"
import { toast } from "sonner";

const contactSchema = z.object({
  fullName: z.string().trim().min(1, "Person's name is required"),
  title: z.string().trim().min(1, "Title is required"),
  companyId: z.string().optional(),
  linkedinUrl: z.string()
    .trim()
    .url("Please enter a valid LinkedIn URL")
    .refine((url) => url.includes("linkedin.com"), {
      message: "Please enter a valid LinkedIn URL"
    })
    .optional()
    .or(z.literal("")),
  email: z.string().trim().email("Please enter a valid email").optional().or(z.literal("")),
  phone: z.string().trim().optional(),
  city: z.string().trim().optional(),
  state: z.string().trim().optional(),
  country: z.string().trim().optional(),
  twitterProfile: z.string()
    .trim()
    .url("Please enter a valid Twitter URL")
    .refine((url) => url.includes("twitter.com") || url.includes("x.com"), {
      message: "Please enter a valid Twitter/X URL"
    })
    .optional()
    .or(z.literal("")),
  instagramProfile: z.string()
    .trim()
    .url("Please enter a valid Instagram URL")
    .refine((url) => url.includes("instagram.com"), {
      message: "Please enter a valid Instagram URL"
    })
    .optional()
    .or(z.literal("")),
}).refine(
  (data) => {
    return data.linkedinUrl || data.twitterProfile || data.instagramProfile;
  },
  {
    message: "At least one social media profile (LinkedIn, Twitter, or Instagram) is required",
    path: ["linkedinUrl"],
  }
)

type ContactFormData = z.infer<typeof contactSchema>

interface AddContactDrawerProps {
  onSubmit?: (data: ContactFormData) => void
  children?: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

const customDrawerStyles = {
  width: '32vw',
  maxWidth: '35vw'
};

export function AddContactDrawer({ onSubmit, children, open: controlledOpen, onOpenChange }: AddContactDrawerProps) {
  const [internalOpen, setInternalOpen] = React.useState(false)
  const [companies, setCompanies] = React.useState<CompanyListItem[]>([])
  const [loadingCompanies, setLoadingCompanies] = React.useState(false)
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen
  const setOpen = onOpenChange || setInternalOpen
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
  })

  // Fetch companies when drawer opens
  React.useEffect(() => {
    if (open && companies.length === 0) {
      fetchCompanies()
    }
  }, [open])

  const fetchCompanies = async () => {
    try {
      setLoadingCompanies(true)
      const response = await axios.get('/api/companies/list')
      setCompanies(response.data.companies || [])
    } catch (error) {
      console.error('Failed to fetch companies:', error)
    } finally {
      setLoadingCompanies(false)
    }
  }

  const onFormSubmit = async (data: ContactFormData) => {
    try {
      const processedData = {
        ...data,
        companyId: data.companyId === "no-company" ? undefined : data.companyId
      }
      const response = await axios.post('/api/contacts/create', processedData)
      if (response.data.success) {
        onSubmit?.(response.data.contact)
        reset()
        toast.success(`Contact ${data.fullName} created successfully!`)
        setOpen(false)
      } else {
        toast.error(response.data.error || "Failed to create contact")
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
    <Drawer direction="right" open={open} onOpenChange={setOpen}>
      {children && (
        <DrawerTrigger asChild>
          {children}
        </DrawerTrigger>
      )}
      <DrawerContent style={customDrawerStyles}>
        <div className="mx-auto w-full h-screen flex flex-col">
          <DrawerHeader className="sticky top-0 bg-white z-10 border-b">
            <DrawerTitle>Add New Contact</DrawerTitle>
            <p className="text-sm text-muted-foreground">
              Add a new contact to your organization. Fill in the contact details below.
            </p>
          </DrawerHeader>
          <form onSubmit={handleSubmit(onFormSubmit)} className="flex flex-col flex-1 overflow-y-auto">
            <div className="px-6 py-4 space-y-6 flex-1 flex flex-col justify-between">
              <div className="space-y-6">

              <div className="space-y-2">
                <label htmlFor="fullName" className="flex items-center gap-2 text-sm font-medium">
                  <User className="h-4 w-4" />
                  Person&apos;s Name *
                </label>
                <Input
                  id="fullName"
                  placeholder="Enter person's full name"
                  {...register("fullName")}
                  aria-invalid={!!errors.fullName}
                />
                {errors.fullName && (
                  <p className="text-sm text-destructive">{errors.fullName.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <label htmlFor="title" className="flex items-center gap-2 text-sm font-medium">
                  <Briefcase className="h-4 w-4" />
                  Title *
                </label>
                <Input
                  id="title"
                  placeholder="Enter job title"
                  {...register("title")}
                  aria-invalid={!!errors.title}
                />
                {errors.title && (
                  <p className="text-sm text-destructive">{errors.title.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium">
                  <Building2 className="h-4 w-4" />
                  Company
                </label>
                <Controller
                  name="companyId"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder={loadingCompanies ? "Loading companies..." : "Select a company"} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="no-company">No company</SelectItem>
                        {companies.map((company) => (
                          <SelectItem key={company.id} value={company.id}>
                            {company.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium">
                  <LinkedinIcon className="h-4 w-4 text-[#0A66C2]" />
                  LinkedIn *
                </label>
                <Input
                  id="linkedinUrl"
                  type="url"
                  placeholder="https://linkedin.com/in/username"
                  {...register("linkedinUrl")}
                  aria-invalid={!!errors.linkedinUrl}
                />
                {errors.linkedinUrl && (
                  <p className="text-sm text-destructive">{errors.linkedinUrl.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium">
                  <Twitter className="h-4 w-4 text-[#1DA1F2]" />
                  Twitter
                </label>
                <Input
                  id="twitterProfile"
                  type="url"
                  placeholder="https://twitter.com/username or https://x.com/username"
                  {...register("twitterProfile")}
                  aria-invalid={!!errors.twitterProfile}
                />
                {errors.twitterProfile && (
                  <p className="text-sm text-destructive">{errors.twitterProfile.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium">
                  <Instagram className="h-4 w-4 text-[#E4405F]" />
                  Instagram
                </label>
                <Input
                  id="instagramProfile"
                  type="url"
                  placeholder="https://instagram.com/username"
                  {...register("instagramProfile")}
                  aria-invalid={!!errors.instagramProfile}
                />
                {errors.instagramProfile && (
                  <p className="text-sm text-destructive">{errors.instagramProfile.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <label htmlFor="email" className="flex items-center gap-2 text-sm font-medium">
                  <Mail className="h-4 w-4" />
                  Email
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="email@example.com"
                  {...register("email")}
                  aria-invalid={!!errors.email}
                />
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <label htmlFor="phone" className="flex items-center gap-2 text-sm font-medium">
                  <Phone className="h-4 w-4" />
                  Phone
                </label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+1 (555) 123-4567"
                  {...register("phone")}
                  aria-invalid={!!errors.phone}
                />
                {errors.phone && (
                  <p className="text-sm text-destructive">{errors.phone.message}</p>
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
                  <Globe className="h-4 w-4" />
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
                  <Button  type="submit" disabled={isSubmitting}>
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