"use client"

import { useState, useCallback, useMemo, memo } from "react"
import {
  MapPin, Mail, Phone, LinkedinIcon, Twitter, Instagram,
  Building, Clock, User, Pencil, Plus, Trash2, Star, X, Check,
  Loader2, ExternalLink, Languages,
} from "lucide-react"
import { format, parseISO } from "date-fns"
import axios from "axios"
import { toast } from "sonner"
import { z } from "zod"
import { cn } from "@/lib/utils"
import { useFontSize } from "@/lib/font-size-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import type { DrawerContact, ContactEmail, ContactPhone } from "@/types/contacts"

// ─── Typography scale map ───────────────────────────────────────────────────

const mutedSizeMap: Record<string, string> = {
  "text-xs": "text-[10px]",
  "text-sm": "text-xs",
  "text-base": "text-sm",
  "text-lg": "text-base",
}

// ─── Validation ─────────────────────────────────────────────────────────────

const ContactUpdateSchema = z.object({
  linkedin_url: z.string().nullable().optional().refine(
    val => !val || val.startsWith("http"),
    { message: "LinkedIn URL must start with http:// or https://" }
  ),
  twitter_handle: z.string().nullable().optional(),
  instagram_handle: z.string().nullable().optional(),
  emails: z.array(
    z.object({
      id: z.string().optional(),
      email: z.string().email("Invalid email address"),
      is_primary: z.boolean(),
      label: z.string().max(20, "Label too long").nullable().optional(),
    })
  ).refine(
    emails => emails.filter(e => e.is_primary).length <= 1,
    { message: "Only one email can be marked as primary" }
  ),
  phones: z.array(
    z.object({
      id: z.string().optional(),
      phone: z.string()
        .min(1, "Phone number is required")
        .max(15, "Phone number cannot exceed 15 characters")
        .regex(/^\+?\d+$/, "Phone number can only contain digits and an optional leading +"),
      is_primary: z.boolean(),
      label: z.string().max(20, "Label too long").nullable().optional(),
    })
  ).refine(
    phones => phones.filter(p => p.is_primary).length <= 1,
    { message: "Only one phone can be marked as primary" }
  ),
})

// ─── Props ────────────────────────────────────────────────────────────────────

interface ContactPersonalInfoSectionProps {
  contact: DrawerContact
  companyIndustry?: string | null
  onUpdate: () => void
}

// ─── Component ───────────────────────────────────────────────────────────────

