"use client"

import * as React from "react"
import { useState } from "react"
import { useDropzone } from "react-dropzone"
import { FileUp, Upload, X, AlertCircle, Download } from "lucide-react"
import { toast } from "sonner"
import axios from "axios"

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
  'state',
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
    state: 'CA',
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
    state: 'NY',
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

export function ImportContactsDrawer({ onSubmit, children, open: controlledOpen, onOpenChange }: ImportContactsDrawerProps) {
  const [internalOpen, setInternalOpen] = React.useState(false)
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen
  const setOpen = onOpenChange || setInternalOpen

  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [copiedHeader, setCopiedHeader] = useState<string | null>(null)

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

      // Call the bulk import API
      const response = await axios.post('/api/contacts/create/bulk', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })

      if (response.data.success) {
        // Show success message with summary
        const { total_processed, contacts_created, contacts_updated, companies_created, contacts_skipped } = response.data
        
        let message = `Successfully processed ${total_processed} rows`
        const details = []
        
        if (contacts_created > 0) details.push(`${contacts_created} contacts created`)
        if (contacts_updated > 0) details.push(`${contacts_updated} contacts updated`)
        if (companies_created > 0) details.push(`${companies_created} companies created`)
        
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
                    className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                      isDragActive 
                        ? 'border-blue-400 bg-blue-50' 
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <input {...getInputProps()} />
                    <FileUp className={`mx-auto h-12 w-12 ${
                      isDragActive ? 'text-blue-500' : 'text-gray-400'
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

              {/* Important Alert - CSV Format */}
              <Alert className="border-amber-200 bg-amber-50">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <AlertTitle className="text-amber-900 font-semibold">Important: CSV Format Requirements</AlertTitle>
                <AlertDescription className="text-amber-800">
                  <p className="mb-3">Click on any header below to copy it to your clipboard. Headers are case-sensitive and must match exactly.</p>

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
                        className={`block text-xs px-2 py-1.5 rounded border cursor-pointer transition-colors ${
                          copiedHeader === 'full_name'
                            ? 'bg-green-100 border-green-300 text-green-900'
                            : 'bg-white border-red-300 text-red-900 hover:bg-red-100'
                        }`}
                      >
                        full_name
                      </code>
                      <div className="text-xs text-red-800 ml-2 mb-2">At least ONE social media profile:</div>
                      <code
                        onClick={() => copyHeader('linkedin_url')}
                        className={`block text-xs px-2 py-1.5 rounded border cursor-pointer transition-colors ${
                          copiedHeader === 'linkedin_url'
                            ? 'bg-green-100 border-green-300 text-green-900'
                            : 'bg-white border-red-300 text-red-900 hover:bg-red-100'
                        }`}
                      >
                        linkedin_url
                      </code>
                      <code
                        onClick={() => copyHeader('twitter_profile')}
                        className={`block text-xs px-2 py-1.5 rounded border cursor-pointer transition-colors ${
                          copiedHeader === 'twitter_profile'
                            ? 'bg-green-100 border-green-300 text-green-900'
                            : 'bg-white border-red-300 text-red-900 hover:bg-red-100'
                        }`}
                      >
                        twitter_profile
                      </code>
                      <code
                        onClick={() => copyHeader('instagram_profile')}
                        className={`block text-xs px-2 py-1.5 rounded border cursor-pointer transition-colors ${
                          copiedHeader === 'instagram_profile'
                            ? 'bg-green-100 border-green-300 text-green-900'
                            : 'bg-white border-red-300 text-red-900 hover:bg-red-100'
                        }`}
                      >
                        instagram_profile
                      </code>
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
                        className={`block text-xs px-2 py-1.5 rounded border cursor-pointer transition-colors ${
                          copiedHeader === 'title'
                            ? 'bg-green-100 border-green-300 text-green-900'
                            : 'bg-white border-blue-300 text-blue-900 hover:bg-blue-100'
                        }`}
                      >
                        title
                      </code>
                      <code
                        onClick={() => copyHeader('email')}
                        className={`block text-xs px-2 py-1.5 rounded border cursor-pointer transition-colors ${
                          copiedHeader === 'email'
                            ? 'bg-green-100 border-green-300 text-green-900'
                            : 'bg-white border-blue-300 text-blue-900 hover:bg-blue-100'
                        }`}
                      >
                        email
                      </code>
                      <code
                        onClick={() => copyHeader('phone')}
                        className={`block text-xs px-2 py-1.5 rounded border cursor-pointer transition-colors ${
                          copiedHeader === 'phone'
                            ? 'bg-green-100 border-green-300 text-green-900'
                            : 'bg-white border-blue-300 text-blue-900 hover:bg-blue-100'
                        }`}
                      >
                        phone
                      </code>
                      <code
                        onClick={() => copyHeader('city')}
                        className={`block text-xs px-2 py-1.5 rounded border cursor-pointer transition-colors ${
                          copiedHeader === 'city'
                            ? 'bg-green-100 border-green-300 text-green-900'
                            : 'bg-white border-blue-300 text-blue-900 hover:bg-blue-100'
                        }`}
                      >
                        city
                      </code>
                      <code
                        onClick={() => copyHeader('state')}
                        className={`block text-xs px-2 py-1.5 rounded border cursor-pointer transition-colors ${
                          copiedHeader === 'state'
                            ? 'bg-green-100 border-green-300 text-green-900'
                            : 'bg-white border-blue-300 text-blue-900 hover:bg-blue-100'
                        }`}
                      >
                        state
                      </code>
                      <code
                        onClick={() => copyHeader('country')}
                        className={`block text-xs px-2 py-1.5 rounded border cursor-pointer transition-colors ${
                          copiedHeader === 'country'
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
                        className={`block text-xs px-2 py-1.5 rounded border cursor-pointer transition-colors ${
                          copiedHeader === 'company_name'
                            ? 'bg-green-100 border-green-300 text-green-900'
                            : 'bg-white border-amber-300 text-amber-900 hover:bg-amber-100'
                        }`}
                      >
                        company_name
                      </code>
                      <code
                        onClick={() => copyHeader('company_url')}
                        className={`block text-xs px-2 py-1.5 rounded border cursor-pointer transition-colors ${
                          copiedHeader === 'company_url'
                            ? 'bg-green-100 border-green-300 text-green-900'
                            : 'bg-white border-amber-300 text-amber-900 hover:bg-amber-100'
                        }`}
                      >
                        company_url
                      </code>
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
                        className={`block text-xs px-2 py-1.5 rounded border cursor-pointer transition-colors ${
                          copiedHeader === 'company_linkedin_url'
                            ? 'bg-green-100 border-green-300 text-green-900'
                            : 'bg-white border-purple-300 text-purple-900 hover:bg-purple-100'
                        }`}
                      >
                        company_linkedin_url
                      </code>
                      <code
                        onClick={() => copyHeader('company_industry')}
                        className={`block text-xs px-2 py-1.5 rounded border cursor-pointer transition-colors ${
                          copiedHeader === 'company_industry'
                            ? 'bg-green-100 border-green-300 text-green-900'
                            : 'bg-white border-purple-300 text-purple-900 hover:bg-purple-100'
                        }`}
                      >
                        company_industry
                      </code>
                      <code
                        onClick={() => copyHeader('company_city')}
                        className={`block text-xs px-2 py-1.5 rounded border cursor-pointer transition-colors ${
                          copiedHeader === 'company_city'
                            ? 'bg-green-100 border-green-300 text-green-900'
                            : 'bg-white border-purple-300 text-purple-900 hover:bg-purple-100'
                        }`}
                      >
                        company_city
                      </code>
                      <code
                        onClick={() => copyHeader('company_state')}
                        className={`block text-xs px-2 py-1.5 rounded border cursor-pointer transition-colors ${
                          copiedHeader === 'company_state'
                            ? 'bg-green-100 border-green-300 text-green-900'
                            : 'bg-white border-purple-300 text-purple-900 hover:bg-purple-100'
                        }`}
                      >
                        company_state
                      </code>
                      <code
                        onClick={() => copyHeader('company_country')}
                        className={`block text-xs px-2 py-1.5 rounded border cursor-pointer transition-colors ${
                          copiedHeader === 'company_country'
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
                  className="gap-2"
                >
                  <Upload className="h-4 w-4" />
                  {isUploading ? "Uploading..." : "Import Contacts"}
                </Button>
              </div>
            </div>
          </form>
        </div>
      </DrawerContent>
    </Drawer>
  )
}