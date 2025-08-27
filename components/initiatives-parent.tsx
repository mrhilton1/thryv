"use client"

import { useState } from "react"
import { InitiativesList } from "./initiatives-list"
import { InitiativeForm } from "./initiative-form"
import type { Initiative } from "@/types"

interface InitiativesParentProps {
  initiatives: Initiative[]
  users: any[]
  configItems?: any
  onSaveInitiative: (data: any) => void
  onDeleteInitiative?: (initiative: Initiative) => void
}

export function InitiativesParent({
  initiatives,
  users,
  configItems,
  onSaveInitiative,
  onDeleteInitiative,
}: InitiativesParentProps) {
  // State for controlling the InitiativeForm modal
  const [showInitiativeForm, setShowInitiativeForm] = useState(false)
  const [editingInitiative, setEditingInitiative] = useState<Initiative | undefined>()
  const [selectedInitiative, setSelectedInitiative] = useState<Initiative | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)

  // Handler for when Edit is clicked in InitiativesList
  const handleEditInitiative = (initiative: Initiative) => {
    console.log("Edit initiative clicked:", initiative.title)
    setEditingInitiative(initiative) // Set the initiative to edit
    setShowInitiativeForm(true) // Open the modal
  }

  // Handler for when View is clicked in InitiativesList
  const handleViewInitiative = (initiative: Initiative) => {
    setSelectedInitiative(initiative)
    setShowDetailModal(true)
  }

  // Handler for when Delete is clicked in InitiativesList
  const handleDeleteInitiative = (initiative: Initiative) => {
    if (window.confirm(`Are you sure you want to delete "${initiative.title}"?`)) {
      onDeleteInitiative?.(initiative)
    }
  }

  // Handler for creating a new initiative
  const handleCreateInitiative = () => {
    setEditingInitiative(undefined) // Clear any existing initiative
    setShowInitiativeForm(true) // Open the modal
  }

  // Handler for saving initiative (both create and edit)
  const handleSaveInitiative = (initiativeData: any) => {
    try {
      onSaveInitiative(initiativeData)
      setShowInitiativeForm(false) // Close the modal
      setEditingInitiative(undefined) // Clear the editing state
    } catch (error) {
      console.error("Error saving initiative:", error)
      // Don't close the modal if there's an error
    }
  }

  // Handler for canceling/closing the form
  const handleCloseForm = () => {
    setShowInitiativeForm(false)
    setEditingInitiative(undefined)
  }

  return (
    <div className="space-y-6">
      {/* Add Create Button */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Initiatives</h1>
        <button
          onClick={handleCreateInitiative}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Create Initiative
        </button>
      </div>

      {/* Initiatives List */}
      <InitiativesList
        initiatives={initiatives}
        onView={handleViewInitiative}
        onEdit={handleEditInitiative} // This is the key prop
        onDelete={handleDeleteInitiative}
      />

      {/* Initiative Form Modal */}
      <InitiativeForm
        open={showInitiativeForm} // Controls modal visibility
        onOpenChange={handleCloseForm} // Handles modal close
        initiative={editingInitiative} // The initiative to edit (undefined for create)
        users={users}
        config={configItems}
        onSave={handleSaveInitiative}
      />

      {/* Detail Modal (if you want to keep the view functionality) */}
      {selectedInitiative && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">{selectedInitiative.title}</h2>
              <button onClick={() => setShowDetailModal(false)} className="text-gray-500 hover:text-gray-700">
                ×
              </button>
            </div>
            <div className="space-y-4">
              <p>
                <strong>Description:</strong> {selectedInitiative.description}
              </p>
              <p>
                <strong>Status:</strong> {selectedInitiative.status}
              </p>
              <p>
                <strong>Priority:</strong> {selectedInitiative.priority}
              </p>
              <p>
                <strong>Progress:</strong> {selectedInitiative.progress}%
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
