"use client"

import * as React from "react"
import { useState } from "react"
import { FileUp, Upload, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && file.type === 'text/csv') {
      setSelectedFile(file)
    } else {
      alert('Please select a valid CSV file')
      event.target.value = ''
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedFile) return

    try {
      setIsUploading(true)
      onSubmit?.(selectedFile)
      setSelectedFile(null)
      setOpen(false)
    } catch (error) {
      console.error("Error uploading file:", error)
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
        <div className="mx-auto w-full h-screen overflow-y-auto">
          <DrawerHeader className="sticky top-0 bg-white z-10 border-b">
            <DrawerTitle>Import Contacts from CSV</DrawerTitle>
            <p className="text-sm text-muted-foreground">
              Upload a CSV file to import multiple contacts at once.
            </p>
          </DrawerHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="px-6 py-4 space-y-6">
              
              {/* File Upload Section */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-foreground">Upload CSV File</h3>
                
                <div className="space-y-4">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <FileUp className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="mt-4">
                      <label htmlFor="csv-upload" className="cursor-pointer">
                        <span className="text-sm font-medium text-blue-600 hover:text-blue-500">
                          Click to upload
                        </span>
                        <span className="text-sm text-gray-500"> or drag and drop</span>
                      </label>
                      <Input
                        id="csv-upload"
                        type="file"
                        accept=".csv"
                        onChange={handleFileSelect}
                        className="sr-only"
                      />
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
                    full_name, title, company_name, linkedin_url, email, phone, twitter_profile, instagram_profile
                  </code>
                  <p className="text-xs text-gray-500 mt-2">
                    * Required columns: full_name, title, company_name, linkedin_url
                  </p>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t bg-white sticky bottom-0">
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