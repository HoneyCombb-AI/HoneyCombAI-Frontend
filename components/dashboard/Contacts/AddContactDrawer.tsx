"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"

const contactSchema = z.object({
  fullName: z.string().min(1, "Person's name is required"),
  title: z.string().min(1, "Title is required"),
  companyName: z.string().min(1, "Company is required"),
  linkedinUrl: z.string()
    .min(1, "LinkedIn URL is required")
    .url("Please enter a valid LinkedIn URL")
    .refine((url) => url.includes("linkedin.com"), {
      message: "Please enter a valid LinkedIn URL"
    }),
  email: z.string().email("Please enter a valid email").optional().or(z.literal("")),
  phone: z.string().optional(),
  twitterProfile: z.string()
    .url("Please enter a valid Twitter URL")
    .refine((url) => url.includes("twitter.com") || url.includes("x.com"), {
      message: "Please enter a valid Twitter/X URL"
    })
    .optional()
    .or(z.literal("")),
  instagramProfile: z.string()
    .url("Please enter a valid Instagram URL")
    .refine((url) => url.includes("instagram.com"), {
      message: "Please enter a valid Instagram URL"
    })
    .optional()
    .or(z.literal("")),
})

type ContactFormData = z.infer<typeof contactSchema>

interface AddContactDrawerProps {
  onSubmit?: (data: ContactFormData) => void
  children?: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

const customDrawerStyles = {
  width: '40vw',
  maxWidth: '45vw'
};

export function AddContactDrawer({ onSubmit, children, open: controlledOpen, onOpenChange }: AddContactDrawerProps) {
  const [internalOpen, setInternalOpen] = React.useState(false)
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen
  const setOpen = onOpenChange || setInternalOpen
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
  })

  const onFormSubmit = (data: ContactFormData) => {
    try {
      onSubmit?.(data)
      reset()
      setOpen(false)
    } catch (error) {
      console.error("Error submitting form:", error)
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
        <div className="mx-auto w-full h-screen overflow-y-auto">
          <DrawerHeader className="sticky top-0 bg-white z-10 border-b">
            <DrawerTitle>Add New Contact</DrawerTitle>
            <p className="text-sm text-muted-foreground">
              Add a new contact to your organization. Fill in the contact details below.
            </p>
          </DrawerHeader>
        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
          <div className="px-6 py-4 space-y-6">
          {/* Required Fields */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground">Required Information</h3>
            
            <div className="space-y-2">
              <label htmlFor="fullName" className="text-sm font-medium">
                Person&apos;s Name *
              </label>
              <Input
                id="fullName"
                placeholder="Enter person&apos;s full name"
                {...register("fullName")}
                aria-invalid={!!errors.fullName}
              />
              {errors.fullName && (
                <p className="text-sm text-destructive">{errors.fullName.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="title" className="text-sm font-medium">
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
              <label htmlFor="companyName" className="text-sm font-medium">
                Company *
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
              <label htmlFor="linkedinUrl" className="text-sm font-medium">
                LinkedIn URL *
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
          </div>

          {/* Optional Fields */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground">Contact Information</h3>
            
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
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
              <label htmlFor="phone" className="text-sm font-medium">
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
          </div>

          {/* Social Media Fields */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground">Social Media</h3>
            
            <div className="space-y-2">
              <label htmlFor="twitterProfile" className="text-sm font-medium">
                Twitter Profile
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
              <label htmlFor="instagramProfile" className="text-sm font-medium">
                Instagram Profile
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
          </div>
          </div>

          <div className="px-6 py-4 border-t bg-white sticky bottom-0">
            <div className="flex gap-3 justify-end">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Adding..." : "Add Contact"}
              </Button>
            </div>
          </div>
        </form>
        </div>
      </DrawerContent>
    </Drawer>
  )
}