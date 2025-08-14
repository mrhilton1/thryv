"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Trash2, Search, ArrowRight, Plus, Database } from "lucide-react"
import { fieldMappingService, type FieldMapping } from "@/lib/field-mapping-service"
import { useAuth } from "@/contexts/auth-context"

export function FieldMappingManagement() {
  const { user } = useAuth()
  const [mappings, setMappings] = useState<FieldMapping[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedField, setSelectedField] = useState<string>("all")

  useEffect(() => {
    loadMappings()
  }, [])

  const loadMappings = async () => {
    try {
      setLoading(true)
      const data = await fieldMappingService.getStoredMappings()
      setMappings(data)
    } catch (error) {
      console.error("Error loading mappings:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteMapping = async (id: string) => {
    try {
      await fieldMappingService.deleteMapping(id)
      await loadMappings()
    } catch (error) {
      console.error("Error deleting mapping:", error)
    }
  }

  const filteredMappings = mappings.filter((mapping) => {
    const matchesSearch =
      mapping.sourceValue.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mapping.targetValue.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mapping.fieldName.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesField = selectedField === "all" || mapping.fieldName === selectedField

    return matchesSearch && matchesField
  })

  const groupedMappings = filteredMappings.reduce(
    (acc, mapping) => {
      if (!acc[mapping.fieldName]) {
        acc[mapping.fieldName] = []
      }
      acc[mapping.fieldName].push(mapping)
      return acc
    },
    {} as Record<string, FieldMapping[]>,
  )

  const getFieldDisplayName = (fieldName: string) => {
    const displayNames: Record<string, string> = {
      productArea: "Product Area",
      team: "Team",
      status: "Status",
      processStage: "Process Stage",
      priority: "Priority",
      businessImpact: "Business Impact",
      estimatedGtmType: "GTM Type",
    }
    return displayNames[fieldName] || fieldName
  }

  const uniqueFields = [...new Set(mappings.map((m) => m.fieldName))]

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            Field Mappings
          </CardTitle>
          <CardDescription>Loading field mappings...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="w-5 h-5" />
          Field Mappings
        </CardTitle>
        <CardDescription>Manage stored field value mappings for data imports and form submissions.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search and Filter */}
        <div className="flex gap-4">
          <div className="flex-1">
            <Label htmlFor="search" className="sr-only">
              Search mappings
            </Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                id="search"
                placeholder="Search by source value, target value, or field name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="w-48">
            <Label htmlFor="field-filter" className="sr-only">
              Filter by field
            </Label>
            <select
              id="field-filter"
              value={selectedField}
              onChange={(e) => setSelectedField(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="all">All Fields</option>
              {uniqueFields.map((field) => (
                <option key={field} value={field}>
                  {getFieldDisplayName(field)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Mappings List */}
        {Object.keys(groupedMappings).length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            {searchTerm || selectedField !== "all" ? (
              <div>
                <Search className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No mappings found matching your search criteria.</p>
              </div>
            ) : (
              <div>
                <Database className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No field mappings have been created yet.</p>
                <p className="text-sm mt-2">
                  Mappings will be created automatically when you import data with unmapped field values.
                </p>
              </div>
            )}
          </div>
        ) : (
          <ScrollArea className="h-96">
            <div className="space-y-6">
              {Object.entries(groupedMappings).map(([fieldName, fieldMappings]) => (
                <div key={fieldName}>
                  <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                    {getFieldDisplayName(fieldName)}
                    <Badge variant="secondary">{fieldMappings.length}</Badge>
                  </h3>

                  <div className="space-y-2">
                    {fieldMappings.map((mapping) => (
                      <div
                        key={mapping.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border"
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <Badge variant="outline" className="font-mono text-xs">
                            {mapping.sourceValue}
                          </Badge>
                          <ArrowRight className="w-4 h-4 text-gray-400" />
                          <Badge
                            variant={mapping.targetType === "new" ? "default" : "secondary"}
                            className="font-mono text-xs"
                          >
                            {mapping.targetValue}
                            {mapping.targetType === "new" && <Plus className="w-3 h-3 ml-1" />}
                          </Badge>
                        </div>

                        <div className="flex items-center gap-2">
                          {mapping.targetType === "new" && (
                            <Badge variant="outline" className="text-xs">
                              Created New
                            </Badge>
                          )}
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Field Mapping</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete this mapping? This will remove the automatic
                                  conversion from "{mapping.sourceValue}" to "{mapping.targetValue}" for the{" "}
                                  {getFieldDisplayName(fieldName)} field.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteMapping(mapping.id!)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Delete Mapping
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    ))}
                  </div>

                  {Object.keys(groupedMappings).indexOf(fieldName) < Object.keys(groupedMappings).length - 1 && (
                    <Separator className="mt-4" />
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        )}

        {/* Summary */}
        {mappings.length > 0 && (
          <div className="pt-4 border-t">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Total mappings: {mappings.length}</span>
              <span>Fields with mappings: {uniqueFields.length}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
