"use client"

import * as React from "react"
import { useState, useEffect, useMemo } from "react"
import { useDropzone } from "react-dropzone"
import { FileUp, Upload, X, AlertCircle, Download, Loader2, Check, Plus, Info } from "lucide-react"
import { toast } from "sonner"
import axios from "axios"
import { COLOR_PALETTE } from "@/lib/constants/tags"

import { Button } from "@/components/ui/button"
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"

interface ImportContactsDrawerProps {
  onSubmit?: (file: File) => void
  children?: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

const customDrawerStyles = {
  width: '40vw',
  maxWidth: '45vw'
};

// CSV Template data
const CSV_HEADERS = [
  'full_name',
  'title',
  'email',
  'phone',
  'city',
  'country',
  'linkedin_url',
  'twitter_profile',
  'instagram_profile',
  'company_name',
  'company_url',
  'company_linkedin_url',
  'company_industry',
  'company_city',
  'company_state',
  'company_country'
];

const SAMPLE_ROWS = [
  {
    full_name: 'John Doe',
    title: 'CEO',
    email: 'john@example.com',
    phone: '+1234567890',
    city: 'San Francisco',
    country: 'USA',
    linkedin_url: 'https://linkedin.com/in/johndoe',
    twitter_profile: 'https://twitter.com/johndoe',
    instagram_profile: 'https://instagram.com/johndoe',
    company_name: 'Example Corp',
    company_url: 'https://example.com',
    company_linkedin_url: 'https://linkedin.com/company/examplecorp',
    company_industry: 'Technology',
    company_city: 'San Francisco',
    company_state: 'CA',
    company_country: 'USA'
  },
  {
    full_name: 'Jane Smith',
    title: 'CTO',
    email: 'jane@techco.com',
    phone: '+1987654321',
    city: 'New York',
    country: 'USA',
    linkedin_url: 'https://linkedin.com/in/janesmith',
    twitter_profile: '',
    instagram_profile: '',
    company_name: 'Tech Co',
    company_url: 'https://techco.com',
    company_linkedin_url: 'https://linkedin.com/company/techco',
    company_industry: 'SaaS',
    company_city: 'New York',
    company_state: 'NY',
    company_country: 'USA'
  }
];

interface SystemTag {
  name: string
  color: string
}

export function ImportContactsDrawer({ onSubmit, children, open: controlledOpen, onOpenChange }: ImportContactsDrawerProps) {
  const [internalOpen, setInternalOpen] = React.useState(false)
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen
  const setOpen = onOpenChange || setInternalOpen

  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [copiedHeader, setCopiedHeader] = useState<string | null>(null)
  const [tags, setTags] = useState<Array<{ name: string; color: string }>>([])
  const [tagName, setTagName] = useState('')
  const [tagColor, setTagColor] = useState(COLOR_PALETTE[0].value)
  const [tagHexRaw, setTagHexRaw] = useState(COLOR_PALETTE[0].value.slice(1).toUpperCase())
  const [systemTags, setSystemTags] = useState<SystemTag[]>([])
  const [loadingTags, setLoadingTags] = useState(false)

  // Colors claimed by existing system tags + tags queued for this import
  const usedColors = useMemo(() => {
    const map = new Map<string, string>()
    systemTags.forEach(t => map.set(t.color.toUpperCase(), t.name))
    tags.forEach(t => map.set(t.color.toUpperCase(), t.name))
    return map
  }, [systemTags, tags])

  // Fetch existing system tags when drawer opens
  useEffect(() => {
    if (open) {
      setLoadingTags(true)
      axios.get('/api/tags', { params: { taggable_type: 'contact' } })
        .then(res => setSystemTags(res.data || []))
        .catch(() => setSystemTags([]))
        .finally(() => setLoadingTags(false))
    }
  }, [open])

  // Keep tagColor valid when colors get used
  useEffect(() => {
    if (usedColors.has(tagColor.toUpperCase())) {
      const available = COLOR_PALETTE.find(c => !usedColors.has(c.value.toUpperCase()))
      if (available) {
        setTagColor(available.value)
        setTagHexRaw(available.value.slice(1).toUpperCase())
      }
    }
  }, [usedColors, tagColor])

  const onDrop = React.useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (file && file.type === 'text/csv') {
      setSelectedFile(file)
    } else {
      toast.error('Please select a valid CSV file')
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv']
    },
    multiple: false
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedFile) return

