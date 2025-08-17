"use client"

import * as React from "react"
import { useState } from "react"
import { useDropzone } from "react-dropzone"
import { FileUp, Upload, X } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"

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

export function ImportContactsDrawer({ onSubmit, children, open: controlledOpen, onOpenChange }: ImportContactsDrawerProps) {
  const [internalOpen, setInternalOpen] = React.useState(false)
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen
  const setOpen = onOpenChange || setInternalOpen
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)

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
      const response = await fetch('/api/contacts/create/bulk', {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()

      if (!response.ok) {
        toast.error(result.error || 'Import failed')
        return
      }

      if (result.success) {
        // Show success message with summary
        const { total_processed, contacts_created, contacts_updated, companies_created, contacts_skipped } = result
        
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
        toast.error(result.error || 'Import failed')
      }
    } catch (error) {
      console.error("Error uploading file:", error)
      toast.error("Network error during import. Please try again.")
    } finally {
      setIsUploading(false)
    }
  }

  const handleCancel = () => {
    setSelectedFile(null)
    setOpen(false)
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

              {/* CSV Format Instructions */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-foreground">Expected CSV Format</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs text-gray-600 mb-2">Your CSV should include these columns:</p>
                  <code className="text-xs bg-white px-2 py-1 rounded border block">
                    full_name, title, email, phone, city, state, country, linkedin_url, twitter_profile, instagram_profile, company_name, company_url
                  </code>
                  <div className="mt-3 space-y-1">
                    <p className="text-xs text-gray-600 font-medium">Required fields:</p>
                    <p className="text-xs text-gray-500">
                      • Contact: full_name
                    </p>
                    <p className="text-xs text-gray-500">
                      • Social Media: At least one of linkedin_url, twitter_profile, or instagram_profile
                    </p>
                    <p className="text-xs text-gray-600 font-medium mt-2">Optional fields:</p>
                    <p className="text-xs text-gray-500">
                      • Contact details: title, email, phone
                    </p>
                    <p className="text-xs text-gray-500">
                      • Location: city, state, country
                    </p>
                    <p className="text-xs text-gray-500">
                      • Company: company_name, company_url (both required if providing company info)
                    </p>
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