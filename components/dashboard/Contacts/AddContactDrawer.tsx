"use client"

import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import axios from "axios"
import { Building2, User, Briefcase, Mail, Phone, LinkedinIcon, Twitter, Instagram, Globe, Plus, Star, Trash2 } from "lucide-react"

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
import type { CompanyListItem } from "@/types/companies"
import { toast } from "sonner";
import { AddCompanyDrawer } from "../Company/AddCompanyDrawer"
import {
  contactPhonePattern,
  sanitizeContactPhoneInput,
  type ContactEmailInput,
  type ContactPhoneInput,
} from "@/lib/contacts/contact-details"
import { useCallback, useEffect, useState } from "react"

type ContactEmailFormRow = ContactEmailInput & { _uiKey: string }
type ContactPhoneFormRow = ContactPhoneInput & { _uiKey: string }

const createEmailRow = (isPrimary = false): ContactEmailFormRow => ({
  _uiKey: crypto.randomUUID(),
  email: "",
  is_primary: isPrimary,
  label: "",
})

const createPhoneRow = (isPrimary = false): ContactPhoneFormRow => ({
  _uiKey: crypto.randomUUID(),
  phone: "",
  is_primary: isPrimary,
  label: "",
})

const emailEntrySchema = z.object({
  email: z.string().trim().email("Please enter a valid email"),
  is_primary: z.boolean(),
  label: z.string().trim().max(20, "Label too long").nullable().optional(),
})

const phoneEntrySchema = z.object({
  phone: z.string()
    .trim()
    .regex(contactPhonePattern, "Phone number must use digits only, may start with +, and be up to 15 characters total"),
  is_primary: z.boolean(),
  label: z.string().trim().max(20, "Label too long").nullable().optional(),
})

