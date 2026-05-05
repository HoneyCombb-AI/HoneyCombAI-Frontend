"use client"

import * as React from "react"
import { useState, useEffect, useMemo, useCallback } from "react"
import { X, Plus, Edit2, Trash2, Loader2, Check, Info, Minus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"
import { Badge } from "@/components/ui/badge"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import axios from "axios"
import { toast } from "sonner"

interface Tag {
  id: string
  taggable_id: string
  name: string
  color: string
}

interface SystemTag {
  name: string
  color: string
}

interface TagsDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedItems: string[]
  taggableType: "contact" | "company"
  onTagsUpdated?: () => void
}

const customDrawerStyles = {
  width: '28vw',
  maxWidth: '400px',
  minWidth: '320px'
}

const COLOR_PALETTE = [
  { name: "Blue", value: "#3B82F6" },
  { name: "Purple", value: "#A855F7" },
  { name: "Green", value: "#10B981" },
  { name: "Red", value: "#EF4444" },
  { name: "Orange", value: "#F97316" },
  { name: "Pink", value: "#EC4899" },
  { name: "Teal", value: "#14B8A6" },
  { name: "Yellow", value: "#EAB308" },
  { name: "Indigo", value: "#6366F1" },
]

const ColorButton = React.memo(({
  color,
  isSelected,
  isDisabled,
  usedByTag,
  onClick,
  size = "large"
}: {
  color: { name: string; value: string }
  isSelected: boolean
  isDisabled: boolean
  usedByTag?: string
  onClick: () => void
  size?: "large" | "small"
}) => {
  const height = size === "large" ? "h-11" : "h-9"
  const checkSize = size === "large" ? "h-5 w-5" : "h-4 w-4"

  return (
    <button
      onClick={onClick}
      disabled={isDisabled}
      className={`relative ${height} rounded-lg border-2 transition-all duration-200 ${
        isSelected
          ? 'border-gray-900 shadow-md scale-105'
          : isDisabled
          ? 'border-gray-300 opacity-40 cursor-not-allowed'
          : 'border-gray-200 hover:border-gray-400 hover:shadow-sm hover:scale-102'
      }`}
      style={{
        backgroundColor: color.value,
        boxShadow: isSelected ? `0 4px 12px ${color.value}40` : undefined
      }}
      title={isDisabled ? `Already used by tag: ${usedByTag}` : color.name}
    >
      {isSelected && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Check className={`${checkSize} text-white drop-shadow-md`} strokeWidth={3} />
        </div>
      )}
    </button>
  )
})

ColorButton.displayName = 'ColorButton'