    try {
      setIsUploading(true)

      // Create FormData for file upload
      const formData = new FormData()
      formData.append('csv', selectedFile)
      if (tags.length > 0) {
        formData.append('tags', JSON.stringify(tags))
      }

      // Call the bulk import API
      const response = await axios.post('/api/contacts/create/bulk', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })

      if (response.data.success) {
        // Show success message with summary
        const { total_processed, contacts_created, contacts_updated, companies_created, contacts_skipped, tags_applied } = response.data

        let message = `Successfully processed ${total_processed} rows`
        const details = []

        if (contacts_created > 0) details.push(`${contacts_created} contacts created`)
        if (contacts_updated > 0) details.push(`${contacts_updated} contacts updated`)
        if (companies_created > 0) details.push(`${companies_created} companies created`)
        if (tags_applied > 0) details.push(`${tags_applied} tags applied`)

        if (details.length > 0) {
          message += `: ${details.join(', ')}`
        }

        if (contacts_skipped > 0) {
          toast.warning(`${message}. ${contacts_skipped} rows were skipped due to validation errors.`)
        } else {
          toast.success(message)
        }
        onSubmit?.(selectedFile)
        setSelectedFile(null)
        setTags([])
        setTagName('')
        setTagColor(COLOR_PALETTE[0].value)
        setTagHexRaw(COLOR_PALETTE[0].value.slice(1).toUpperCase())
        setOpen(false)
      } else {
        toast.error(response.data.error || 'Import failed')
      }
    } catch (error) {
      console.error("Error uploading file:", error)

      if (axios.isAxiosError(error) && error.response) {
        const status = error.response.status

        if (status === 429) {
          toast.error("Rate limit exceeded. Please wait before importing more data.")
        } else if (status === 401) {
          toast.error("Unauthorized. Please log in again.")
        } else if (status >= 500) {
          toast.error("Server error. Please try again later.")
        } else {
          console.log(error.response)
          toast.error(`Import failed! ${error.response.data.error}`)
        }
      } else {
        toast.error("Network error. Please try again.")
      }
    } finally {
      setIsUploading(false)
    }
  }

  const handleCancel = () => {
    setSelectedFile(null)
    setTags([])
    setTagName('')
    setTagColor(COLOR_PALETTE[0].value)
    setTagHexRaw(COLOR_PALETTE[0].value.slice(1).toUpperCase())
    setOpen(false)
  }

  const downloadTemplate = () => {
    const csvContent = [
      CSV_HEADERS.join(','),
      ...SAMPLE_ROWS.map(row =>
        CSV_HEADERS.map(header => {
          const value = row[header as keyof typeof row] || ''
          // Escape values that contain commas
          return value.includes(',') ? `"${value}"` : value
        }).join(',')
      )
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'contacts_import_template.csv'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
    toast.success('Template downloaded!')
  }

  const copyHeader = (header: string) => {
    navigator.clipboard.writeText(header)
    setCopiedHeader(header)
    toast.success(`"${header}" copied to clipboard!`)
    setTimeout(() => setCopiedHeader(null), 2000)
  }

  const addTag = () => {
    const trimmedName = tagName.trim().toLowerCase()
    if (!trimmedName) return

    // Check if this tag already exists in system tags
    const existingSystemTag = systemTags.find(t => t.name === trimmedName)
    if (existingSystemTag) {
      // If it exists in the system, use its color and add it to the queue
      if (tags.some(t => t.name === trimmedName)) {
        toast.error('Tag already added to import')
        return
      }
      setTags([...tags, { name: trimmedName, color: existingSystemTag.color }])
      setTagName('')
      return
    }

    // Prevent duplicate tag names in the import queue
    if (tags.some(t => t.name === trimmedName)) {
      toast.error('Tag with this name already added')
      return
    }
    // Prevent duplicate tag colors
    if (usedColors.has(tagColor.toUpperCase())) {
      toast.error('This color is already in use. Please choose a different color.')
      return
    }
    setTags([...tags, { name: trimmedName, color: tagColor }])
    setSystemTags([...systemTags, { name: trimmedName, color: tagColor }])
    setTagName('')
  }

  const removeTag = (index: number) => {
    setTags(tags.filter((_, i) => i !== index))
  }

  const toggleExistingTag = (tag: SystemTag) => {
    const isSelected = tags.some(t => t.name === tag.name)
    if (isSelected) {
      setTags(tags.filter(t => t.name !== tag.name))
    } else {
      setTags([...tags, { name: tag.name, color: tag.color }])
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
            <DrawerTitle>Import Contacts from CSV</DrawerTitle>
            <p className="text-sm text-muted-foreground">
              Upload a CSV file to import multiple contacts at once.
            </p>
          </DrawerHeader>

          <div className="flex-1 overflow-y-auto">
            <div className="px-6 py-4 space-y-6">

              {/* File Upload Section */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-foreground">Upload CSV File</h3>

                <div className="space-y-4">
                  <div
                    {...getRootProps()}
                    className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${isDragActive
                        ? 'border-blue-400 bg-blue-50'
                        : 'border-gray-300 hover:border-gray-400'
                      }`}
                  >
                    <input {...getInputProps()} />
                    <FileUp className={`mx-auto h-12 w-12 ${isDragActive ? 'text-blue-500' : 'text-gray-400'
                      }`} />
                    <div className="mt-4">
                      <span className="text-sm font-medium text-blue-600 hover:text-blue-500">
                        {isDragActive ? 'Drop the CSV file here' : 'Click to upload'}
                      </span>
                      <span className="text-sm text-gray-500"> or drag and drop</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">CSV files only</p>
                  </div>

                  {selectedFile && (
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <FileUp className="h-4 w-4 text-green-600" />
                        <div>
                          <p className="text-sm font-medium">{selectedFile.name}</p>
                          <p className="text-xs text-gray-500">
                            {(selectedFile.size / 1024).toFixed(1)} KB
                          </p>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedFile(null)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Tag Selection Section */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-900">Tag Imported Contacts</h3>
                <p className="text-xs text-muted-foreground">
                  Tags will be applied to all successfully imported contacts.
                </p>

                {/* New Tag Creation */}
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-gray-900">New Tag</h4>
                  <Input
                    placeholder="Type a tag name..."
                    value={tagName}
                    onChange={(e) => setTagName(e.target.value.toLowerCase())}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        addTag()
                      }
                    }}
                  />

                  {/* Color picker — only visible while typing */}
                  <div
                    className={`overflow-hidden transition-all duration-300 ease-in-out ${
                      tagName.length > 0 ? 'max-h-64 opacity-100' : 'max-h-0 opacity-0'
                    }`}
                  >
                    <div className="space-y-2 pt-1">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs">Color</Label>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Info className="h-3 w-3" />
                          <span>One color per tag</span>
                        </div>
                      </div>
                      <div className="grid grid-cols-6 gap-2 p-1">
                        {COLOR_PALETTE.map((color) => {
                          const isColorUsed = usedColors.has(color.value.toUpperCase())
                          const usedByTagName = usedColors.get(color.value.toUpperCase())
                          return (
                            <button
                              key={color.value}
                              type="button"
                              onClick={() => {
                                if (!isColorUsed) {
                                  setTagColor(color.value)
                                  setTagHexRaw(color.value.slice(1).toUpperCase())
                                }
                              }}
                              disabled={isColorUsed}
                              className={`relative h-9 rounded-lg border-2 transition-all duration-200 ${
                                tagColor.toUpperCase() === color.value.toUpperCase()
                                  ? 'border-gray-900 shadow-md scale-105'
                                  : isColorUsed
                                  ? 'border-gray-300 opacity-40 cursor-not-allowed'
                                  : 'border-gray-200 hover:border-gray-400 hover:shadow-sm'
                              }`}
                              style={{
                                backgroundColor: color.value,
                                boxShadow: tagColor.toUpperCase() === color.value.toUpperCase() ? `0 4px 12px ${color.value}40` : undefined
                              }}
                              title={isColorUsed ? `Already used by tag: ${usedByTagName}` : color.name}
                            >
                              {tagColor.toUpperCase() === color.value.toUpperCase() && (
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <Check className="h-4 w-4 text-white drop-shadow-md" strokeWidth={3} />
                                </div>
                              )}
                            </button>
                          )
                        })}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <div className={`flex items-center gap-1.5 border rounded-md px-2 py-1 flex-1 bg-white transition-colors ${
                          tagHexRaw.length === 6 && usedColors.has('#' + tagHexRaw)
                            ? 'border-red-400'
                            : 'border-gray-200 focus-within:border-gray-400'
                        }`}>
                          <div className="w-3.5 h-3.5 rounded-sm border border-gray-200 shrink-0" style={{ backgroundColor: tagColor }} />
                          <span className="text-xs text-muted-foreground font-mono">#</span>
                          <input
                            className="flex-1 text-xs font-mono bg-transparent outline-none uppercase w-0 min-w-0"
                            placeholder="Custom hex"
                            maxLength={6}
                            value={tagHexRaw}
                            onChange={(e) => {
                              const raw = e.target.value.replace(/[^0-9a-fA-F]/g, '').toUpperCase().slice(0, 6)
                              setTagHexRaw(raw)
                              if (raw.length === 6 && !usedColors.has('#' + raw)) {
                                setTagColor('#' + raw)
                              }
                            }}
                          />
                          {tagHexRaw.length === 6 && usedColors.has('#' + tagHexRaw) && (
                            <span className="text-xs text-red-500 shrink-0">In use</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {tagName.length > 0 && (
                    <Button
                      type="button"
                      onClick={addTag}
                      className="w-full"
                      size="sm"
                    >
                      <Plus className="h-4 w-4 mr-2" />Create & Apply
                    </Button>
                  )}
                </div>

                <Separator />

                {/* Existing Tags */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-gray-900">
                      All Tags
                      {systemTags.length > 0 && (
                        <span className="text-gray-500 font-normal ml-2">({systemTags.length})</span>
                      )}
                    </h4>
                    <span className="text-xs text-gray-400">Click circle to apply/remove</span>
                  </div>

                  {loadingTags ? (
                    <div className="flex items-center justify-center py-6">
                      <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                    </div>
                  ) : systemTags.length === 0 ? (
                    <div className="text-sm text-gray-500 py-4 text-center">
                      No existing tags. Create one above!
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {systemTags.map((tag) => {
                        const isSelected = tags.some(t => t.name === tag.name)
                        return (
                          <div key={tag.name} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                            <div className="flex items-center gap-3">
                              <button
                                type="button"
                                onClick={() => toggleExistingTag(tag)}
                                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                                  isSelected
                                    ? 'border-green-500 bg-green-500'
                                    : 'border-gray-300 bg-white hover:border-gray-500'
                                } cursor-pointer`}
                              >
                                {isSelected && (
                                  <Check className="h-3 w-3 text-white" strokeWidth={3} />
                                )}
                              </button>
                              <Badge
                                style={{
                                  backgroundColor: tag.color + '20',
                                  color: tag.color,
                                  borderColor: tag.color + '40'
                                }}
                                className="border"
                              >
                                {tag.name}
                              </Badge>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>

                {/* Selected tags summary */}
                {tags.length > 0 && (
                  <div className="space-y-2">
                    <Separator />
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-semibold text-gray-500 uppercase">Tags to apply ({tags.length})</h4>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {tags.map((tag, index) => (
                        <Badge
                          key={index}
                          style={{
                            backgroundColor: tag.color + '20',
                            color: tag.color,
                            borderColor: tag.color + '40'
                          }}
                          className="border pl-2 pr-1 py-1 text-sm flex items-center gap-1.5"
                        >
                          {tag.name}
                          <button
                            type="button"
                            onClick={() => removeTag(index)}
                            className="ml-1 hover:bg-gray-300 rounded-full p-0.5 transition-colors"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Important Alert - CSV Format */}
              <Alert className="border-amber-200 bg-amber-50">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <AlertTitle className="text-amber-900 font-semibold">Helpful CSV Tips</AlertTitle>
                <AlertDescription className="text-amber-800">
                  <p className="mb-3">
                    Click any header below to copy it to your clipboard. We automatically normalize case and common variations
                    (e.g. <span className="font-semibold">Full Name</span>, <span className="font-semibold">Name</span>, or separate <span className="font-semibold">First Name</span> / <span className="font-semibold">Last Name</span> columns),
                    so feel free to use natural casing in your CSV.
                  </p>

                  {/* Download Template Button */}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={downloadTemplate}
                    className="w-full border-amber-300 text-amber-900 hover:bg-amber-100"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download CSV Template with Examples
                  </Button>
                </AlertDescription>
              </Alert>

              {/* Field Requirements */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-foreground">CSV Column Headers</h3>

                <div className="space-y-3">
                  {/* Required Fields */}
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Badge variant="destructive" className="text-xs">Required</Badge>
                      <span className="text-sm font-medium text-red-900">Must include these headers:</span>
                    </div>
                    <div className="space-y-1.5">
                      <code
                        onClick={() => copyHeader('full_name')}
                        className={`block text-xs px-2 py-1.5 rounded border cursor-pointer transition-colors ${copiedHeader === 'full_name'
                            ? 'bg-green-100 border-green-300 text-green-900'
                            : 'bg-white border-red-300 text-red-900 hover:bg-red-100'
                          }`}
                      >
                        full_name
                      </code>
                      <p className="text-xs text-red-700 ml-2">
                        We also accept <span className="font-semibold">Full Name</span>, <span className="font-semibold">Name</span>, or separate <span className="font-semibold">First Name</span> and <span className="font-semibold">Last Name</span> columns.
                      </p>
                      <div className="text-xs text-red-800 ml-2 mb-2">At least ONE social media profile:</div>
                      <code
                        onClick={() => copyHeader('linkedin_url')}
                        className={`block text-xs px-2 py-1.5 rounded border cursor-pointer transition-colors ${copiedHeader === 'linkedin_url'
                            ? 'bg-green-100 border-green-300 text-green-900'
                            : 'bg-white border-red-300 text-red-900 hover:bg-red-100'
                          }`}
                      >
                        linkedin_url
                      </code>
                      <p className="text-xs text-red-700 ml-2">
                        Includes variations such as <span className="font-semibold">LinkedIn URL</span>, <span className="font-semibold">LinkedIn Profile</span>, or <span className="font-semibold">Person Linkedin Url</span>.
                      </p>
                      <code
                        onClick={() => copyHeader('twitter_profile')}
                        className={`block text-xs px-2 py-1.5 rounded border cursor-pointer transition-colors ${copiedHeader === 'twitter_profile'
                            ? 'bg-green-100 border-green-300 text-green-900'
                            : 'bg-white border-red-300 text-red-900 hover:bg-red-100'
                          }`}
                      >
                        twitter_profile
                      </code>
                      <p className="text-xs text-red-700 ml-2">
                        Handles variations like <span className="font-semibold">Twitter URL</span>, <span className="font-semibold">Twitter Handle</span>
                      </p>
                      <code
                        onClick={() => copyHeader('instagram_profile')}
                        className={`block text-xs px-2 py-1.5 rounded border cursor-pointer transition-colors ${copiedHeader === 'instagram_profile'
                            ? 'bg-green-100 border-green-300 text-green-900'
                            : 'bg-white border-red-300 text-red-900 hover:bg-red-100'
                          }`}
                      >
                        instagram_profile
                      </code>
                      <p className="text-xs text-red-700 ml-2">
                        Also matches <span className="font-semibold">Instagram</span> or <span className="font-semibold">Instagram URL</span>.
                      </p>
                    </div>
                  </div>

                  {/* Optional Fields */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-900 border-blue-300">Optional</Badge>
                      <span className="text-sm font-medium text-blue-900">Additional headers:</span>
                    </div>
                    <div className="space-y-1.5">
                      <code
                        onClick={() => copyHeader('title')}
                        className={`block text-xs px-2 py-1.5 rounded border cursor-pointer transition-colors ${copiedHeader === 'title'
                            ? 'bg-green-100 border-green-300 text-green-900'
                            : 'bg-white border-blue-300 text-blue-900 hover:bg-blue-100'
                          }`}
                      >
                        title
                      </code>
                      <code
                        onClick={() => copyHeader('email')}
                        className={`block text-xs px-2 py-1.5 rounded border cursor-pointer transition-colors ${copiedHeader === 'email'
                            ? 'bg-green-100 border-green-300 text-green-900'
                            : 'bg-white border-blue-300 text-blue-900 hover:bg-blue-100'
                          }`}
                      >
                        email
                      </code>
                      <code
                        onClick={() => copyHeader('phone')}
                        className={`block text-xs px-2 py-1.5 rounded border cursor-pointer transition-colors ${copiedHeader === 'phone'
                            ? 'bg-green-100 border-green-300 text-green-900'
                            : 'bg-white border-blue-300 text-blue-900 hover:bg-blue-100'
                          }`}
                      >
                        phone
                      </code>
                      <code
                        onClick={() => copyHeader('city')}
                        className={`block text-xs px-2 py-1.5 rounded border cursor-pointer transition-colors ${copiedHeader === 'city'
                            ? 'bg-green-100 border-green-300 text-green-900'
                            : 'bg-white border-blue-300 text-blue-900 hover:bg-blue-100'
                          }`}
                      >
                        city
                      </code>
                      <code
                        onClick={() => copyHeader('country')}
                        className={`block text-xs px-2 py-1.5 rounded border cursor-pointer transition-colors ${copiedHeader === 'country'
                            ? 'bg-green-100 border-green-300 text-green-900'
                            : 'bg-white border-blue-300 text-blue-900 hover:bg-blue-100'
                          }`}
                      >
                        country
                      </code>
                    </div>
                  </div>

                  {/* Company Info - Required Together */}
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-900 border-amber-300">Optional</Badge>
                      <span className="text-sm font-medium text-amber-900">Company info (if provided, both fields required):</span>
                    </div>
                    <div className="space-y-1.5">
                      <code
                        onClick={() => copyHeader('company_name')}
                        className={`block text-xs px-2 py-1.5 rounded border cursor-pointer transition-colors ${copiedHeader === 'company_name'
                            ? 'bg-green-100 border-green-300 text-green-900'
                            : 'bg-white border-amber-300 text-amber-900 hover:bg-amber-100'
                          }`}
                      >
                        company_name
                      </code>
                      <p className="text-xs text-amber-700 ml-2">
                        Variations such as <span className="font-semibold">Company</span>, <span className="font-semibold">Organization</span>, or <span className="font-semibold">Business Name</span> are accepted.
                      </p>
                      <code
                        onClick={() => copyHeader('company_url')}
                        className={`block text-xs px-2 py-1.5 rounded border cursor-pointer transition-colors ${copiedHeader === 'company_url'
                            ? 'bg-green-100 border-green-300 text-green-900'
                            : 'bg-white border-amber-300 text-amber-900 hover:bg-amber-100'
                          }`}
                      >
                        company_url
                      </code>
                      <p className="text-xs text-amber-700 ml-2">
                        We&apos;ll match <span className="font-semibold">Website</span>, <span className="font-semibold">Company Website</span>, and similar labels automatically.
                      </p>
                    </div>
                  </div>

                  {/* Additional Company Fields - Optional */}
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-900 border-purple-300">Optional</Badge>
                      <span className="text-sm font-medium text-purple-900">Additional company info:</span>
                    </div>
                    <div className="space-y-1.5">
                      <code
                        onClick={() => copyHeader('company_linkedin_url')}
                        className={`block text-xs px-2 py-1.5 rounded border cursor-pointer transition-colors ${copiedHeader === 'company_linkedin_url'
                            ? 'bg-green-100 border-green-300 text-green-900'
                            : 'bg-white border-purple-300 text-purple-900 hover:bg-purple-100'
                          }`}
                      >
                        company_linkedin_url
                      </code>
                      <code
                        onClick={() => copyHeader('company_industry')}
                        className={`block text-xs px-2 py-1.5 rounded border cursor-pointer transition-colors ${copiedHeader === 'company_industry'
                            ? 'bg-green-100 border-green-300 text-green-900'
                            : 'bg-white border-purple-300 text-purple-900 hover:bg-purple-100'
                          }`}
                      >
                        company_industry
                      </code>
                      <p className="text-xs text-purple-700 ml-2">
                        You can use labels like <span className="font-semibold">Industry</span>—we&apos;ll map them for you.
                      </p>
                      <code
                        onClick={() => copyHeader('company_city')}
                        className={`block text-xs px-2 py-1.5 rounded border cursor-pointer transition-colors ${copiedHeader === 'company_city'
                            ? 'bg-green-100 border-green-300 text-green-900'
                            : 'bg-white border-purple-300 text-purple-900 hover:bg-purple-100'
                          }`}
                      >
                        company_city
                      </code>
                      <code
                        onClick={() => copyHeader('company_state')}
                        className={`block text-xs px-2 py-1.5 rounded border cursor-pointer transition-colors ${copiedHeader === 'company_state'
                            ? 'bg-green-100 border-green-300 text-green-900'
                            : 'bg-white border-purple-300 text-purple-900 hover:bg-purple-100'
                          }`}
                      >
                        company_state
                      </code>
                      <code
                        onClick={() => copyHeader('company_country')}
                        className={`block text-xs px-2 py-1.5 rounded border cursor-pointer transition-colors ${copiedHeader === 'company_country'
                            ? 'bg-green-100 border-green-300 text-green-900'
                            : 'bg-white border-purple-300 text-purple-900 hover:bg-purple-100'
                          }`}
                      >
                        company_country
                      </code>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="px-6 py-4 border-t bg-white">
              <div className="flex gap-3 justify-end">
                <Button type="button" variant="outline" onClick={handleCancel}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={!selectedFile || isUploading}
                  className="gap-2 whitespace-nowrap"
                >
                  {isUploading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}
                  Import Contacts
                </Button>
              </div>
            </div>
          </form>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
