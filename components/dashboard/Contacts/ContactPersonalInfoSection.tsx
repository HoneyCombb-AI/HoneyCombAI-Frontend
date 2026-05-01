"use client"

import { useState } from "react"
import {
  MapPin, Mail, Phone, Flag, LinkedinIcon, Twitter, Instagram,
  Building, Clock, User, Pencil, Plus, Trash2, Star, X, Check,
  Loader2, ExternalLink, Languages,
} from "lucide-react"
import { format, parseISO } from "date-fns"
import axios from "axios"
import { toast } from "sonner"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import type { DrawerContact } from "@/types/contacts"

// ─── Validation ─────────────────────────────────────────────────────────────

const EmailEntrySchema = z.object({
  id: z.string().optional(),
  email: z.string().email("Invalid email address"),
  is_primary: z.boolean(),
  label: z.string().nullable().optional(),
})

const PhoneEntrySchema = z.object({
  id: z.string().optional(),
  phone: z.string().min(1, "Phone number is required"),
  is_primary: z.boolean(),
  label: z.string().nullable().optional(),
})

const ContactUpdateSchema = z.object({
  city: z.string().nullable().optional(),
  country: z.string().nullable().optional(),
  linkedin_url: z.string().nullable().optional().refine(
    val => !val || val.startsWith("http"),
    { message: "LinkedIn URL must start with http:// or https://" }
  ),
  twitter_handle: z.string().nullable().optional(),
  instagram_handle: z.string().nullable().optional(),
  emails: z.array(EmailEntrySchema).refine(
    emails => emails.filter(e => e.is_primary).length <= 1,
    { message: "Only one email can be marked as primary" }
  ),
  phones: z.array(PhoneEntrySchema).refine(
    phones => phones.filter(p => p.is_primary).length <= 1,
    { message: "Only one phone can be marked as primary" }
  ),
})

// ─── Types ───────────────────────────────────────────────────────────────────

type FormEmail = { id?: string; email: string; is_primary: boolean; label: string }
type FormPhone = { id?: string; phone: string; is_primary: boolean; label: string }

interface ContactPersonalInfoSectionProps {
  contact: DrawerContact
  companyIndustry?: string | null
  onUpdate: () => void
}

// ─── Component ───────────────────────────────────────────────────────────────

