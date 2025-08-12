"use client"

import type React from "react"

import { useState } from "react"
import { useSupabaseDatabase } from "@/contexts/supabase-database-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Users,
  Target,
  Award,
  SettingsIcon,
  Plus,
  Edit,
  Trash2,
  GripVertical,
  Palette,
  X,
  CheckCircle,
  Circle,
  TargetIcon,
  Flag,
  Star,
  Home,
  Calendar,
  FileText,
  Settings,
  UsersIcon,
  BarChart3,
  Zap,
} from "lucide-react"
import { DatabaseConnectionTest } from "./database-connection-test"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface AdminPanelProps {
  onUpdateUser?: (userId: string, updates: any) => Promise<void>
}

export function AdminPanel({ onUpdateUser }: AdminPanelProps) {
  const {
    users = [],
    initiatives = [],
    achievements = [],
    navigationConfig = [],
    configItems = {
      teams: [],
      businessImpacts: [],
      productAreas: [],
      processStages: [],
      priorities: [],
      statuses: [],
      gtmTypes: [],
    },
    fieldConfigurations = {},
    createConfigItem,
    updateConfigItem,
    deleteConfigItem,
    reorderConfigItems,
    updateNavigationConfig,
    createNavigationConfig,
    deleteNavigationConfig,
    reorderNavigationConfig,
    updateFieldConfiguration,
    reorderFieldConfigurations,
  } = useSupabaseDatabase()

  const [editingNavItem, setEditingNavItem] = useState<any>(null)
  const [showNavItemDialog, setShowNavItemDialog] = useState(false)
  const [navItemForm, setNavItemForm] = useState({
    name: "",
    description: "",
    isVisible: true,
    icon: "Circle",
  })
  const [draggedItem, setDraggedItem] = useState<any>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  const [optimisticNavigation, setOptimisticNavigation] = useState<any[]>([])

  const [editingConfigItem, setEditingConfigItem] = useState<any>(null)
  const [showConfigItemDialog, setShowConfigItemDialog] = useState(false)
  const [configItemForm, setConfigItemForm] = useState({
    name: "",
    category: "",
    color: "#3b82f6",
  })
  const [draggedConfigItem, setDraggedConfigItem] = useState<any>(null)

  const [draggedFieldId, setDraggedFieldId] = useState<string | null>(null)
  const [dragOverFieldId, setDragOverFieldId] = useState<string | null>(null)

  const displayNavigationConfig = optimisticNavigation.length > 0 ? optimisticNavigation : navigationConfig

  const handleUpdateNavigationItem = async (itemId: string, updates: any) => {
    try {
      console.log("Updating navigation item:", itemId, updates)
      await updateNavigationConfig(itemId, updates)
    } catch (error) {
      console.error("Error updating navigation item:", error)
    }
  }

  const handleToggleVisibility = async (item: any, checked: boolean) => {
    try {
      console.log("Toggling visibility for item:", item.id, "to:", checked)
      console.log("Item data:", item)

      const currentItems = optimisticNavigation.length > 0 ? optimisticNavigation : navigationConfig
      const updatedItems = currentItems.map((navItem) =>
        navItem.id === item.id ? { ...navItem, isVisible: checked, is_visible: checked } : navItem,
      )
      setOptimisticNavigation(updatedItems)

      window.dispatchEvent(
        new CustomEvent("optimisticNavigationUpdate", {
          detail: updatedItems,
        }),
      )

      // Update the navigation item with proper field mapping
      await updateNavigationConfig(item.id, {
        is_visible: checked,
        isVisible: checked, // Include both formats for compatibility
      })

      // Dispatch event to refresh navigation
      window.dispatchEvent(new CustomEvent("navigationUpdated"))
      console.log("Navigation toggle completed successfully")

      setTimeout(() => {
        setOptimisticNavigation([])
      }, 500)
    } catch (error) {
      console.error("Error toggling visibility:", error)
      setOptimisticNavigation([])
      // Show user-friendly error message
      alert("Failed to update navigation visibility. Please try again.")
    }
  }

  const handleDragStart = (e: React.DragEvent, item: any) => {
    setDraggedItem(item)
    e.dataTransfer.effectAllowed = "move"
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
    setDragOverIndex(index)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    // Only clear drag over index if we're leaving the container entirely
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX
    const y = e.clientY

    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setDragOverIndex(null)
    }
  }

  const handleDrop = async (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault()
    setDragOverIndex(null)

    if (!draggedItem) return

    const sortedItems = [...navigationConfig].sort(
      (a, b) => (a.sortOrder || a.sort_order || 0) - (b.sortOrder || b.sort_order || 0),
    )

    const draggedIndex = sortedItems.findIndex((item) => item.id === draggedItem.id)

    if (draggedIndex === targetIndex) {
      setDraggedItem(null)
      return
    }

    // Create new array with reordered items
    const reorderedItems = [...sortedItems]
    const [draggedItemData] = reorderedItems.splice(draggedIndex, 1)
    reorderedItems.splice(targetIndex, 0, draggedItemData)

    const optimisticItems = reorderedItems.map((item, index) => ({
      ...item,
      sort_order: index + 1,
      sortOrder: index + 1,
    }))

    setOptimisticNavigation(optimisticItems)
    window.dispatchEvent(
      new CustomEvent("optimisticNavigationUpdate", {
        detail: optimisticItems,
      }),
    )

    const updates = reorderedItems.map((item, index) => ({
      id: item.id,
      orderIndex: index + 1,
    }))

    try {
      console.log("Reordering navigation items:", updates)
      await reorderNavigationConfig(updates)

      window.dispatchEvent(new CustomEvent("navigationUpdated"))

      // The navigationUpdated event will trigger a fresh load from database
    } catch (error) {
      console.error("Error reordering navigation items:", error)
      setOptimisticNavigation([])
    }

    setDraggedItem(null)
  }

  const handleEditNavItem = (item: any) => {
    setEditingNavItem(item)
    setNavItemForm({
      name: item.itemLabel || item.item_label || item.name || "",
      description: item.description || "",
      isVisible: item.isVisible || item.is_visible || false,
      icon: item.icon || "Circle",
    })
    setShowNavItemDialog(true)
  }

  const handleSaveNavItem = async () => {
    try {
      const updates = {
        item_label: navItemForm.name,
        description: navItemForm.description,
        is_visible: navItemForm.isVisible,
        icon: navItemForm.icon,
      }

      if (editingNavItem) {
        const currentItems = optimisticNavigation.length > 0 ? optimisticNavigation : navigationConfig
        const optimisticUpdate = currentItems.map((item) =>
          item.id === editingNavItem.id
            ? {
                ...item,
                itemLabel: navItemForm.name,
                item_label: navItemForm.name,
                description: navItemForm.description,
                isVisible: navItemForm.isVisible,
                is_visible: navItemForm.isVisible,
                icon: navItemForm.icon,
              }
            : item,
        )
        setOptimisticNavigation(optimisticUpdate)

        window.dispatchEvent(
          new CustomEvent("optimisticNavigationUpdate", {
            detail: optimisticUpdate,
          }),
        )

        await handleUpdateNavigationItem(editingNavItem.id, updates)

        window.dispatchEvent(new CustomEvent("navigationUpdated"))

        setTimeout(() => {
          setOptimisticNavigation([])
        }, 500)
      } else {
        await createNavigationConfig({
          item_key: navItemForm.name.toLowerCase().replace(/\s+/g, "-"),
          ...updates,
        })
        window.dispatchEvent(new CustomEvent("navigationUpdated"))
      }

      setShowNavItemDialog(false)
      setEditingNavItem(null)
      setNavItemForm({ name: "", description: "", isVisible: true, icon: "Circle" })
    } catch (error) {
      console.error("Error saving navigation item:", error)
      if (editingNavItem) {
        setOptimisticNavigation([])
      }
    }
  }

  const handleDeleteNavItem = async (itemId: string) => {
    if (confirm("Are you sure you want to delete this navigation item?")) {
      try {
        await deleteNavigationConfig(itemId)
      } catch (error) {
        console.error("Error deleting navigation item:", error)
      }
    }
  }

  const handleAddNavItem = () => {
    setEditingNavItem(null)
    setNavItemForm({ name: "", description: "", isVisible: true, icon: "Circle" })
    setShowNavItemDialog(true)
  }

  const adminUsers = users.filter((user) => user.role === "admin")

  const sortedNavigationConfig = [...displayNavigationConfig].sort(
    (a, b) => (a.sortOrder || a.sort_order || 0) - (b.sortOrder || b.sort_order || 0),
  )

  const handleCreateConfigItem = async (category: string, name: string, color: string) => {
    try {
      await createConfigItem({
        name,
        category,
        color,
        sortOrder: (configItems[category as keyof typeof configItems]?.length || 0) + 1,
      })
    } catch (error) {
      console.error("Error creating config item:", error)
    }
  }

  const handleUpdateConfigItemColor = async (id: string, color: string) => {
    try {
      await updateConfigItem(id, { color })
    } catch (error) {
      console.error("Error updating config item color:", error)
    }
  }

  const handleDeleteConfigItem = async (id: string) => {
    if (confirm("Are you sure you want to delete this item?")) {
      try {
        await deleteConfigItem(id)
      } catch (error) {
        console.error("Error deleting config item:", error)
      }
    }
  }

  const handleConfigItemDragStart = (e: React.DragEvent, item: any) => {
    setDraggedConfigItem(item)
    e.dataTransfer.effectAllowed = "move"
  }

  const handleConfigItemDrop = async (e: React.DragEvent, targetItem: any, category: string) => {
    e.preventDefault()

    if (!draggedConfigItem || draggedConfigItem.id === targetItem.id) {
      setDraggedConfigItem(null)
      return
    }

    const categoryItems = configItems[category as keyof typeof configItems] || []
    const draggedIndex = categoryItems.findIndex((item) => item.id === draggedConfigItem.id)
    const targetIndex = categoryItems.findIndex((item) => item.id === targetItem.id)

    if (draggedIndex === -1 || targetIndex === -1) return

    const reorderedItems = [...categoryItems]
    const [draggedItem] = reorderedItems.splice(draggedIndex, 1)
    reorderedItems.splice(targetIndex, 0, draggedItem)

    const updates = reorderedItems.map((item, index) => ({
      id: item.id,
      sortOrder: index + 1,
    }))

    try {
      await reorderConfigItems(category, updates)
    } catch (error) {
      console.error("Error reordering config items:", error)
    }

    setDraggedConfigItem(null)
  }

  const ConfigSection = ({
    title,
    description,
    category,
    items,
  }: {
    title: string
    description: string
    category: string
    items: any[]
  }) => {
    const [newItem, setNewItem] = useState("")

    const handleAdd = async () => {
      if (newItem.trim()) {
        await handleCreateConfigItem(category, newItem.trim(), getRandomColor())
        setNewItem("")
      }
    }

    const handleDragEnd = (startIndex: number, endIndex: number) => {
      if (startIndex === endIndex) return

      const reorderedItems = [...items]
      const [draggedItem] = reorderedItems.splice(startIndex, 1)
      reorderedItems.splice(endIndex, 0, draggedItem)

      const updates = reorderedItems.map((item, index) => ({
        id: item.id,
        sortOrder: index + 1,
      }))

      reorderConfigItems(category, updates)
    }

    const getRandomColor = () => {
      const colors = ["red", "orange", "yellow", "green", "blue", "purple", "pink"]
      return colors[Math.floor(Math.random() * colors.length)]
    }

    const getColorClasses = (color?: string) => {
      switch (color) {
        case "red":
          return "bg-red-100 text-red-800 border-red-200"
        case "orange":
          return "bg-orange-100 text-orange-800 border-orange-200"
        case "yellow":
          return "bg-yellow-100 text-yellow-800 border-yellow-200"
        case "green":
          return "bg-green-100 text-green-800 border-green-200"
        case "blue":
          return "bg-blue-100 text-blue-800 border-blue-200"
        case "purple":
          return "bg-purple-100 text-purple-800 border-purple-200"
        case "pink":
          return "bg-pink-100 text-pink-800 border-pink-200"
        default:
          return "bg-gray-100 text-gray-800 border-gray-200"
      }
    }

    const colorOptions = ["red", "orange", "yellow", "green", "blue", "purple", "pink", "gray"]

    const handleColorChange = async (id: string, color: string) => {
      try {
        await updateConfigItem(id, { color })
      } catch (error) {
        console.error("Error updating config item color:", error)
      }
    }

    const handleDeleteItem = async (id: string) => {
      if (confirm("Are you sure you want to delete this item?")) {
        try {
          await deleteConfigItem(id)
        } catch (error) {
          console.error("Error deleting config item:", error)
        }
      }
    }

    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                value={newItem}
                onChange={(e) => setNewItem(e.target.value)}
                placeholder="Add new item"
                onKeyPress={(e) => e.key === "Enter" && handleAdd()}
              />
            </div>

            <div className="flex flex-wrap gap-2 min-h-[40px] p-2 border-2 border-dashed border-gray-200 rounded-lg">
              {items.map((item, index) => (
                <div
                  key={item.id}
                  className={`inline-flex items-center gap-1 px-2 py-1 rounded-md border text-sm font-medium ${getColorClasses(
                    item.color,
                  )}`}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData("text/plain", index.toString())
                  }}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault()
                    const draggedIndex = Number.parseInt(e.dataTransfer.getData("text/plain"))
                    handleDragEnd(draggedIndex, index)
                  }}
                >
                  <GripVertical className="w-3 h-3 opacity-50" />
                  <span>{item.name || item.label || "Unnamed Item"}</span>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-auto p-0 hover:bg-transparent">
                        <Palette className="w-3 h-3" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-2">
                      <div className="grid grid-cols-4 gap-1">
                        {colorOptions.map((color) => (
                          <Button
                            key={color}
                            variant="ghost"
                            size="sm"
                            className={`w-6 h-6 p-0 rounded-full ${getColorClasses(color).split(" ")[0]}`}
                            onClick={() => handleColorChange(item.id, color)}
                          />
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 hover:bg-transparent"
                    onClick={() => handleDeleteItem(item.id)}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const handleToggleFieldRequired = async (fieldId: string, isRequired: boolean) => {
    try {
      await updateFieldConfiguration(fieldId, { isRequired })
      // Dispatch event to refresh any dependent components
      window.dispatchEvent(new CustomEvent("fieldConfigurationUpdated"))
    } catch (error) {
      console.error("Error updating field required status:", error)
    }
  }

  const handleToggleFieldVisible = async (fieldId: string, isVisible: boolean) => {
    try {
      await updateFieldConfiguration(fieldId, { isVisible })
      // Dispatch event to refresh any dependent components
      window.dispatchEvent(new CustomEvent("fieldConfigurationUpdated"))
    } catch (error) {
      console.error("Error updating field visibility:", error)
    }
  }

  const handleFieldDrop = async (sectionKey: string, draggedId: string, targetId: string) => {
    if (draggedId === targetId) return

    const fields = fieldConfigurations[sectionKey] || []
    const draggedIndex = fields.findIndex((f) => f.id === draggedId)
    const targetIndex = fields.findIndex((f) => f.id === targetId)

    if (draggedIndex === -1 || targetIndex === -1) return

    // Create reordered array
    const reorderedFields = [...fields]
    const [draggedField] = reorderedFields.splice(draggedIndex, 1)
    reorderedFields.splice(targetIndex, 0, draggedField)

    const updates = reorderedFields.map((field, index) => ({
      id: field.id,
      order: index + 1,
    }))

    try {
      await reorderFieldConfigurations(updates)

      // Dispatch event to refresh
      window.dispatchEvent(new CustomEvent("fieldConfigurationUpdated"))
    } catch (error) {
      console.error("Error reordering fields:", error)
    }

    setDraggedFieldId(null)
    setDragOverFieldId(null)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Admin Panel</h1>
        <p className="text-muted-foreground">Manage users, system settings, and database configuration</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.length}</div>
            <p className="text-xs text-muted-foreground">Active system users</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Initiatives</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{initiatives.length}</div>
            <p className="text-xs text-muted-foreground">Total initiatives</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Achievements</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{achievements.length}</div>
            <p className="text-xs text-muted-foreground">Recorded achievements</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Admins</CardTitle>
            <SettingsIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{adminUsers.length}</div>
            <p className="text-xs text-muted-foreground">System administrators</p>
          </CardContent>
        </Card>
      </div>

      {/* Admin Tabs */}
      <Tabs defaultValue="navigation" className="space-y-4">
        <TabsList>
          <TabsTrigger value="users">User Management</TabsTrigger>
          <TabsTrigger value="navigation">Navigation</TabsTrigger>
          <TabsTrigger value="config">Configuration</TabsTrigger>
          <TabsTrigger value="fields">Required Fields</TabsTrigger>
          <TabsTrigger value="database">Database</TabsTrigger>
        </TabsList>

        <TabsContent value="navigation" className="space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold tracking-tight">Navigation Management</h2>
                <p className="text-muted-foreground">
                  Manage navigation menu items. Drag to reorder, toggle visibility, edit names, or add custom navigation
                  items.
                </p>
              </div>
            </div>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Navigation Items</CardTitle>
                  <CardDescription>
                    Manage navigation menu items - drag to reorder, toggle visibility, or edit properties
                  </CardDescription>
                </div>
                <Button onClick={handleAddNavItem}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Navigation Item
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {sortedNavigationConfig.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No navigation items found. Add some items to get started.
                  </div>
                ) : (
                  sortedNavigationConfig.map((item, index) => (
                    <div
                      key={item.id}
                      className={`flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors cursor-move ${
                        dragOverIndex === index ? "border-blue-500 bg-blue-50" : ""
                      } ${draggedItem?.id === item.id ? "opacity-50" : ""}`}
                      draggable
                      onDragStart={(e) => handleDragStart(e, item)}
                      onDragOver={(e) => handleDragOver(e, index)}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, index)}
                    >
                      <div className="flex items-center gap-3">
                        <GripVertical className="h-4 w-4 text-gray-400 cursor-move hover:text-gray-600" />
                        {(() => {
                          switch (item.icon) {
                            case "Circle":
                              return <Circle className="h-5 w-5 text-gray-600" />
                            case "CheckCircle":
                              return <CheckCircle className="h-5 w-5 text-gray-600" />
                            case "Target":
                              return <TargetIcon className="h-5 w-5 text-gray-600" />
                            case "Flag":
                              return <Flag className="h-5 w-5 text-gray-600" />
                            case "Star":
                              return <Star className="h-5 w-5 text-gray-600" />
                            case "Home":
                              return <Home className="h-5 w-5 text-gray-600" />
                            case "Calendar":
                              return <Calendar className="h-5 w-5 text-gray-600" />
                            case "FileText":
                              return <FileText className="h-5 w-5 text-gray-600" />
                            case "Settings":
                              return <Settings className="h-5 w-5 text-gray-600" />
                            case "Users":
                              return <UsersIcon className="h-5 w-5 text-gray-600" />
                            case "BarChart3":
                              return <BarChart3 className="h-5 w-5 text-gray-600" />
                            case "Zap":
                              return <Zap className="h-5 w-5 text-gray-600" />
                            default:
                              return <Circle className="h-5 w-5 text-gray-600" />
                          }
                        })()}
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            {item.itemLabel || item.item_label || item.name || "Unnamed Item"}
                          </span>
                          {!(item.isVisible || item.is_visible) && <Badge variant="secondary">Hidden</Badge>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">Visible</span>
                        <Switch
                          checked={Boolean(item.isVisible === true || item.is_visible === true)}
                          onCheckedChange={(checked) => handleToggleVisibility(item, checked)}
                          disabled={false}
                        />
                        <Button variant="ghost" size="sm" onClick={() => handleEditNavItem(item)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDeleteNavItem(item.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>Manage system users and their roles</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {users.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <div className="font-medium">{user.name}</div>
                      <div className="text-sm text-muted-foreground">{user.email}</div>
                    </div>
                    <Badge variant={user.role === "admin" ? "default" : "secondary"}>{user.role}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="config" className="space-y-4">
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">System Configuration</h2>
              <p className="text-muted-foreground">Configure system-wide settings</p>
            </div>

            <div className="space-y-6">
              <ConfigSection
                title="Teams"
                description="Manage teams options - drag to reorder, click palette to change colors"
                category="teams"
                items={configItems.teams}
              />

              <ConfigSection
                title="Business Impacts"
                description="Manage businessimpacts options - drag to reorder, click palette to change colors"
                category="businessImpacts"
                items={configItems.businessImpacts}
              />

              <ConfigSection
                title="Product Areas"
                description="Manage productareas options - drag to reorder, click palette to change colors"
                category="productAreas"
                items={configItems.productAreas}
              />

              <ConfigSection
                title="Process Stages"
                description="Manage processstages options - drag to reorder, click palette to change colors"
                category="processStages"
                items={configItems.processStages}
              />

              <ConfigSection
                title="Priorities"
                description="Manage priorities options - drag to reorder, click palette to change colors"
                category="priorities"
                items={configItems.priorities}
              />

              <ConfigSection
                title="Statuses"
                description="Manage statuses options - drag to reorder, click palette to change colors"
                category="statuses"
                items={configItems.statuses}
              />

              <ConfigSection
                title="Gtm Types"
                description="Manage gtmtypes options - drag to reorder, click palette to change colors"
                category="gtmTypes"
                items={configItems.gtmTypes}
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="fields" className="space-y-4">
          {Object.entries(fieldConfigurations).map(([sectionKey, fields]) => {
            const sectionTitle = sectionKey
              .replace(/([A-Z])/g, " $1")
              .replace(/^./, (str) => str.toUpperCase())
              .trim()

            return (
              <Card key={sectionKey}>
                <CardHeader>
                  <CardTitle>{sectionTitle}</CardTitle>
                  <CardDescription>
                    Configure field requirements and validation for {sectionTitle.toLowerCase()} section
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {fields
                      .sort((a, b) => (a.order || 0) - (b.order || 0))
                      .map((field) => (
                        <div
                          key={field.id}
                          className={`flex items-center justify-between p-4 border rounded-lg transition-all ${
                            draggedFieldId === field.id ? "opacity-50 scale-95" : ""
                          } ${dragOverFieldId === field.id ? "border-blue-300 bg-blue-50" : ""}`}
                          draggable
                          onDragStart={(e) => {
                            setDraggedFieldId(field.id)
                            e.dataTransfer.effectAllowed = "move"
                          }}
                          onDragOver={(e) => {
                            e.preventDefault()
                            e.dataTransfer.dropEffect = "move"
                            setDragOverFieldId(field.id)
                          }}
                          onDragLeave={(e) => {
                            if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                              setDragOverFieldId(null)
                            }
                          }}
                          onDrop={(e) => {
                            e.preventDefault()
                            if (draggedFieldId && draggedFieldId !== field.id) {
                              handleFieldDrop(sectionKey, draggedFieldId, field.id)
                            }
                          }}
                          onDragEnd={() => {
                            setDraggedFieldId(null)
                            setDragOverFieldId(null)
                          }}
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-3">
                              <GripVertical className="w-4 h-4 text-gray-400 cursor-grab active:cursor-grabbing" />
                              <div className="flex-1">
                                <h4 className="font-medium">
                                  {field.label || field.fieldName || field.name || "Unnamed Field"}
                                </h4>
                                <p className="text-sm text-muted-foreground">
                                  Type: {field.fieldType} • Order: {field.order || "Not set"}
                                </p>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                              <Label htmlFor={`required-${field.id}`} className="text-sm">
                                Required
                              </Label>
                              <button
                                id={`required-${field.id}`}
                                onClick={() => handleToggleFieldRequired(field.id, !field.isRequired)}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                                  field.isRequired ? "bg-blue-600" : "bg-gray-200"
                                }`}
                              >
                                <span
                                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                    field.isRequired ? "translate-x-6" : "translate-x-1"
                                  }`}
                                />
                              </button>
                            </div>

                            <div className="flex items-center gap-2">
                              <Label htmlFor={`visible-${field.id}`} className="text-sm">
                                Visible
                              </Label>
                              <button
                                id={`visible-${field.id}`}
                                onClick={() => handleToggleFieldVisible(field.id, !field.isVisible)}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                                  field.isVisible ? "bg-green-600" : "bg-gray-200"
                                }`}
                              >
                                <span
                                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                    field.isVisible ? "translate-x-6" : "translate-x-1"
                                  }`}
                                />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    {fields.length === 0 && (
                      <p className="text-muted-foreground text-center py-8">No fields configured for this section</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </TabsContent>

        <TabsContent value="database" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Database Connection Test</CardTitle>
              <CardDescription>Test and monitor database connections and table status</CardDescription>
            </CardHeader>
            <CardContent>
              <DatabaseConnectionTest />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Navigation Item Dialog */}
      <Dialog open={showNavItemDialog} onOpenChange={setShowNavItemDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingNavItem ? "Edit Navigation Item" : "Add Navigation Item"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={navItemForm.name}
                onChange={(e) => setNavItemForm({ ...navItemForm, name: e.target.value })}
                placeholder="Navigation item name"
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={navItemForm.description}
                onChange={(e) => setNavItemForm({ ...navItemForm, description: e.target.value })}
                placeholder="Optional description"
              />
            </div>
            <div>
              <Label htmlFor="icon">Icon</Label>
              <Select
                value={navItemForm.icon}
                onValueChange={(value) => setNavItemForm({ ...navItemForm, icon: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select an icon" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Circle">
                    <div className="flex items-center gap-2">
                      <Circle className="w-4 h-4" />
                      Circle
                    </div>
                  </SelectItem>
                  <SelectItem value="CheckCircle">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      Check Circle
                    </div>
                  </SelectItem>
                  <SelectItem value="Target">
                    <div className="flex items-center gap-2">
                      <TargetIcon className="w-4 h-4" />
                      Target
                    </div>
                  </SelectItem>
                  <SelectItem value="Flag">
                    <div className="flex items-center gap-2">
                      <Flag className="w-4 h-4" />
                      Flag
                    </div>
                  </SelectItem>
                  <SelectItem value="Star">
                    <div className="flex items-center gap-2">
                      <Star className="w-4 h-4" />
                      Star
                    </div>
                  </SelectItem>
                  <SelectItem value="Home">
                    <div className="flex items-center gap-2">
                      <Home className="w-4 h-4" />
                      Home
                    </div>
                  </SelectItem>
                  <SelectItem value="Calendar">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Calendar
                    </div>
                  </SelectItem>
                  <SelectItem value="FileText">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      File Text
                    </div>
                  </SelectItem>
                  <SelectItem value="Settings">
                    <div className="flex items-center gap-2">
                      <Settings className="w-4 h-4" />
                      Settings
                    </div>
                  </SelectItem>
                  <SelectItem value="Users">
                    <div className="flex items-center gap-2">
                      <UsersIcon className="w-4 h-4" />
                      Users
                    </div>
                  </SelectItem>
                  <SelectItem value="BarChart3">
                    <div className="flex items-center gap-2">
                      <BarChart3 className="w-4 h-4" />
                      Bar Chart
                    </div>
                  </SelectItem>
                  <SelectItem value="Zap">
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4" />
                      Zap
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="visible"
                checked={Boolean(navItemForm.isVisible)}
                onCheckedChange={(checked) => setNavItemForm({ ...navItemForm, isVisible: checked })}
                disabled={false}
              />
              <Label htmlFor="visible">Visible in navigation</Label>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowNavItemDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveNavItem}>{editingNavItem ? "Update" : "Create"}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showConfigItemDialog} onOpenChange={setShowConfigItemDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Configuration Item</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="config-name">Name</Label>
              <Input
                id="config-name"
                value={configItemForm.name}
                onChange={(e) => setConfigItemForm({ ...configItemForm, name: e.target.value })}
                placeholder="Item name"
              />
            </div>
            <div>
              <Label htmlFor="config-color">Color</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  id="config-color"
                  value={configItemForm.color}
                  onChange={(e) => setConfigItemForm({ ...configItemForm, color: e.target.value })}
                  className="w-12 h-10 rounded border cursor-pointer"
                />
                <Input
                  value={configItemForm.color}
                  onChange={(e) => setConfigItemForm({ ...configItemForm, color: e.target.value })}
                  placeholder="#3b82f6"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowConfigItemDialog(false)}>
                Cancel
              </Button>
              <Button
                onClick={async () => {
                  await handleCreateConfigItem(configItemForm.category, configItemForm.name, configItemForm.color)
                  setShowConfigItemDialog(false)
                  setConfigItemForm({ name: "", category: "", color: "#3b82f6" })
                }}
              >
                Create
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default AdminPanel
