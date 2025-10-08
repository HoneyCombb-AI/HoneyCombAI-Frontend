"use client"

import * as React from "react"
import { useState, useEffect, useMemo } from "react"
import { X, Plus, Edit2, Trash2 } from "lucide-react"
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
import axios from "axios"
import { toast } from "sonner"

interface Tag {
  id: string
  name: string
  color: string
}

interface TagsDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedItems: string[] // Array of contact/company IDs
  taggableType: "contact" | "company"
  onTagsUpdated?: () => void // Callback to refresh data after tag operations
}

const customDrawerStyles = {
  width: '28vw',
  maxWidth: '400px',
  minWidth: '320px'
}

// Predefined color palette
const COLOR_PALETTE = [
  { name: "Blue", value: "#3B82F6" },
  { name: "Purple", value: "#A855F7" },
  { name: "Green", value: "#10B981" },
  { name: "Red", value: "#EF4444" },
  { name: "Orange", value: "#F97316" },
  { name: "Pink", value: "#EC4899" },
  { name: "Teal", value: "#14B8A6" },
  { name: "Yellow", value: "#EAB308" },
]

export function TagsDrawer({
  open,
  onOpenChange,
  selectedItems,
  taggableType,
  onTagsUpdated
}: TagsDrawerProps) {
  const [existingTags, setExistingTags] = useState<Tag[]>([])
  const [loading, setLoading] = useState(false)
  const [editingTag, setEditingTag] = useState<Tag | null>(null)

  // Form states for adding new tags
  const [newTagName, setNewTagName] = useState("")
  const [newTagColor, setNewTagColor] = useState(COLOR_PALETTE[0].value)

  // Form states for editing tags
  const [editTagName, setEditTagName] = useState("")
  const [editTagColor, setEditTagColor] = useState("")

  // Store all tags (including duplicates) for edit/delete operations
  const [allTagsData, setAllTagsData] = useState<Tag[]>([])

  // Create a stable key from selected items to prevent unnecessary re-fetches
  const selectedItemsKey = useMemo(() => {
    return selectedItems.sort().join(',')
  }, [selectedItems.join(',')])

  // Fetch existing tags for selected items - only when drawer opens or items change
  useEffect(() => {
    if (open && selectedItems.length > 0) {
      fetchExistingTags()
    }
  }, [open, selectedItemsKey, taggableType])

  const fetchExistingTags = async () => {
    setLoading(true)
    try {
      const response = await axios.get('/api/tags/fetch', {
        params: {
          taggable_ids: selectedItems.join(','),
          taggable_type: taggableType
        }
      })

      // Store all tags (including duplicates) for later use in edit/delete
      const allTags = (response.data.tags || []) as Tag[]
      setAllTagsData(allTags)

      // Get unique tags (deduplicate by name for display)
      const uniqueTags = Array.from(
        new Map(allTags.map((tag: Tag) => [tag.name, tag])).values()
      ) as Tag[]

      setExistingTags(uniqueTags)
    } catch (err) {
      console.error("Error fetching tags:", err)
      if (axios.isAxiosError(err) && err.response?.data?.error) {
        toast.error(err.response.data.error)
      } else {
        toast.error("Failed to load existing tags")
      }
      setExistingTags([])
      setAllTagsData([])
    } finally {
      setLoading(false)
    }
  }

  const handleAddTag = async () => {
    if (!newTagName.trim()) {
      toast.error("Please enter a tag name")
      return
    }

    setLoading(true)
    try {
      // Build operations array for bulk insert
      const operations = selectedItems.map(itemId => ({
        taggable_type: taggableType,
        taggable_id: itemId,
        tags: [
          {
            name: newTagName.trim(),
            color: newTagColor
          }
        ]
      }))

      await axios.post("/api/tags/create", { operations })

      toast.success(`Tag added to ${selectedItems.length} ${taggableType}(s)`)
      setNewTagName("")
      setNewTagColor(COLOR_PALETTE[0].value)
      fetchExistingTags()
      onTagsUpdated?.()
    } catch (err) {
      console.error("Error adding tag:", err)
      if (axios.isAxiosError(err) && err.response?.data?.error) {
        toast.error(err.response.data.error)
      } else {
        toast.error("Failed to add tag")
      }
    } finally {
      setLoading(false)
    }
  }

  const handleEditTag = (tag: Tag) => {
    setEditingTag(tag)
    setEditTagName(tag.name)
    setEditTagColor(tag.color)
  }

  const handleUpdateTag = async () => {
    if (!editingTag || !editTagName.trim()) {
      toast.error("Please enter a tag name")
      return
    }

    setLoading(true)
    try {
      // Use stored tag data instead of refetching
      const tagIdsToUpdate = allTagsData
        .filter(tag => tag.name === editingTag.name)
        .map(tag => tag.id)

      if (tagIdsToUpdate.length === 0) {
        toast.error("No tags found to update")
        return
      }

      // Build updates array
      const updates = tagIdsToUpdate.map(tagId => ({
        id: tagId,
        name: editTagName.trim(),
        color: editTagColor
      }))

      await axios.patch("/api/tags/update", { updates })

      toast.success(`Tag updated for ${tagIdsToUpdate.length} item(s)`)
      setEditingTag(null)
      setEditTagName("")
      setEditTagColor("")
      fetchExistingTags()
      onTagsUpdated?.()
    } catch (err) {
      console.error("Error updating tag:", err)
      if (axios.isAxiosError(err) && err.response?.data?.error) {
        toast.error(err.response.data.error)
      } else {
        toast.error("Failed to update tag")
      }
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveTag = async (tagName: string) => {
    setLoading(true)
    try {
      // Use stored tag data instead of refetching
      const tagIdsToDelete = allTagsData
        .filter(tag => tag.name === tagName)
        .map(tag => tag.id)

      if (tagIdsToDelete.length === 0) {
        toast.error("No tags found to remove")
        return
      }

      await axios.delete("/api/tags/delete", {
        data: { tag_ids: tagIdsToDelete }
      })

      toast.success(`Tag removed from ${tagIdsToDelete.length} item(s)`)
      fetchExistingTags()
      onTagsUpdated?.()
    } catch (err) {
      console.error("Error removing tag:", err)
      if (axios.isAxiosError(err) && err.response?.data?.error) {
        toast.error(err.response.data.error)
      } else {
        toast.error("Failed to remove tag")
      }
    } finally {
      setLoading(false)
    }
  }

  const cancelEdit = () => {
    setEditingTag(null)
    setEditTagName("")
    setEditTagColor("")
  }

  return (
    <Drawer direction="left" open={open} onOpenChange={onOpenChange}>
      <DrawerContent style={customDrawerStyles} className="left-0 right-auto">
        <div className="mx-auto w-full h-screen overflow-y-auto">
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
            {/* Add New Tag Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-900">Add New Tag</h3>

              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="tag-name" className="text-xs">Tag Name</Label>
                  <Input
                    id="tag-name"
                    placeholder="Enter tag name..."
                    value={newTagName}
                    onChange={(e) => setNewTagName(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs">Color</Label>
                  <div className="grid grid-cols-4 gap-2">
                    {COLOR_PALETTE.map((color) => (
                      <button
                        key={color.value}
                        onClick={() => setNewTagColor(color.value)}
                        className={`h-10 rounded-md border-2 transition-all ${
                          newTagColor === color.value
                            ? 'border-gray-900 scale-105'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        style={{ backgroundColor: color.value }}
                        title={color.name}
                      />
                    ))}
                  </div>
                </div>

                <Button
                  onClick={handleAddTag}
                  disabled={loading || !newTagName.trim()}
                  className="w-full"
                  size="sm"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Tag
                </Button>
              </div>
            </div>

            <Separator />

            {/* Existing Tags Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-900">
                Existing Tags
                {existingTags.length > 0 && (
                  <span className="text-gray-500 font-normal ml-2">
                    ({existingTags.length})
                  </span>
                )}
              </h3>

              {loading && existingTags.length === 0 ? (
                <div className="text-sm text-gray-500 py-4 text-center">
                  Loading tags...
                </div>
              ) : existingTags.length === 0 ? (
                <div className="text-sm text-gray-500 py-4 text-center">
                  No tags yet. Add one above!
                </div>
              ) : (
                <div className="space-y-2">
                  {existingTags.map((tag) => (
                    <div key={tag.id}>
                      {editingTag?.id === tag.id ? (
                        // Edit mode
                        <div className="space-y-3 p-3 border border-gray-200 rounded-lg bg-gray-50">
                          <div className="space-y-2">
                            <Label htmlFor="edit-tag-name" className="text-xs">Tag Name</Label>
                            <Input
                              id="edit-tag-name"
                              value={editTagName}
                              onChange={(e) => setEditTagName(e.target.value)}
                              onKeyPress={(e) => e.key === 'Enter' && handleUpdateTag()}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label className="text-xs">Color</Label>
                            <div className="grid grid-cols-4 gap-2">
                              {COLOR_PALETTE.map((color) => (
                                <button
                                  key={color.value}
                                  onClick={() => setEditTagColor(color.value)}
                                  className={`h-8 rounded-md border-2 transition-all ${
                                    editTagColor === color.value
                                      ? 'border-gray-900 scale-105'
                                      : 'border-gray-200 hover:border-gray-300'
                                  }`}
                                  style={{ backgroundColor: color.value }}
                                  title={color.name}
                                />
                              ))}
                            </div>
                          </div>

                          <div className="flex gap-2">
                            <Button
                              onClick={handleUpdateTag}
                              disabled={loading}
                              size="sm"
                              className="flex-1"
                            >
                              Save
                            </Button>
                            <Button
                              onClick={cancelEdit}
                              variant="outline"
                              size="sm"
                              className="flex-1"
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        // View mode
                        <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
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

                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEditTag(tag)}
                              disabled={loading}
                              className="h-8 w-8"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemoveTag(tag.name)}
                              disabled={loading}
                              className="h-8 w-8 hover:bg-red-50 hover:text-red-600"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