const contactMethodsSchema = z.object({
  emails: z.array(emailEntrySchema).refine(
    emails => emails.filter(e => e.is_primary).length <= 1,
    { message: "Only one email can be marked as primary" }
  ),
  phones: z.array(phoneEntrySchema).refine(
    phones => phones.filter(p => p.is_primary).length <= 1,
    { message: "Only one phone can be marked as primary" }
  ),
})

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
  city: z.string().trim().optional(),
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
  const [internalOpen, setInternalOpen] = useState(false)
  const [companies, setCompanies] = useState<CompanyListItem[]>([])
  const [loadingCompanies, setLoadingCompanies] = useState(false)
  const [companyDrawerOpen, setCompanyDrawerOpen] = useState(false)
  const [emails, setEmails] = useState<ContactEmailFormRow[]>(() => [createEmailRow(true)])
  const [phones, setPhones] = useState<ContactPhoneFormRow[]>(() => [createPhoneRow(true)])
  const [contactMethodErrors, setContactMethodErrors] = useState<Record<string, string>>({})
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

  const resetContactMethods = useCallback(() => {
    setEmails([createEmailRow(true)])
    setPhones([createPhoneRow(true)])
    setContactMethodErrors({})
  }, [])

  // Fetch companies when drawer opens; reset contact methods when it closes
  useEffect(() => {
    if (open) {
      if (companies.length === 0) fetchCompanies()
    } else {
      resetContactMethods()
    }
  }, [open])

  const fetchCompanies = async () => {
    try {
      setLoadingCompanies(true)
      const response = await axios.get('/api/companies/list')
      setCompanies(response.data.companies || [])
    } catch (err) {
      if (axios.isAxiosError(err) && err.response) {
        const status = err.response.status
        if (status === 429) {
          toast.error("Too many requests. Can't Load Companies. Please wait before trying again.")
        } else if (status === 404) {
          toast.error("Companies not found.")
        } else if (status >= 500) {
          toast.error("Server error. Please try again later.")
        } else {
          toast.error(`Failed to fetch Companies details: ${err.response.statusText || 'Unknown error'}`)
        }
      } else if (axios.isAxiosError(err)) {
        toast.error("Network error. Please check your connection.")
      } else {
        toast.error("An unexpected error occurred while loading contact details.")
      }
    } finally {
      setLoadingCompanies(false)
    }
  }

  const handleCompanyAdded = (newCompany: {
    id: string;
    name: string;
    company_url: string;
    linkedin_url?: string;
    city?: string;
    state?: string;
    country?: string;
    user_id: string;
    organization_id?: string;
    created_at: string;
  }) => {
    const companyListItem: CompanyListItem = {
      id: newCompany.id,
      name: newCompany.name
    }
    setCompanies(prev => [...prev, companyListItem])
    setCompanyDrawerOpen(false)
  }

  const setPrimaryEmail = useCallback((index: number) => {
    setEmails(prev => prev.map((email, i) => ({
      ...email,
      is_primary: i === index,
      label: i === index ? "" : email.label,
    })))
  }, [])

  const addEmail = useCallback(() => {
    setEmails(prev => [...prev, createEmailRow(prev.length === 0)])
  }, [])

  const removeEmail = useCallback((index: number) => {
    setEmails(prev => {
      const next = prev.filter((_, i) => i !== index)
      if (prev[index]?.is_primary && next.length > 0) {
        next[0] = { ...next[0], is_primary: true, label: "" }
      }
      return next.length > 0 ? next : [createEmailRow(true)]
    })
  }, [])

  const updateEmail = useCallback((index: number, field: keyof ContactEmailInput, value: string | boolean) => {
    setEmails(prev => prev.map((email, i) => i === index ? { ...email, [field]: value } : email))
  }, [])

  const setPrimaryPhone = useCallback((index: number) => {
    setPhones(prev => prev.map((phone, i) => ({
      ...phone,
      is_primary: i === index,
      label: i === index ? "" : phone.label,
    })))
  }, [])

  const addPhone = useCallback(() => {
    setPhones(prev => [...prev, createPhoneRow(prev.length === 0)])
  }, [])

  const removePhone = useCallback((index: number) => {
    setPhones(prev => {
      const next = prev.filter((_, i) => i !== index)
      if (prev[index]?.is_primary && next.length > 0) {
        next[0] = { ...next[0], is_primary: true, label: "" }
      }
      return next.length > 0 ? next : [createPhoneRow(true)]
    })
  }, [])

  const updatePhone = useCallback((index: number, field: keyof ContactPhoneInput, value: string | boolean) => {
    setPhones(prev => prev.map((phone, i) => i === index ? { ...phone, [field]: value } : phone))
  }, [])

  const onFormSubmit = async (data: ContactFormData) => {
    try {
      const emailRows = emails
        .map(({ _uiKey, ...email }) => ({
          email: email.email.trim(),
          is_primary: email.is_primary,
          label: email.label?.trim() || null,
        }))
        .filter(email => email.email)

      const phoneRows = phones
        .map(({ _uiKey, ...phone }) => ({
          phone: phone.phone.trim(),
          is_primary: phone.is_primary,
          label: phone.label?.trim() || null,
        }))
        .filter(phone => phone.phone)

      if (emailRows.length > 0 && !emailRows.some(email => email.is_primary)) {
        emailRows[0].is_primary = true
      }

      if (phoneRows.length > 0 && !phoneRows.some(phone => phone.is_primary)) {
        phoneRows[0].is_primary = true
      }

      const contactMethodsResult = contactMethodsSchema.safeParse({
        emails: emailRows,
        phones: phoneRows,
      })

      if (!contactMethodsResult.success) {
        const fieldErrors: Record<string, string> = {}
        contactMethodsResult.error.errors.forEach(error => {
          fieldErrors[error.path.join(".")] = error.message
        })
        setContactMethodErrors(fieldErrors)
        toast.error(contactMethodsResult.error.errors[0].message)
        return
      }

      setContactMethodErrors({})

      const processedData = {
        ...data,
        companyId: data.companyId === "no-company" ? undefined : data.companyId,
        emails: contactMethodsResult.data.emails,
        phones: contactMethodsResult.data.phones,
      }
      const response = await axios.post('/api/contacts/create', processedData)
      if (response.data.success) {
        onSubmit?.(response.data.contact)
        reset()
        resetContactMethods()
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
                  <div className="flex gap-2">
                    <div className="flex-1">
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
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setCompanyDrawerOpen(true)}
                      className="shrink-0"
                    >
                      Add Company
                    </Button>
                  </div>
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
                  <label className="flex items-center gap-2 text-sm font-medium">
                    <Mail className="h-4 w-4" />
                    Email Addresses
                  </label>
                  <div className="space-y-2">
                    {emails.map((entry, index) => (
                      <div key={entry._uiKey} className="flex items-center gap-2">
                        <Input
                          type="email"
                          placeholder="email@example.com"
                          value={entry.email}
                          onChange={(event) => updateEmail(index, "email", event.target.value)}
                          aria-invalid={!!contactMethodErrors[`emails.${index}.email`]}
                          className="flex-1"
                        />
                        <Input
                          value={entry.is_primary ? "" : (entry.label || "")}
                          onChange={(event) => updateEmail(index, "label", event.target.value)}
                          placeholder={entry.is_primary ? "Primary" : "work, personal..."}
                          maxLength={20}
                          disabled={entry.is_primary}
                          className="w-36"
                        />
                        <button
                          type="button"
                          title={entry.is_primary ? "Primary email" : "Set as primary"}
                          onClick={() => setPrimaryEmail(index)}
                          className={`shrink-0 p-2 rounded transition-colors ${entry.is_primary
                            ? "text-amber-500 bg-amber-50"
                            : "text-gray-300 hover:text-amber-400 hover:bg-amber-50"
                            }`}
                        >
                          <Star className="h-4 w-4" fill={entry.is_primary ? "currentColor" : "none"} />
                        </button>
                        <button
                          type="button"
                          title="Remove email"
                          onClick={() => removeEmail(index)}
                          className="shrink-0 p-2 rounded text-gray-300 hover:text-red-400 hover:bg-red-50 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                  {contactMethodErrors.emails && (
                    <p className="text-sm text-destructive">{contactMethodErrors.emails}</p>
                  )}
                  <Button type="button" variant="ghost" size="sm" className="h-8 gap-1.5 text-gray-500" onClick={addEmail}>
                    <Plus className="h-4 w-4" /> Add email
                  </Button>
                </div>

                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium">
                    <Phone className="h-4 w-4" />
                    Phone Numbers
                  </label>
                  <div className="space-y-2">
                    {phones.map((entry, index) => (
                      <div key={entry._uiKey} className="flex items-center gap-2">
                        <Input
                          type="tel"
                          inputMode="tel"
                          placeholder="+15551234567"
                          value={entry.phone}
                          onChange={(event) => updatePhone(index, "phone", sanitizeContactPhoneInput(event.target.value))}
                          aria-invalid={!!contactMethodErrors[`phones.${index}.phone`]}
                          className="flex-1"
                        />
                        <Input
                          value={entry.is_primary ? "" : (entry.label || "")}
                          onChange={(event) => updatePhone(index, "label", event.target.value)}
                          placeholder={entry.is_primary ? "Primary" : "mobile, office..."}
                          maxLength={20}
                          disabled={entry.is_primary}
                          className="w-36"
                        />
                        <button
                          type="button"
                          title={entry.is_primary ? "Primary phone" : "Set as primary"}
                          onClick={() => setPrimaryPhone(index)}
                          className={`shrink-0 p-2 rounded transition-colors ${entry.is_primary
                            ? "text-amber-500 bg-amber-50"
                            : "text-gray-300 hover:text-amber-400 hover:bg-amber-50"
                            }`}
                        >
                          <Star className="h-4 w-4" fill={entry.is_primary ? "currentColor" : "none"} />
                        </button>
                        <button
                          type="button"
                          title="Remove phone"
                          onClick={() => removePhone(index)}
                          className="shrink-0 p-2 rounded text-gray-300 hover:text-red-400 hover:bg-red-50 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                  {contactMethodErrors.phones && (
                    <p className="text-sm text-destructive">{contactMethodErrors.phones}</p>
                  )}
                  <Button type="button" variant="ghost" size="sm" className="h-8 gap-1.5 text-gray-500" onClick={addPhone}>
                    <Plus className="h-4 w-4" /> Add phone
                  </Button>
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
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Adding..." : "Save"}
                  </Button>
                </div>
              </div>
            </div>
          </form>
        </div>
      </DrawerContent>
      <AddCompanyDrawer
        open={companyDrawerOpen}
        onOpenChange={setCompanyDrawerOpen}
        direction="left"
        onSubmit={handleCompanyAdded}
      />
    </Drawer>
  )
}
