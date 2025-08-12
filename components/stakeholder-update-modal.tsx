"use client"

import React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Trash2 } from "lucide-react"
import type { InitiativeWithRelations } from "@/lib/database/schemas"

interface StakeholderUpdateModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initiative: InitiativeWithRelations | null
  onSave: (initiativeId: string, updates: { executiveUpdate: string; showOnExecutiveSummary: boolean }) => Promise<void>
  onRemove: (initiativeId: string) => Promise<void>
}

export function StakeholderUpdateModal({
  open,
  onOpenChange,
  initiative,
  onSave,
  onRemove,
}: StakeholderUpdateModalProps) {
  const [message, setMessage] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Initialize message when modal opens
  React.useEffect(() => {
    if (open && initiative) {
      setMessage(initiative.executiveUpdate || "")
    }
  }, [open, initiative])

  if (!initiative) return null

  const handleSave = async () => {
    if (!message.trim()) return

    setIsSubmitting(true)
    try {
      await onSave(initiative.id, {
        executiveUpdate: message.trim(),
        showOnExecutiveSummary: true,
      })
      onOpenChange(false)
    } catch (error) {
      console.error("Error saving stakeholder update:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleRemove = async () => {
    setIsSubmitting(true)
    try {
      await onRemove(initiative.id)
      onOpenChange(false)
    } catch (error) {
      console.error("Error removing stakeholder update:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const isEditing = initiative.showOnExecutiveSummary && initiative.executiveUpdate

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Stakeholder Update" : "Add Stakeholder Update"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-sm text-gray-900 mb-2">Initiative</h4>
            <p className="text-sm text-gray-600">{initiative.title}</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="stakeholder-message">
              Stakeholder Message <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="stakeholder-message"
              placeholder="Enter the message for stakeholders..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              className="resize-none"
            />
          </div>

          <div className="flex justify-between pt-4">
            <div>
              {isEditing && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRemove}
                  disabled={isSubmitting}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 bg-transparent"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Remove Flag
                </Button>
              )}
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={!message.trim() || isSubmitting}>
                {isSubmitting ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
