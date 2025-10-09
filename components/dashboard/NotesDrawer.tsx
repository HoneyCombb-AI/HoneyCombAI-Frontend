"use client"

import * as React from "react"
import { useState, useEffect, useCallback } from "react"
import { X, Plus, Edit2, Trash2, Loader2, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { toast } from "sonner"
import axios from "axios"

interface Note {
  id: string
  content: string
  created_at: string
}

interface NotesDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  notableId: string
  notableType: "contact" | "company"
  notableName?: string
  onNotesUpdated?: () => void
}

const customDrawerStyles = {
  width: '40vw',
  maxWidth: '600px',
  minWidth: '320px'
}

export function NotesDrawer({
  open,
  onOpenChange,
  notableId,
  notableType,
  notableName,
  onNotesUpdated
}: NotesDrawerProps) {
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(false)
  const [editingNote, setEditingNote] = useState<Note | null>(null)

  // Form states for adding new notes
  const [newNoteContent, setNewNoteContent] = useState("")

  // Form states for editing notes
  const [editNoteContent, setEditNoteContent] = useState("")

  // Loading states for individual operations
  const [isAdding, setIsAdding] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [deletingNoteId, setDeletingNoteId] = useState<string | null>(null)

  const fetchNotes = useCallback(async () => {
    setLoading(true)
    try {
      const response = await axios.get('/api/notes/fetch', {
        params: {
          notable_id: notableId,
          notable_type: notableType
        }
      })
      setNotes(response.data.notes || [])
    } catch (err) {
      console.error("Error fetching notes:", err)
      if (axios.isAxiosError(err) && err.response?.data?.error) {
        toast.error(err.response.data.error)
      } else {
        toast.error("Failed to load notes")
      }
      setNotes([])
    } finally {
      setLoading(false)
    }
  }, [notableId, notableType])

  useEffect(() => {
    if (open && notableId) {
      fetchNotes()
    }
  }, [open, notableId, fetchNotes])

  const handleAddNote = useCallback(async () => {
    if (!newNoteContent.trim()) {
      toast.error("Please enter note content")
      return
    }

    setIsAdding(true)
    try {
      const response = await axios.post("/api/notes/create", {
        notable_type: notableType,
        notable_id: notableId,
        content: newNoteContent.trim()
      })

      if (response.data.success && response.data.note) {
        setNotes(prev => [response.data.note, ...prev])
        toast.success("Note added successfully")
        setNewNoteContent("")
        onNotesUpdated?.()
      }
    } catch (err) {
      console.error("Error adding note:", err)
      if (axios.isAxiosError(err) && err.response?.data?.error) {
        toast.error(err.response.data.error)
      } else {
        toast.error("Failed to add note")
      }
    } finally {
      setIsAdding(false)
    }
  }, [newNoteContent, notableId, notableType, onNotesUpdated])

  const handleEditNote = useCallback((note: Note) => {
    setEditingNote(note)
    setEditNoteContent(note.content)
  }, [])

  const handleUpdateNote = useCallback(async () => {
    if (!editingNote || !editNoteContent.trim()) {
      toast.error("Please enter note content")
      return
    }

    setIsUpdating(true)
    try {
      const response = await axios.patch("/api/notes/update", {
        id: editingNote.id,
        content: editNoteContent.trim()
      })

      if (response.data.success && response.data.note) {
        setNotes(prev => prev.map(note =>
          note.id === editingNote.id ? response.data.note : note
        ))
        toast.success("Note updated successfully")
        setEditingNote(null)
        setEditNoteContent("")
        onNotesUpdated?.()
      }
    } catch (err) {
      console.error("Error updating note:", err)
      if (axios.isAxiosError(err) && err.response?.data?.error) {
        toast.error(err.response.data.error)
      } else {
        toast.error("Failed to update note")
      }
    } finally {
      setIsUpdating(false)
    }
  }, [editingNote, editNoteContent, onNotesUpdated])

  const handleDeleteNote = useCallback(async (noteId: string) => {
    setLoading(true)
    try {
      await axios.delete("/api/notes/delete", {
        data: { id: noteId }
      })

      setNotes(prev => prev.filter(note => note.id !== noteId))
      toast.success("Note deleted successfully")
      setDeletingNoteId(null)
      onNotesUpdated?.()
    } catch (err) {
      console.error("Error deleting note:", err)
      if (axios.isAxiosError(err) && err.response?.data?.error) {
        toast.error(err.response.data.error)
      } else {
        toast.error("Failed to delete note")
      }
      setDeletingNoteId(null)
    } finally {
      setLoading(false)
    }
  }, [onNotesUpdated])

  const cancelEdit = useCallback(() => {
    setEditingNote(null)
    setEditNoteContent("")
  }, [])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMs = now.getTime() - date.getTime()
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))

    // Handle future dates or same-day edge cases (timezone issues)
    if (diffInDays < 0 || diffInDays === 0) {
      return "Today"
    } else if (diffInDays === 1) {
      return "Yesterday"
    } else if (diffInDays < 7) {
      return `${diffInDays} days ago`
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    }
  }

  return (
    <Drawer direction="left" open={open} onOpenChange={onOpenChange} dismissible={false}>
      <DrawerContent style={customDrawerStyles} className="left-0 right-auto">
        <div className="mx-auto w-full h-screen overflow-y-auto">
          <DrawerHeader className="sticky top-0 bg-white z-10 border-b px-6">
            <DrawerTitle className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">Notes</h2>
                <p className="text-sm text-gray-500 font-normal mt-1">
                  {notableName ? (
                    <>Notes for {notableName}</>
                  ) : (
                    <>{notableType === "contact" ? "Contact" : "Company"} notes</>
                  )}
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
            {/* Add New Note Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-900">Add New Note</h3>

              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="note-content" className="text-xs">Note Content</Label>
                  <Textarea
                    id="note-content"
                    placeholder="Enter your note here..."
                    value={newNoteContent}
                    onChange={(e) => setNewNoteContent(e.target.value)}
                    disabled={isAdding}
                    rows={10}
                    className="resize-none"
                  />
                </div>

                <Button
                  onClick={handleAddNote}
                  disabled={isAdding || !newNoteContent.trim()}
                  className="w-full"
                  size="sm"
                >
                  {isAdding ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Note
                    </>
                  )}
                </Button>
              </div>
            </div>

            <Separator />

            {/* Existing Notes Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-900">
                All Notes
                {notes.length > 0 && (
                  <span className="text-gray-500 font-normal ml-2">
                    ({notes.length})
                  </span>
                )}
              </h3>

              {loading && notes.length === 0 ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                </div>
              ) : notes.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <FileText className="h-12 w-12 text-gray-300 mb-3" />
                  <p className="text-sm text-gray-500">No notes yet. Add one above!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {notes.map((note) => (
                    <div key={note.id}>
                      {editingNote?.id === note.id ? (
                        // Edit mode
                        <div className="space-y-3 p-3 border border-gray-200 rounded-lg bg-gray-50">
                          <div className="space-y-2">
                            <Label htmlFor="edit-note-content" className="text-xs">Note Content</Label>
                            <Textarea
                              id="edit-note-content"
                              value={editNoteContent}
                              onChange={(e) => setEditNoteContent(e.target.value)}
                              disabled={isUpdating}
                              rows={10}
                              className="resize-none"
                            />
                          </div>

                          <div className="flex gap-2">
                            <Button
                              onClick={handleUpdateNote}
                              disabled={isUpdating || !editNoteContent.trim()}
                              size="sm"
                              className="flex-1"
                            >
                              {isUpdating ? (
                                <>
                                  <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
                                  Saving...
                                </>
                              ) : (
                                'Save'
                              )}
                            </Button>
                            <Button
                              onClick={cancelEdit}
                              variant="outline"
                              size="sm"
                              className="flex-1"
                              disabled={isUpdating}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : deletingNoteId === note.id ? (
                        // Delete confirmation mode
                        <Alert className="p-3 border-red-200 bg-red-50">
                          <AlertDescription>
                            <div className="space-y-3">
                              <p className="text-sm text-red-900 font-medium">
                                Delete this note?
                              </p>
                              <div className="flex gap-2">
                                <Button
                                  onClick={() => handleDeleteNote(note.id)}
                                  variant="destructive"
                                  size="sm"
                                  className="flex-1"
                                  disabled={loading}
                                >
                                  {loading ? (
                                    <>
                                      <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
                                      Deleting...
                                    </>
                                  ) : (
                                    'Delete'
                                  )}
                                </Button>
                                <Button
                                  onClick={() => setDeletingNoteId(null)}
                                  variant="outline"
                                  size="sm"
                                  className="flex-1"
                                  disabled={loading}
                                >
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          </AlertDescription>
                        </Alert>
                      ) : (
                        // View mode
                        <div className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <p className="text-xs text-gray-500">
                              {formatDate(note.created_at)}
                            </p>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEditNote(note)}
                                disabled={isAdding || isUpdating || loading || deletingNoteId !== null}
                                className="h-7 w-7"
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setDeletingNoteId(note.id)}
                                disabled={isAdding || isUpdating || loading || deletingNoteId !== null}
                                className="h-7 w-7 hover:bg-red-50 hover:text-red-600"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </div>
                          <p className="text-sm text-gray-700 whitespace-pre-wrap break-words">
                            {note.content}
                          </p>
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