export const ContactPersonalInfoSection = memo(function ContactPersonalInfoSection({
  contact,
  companyIndustry,
  onUpdate,
}: ContactPersonalInfoSectionProps) {
  const { getFontSizeClass } = useFontSize()

  // ── Typography classes (scale with accessibility setting) ──────────────
  const typo = useMemo(() => {
    const body = getFontSizeClass()
    const muted = mutedSizeMap[body] || "text-xs"
    return { body, muted }
  }, [getFontSizeClass])

  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const [linkedinUrl, setLinkedinUrl] = useState(contact.linkedin_url || "")
  const [twitterHandle, setTwitterHandle] = useState(contact.twitter_handle || "")
  const [instagramHandle, setInstagramHandle] = useState(contact.instagram_handle || "")
  
  const [emails, setEmails] = useState<Partial<ContactEmail>[]>(
    contact.emails?.length > 0
      ? contact.emails.map(e => ({ id: e.id, email: e.email, is_primary: e.is_primary, label: e.label || "" }))
      : contact.email ? [{ email: contact.email, is_primary: true, label: "" }] : []
  )
  const [phones, setPhones] = useState<Partial<ContactPhone>[]>(
    contact.phones?.length > 0
      ? contact.phones.map(p => ({ id: p.id, phone: p.phone, is_primary: p.is_primary, label: p.label || "" }))
      : contact.phone ? [{ phone: contact.phone, is_primary: true, label: "" }] : []
  )

  // ── Memoised display data ──────────────────────────────────────────────────

  const displayEmails = useMemo(() => {
    if (contact.emails?.length > 0) return contact.emails
    if (contact.email) return [{ id: "legacy", email: contact.email, is_primary: true, label: null, created_at: "" }]
    return []
  }, [contact])
  
  const displayPhones = useMemo(() => {
    if (contact.phones?.length > 0) return contact.phones
    if (contact.phone) return [{ id: "legacy", phone: contact.phone, is_primary: true, label: null, created_at: "" }]
    return []
  }, [contact])
  const useThreeColumns = displayEmails.length >= 2 && displayPhones.length >= 2
  const locationLabel = useMemo(
    () => [contact.city, contact.country].filter(Boolean).join(", "),
    [contact.city, contact.country]
  )

  // ── Mode handlers ──────────────────────────────────────────────────────────

  const enterEditMode = useCallback(() => {
    setLinkedinUrl(contact.linkedin_url || "")
    setTwitterHandle(contact.twitter_handle || "")
    setInstagramHandle(contact.instagram_handle || "")
    setEmails(
      contact.emails?.length > 0
        ? contact.emails.map(e => ({ id: e.id, email: e.email, is_primary: e.is_primary, label: e.label || "" }))
        : contact.email ? [{ email: contact.email, is_primary: true, label: "" }] : []
    )
    setPhones(
      contact.phones?.length > 0
        ? contact.phones.map(p => ({ id: p.id, phone: p.phone, is_primary: p.is_primary, label: p.label || "" }))
        : contact.phone ? [{ phone: contact.phone, is_primary: true, label: "" }] : []
    )
    setErrors({})
    setIsEditing(true)
  }, [contact])

  const handleCancel = useCallback(() => {
    setErrors({})
    setIsEditing(false)
  }, [])

  // ── Email handlers ────────────────────────────────────────────────────────

  const setPrimaryEmail = useCallback((index: number) =>
    setEmails(prev => prev.map((e, i) => ({ ...e, is_primary: i === index }))), [])

  const addEmail = useCallback(() =>
    setEmails(prev => [...prev, { email: "", is_primary: prev.length === 0, label: "" }]), [])

  const removeEmail = useCallback((index: number) =>
    setEmails(prev => {
      const next = prev.filter((_, i) => i !== index)
      if (prev[index].is_primary && next.length > 0) next[0].is_primary = true
      return next
    }), [])

  const updateEmail = useCallback((index: number, field: keyof ContactEmail, value: string | boolean) =>
    setEmails(prev => prev.map((e, i) => i === index ? { ...e, [field]: value } : e)), [])

  // ── Phone handlers ────────────────────────────────────────────────────────

  const setPrimaryPhone = useCallback((index: number) =>
    setPhones(prev => prev.map((p, i) => ({ ...p, is_primary: i === index }))), [])

  const addPhone = useCallback(() =>
    setPhones(prev => [...prev, { phone: "", is_primary: prev.length === 0, label: "" }]), [])

  const removePhone = useCallback((index: number) =>
    setPhones(prev => {
      const next = prev.filter((_, i) => i !== index)
      if (prev[index].is_primary && next.length > 0) next[0].is_primary = true
      return next
    }), [])

  const updatePhone = useCallback((index: number, field: keyof ContactPhone, value: string | boolean) =>
    setPhones(prev => prev.map((p, i) => i === index ? { ...p, [field]: value } : p)), [])

  // ── Save ──────────────────────────────────────────────────────────────────

  const handleSave = useCallback(async () => {
    const payload = {
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
  }, [linkedinUrl, twitterHandle, instagramHandle, emails, phones, contact.id, onUpdate])

  // ─── View mode ────────────────────────────────────────────────────────────

  if (!isEditing) {
    return (
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-blue-600">
              <User className="h-3.5 w-3.5" />
            </div>
            <h3 className={cn("font-semibold text-gray-900", typo.body)}>Personal Information</h3>
          </div>
          <Button variant="ghost" size="sm" className={cn("h-7 gap-1.5 text-gray-500 hover:text-gray-900", typo.muted)} onClick={enterEditMode}>
            <Pencil className="h-3 w-3" /> Edit
          </Button>
        </div>

        <div className="grid grid-cols-3 gap-x-6">

          {/* ── Column 1: Location, Socials, Industry, Languages ──── */}
          <div className="space-y-2.5">
            {locationLabel && (
              <div className={cn("flex items-center gap-2.5 text-gray-700", typo.body)}>
                <MapPin className="h-4 w-4 shrink-0 text-gray-400" />
                <span className="font-medium">{locationLabel}</span>
              </div>
            )}
            <div className={cn("flex items-center gap-2.5", typo.body)}>
              <LinkedinIcon className="h-4 w-4 text-[#0A66C2] shrink-0" />
              {contact.linkedin_url ? (
                <a href={contact.linkedin_url} target="_blank" rel="noopener noreferrer"
                  className="text-blue-600 hover:underline flex items-center gap-1 truncate">
                  LinkedIn Profile <ExternalLink className="h-3 w-3 shrink-0" />
                </a>
              ) : (
                <span className={cn("italic text-gray-300", typo.muted)}>No LinkedIn profile</span>
              )}
            </div>
            <div className={cn("flex items-center gap-2.5", typo.body)}>
              <Instagram className="h-4 w-4 text-[#E4405F] shrink-0" />
              {contact.instagram_handle ? (
                <a href={`https://instagram.com/${contact.instagram_handle}`} target="_blank" rel="noopener noreferrer"
                  className="text-blue-600 hover:underline flex items-center gap-1">
                  @{contact.instagram_handle} <ExternalLink className="h-3 w-3 shrink-0" />
                </a>
              ) : (
                <span className={cn("italic text-gray-300", typo.muted)}>No Instagram profile</span>
              )}
            </div>
            <div className={cn("flex items-center gap-2.5", typo.body)}>
              <Twitter className="h-4 w-4 text-[#1DA1F2] shrink-0" />
              {contact.twitter_handle ? (
                <a href={`https://twitter.com/${contact.twitter_handle}`} target="_blank" rel="noopener noreferrer"
                  className="text-blue-600 hover:underline flex items-center gap-1">
                  @{contact.twitter_handle} <ExternalLink className="h-3 w-3 shrink-0" />
                </a>
              ) : (
                <span className={cn("italic text-gray-300", typo.muted)}>No X profile</span>
              )}
            </div>
            {companyIndustry && (
              <div className={cn("flex items-center gap-2.5 text-gray-700", typo.body)}>
                <Building className="h-4 w-4 shrink-0 text-gray-400" />
                <span>Works in <span className="font-medium">{companyIndustry}</span></span>
              </div>
            )}
            {contact.languages && contact.languages.length > 0 && (
              <div className={cn("flex items-start gap-2.5 text-gray-700", typo.body)}>
                <Languages className="h-4 w-4 shrink-0 mt-0.5 text-gray-400" />
                <div className="flex flex-wrap gap-1">
                  {contact.languages.map((lang, i) => (
                    <Badge key={i} variant="secondary" className="text-xs px-2 py-0.5">{lang}</Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Dense mode: added by + updated by move into col 1 */}
            {useThreeColumns && (
              <>
                {contact.created_by_name && (
                  <div className={cn("flex items-center gap-2.5 text-gray-500", typo.body)}>
                    <User className="h-4 w-4 shrink-0 text-gray-400" />
                    <span>Added by <span className="font-medium text-gray-700">{contact.created_by_name}</span></span>
                  </div>
                )}
                {contact.updated_at && (
                  <div className={cn("flex items-center gap-2.5 text-gray-500", typo.body)}>
                    <Clock className="h-4 w-4 shrink-0 text-gray-400" />
                    <span>
                      Updated{contact.updated_by_name ? <> by <span className="font-medium text-gray-700">{contact.updated_by_name}</span></> : ""} on{" "}
                      {format(parseISO(contact.updated_at), "PPP")}
                    </span>
                  </div>
                )}
              </>
            )}
          </div>

          {/* ── Column 2 ─────────────────────────────────────────────── */}
          <div className="space-y-2.5">
            {/* Emails always in col 2 */}
            {displayEmails.length > 0
              ? displayEmails.map(entry => (
                <div key={entry.id} className={cn("flex items-center gap-2", typo.body)}>
                  <Mail className={cn("h-4 w-4 shrink-0", entry.is_primary ? "text-blue-500" : "text-gray-400")} />
                  <span className={cn("truncate", entry.is_primary ? "text-gray-900 font-semibold" : "text-gray-600")}>
                    {entry.email}
                  </span>
                  {entry.is_primary && <Badge variant="secondary" className="text-[10px] px-1.5 py-0 shrink-0">Primary</Badge>}
                  {entry.label && <span className={cn("text-gray-400 capitalize shrink-0", typo.muted)}>{entry.label}</span>}
                </div>
              ))
              : (
                <div className={cn("flex items-center gap-2 italic text-gray-300", typo.muted)}>
                  <Mail className="h-4 w-4 shrink-0" />
                  <span>No email provided</span>
                </div>
              )}

            {/* Sparse mode: phones also go into col 2 */}
            {!useThreeColumns && (
              displayPhones.length > 0
                ? displayPhones.map(entry => (
                  <div key={entry.id} className={cn("flex items-center gap-2", typo.body)}>
                    <Phone className={cn("h-4 w-4 shrink-0", entry.is_primary ? "text-green-500" : "text-gray-400")} />
                    <span className={cn("truncate", entry.is_primary ? "text-gray-900 font-semibold" : "text-gray-600")}>
                      {entry.phone}
                    </span>
                    {entry.is_primary && <Badge variant="secondary" className="text-[10px] px-1.5 py-0 shrink-0">Primary</Badge>}
                    {entry.label && <span className={cn("text-gray-400 capitalize shrink-0", typo.muted)}>{entry.label}</span>}
                  </div>
                ))
                : (
                  <div className={cn("flex items-center gap-2 italic text-gray-300", typo.muted)}>
                    <Phone className="h-4 w-4 shrink-0" />
                    <span>No phone provided</span>
                  </div>
                )
            )}
          </div>

          {/* ── Column 3 ─────────────────────────────────────────────── */}
          <div className="space-y-2.5">
            {useThreeColumns ? (
              /* Dense mode: col 3 = phones */
              displayPhones.map(entry => (
                <div key={entry.id} className={cn("flex items-center gap-2", typo.body)}>
                  <Phone className={cn("h-4 w-4 shrink-0", entry.is_primary ? "text-green-500" : "text-gray-400")} />
                  <span className={cn("truncate", entry.is_primary ? "text-gray-900 font-semibold" : "text-gray-600")}>
                    {entry.phone}
                  </span>
                  {entry.is_primary && <Badge variant="secondary" className="text-[10px] px-1.5 py-0 shrink-0">Primary</Badge>}
                  {entry.label && <span className={cn("text-gray-400 capitalize shrink-0", typo.muted)}>{entry.label}</span>}
                </div>
              ))
            ) : (
              /* Sparse mode: col 3 = added by + updated by */
              <>
                {contact.created_by_name && (
                  <div className={cn("flex items-center gap-2.5 text-gray-500", typo.body)}>
                    <User className="h-4 w-4 shrink-0 text-gray-400" />
                    <span>Added by <span className="font-medium text-gray-700">{contact.created_by_name}</span></span>
                  </div>
                )}
                {contact.updated_at && (
                  <div className={cn("flex items-center gap-2.5 text-gray-500", typo.body)}>
                    <Clock className="h-4 w-4 shrink-0 text-gray-400" />
                    <span>
                      Updated{contact.updated_by_name ? <> by <span className="font-medium text-gray-700">{contact.updated_by_name}</span></> : ""} on{" "}
                      {format(parseISO(contact.updated_at), "PPP")}
                    </span>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    )
  }

  // ─── Edit mode ────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-blue-600">
          <User className="h-3.5 w-3.5" />
        </div>
        <h3 className={cn("font-semibold text-gray-900", typo.body)}>Personal Information</h3>
      </div>

      {/* Emails */}
      <div className="space-y-2">
        <Label className={cn("text-gray-500 flex items-center gap-1.5", typo.muted)}>
          <Mail className="h-3 w-3" /> Email Addresses
        </Label>
        <div className="space-y-2">
          {emails.map((entry, index) => (
            <div key={index} className="flex items-center gap-2">
              <Input
                value={entry.email || ""}
                onChange={e => updateEmail(index, "email", e.target.value)}
                placeholder="email@example.com"
                className={cn("h-8 flex-1", typo.body, errors[`emails.${index}.email`] ? "border-red-400" : "")}
              />
              <Input
                value={entry.label || ""}
                onChange={e => updateEmail(index, "label", e.target.value)}
                placeholder="work, personal..."
                maxLength={20}
                className={cn("h-8 w-32", typo.body)}
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
          {errors.emails && <p className={cn("text-red-500", typo.muted)}>{errors.emails}</p>}
          <Button type="button" variant="ghost" size="sm" className={cn("h-7 gap-1.5 text-gray-500", typo.muted)} onClick={addEmail}>
            <Plus className="h-3 w-3" /> Add email
          </Button>
        </div>
      </div>

      {/* Phones */}
      <div className="space-y-2">
        <Label className={cn("text-gray-500 flex items-center gap-1.5", typo.muted)}>
          <Phone className="h-3 w-3" /> Phone Numbers
        </Label>
        <div className="space-y-2">
          {phones.map((entry, index) => (
            <div key={index} className="flex items-center gap-2">
              <Input
                value={entry.phone || ""}
                onChange={e => {
                  const sanitized = e.target.value.replace(/[^\d+]/g, "").replace(/(?!^)\+/g, "").slice(0, 15)
                  updatePhone(index, "phone", sanitized)
                }}
                maxLength={15}
                placeholder="+1234567890"
                className={cn("h-8 flex-1", typo.body, errors[`phones.${index}.phone`] ? "border-red-400" : "")}
              />
              <Input
                value={entry.label || ""}
                onChange={e => updatePhone(index, "label", e.target.value)}
                placeholder="mobile, office..."
                maxLength={20}
                className={cn("h-8 w-32", typo.body)}
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
          {errors.phones && <p className={cn("text-red-500", typo.muted)}>{errors.phones}</p>}
          <Button type="button" variant="ghost" size="sm" className={cn("h-7 gap-1.5 text-gray-500", typo.muted)} onClick={addPhone}>
            <Plus className="h-3 w-3" /> Add phone
          </Button>
        </div>
      </div>

      {/* Social handles */}
      <div className="grid grid-cols-2 gap-x-6 gap-y-4">
        <div className="space-y-1.5">
          <Label className={cn("text-gray-500 flex items-center gap-1.5", typo.muted)}>
            <Instagram className="h-3 w-3 text-[#E4405F]" /> Instagram Handle
          </Label>
          <Input value={instagramHandle} onChange={e => setInstagramHandle(e.target.value)}
            placeholder="handle (without @)" className={cn("h-8", typo.body)} />
        </div>

        <div className="space-y-1.5">
          <Label className={cn("text-gray-500 flex items-center gap-1.5", typo.muted)}>
            <LinkedinIcon className="h-3 w-3 text-[#0A66C2]" /> LinkedIn URL
          </Label>
          <Input value={linkedinUrl} onChange={e => setLinkedinUrl(e.target.value)}
            placeholder="https://linkedin.com/in/..." className={cn("h-8", typo.body)} />
          {errors.linkedin_url && <p className={cn("text-red-500", typo.muted)}>{errors.linkedin_url}</p>}
        </div>

        <div className="space-y-1.5">
          <Label className={cn("text-gray-500 flex items-center gap-1.5", typo.muted)}>
            <Twitter className="h-3 w-3 text-[#1DA1F2]" /> X Handle
          </Label>
          <Input value={twitterHandle} onChange={e => setTwitterHandle(e.target.value)}
            placeholder="handle (without @)" className={cn("h-8", typo.body)} />
        </div>
      </div>

      {/* City/Country — read-only reminder */}
      {locationLabel && (
        <div className={cn("flex items-center gap-2 text-gray-400", typo.muted)}>
          <MapPin className="h-3.5 w-3.5 shrink-0" />
          <span>{locationLabel} · location is not editable here</span>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 pt-1">
        <Button size="sm" className={cn("h-8 gap-1.5", typo.body)} onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
          {saving ? "Saving..." : "Save Changes"}
        </Button>
        <Button size="sm" variant="ghost" className={cn("h-8 gap-1.5 text-gray-500", typo.body)} onClick={handleCancel} disabled={saving}>
          <X className="h-3.5 w-3.5" /> Cancel
        </Button>
      </div>
    </div>
  )
})