export function TagsDrawer({
  open,
  onOpenChange,
  selectedItems,
  taggableType,
  onTagsUpdated
}: TagsDrawerProps) {
  // All tags that exist globally in the system
  const [systemTags, setSystemTags] = useState<SystemTag[]>([])
  // Tags actually applied to the currently selected contacts (with IDs for mutations)
  const [appliedTagsData, setAppliedTagsData] = useState<Tag[]>([])
  const [loading, setLoading] = useState(false)

  const [editingTag, setEditingTag] = useState<SystemTag | null>(null)
  const [editTagName, setEditTagName] = useState("")
  const [editTagColor, setEditTagColor] = useState("")

  const [newTagName, setNewTagName] = useState("")
  const [newTagColor, setNewTagColor] = useState(COLOR_PALETTE[0].value)

  const [isAdding, setIsAdding] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [togglingTag, setTogglingTag] = useState<string | null>(null)
  const [deletingTagName, setDeletingTagName] = useState<string | null>(null)

  // Colors already claimed by existing global tags
  const usedColors = useMemo(() => {
    return new Map(systemTags.map(tag => [tag.color.toUpperCase(), tag.name]))
  }, [systemTags])

  // Per-tag application status across selected contacts
  const tagStatuses = useMemo(() => {
    return systemTags.map(tag => {
      const contactsWithTag = new Set(
        appliedTagsData
          .filter(t => t.name === tag.name)
          .map(t => t.taggable_id)
      )
      const appliedCount = selectedItems.filter(id => contactsWithTag.has(id)).length
      const status: 'all' | 'some' | 'none' =
        appliedCount === 0 ? 'none' :
        appliedCount === selectedItems.length ? 'all' : 'some'
      return { ...tag, appliedCount, status }
    })
  }, [systemTags, appliedTagsData, selectedItems])

  // Keep newTagColor valid as systemTags change
  useEffect(() => {
    const available = COLOR_PALETTE.find(c => !usedColors.has(c.value.toUpperCase()))
    if (available && usedColors.has(newTagColor.toUpperCase())) {
      setNewTagColor(available.value)
    }
  }, [usedColors, newTagColor])

  const selectedItemsKey = useMemo(() => {
    return [...selectedItems].sort().join(',')
  }, [selectedItems])

  const fetchAllData = useCallback(async () => {
    setLoading(true)
    try {
      const [systemRes, appliedRes] = await Promise.all([
        axios.get('/api/tags', { params: { taggable_type: taggableType } }),
        selectedItems.length > 0
          ? axios.get('/api/tags/fetch', {
              params: { taggable_ids: selectedItemsKey, taggable_type: taggableType }
            })
          : Promise.resolve({ data: { tags: [] } })
      ])

      setSystemTags(systemRes.data || [])
      setAppliedTagsData(appliedRes.data.tags || [])
    } catch (err) {
      console.error("Error fetching tags:", err)
      if (axios.isAxiosError(err) && err.response?.data?.error) {
        toast.error(err.response.data.error)
      } else {
        toast.error("Failed to load tags")
      }
      setSystemTags([])
      setAppliedTagsData([])
    } finally {
      setLoading(false)
    }
  }, [selectedItemsKey, taggableType])

  useEffect(() => {
    if (open) {
      fetchAllData()
    }
  }, [open, selectedItemsKey, fetchAllData])

  // Toggle a tag on/off for all selected contacts
  const handleToggleTag = useCallback(async (tag: SystemTag & { status: 'all' | 'some' | 'none'; appliedCount: number }) => {
    setTogglingTag(tag.name)
    try {
      if (tag.status === 'all') {
        // Remove from all selected contacts
        const tagIdsToDelete = appliedTagsData
          .filter(t => t.name === tag.name && selectedItems.includes(t.taggable_id))
          .map(t => t.id)

        if (tagIdsToDelete.length > 0) {
          await axios.delete('/api/tags/delete', { data: { tag_ids: tagIdsToDelete } })
          toast.success(`Removed "${tag.name}" from ${tagIdsToDelete.length} contact(s)`)
        }
      } else {
        // Apply to contacts that don't have it yet
        const contactsWithTag = new Set(
          appliedTagsData.filter(t => t.name === tag.name).map(t => t.taggable_id)
        )
        const contactsToApply = selectedItems.filter(id => !contactsWithTag.has(id))

        if (contactsToApply.length > 0) {
          const operations = contactsToApply.map(itemId => ({
            taggable_type: taggableType,
            taggable_id: itemId,
            tags: [{ name: tag.name, color: tag.color }]
          }))
          await axios.post('/api/tags/create', { operations })
          toast.success(`Applied "${tag.name}" to ${contactsToApply.length} contact(s)`)
        }
      }
      fetchAllData()
      onTagsUpdated?.()
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.data?.error) {
        toast.error(err.response.data.error)
      } else {
        toast.error("Failed to update tag")
      }
    } finally {
      setTogglingTag(null)
    }
  }, [appliedTagsData, selectedItems, taggableType, fetchAllData, onTagsUpdated])

  const handleAddTag = useCallback(async () => {
    const trimmedName = newTagName.trim().toLowerCase()
    if (!trimmedName) {
      toast.error("Please enter a tag name")
      return
    }

    // If this tag name already exists globally, skip contacts that already have it
    // to avoid a unique constraint 409 error
    const existingSystemTag = systemTags.find(t => t.name === trimmedName)
    const contactsWithTag = new Set(
      appliedTagsData.filter(t => t.name === trimmedName).map(t => t.taggable_id)
    )
    const contactsToApply = existingSystemTag
      ? selectedItems.filter(id => !contactsWithTag.has(id))
      : selectedItems

    if (contactsToApply.length === 0) {
      toast.info(`All selected contacts already have the "${trimmedName}" tag`)
      return
    }

    setIsAdding(true)
    try {
      const tagColor = existingSystemTag ? existingSystemTag.color : newTagColor
      const operations = contactsToApply.map(itemId => ({
        taggable_type: taggableType,
        taggable_id: itemId,
        tags: [{ name: trimmedName, color: tagColor }]
      }))

      await axios.post("/api/tags/create", { operations })
      toast.success(`Tag applied to ${contactsToApply.length} contact(s)`)
      setNewTagName("")
      fetchAllData()
      onTagsUpdated?.()
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.data?.error) {
        toast.error(err.response.data.error)
      } else {
        toast.error("Failed to add tag")
      }
    } finally {
      setIsAdding(false)
    }
  }, [newTagName, newTagColor, systemTags, appliedTagsData, selectedItems, taggableType, fetchAllData, onTagsUpdated])

  const handleEditTag = useCallback((tag: SystemTag) => {
    setEditingTag(tag)
    setEditTagName(tag.name)
    setEditTagColor(tag.color)
  }, [])

  const handleUpdateTag = useCallback(async () => {
    if (!editingTag || !editTagName.trim()) {
      toast.error("Please enter a tag name")
      return
    }

    setIsUpdating(true)
    try {
      await axios.patch("/api/tags/update", {
        original_name: editingTag.name,
        taggable_type: taggableType,
        name: editTagName.trim().toLowerCase(),
        color: editTagColor,
      })
      toast.success(`Tag updated globally`)
      setEditingTag(null)
      setEditTagName("")
      setEditTagColor("")
      fetchAllData()
      onTagsUpdated?.()
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.data?.error) {
        toast.error(err.response.data.error)
      } else {
        toast.error("Failed to update tag")
      }
    } finally {
      setIsUpdating(false)
    }
  }, [editingTag, editTagName, editTagColor, taggableType, fetchAllData, onTagsUpdated])

  // Globally delete a tag by name — removes it from every contact that has it
  const handleGlobalDeleteTag = useCallback(async (tagName: string) => {
    setLoading(true)
    try {
      await axios.delete("/api/tags/delete", {
        data: { name: tagName, taggable_type: taggableType }
      })
      toast.success(`Deleted "${tagName}" from all contacts`)
      setDeletingTagName(null)
      fetchAllData()
      onTagsUpdated?.()
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.data?.error) {
        toast.error(err.response.data.error)
      } else {
        toast.error("Failed to delete tag")
      }
      setDeletingTagName(null)
    } finally {
      setLoading(false)
    }
  }, [taggableType, fetchAllData, onTagsUpdated])

  const cancelEdit = useCallback(() => {
    setEditingTag(null)
    setEditTagName("")
    setEditTagColor("")
  }, [])

  const isBusy = isAdding || isUpdating || loading || deletingTagName !== null || togglingTag !== null

  return (
    <Drawer direction="left" open={open} onOpenChange={onOpenChange}>
      <DrawerContent style={customDrawerStyles} className="left-0 right-auto">
        <div className="mx-auto w-full h-screen overflow-y-auto no-scrollbar">
          <DrawerHeader className="sticky top-0 bg-white z-10 border-b px-6">
            <DrawerTitle className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">Manage Tags</h2>
                <p className="text-sm text-gray-500 font-normal mt-1">
                  {selectedItems.length} {taggableType}(s) selected
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onOpenChange(false)}
                className="h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </DrawerTitle>
          </DrawerHeader>

          <div className="px-6 py-4 space-y-6">
            {/* Create New Tag Section — top */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-900">New Tag</h3>
              <div className="space-y-3">
                <Input
                  id="tag-name"
                  placeholder="Type a tag name..."
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value.toLowerCase())}
                  onKeyDown={(e) => e.key === 'Enter' && !isAdding && handleAddTag()}
                  disabled={isAdding}
                />

                {/* Color picker — only visible while typing */}
                <div
                  className={`overflow-hidden transition-all duration-300 ease-in-out ${
                    newTagName.length > 0 ? 'max-h-64 opacity-100' : 'max-h-0 opacity-0'
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
                    <div className="grid grid-cols-3 gap-3 p-1">
                      {COLOR_PALETTE.map((color) => {
                        const isColorUsed = usedColors.has(color.value.toUpperCase())
                        const usedByTag = usedColors.get(color.value.toUpperCase())
                        return (
                          <ColorButton
                            key={color.value}
                            color={color}
                            isSelected={newTagColor.toUpperCase() === color.value.toUpperCase()}
                            isDisabled={isAdding || isColorUsed}
                            usedByTag={usedByTag}
                            onClick={() => !isColorUsed && setNewTagColor(color.value)}
                            size="large"
                          />
                        )
                      })}
                    </div>
                  </div>
                </div>

                {newTagName.length > 0 && (
                  <Button
                    onClick={handleAddTag}
                    disabled={isAdding}
                    className="w-full"
                    size="sm"
                  >
                    {isAdding
                      ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Adding...</>
                      : <><Plus className="h-4 w-4 mr-2" />Create & Apply</>}
                  </Button>
                )}
              </div>
            </div>

            <Separator />

            {/* All Tags Section — below create */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-900">
                  All Tags
                  {systemTags.length > 0 && (
                    <span className="text-gray-500 font-normal ml-2">({systemTags.length})</span>
                  )}
                </h3>
                <span className="text-xs text-gray-400">Click circle to apply/remove</span>
              </div>

              {loading && systemTags.length === 0 ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                </div>
              ) : systemTags.length === 0 ? (
                <div className="text-sm text-gray-500 py-4 text-center">
                  No tags yet. Create one below!
                </div>
              ) : (
                <div className="space-y-2">
                  {tagStatuses.map((tag) => {
                    const isToggling = togglingTag === tag.name

                    if (editingTag?.name === tag.name) {
                      return (
                        <div key={tag.name} className="space-y-3 p-3 border border-gray-200 rounded-lg bg-gray-50">
                          <div className="space-y-2">
                            <Label htmlFor="edit-tag-name" className="text-xs">Tag Name</Label>
                            <Input
                              id="edit-tag-name"
                              value={editTagName}
                              onChange={(e) => setEditTagName(e.target.value.toLowerCase())}
                              onKeyDown={(e) => e.key === 'Enter' && !isUpdating && handleUpdateTag()}
                              disabled={isUpdating}
                            />
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <Label className="text-xs">Color</Label>
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Info className="h-3 w-3" />
                                <span>One color per tag</span>
                              </div>
                            </div>
                            <div className="grid grid-cols-3 gap-2 p-1">
                              {COLOR_PALETTE.map((color) => {
                                const isColorUsed = usedColors.has(color.value.toUpperCase())
                                const usedByTag = usedColors.get(color.value.toUpperCase())
                                const isCurrentTagColor = editingTag?.color.toUpperCase() === color.value.toUpperCase()
                                const isDisabled = isColorUsed && !isCurrentTagColor

                                return (
                                  <ColorButton
                                    key={color.value}
                                    color={color}
                                    isSelected={editTagColor.toUpperCase() === color.value.toUpperCase()}
                                    isDisabled={isUpdating || isDisabled}
                                    usedByTag={usedByTag}
                                    onClick={() => !isDisabled && setEditTagColor(color.value)}
                                    size="small"
                                  />
                                )
                              })}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button onClick={handleUpdateTag} disabled={isUpdating} size="sm" className="flex-1">
                              {isUpdating
                                ? <><Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />Saving...</>
                                : 'Save'}
                            </Button>
                            <Button onClick={cancelEdit} variant="outline" size="sm" className="flex-1" disabled={isUpdating}>
                              Cancel
                            </Button>
                          </div>
                        </div>
                      )
                    }

                    if (deletingTagName === tag.name) {
                      return (
                        <div key={tag.name} className="p-3 border border-red-200 bg-red-50 rounded-lg space-y-3">
                          <p className="text-sm text-red-900 font-medium">
                            Delete &apos;{tag.name}&apos;?
                          </p>
                          <p className="text-xs text-red-700">
                            This removes it from every contact that has it, not just your current selection.
                          </p>
                          <div className="flex gap-2">
                            <Button
                              onClick={() => handleGlobalDeleteTag(tag.name)}
                              variant="destructive"
                              size="sm"
                              className="flex-1"
                              disabled={loading}
                            >
                              {loading
                                ? <><Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />Deleting...</>
                                : 'Delete'}
                            </Button>
                            <Button
                              onClick={() => setDeletingTagName(null)}
                              variant="outline"
                              size="sm"
                              className="flex-1"
                              disabled={loading}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      )
                    }

                    return (
                      <div key={tag.name} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                        <div className="flex items-center gap-3">
                          {/* Toggle circle with tooltip */}
                          <TooltipProvider delayDuration={200}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button
                                  onClick={() => !isToggling && handleToggleTag(tag)}
                                  disabled={isBusy}
                                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                                    tag.status === 'all'
                                      ? 'border-green-500 bg-green-500'
                                      : tag.status === 'some'
                                      ? 'border-amber-400 bg-amber-400'
                                      : 'border-gray-300 bg-white hover:border-gray-500'
                                  } ${isBusy ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                                >
                                  {isToggling ? (
                                    <Loader2 className="h-2.5 w-2.5 animate-spin text-gray-500" />
                                  ) : tag.status === 'all' ? (
                                    <Check className="h-3 w-3 text-white" strokeWidth={3} />
                                  ) : tag.status === 'some' ? (
                                    <Minus className="h-3 w-3 text-white" strokeWidth={3} />
                                  ) : null}
                                </button>
                              </TooltipTrigger>
                              <TooltipContent side="right" className="max-w-[180px] text-xs">
                                {tag.status === 'all' && (
                                  <p>Applied to all {selectedItems.length} contacts. Click to remove from all.</p>
                                )}
                                {tag.status === 'some' && (
                                  <p>Applied to {tag.appliedCount} of {selectedItems.length} contacts. Click to apply to the rest.</p>
                                )}
                                {tag.status === 'none' && (
                                  <p>Not applied to any selected contacts. Click to apply to all.</p>
                                )}
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>

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

                          {tag.status === 'some' && (
                            <span className="text-xs text-gray-400">{tag.appliedCount}/{selectedItems.length}</span>
                          )}
                        </div>

                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditTag(tag)}
                            disabled={isBusy}
                            className="h-8 w-8"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeletingTagName(tag.name)}
                            disabled={isBusy}
                            className="h-8 w-8 hover:bg-red-50 hover:text-red-600"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

          </div>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