export function ContactPersonalInfoSection({
  contact,
  companyIndustry,
  onUpdate,
}: ContactPersonalInfoSectionProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const [city, setCity] = useState(contact.city || "")
  const [country, setCountry] = useState(contact.country || "")
  const [linkedinUrl, setLinkedinUrl] = useState(contact.linkedin_url || "")
  const [twitterHandle, setTwitterHandle] = useState(contact.twitter_handle || "")
  const [instagramHandle, setInstagramHandle] = useState(contact.instagram_handle || "")
  const [emails, setEmails] = useState<FormEmail[]>(buildInitialEmails(contact))
  const [phones, setPhones] = useState<FormPhone[]>(buildInitialPhones(contact))

  // Sync form state from current prop values each time the user opens edit mode
  const enterEditMode = () => {
    setCity(contact.city || "")
    setCountry(contact.country || "")
    setLinkedinUrl(contact.linkedin_url || "")
    setTwitterHandle(contact.twitter_handle || "")
    setInstagramHandle(contact.instagram_handle || "")
    setEmails(buildInitialEmails(contact))
    setPhones(buildInitialPhones(contact))
    setErrors({})
    setIsEditing(true)
  }

  const handleCancel = () => {
    setErrors({})
    setIsEditing(false)
  }

  // ── Email handlers ────────────────────────────────────────────────────────

  const setPrimaryEmail = (index: number) =>
    setEmails(prev => prev.map((e, i) => ({ ...e, is_primary: i === index })))

  const addEmail = () =>
    setEmails(prev => [...prev, { email: "", is_primary: prev.length === 0, label: "" }])

  const removeEmail = (index: number) =>
    setEmails(prev => {
      const next = prev.filter((_, i) => i !== index)
      if (prev[index].is_primary && next.length > 0) next[0].is_primary = true
      return next
    })

  const updateEmail = (index: number, field: keyof FormEmail, value: string | boolean) =>
    setEmails(prev => prev.map((e, i) => i === index ? { ...e, [field]: value } : e))

  // ── Phone handlers ────────────────────────────────────────────────────────

  const setPrimaryPhone = (index: number) =>
    setPhones(prev => prev.map((p, i) => ({ ...p, is_primary: i === index })))

  const addPhone = () =>
    setPhones(prev => [...prev, { phone: "", is_primary: prev.length === 0, label: "" }])

  const removePhone = (index: number) =>
    setPhones(prev => {
      const next = prev.filter((_, i) => i !== index)
      if (prev[index].is_primary && next.length > 0) next[0].is_primary = true
      return next
    })

  const updatePhone = (index: number, field: keyof FormPhone, value: string | boolean) =>
    setPhones(prev => prev.map((p, i) => i === index ? { ...p, [field]: value } : p))

  // ── Save ──────────────────────────────────────────────────────────────────

  const handleSave = async () => {
    const payload = {
      city: city || null,
      country: country || null,
      linkedin_url: linkedinUrl || null,
      twitter_handle: twitterHandle || null,
      instagram_handle: instagramHandle || null,
      emails,
      phones,
    }

    const result = ContactUpdateSchema.safeParse(payload)
    if (!result.success) {
      const fieldErrors: Record<string, string> = {}
      result.error.errors.forEach(err => {
        fieldErrors[err.path.join(".")] = err.message
      })
      setErrors(fieldErrors)
      toast.error(result.error.errors[0].message)
      return
    }

    setErrors({})
    setSaving(true)
    try {
      await axios.patch(`/api/contacts/${contact.id}`, result.data)
      toast.success("Contact updated successfully")
      setIsEditing(false)
      onUpdate()
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.data?.error) {
        toast.error(error.response.data.error)
      } else {
        toast.error("Failed to update contact")
      }
    } finally {
      setSaving(false)
    }
  }

  // ─── View mode ────────────────────────────────────────────────────────────

  if (!isEditing) {
    const displayEmails = contact.emails?.length > 0
      ? contact.emails
      : contact.email
        ? [{ id: "legacy", email: contact.email, is_primary: true, label: null, created_at: "" }]
        : []

    const displayPhones = contact.phones?.length > 0
      ? contact.phones
      : contact.phone
        ? [{ id: "legacy", phone: contact.phone, is_primary: true, label: null, created_at: "" }]
        : []

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <SectionHeader />
          <Button
            variant="ghost"
            size="sm"
            className="h-7 gap-1.5 text-xs text-gray-500 hover:text-gray-900"
            onClick={enterEditMode}
          >
            <Pencil className="h-3 w-3" />
            Edit
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-x-8 gap-y-3">
          {contact.city && (
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <MapPin className="h-4 w-4 shrink-0" />
              <span>{contact.city}</span>
            </div>
          )}
          {contact.country && (
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <Flag className="h-4 w-4 shrink-0" />
              <span>{contact.country}</span>
            </div>
          )}

          {displayEmails.length > 0
            ? displayEmails.map(entry => (
              <div key={entry.id} className="flex items-center gap-2 text-sm text-gray-600">
                <Mail className="h-4 w-4 shrink-0" />
                <span className="truncate">{entry.email}</span>
                {entry.is_primary && (
                  <Badge variant="secondary" className="text-xs px-1.5 py-0 shrink-0">Primary</Badge>
                )}
                {entry.label && (
                  <span className="text-xs text-gray-400 capitalize shrink-0">{entry.label}</span>
                )}
              </div>
            ))
            : (
              <div className="flex items-center gap-3 text-sm text-gray-400">
                <Mail className="h-4 w-4 shrink-0" />
                <span>No email provided</span>
              </div>
            )}

          {displayPhones.length > 0
            ? displayPhones.map(entry => (
              <div key={entry.id} className="flex items-center gap-2 text-sm text-gray-600">
                <Phone className="h-4 w-4 shrink-0" />
                <span className="truncate">{entry.phone}</span>
                {entry.is_primary && (
                  <Badge variant="secondary" className="text-xs px-1.5 py-0 shrink-0">Primary</Badge>
                )}
                {entry.label && (
                  <span className="text-xs text-gray-400 capitalize shrink-0">{entry.label}</span>
                )}
              </div>
            ))
            : (
              <div className="flex items-center gap-3 text-sm text-gray-400">
                <Phone className="h-4 w-4 shrink-0" />
                <span>No phone provided</span>
              </div>
            )}

          <div className="flex items-center gap-3 text-sm">
            <LinkedinIcon className="h-4 w-4 text-[#0A66C2] shrink-0" />
            {contact.linkedin_url ? (
              <a
                href={contact.linkedin_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline flex items-center gap-1 truncate"
              >
                LinkedIn Profile <ExternalLink className="h-3 w-3 shrink-0" />
              </a>
            ) : (
              <span className="text-gray-400">No LinkedIn profile</span>
            )}
          </div>

          <div className="flex items-center gap-3 text-sm">
            <Twitter className="h-4 w-4 text-[#1DA1F2] shrink-0" />
            {contact.twitter_handle ? (
              <a
                href={`https://twitter.com/${contact.twitter_handle}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline flex items-center gap-1"
              >
                @{contact.twitter_handle} <ExternalLink className="h-3 w-3 shrink-0" />
              </a>
            ) : (
              <span className="text-gray-400">No X profile</span>
            )}
          </div>

          <div className="flex items-center gap-3 text-sm">
            <Instagram className="h-4 w-4 text-[#E4405F] shrink-0" />
            {contact.instagram_handle ? (
              <a
                href={`https://instagram.com/${contact.instagram_handle}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline flex items-center gap-1"
              >
                @{contact.instagram_handle} <ExternalLink className="h-3 w-3 shrink-0" />
              </a>
            ) : (
              <span className="text-gray-400">No Instagram profile</span>
            )}
          </div>

          {companyIndustry && (
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <Building className="h-4 w-4 shrink-0" />
              <span>Works in {companyIndustry}</span>
            </div>
          )}

          {contact.languages && contact.languages.length > 0 && (
            <div className="col-span-2 flex items-start gap-3 text-sm text-gray-600">
              <Languages className="h-4 w-4 shrink-0 mt-0.5" />
              <div className="flex flex-wrap gap-1">
                {contact.languages.map((lang, i) => (
                  <Badge key={i} variant="secondary" className="text-xs px-2 py-0.5">{lang}</Badge>
                ))}
              </div>
            </div>
          )}

          {contact.created_by_name && (
            <div className="flex items-center gap-3 text-sm text-gray-500">
              <User className="h-4 w-4 shrink-0" />
              <span>Added by {contact.created_by_name}</span>
            </div>
          )}

          {contact.updated_at && (
            <div className="flex items-center gap-3 text-sm text-gray-500">
              <Clock className="h-4 w-4 shrink-0" />
              <span>
                Updated{contact.updated_by_name ? ` by ${contact.updated_by_name}` : ""} on{" "}
                {format(parseISO(contact.updated_at), "PPP")}
              </span>
            </div>
          )}
        </div>
      </div>
    )
  }

  // ─── Edit mode ────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <SectionHeader />
      </div>

      {/* Basic fields — 2-col grid */}
      <div className="grid grid-cols-2 gap-x-6 gap-y-4">
        <div className="space-y-1.5">
          <Label className="text-xs text-gray-500 flex items-center gap-1.5">
            <MapPin className="h-3 w-3" /> City
          </Label>
          <Input
            value={city}
            onChange={e => setCity(e.target.value)}
            placeholder="City"
            className="h-8 text-sm"
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs text-gray-500 flex items-center gap-1.5">
            <Flag className="h-3 w-3" /> Country
          </Label>
          <Input
            value={country}
            onChange={e => setCountry(e.target.value)}
            placeholder="Country"
            className="h-8 text-sm"
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs text-gray-500 flex items-center gap-1.5">
            <LinkedinIcon className="h-3 w-3 text-[#0A66C2]" /> LinkedIn URL
          </Label>
          <Input
            value={linkedinUrl}
            onChange={e => setLinkedinUrl(e.target.value)}
            placeholder="https://linkedin.com/in/..."
            className="h-8 text-sm"
          />
          {errors.linkedin_url && (
            <p className="text-xs text-red-500">{errors.linkedin_url}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs text-gray-500 flex items-center gap-1.5">
            <Twitter className="h-3 w-3 text-[#1DA1F2]" /> X Handle
          </Label>
          <Input
            value={twitterHandle}
            onChange={e => setTwitterHandle(e.target.value)}
            placeholder="handle (without @)"
            className="h-8 text-sm"
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs text-gray-500 flex items-center gap-1.5">
            <Instagram className="h-3 w-3 text-[#E4405F]" /> Instagram Handle
          </Label>
          <Input
            value={instagramHandle}
            onChange={e => setInstagramHandle(e.target.value)}
            placeholder="handle (without @)"
            className="h-8 text-sm"
          />
        </div>
      </div>

      {/* Emails — full width, grows with list */}
      <div className="space-y-2">
        <Label className="text-xs text-gray-500 flex items-center gap-1.5">
          <Mail className="h-3 w-3" /> Email Addresses
        </Label>
        <div className="space-y-2">
          {emails.map((entry, index) => (
            <div key={index} className="flex items-center gap-2">
              <Input
                value={entry.email}
                onChange={e => updateEmail(index, "email", e.target.value)}
                placeholder="email@example.com"
                className={`h-8 text-sm flex-1 ${errors[`emails.${index}.email`] ? "border-red-400" : ""}`}
              />
              <Input
                value={entry.label}
                onChange={e => updateEmail(index, "label", e.target.value)}
                placeholder="work, personal..."
                className="h-8 text-sm w-32"
              />
              <button
                type="button"
                title={entry.is_primary ? "Primary email" : "Set as primary"}
                onClick={() => setPrimaryEmail(index)}
                className={`shrink-0 p-1.5 rounded transition-colors ${entry.is_primary
                    ? "text-amber-500 bg-amber-50"
                    : "text-gray-300 hover:text-amber-400 hover:bg-amber-50"
                  }`}
              >
                <Star className="h-3.5 w-3.5" fill={entry.is_primary ? "currentColor" : "none"} />
              </button>
              <button
                type="button"
                onClick={() => removeEmail(index)}
                className="shrink-0 p-1.5 rounded text-gray-300 hover:text-red-400 hover:bg-red-50 transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
          {errors.emails && <p className="text-xs text-red-500">{errors.emails}</p>}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 gap-1.5 text-xs text-gray-500"
            onClick={addEmail}
          >
            <Plus className="h-3 w-3" /> Add email
          </Button>
        </div>
      </div>

      {/* Phones — full width, grows with list */}
      <div className="space-y-2">
        <Label className="text-xs text-gray-500 flex items-center gap-1.5">
          <Phone className="h-3 w-3" /> Phone Numbers
        </Label>
        <div className="space-y-2">
          {phones.map((entry, index) => (
            <div key={index} className="flex items-center gap-2">
              <Input
                value={entry.phone}
                onChange={e => updatePhone(index, "phone", e.target.value)}
                placeholder="+1 234 567 8900"
                className={`h-8 text-sm flex-1 ${errors[`phones.${index}.phone`] ? "border-red-400" : ""}`}
              />
              <Input
                value={entry.label}
                onChange={e => updatePhone(index, "label", e.target.value)}
                placeholder="mobile, office..."
                className="h-8 text-sm w-32"
              />
              <button
                type="button"
                title={entry.is_primary ? "Primary phone" : "Set as primary"}
                onClick={() => setPrimaryPhone(index)}
                className={`shrink-0 p-1.5 rounded transition-colors ${entry.is_primary
                    ? "text-amber-500 bg-amber-50"
                    : "text-gray-300 hover:text-amber-400 hover:bg-amber-50"
                  }`}
              >
                <Star className="h-3.5 w-3.5" fill={entry.is_primary ? "currentColor" : "none"} />
              </button>
              <button
                type="button"
                onClick={() => removePhone(index)}
                className="shrink-0 p-1.5 rounded text-gray-300 hover:text-red-400 hover:bg-red-50 transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
          {errors.phones && <p className="text-xs text-red-500">{errors.phones}</p>}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 gap-1.5 text-xs text-gray-500"
            onClick={addPhone}
          >
            <Plus className="h-3 w-3" /> Add phone
          </Button>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 pt-1">
        <Button size="sm" className="h-8 gap-1.5 text-sm" onClick={handleSave} disabled={saving}>
          {saving
            ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
            : <Check className="h-3.5 w-3.5" />}
          {saving ? "Saving..." : "Save Changes"}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="h-8 gap-1.5 text-sm text-gray-500"
          onClick={handleCancel}
          disabled={saving}
        >
          <X className="h-3.5 w-3.5" /> Cancel
        </Button>
      </div>
    </div>
  )
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function SectionHeader() {
  return (
    <div className="flex items-center gap-2">
      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-blue-600">
        <User className="h-3.5 w-3.5" />
      </div>
      <h3 className="text-sm font-semibold text-gray-900">Personal Information</h3>
    </div>
  )
}

function buildInitialEmails(contact: DrawerContact): FormEmail[] {
  if (contact.emails?.length > 0) {
    return contact.emails.map(e => ({
      id: e.id,
      email: e.email,
      is_primary: e.is_primary,
      label: e.label || "",
    }))
  }
  if (contact.email) return [{ email: contact.email, is_primary: true, label: "" }]
  return []
}

function buildInitialPhones(contact: DrawerContact): FormPhone[] {
  if (contact.phones?.length > 0) {
    return contact.phones.map(p => ({
      id: p.id,
      phone: p.phone,
      is_primary: p.is_primary,
      label: p.label || "",
    }))
  }
  if (contact.phone) return [{ phone: contact.phone, is_primary: true, label: "" }]
  return []
}
