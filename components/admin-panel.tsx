"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useSupabaseDatabase } from "@/contexts/api-database-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import {
  Trash2,
  Edit,
  Plus,
  GripVertical,
  Users,
  Target,
  Trophy,
  SettingsIcon,
  BarChart3,
  FileText,
  Calendar,
  Home,
  Circle,
  CheckCircle,
  Flag,
  Star,
  Zap,
  X,
  Palette,
} from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { getDatabaseService } from "@/lib/supabase/database-service"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { DatabaseConnectionTest } from "@/components/database-connection-test"

interface User {
  id: string
  name: string
  email: string
  role: string
  created_at?: string
}

interface Initiative {
  id: string
  title: string
  description?: string
}

export function AdminPanel() {
  const {
    users,
    navigationConfig,
    initiatives,
    achievements,
    configItems,
    allConfigItems,
    fieldConfigurations,
    allFieldConfigurations,
    createUser,
    updateUser,
    deleteUser,
    updateNavigationConfig,
    reorderNavigationConfig,
    createConfigItem,
    updateConfigItem,
    deleteConfigItem,
    reorderConfigItems,
    loadUsers,
    loadNavigationConfig,
    updateFieldConfiguration,
    reorderFieldConfigurations,
  } = useSupabaseDatabase()

  // User management state
  const [isUserModalOpen, setIsUserModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [userForm, setUserForm] = useState({ name: "", email: "", role: "user" })
  const [deleteUserToConfirm, setDeleteUserToConfirm] = useState<User | null>(null)
  const [userOwnedInitiatives, setUserOwnedInitiatives] = useState<Initiative[]>([])
  const [transferToUserId, setTransferToUserId] = useState<string>("")

  // Navigation management state
  const [isNavModalOpen, setIsNavModalOpen] = useState(false)
  const [editingNavItem, setEditingNavItem] = useState<any>(null)
  const [navItemForm, setNavItemForm] = useState({ name: "", description: "", isVisible: true, icon: "Circle" })
  const [draggedItem, setDraggedItem] = useState<any>(null)
  const [dragOverItem, setDragOverItem] = useState<any>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [optimisticNavigation, setOptimisticNavigation] = useState<any[]>([])

  // Config item management state
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false)
  const [editingConfigItem, setEditingConfigItem] = useState<any>(null)
  const [configItemForm, setConfigItemForm] = useState({
    category: "",
    label: "",
    color: "gray",
    isActive: true,
  })
  const [selectedCategory, setSelectedCategory] = useState<string>("teams")

  const [newItemInputs, setNewItemInputs] = useState<Record<string, string>>({})

  // Field configuration state
  const [draggedFieldId, setDraggedFieldId] = useState<string | null>(null)
  const [dragOverFieldId, setDragOverFieldId] = useState<string | null>(null)

  useEffect(() => {
    // Only set optimistic navigation if it's empty (initial load) or if there was an error
    if (navigationConfig && optimisticNavigation.length === 0) {
      setOptimisticNavigation([...navigationConfig])
    }
  }, [navigationConfig]) // Removed optimisticNavigation from dependency array to prevent infinite loops

  // User management functions
  const handleCreateUser = () => {
    setEditingUser(null)
    setUserForm({ name: "", email: "", role: "user" })
    setIsUserModalOpen(true)
  }

  const handleEditUser = (user: User) => {
    setEditingUser(user)
    setUserForm({ name: user.name, email: user.email, role: user.role })
    setIsUserModalOpen(true)
  }

  const handleDeleteUser = async (user: User) => {
    try {
      const [ownedInitiatives, createdInitiatives] = await Promise.all([
        getDatabaseService().getInitiativesByOwner(user.id),
        getDatabaseService().getInitiativesByCreator(user.id),
      ])

      const allInitiatives = [...ownedInitiatives, ...createdInitiatives]

      if (allInitiatives.length > 0) {
        // User has initiatives - show transfer modal
        setUserOwnedInitiatives(allInitiatives)
        setDeleteUserToConfirm(user)
        setTransferToUserId("")
      } else {
        // No initiatives - delete immediately
        await deleteUser(user.id)
        toast({
          title: "Success",
          description: `User ${user.name} has been deleted successfully.`,
        })
      }
    } catch (error: any) {
      console.error("Error checking user initiatives:", error)
      toast({
        title: "Error",
        description: "Failed to check user initiatives. Please try again.",
        variant: "destructive",
      })
    }
  }

  const confirmDeleteUser = async () => {
    if (!deleteUserToConfirm) return

    try {
      if (userOwnedInitiatives.length > 0 && transferToUserId) {
        await getDatabaseService().transferInitiativeRelationships(deleteUserToConfirm.id, transferToUserId)
      }

      await deleteUser(deleteUserToConfirm.id)
      toast({
        title: "Success",
        description: `User ${deleteUserToConfirm.name} has been deleted successfully.`,
      })
      setDeleteUserToConfirm(null)
      setUserOwnedInitiatives([])
      setTransferToUserId("")
    } catch (error: any) {
      // Revert optimistic update on error
      setOptimisticNavigation([...navigationConfig])
      window.dispatchEvent(
        new CustomEvent("optimisticNavigationUpdate", {
          detail: navigationConfig,
        }),
      )

      console.error("Error deleting user:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to delete user. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleSaveUser = async () => {
    try {
      if (editingUser) {
        await updateUser(editingUser.id, userForm)
        toast({
          title: "Success",
          description: "User updated successfully",
        })
      } else {
        await createUser(userForm)
        toast({
          title: "Success",
          description: "User created successfully",
        })
      }
      setIsUserModalOpen(false)
      setUserForm({ name: "", email: "", role: "user" })
      setEditingUser(null)
    } catch (error: any) {
      console.error("Error saving user:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to save user",
        variant: "destructive",
      })
    }
  }

  // Navigation management functions
  const handleToggleVisibility = async (item: any) => {
    const newVisibility = !(item.isVisible !== undefined ? item.isVisible : item.is_visible)

    // Optimistic update
    const updatedItems = optimisticNavigation.map((navItem) =>
      navItem.id === item.id ? { ...navItem, isVisible: newVisibility, is_visible: newVisibility } : navItem,
    )
    setOptimisticNavigation(updatedItems)

    // Dispatch event for main navigation
    window.dispatchEvent(
      new CustomEvent("optimisticNavigationUpdate", {
        detail: updatedItems,
      }),
    )

    try {
      await updateNavigationConfig(item.id, {
        is_visible: newVisibility,
        isVisible: newVisibility,
      })
    } catch (error: any) {
      // Revert optimistic update on error
      setOptimisticNavigation([...navigationConfig])
      window.dispatchEvent(
        new CustomEvent("optimisticNavigationUpdate", {
          detail: navigationConfig,
        }),
      )

      console.error("Error updating visibility:", error)
      toast({
        title: "Error",
        description: "Failed to update visibility",
        variant: "destructive",
      })
    }
  }

  const handleDragStart = (e: React.DragEvent, item: any) => {
    setDraggedItem(item)
    setIsDragging(true)
    e.dataTransfer.effectAllowed = "move"
    e.dataTransfer.setData("text/plain", item.id)

    // Add visual feedback to dragged element
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = "0.5"
    }
  }

  const handleDragEnd = (e: React.DragEvent) => {
    // Reset visual states
    setDraggedItem(null)
    setDragOverItem(null)
    setIsDragging(false)

    // Reset opacity
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = "1"
    }
  }

  const handleDragOver = (e: React.DragEvent, item: any) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"

    // Set drag over item for visual feedback
    if (draggedItem && draggedItem.id !== item.id) {
      setDragOverItem(item)
    }
  }

  const handleDragLeave = (e: React.DragEvent) => {
    // Only clear drag over if we're actually leaving the element
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setDragOverItem(null)
    }
  }

  const handleDrop = async (e: React.DragEvent, targetItem: any) => {
    e.preventDefault()
    setDragOverItem(null)

    if (!draggedItem || draggedItem.id === targetItem.id) {
      setDraggedItem(null)
      setIsDragging(false)
      return
    }

    const currentItems = [...optimisticNavigation].sort((a, b) => {
      const orderA = a.sortOrder || a.sort_order || 0
      const orderB = b.sortOrder || b.sort_order || 0
      return orderA - orderB
    })

    const draggedIndex = currentItems.findIndex((item) => item.id === draggedItem.id)
    const targetIndex = currentItems.findIndex((item) => item.id === targetItem.id)

    if (draggedIndex === -1 || targetIndex === -1) return

    // Remove dragged item and insert at target position
    const [removed] = currentItems.splice(draggedIndex, 1)
    currentItems.splice(targetIndex, 0, removed)

    // Update sort orders to match new positions
    const reorderedItems = currentItems.map((item, index) => ({
      ...item,
      sortOrder: index + 1,
      sort_order: index + 1,
    }))

    // STEP 1: Update Navigation management order (immediate UI update)
    setOptimisticNavigation(reorderedItems)

    // STEP 2: Update main navigation (dispatch event)
    window.dispatchEvent(
      new CustomEvent("optimisticNavigationUpdate", {
        detail: reorderedItems,
      }),
    )

    // STEP 3: Backend API calls (async, don't block UI)
    setTimeout(async () => {
      try {
        const updates = reorderedItems.map((item, index) => ({
          id: item.id,
          orderIndex: index + 1,
        }))

        await reorderNavigationConfig(updates)

        window.dispatchEvent(
          new CustomEvent("navigationUpdated", {
            detail: { type: "reorder", success: true },
          }),
        )
      } catch (error: any) {
        // Revert optimistic update on error
        setOptimisticNavigation([...navigationConfig])
        window.dispatchEvent(
          new CustomEvent("optimisticNavigationUpdate", {
            detail: navigationConfig,
          }),
        )

        console.error("Error reordering navigation:", error)
        toast({
          title: "Error",
          description: "Failed to reorder navigation items",
          variant: "destructive",
        })
      }
    }, 0)

    setDraggedItem(null)
    setIsDragging(false)
  }

  const handleEditNavItem = (item: any) => {
    setEditingNavItem(item)
    setNavItemForm({
      name: item.itemLabel || item.item_label || item.name || "",
      description: item.description || "",
      isVisible: item.isVisible !== undefined ? item.isVisible : item.is_visible !== undefined ? item.is_visible : true,
      icon: item.icon || "Circle",
    })
    setIsNavModalOpen(true)
  }

  const handleSaveNavItem = async () => {
    if (!editingNavItem) return

    // Optimistic update
    const updatedItems = optimisticNavigation.map((item) =>
      item.id === editingNavItem.id
        ? {
            ...item,
            itemLabel: navItemForm.name,
            item_label: navItemForm.name,
            isVisible: navItemForm.isVisible,
            is_visible: navItemForm.isVisible,
            icon: navItemForm.icon,
          }
        : item,
    )
    setOptimisticNavigation(updatedItems)

    // Dispatch event for main navigation
    window.dispatchEvent(
      new CustomEvent("optimisticNavigationUpdate", {
        detail: updatedItems,
      }),
    )

    try {
      await updateNavigationConfig(editingNavItem.id, {
        item_label: navItemForm.name,
        itemLabel: navItemForm.name,
        is_visible: navItemForm.isVisible,
        isVisible: navItemForm.isVisible,
        icon: navItemForm.icon,
      })

      setIsNavModalOpen(false)
      setEditingNavItem(null)
      setNavItemForm({ name: "", description: "", isVisible: true, icon: "Circle" })

      toast({
        title: "Success",
        description: "Navigation item updated successfully",
      })
    } catch (error: any) {
      // Revert optimistic update on error
      setOptimisticNavigation([...navigationConfig])
      window.dispatchEvent(
        new CustomEvent("optimisticNavigationUpdate", {
          detail: navigationConfig,
        }),
      )

      console.error("Error updating navigation item:", error)
      toast({
        title: "Error",
        description: "Failed to update navigation item",
        variant: "destructive",
      })
    }
  }

  const getIcon = (iconName: string) => {
    const icons: { [key: string]: any } = {
      BarChart3,
      Target,
      FileText,
      Calendar,
      Settings: SettingsIcon,
      Home,
      Circle,
      CheckCircle,
      Flag,
      Star,
      Zap,
      Users,
    }
    return icons[iconName] || BarChart3
  }

  const availableUsers = users?.filter((u) => u.id !== deleteUserToConfirm?.id) || []

  // Config item management functions
  const handleCreateConfigItem = (category: string) => {
    setEditingConfigItem(null)
    setConfigItemForm({
      category,
      label: "",
      color: "gray",
      isActive: true,
    })
    setIsConfigModalOpen(true)
  }

  const handleEditConfigItem = (item: any) => {
    setEditingConfigItem(item)
    setConfigItemForm({
      category: item.category,
      label: item.label,
      color: item.color || "gray",
      isActive: item.isActive !== undefined ? item.isActive : true,
    })
    setIsConfigModalOpen(true)
  }

  const handleSaveConfigItem = async () => {
    try {
      if (editingConfigItem) {
        await updateConfigItem(editingConfigItem.id, configItemForm)
        toast({
          title: "Success",
          description: "Configuration item updated successfully",
        })
      } else {
        await createConfigItem({
          ...configItemForm,
          sortOrder: (configItems[configItemForm.category as keyof typeof configItems]?.length || 0) + 1,
        })
        toast({
          title: "Success",
          description: "Configuration item created successfully",
        })
      }
      setIsConfigModalOpen(false)
      setConfigItemForm({ category: "", label: "", color: "gray", isActive: true })
      setEditingConfigItem(null)
    } catch (error: any) {
      console.error("Error saving config item:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to save configuration item",
        variant: "destructive",
      })
    }
  }

  const handleDeleteConfigItem = async (item: any) => {
    if (confirm(`Are you sure you want to delete "${item.label}"?`)) {
      try {
        await deleteConfigItem(item.id)
        toast({
          title: "Success",
          description: "Configuration item deleted successfully",
        })
      } catch (error: any) {
        console.error("Error deleting config item:", error)
        toast({
          title: "Error",
          description: error.message || "Failed to delete configuration item",
          variant: "destructive",
        })
      }
    }
  }

  const handleAddConfigItem = async (category: string, label: string) => {
    if (!label) return

    try {
      await createConfigItem({
        category,
        label,
        color: "gray",
        isActive: true,
        sortOrder: (configItems[category as keyof typeof configItems]?.length || 0) + 1,
      })
      setNewItemInputs({ ...newItemInputs, [category]: "" })
      toast({
        title: "Success",
        description: "Configuration item added successfully",
      })
    } catch (error: any) {
      console.error("Error adding config item:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to add configuration item",
        variant: "destructive",
      })
    }
  }

  const handleColorChange = async (item: any, color: string) => {
    try {
      await updateConfigItem(item.id, { ...item, color })
      toast({
        title: "Success",
        description: "Color updated successfully",
      })
    } catch (error: any) {
      console.error("Error updating color:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to update color",
        variant: "destructive",
      })
    }
  }

  const handleRemoveConfigItem = async (item: any) => {
    try {
      await deleteConfigItem(item.id)
      toast({
        title: "Success",
        description: "Configuration item removed successfully",
      })
    } catch (error: any) {
      console.error("Error removing config item:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to remove configuration item",
        variant: "destructive",
      })
    }
  }

  const getCategoryDisplayName = (category: string) => {
    const names: { [key: string]: string } = {
      teams: "Teams",
      businessImpacts: "Business Impacts",
      productAreas: "Product Areas",
      processStages: "Process Stages",
      priorities: "Priorities",
      statuses: "Statuses",
      gtmTypes: "GTM Types",
    }
    return names[category] || category
  }

  const getColorClasses = (color: string) => {
    const colors: { [key: string]: string } = {
      gray: "bg-gray-100 text-gray-800 border-gray-200",
      red: "bg-red-100 text-red-800 border-red-200",
      orange: "bg-orange-100 text-orange-800 border-orange-200",
      yellow: "bg-yellow-100 text-yellow-800 border-yellow-200",
      green: "bg-green-100 text-green-800 border-green-200",
      blue: "bg-blue-100 text-blue-800 border-blue-200",
      purple: "bg-purple-100 text-purple-800 border-purple-200",
      pink: "bg-pink-100 text-pink-800 border-pink-200",
    }
    return colors[color] || colors.gray
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
        await handleAddConfigItem(category, newItem.trim())
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
        toast({
          title: "Success",
          description: "Color updated successfully",
        })
      } catch (error: any) {
        console.error("Error updating config item color:", error)
        toast({
          title: "Error",
          description: error.message || "Failed to update color",
          variant: "destructive",
        })
      }
    }

    const handleDeleteItem = async (id: string) => {
      try {
        await deleteConfigItem(id)
        toast({
          title: "Success",
          description: "Configuration item removed successfully",
        })
      } catch (error: any) {
        console.error("Error deleting config item:", error)
        toast({
          title: "Error",
          description: error.message || "Failed to remove configuration item",
          variant: "destructive",
        })
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
      toast({
        title: "Success",
        description: `Field requirement updated successfully`,
      })
    } catch (error: any) {
      console.error("Error updating field requirement:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to update field requirement",
        variant: "destructive",
      })
    }
  }

  const handleToggleFieldVisible = async (fieldId: string, isVisible: boolean) => {
    try {
      await updateFieldConfiguration(fieldId, { isVisible })
      toast({
        title: "Success",
        description: `Field visibility updated successfully`,
      })
    } catch (error: any) {
      console.error("Error updating field visibility:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to update field visibility",
        variant: "destructive",
      })
    }
  }

  const handleFieldDrop = async (sectionKey: string, draggedFieldId: string, targetFieldId: string) => {
    try {
      if (!fieldConfigurations) return

      const sectionFields = [...fieldConfigurations[sectionKey]]
      const draggedIndex = sectionFields.findIndex((field) => field.id === draggedFieldId)
      const targetIndex = sectionFields.findIndex((field) => field.id === targetFieldId)

      if (draggedIndex === -1 || targetIndex === -1) {
        console.warn("Dragged or target field not found in section.")
        return
      }

      const [draggedField] = sectionFields.splice(draggedIndex, 1)
      sectionFields.splice(targetIndex, 0, draggedField)

      const updates = sectionFields.map((field, index) => ({
        id: field.id,
        order: index + 1,
      }))

      await reorderFieldConfigurations(updates)

      toast({
        title: "Success",
        description: "Field order updated successfully",
      })
    } catch (error: any) {
      console.error("Error reordering fields:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to reorder fields",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Admin Panel</h1>
        <p className="text-muted-foreground">Manage users, system settings, and database configuration</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users?.length || 0}</div>
            <p className="text-xs text-muted-foreground">Active system users</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Initiatives</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{initiatives?.length || 0}</div>
            <p className="text-xs text-muted-foreground">Total initiatives</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Achievements</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{achievements?.length || 0}</div>
            <p className="text-xs text-muted-foreground">Recorded achievements</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Admins</CardTitle>
            <SettingsIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users?.filter((u) => u.role === "admin").length || 0}</div>
            <p className="text-xs text-muted-foreground">System administrators</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="users" className="space-y-4">
        <TabsList>
          <TabsTrigger value="users">User Management</TabsTrigger>
          <TabsTrigger value="navigation">Navigation</TabsTrigger>
          <TabsTrigger value="config">Configuration</TabsTrigger>
          <TabsTrigger value="fields">Required Fields</TabsTrigger>
          <TabsTrigger value="database">Database</TabsTrigger>
        </TabsList>

        {/* User Management Tab */}
        <TabsContent value="users" className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">User Management</h2>
              <p className="text-muted-foreground">Manage system users and their roles</p>
            </div>
            <Button onClick={handleCreateUser}>
              <Plus className="h-4 w-4 mr-2" />
              Create User
            </Button>
          </div>

          <div className="space-y-4">
            {users?.map((user) => (
              <Card key={user.id}>
                <CardContent className="flex items-center justify-between p-4">
                  <div>
                    <h3 className="font-semibold">{user.name}</h3>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={user.role === "admin" ? "default" : "secondary"}>{user.role}</Badge>
                    <Button variant="ghost" size="sm" onClick={() => handleEditUser(user)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDeleteUser(user)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Navigation Management Tab */}
        <TabsContent value="navigation" className="space-y-4">
          <div>
            <h2 className="text-2xl font-bold">Navigation Management</h2>
            <p className="text-muted-foreground">
              Manage navigation menu items. Drag to reorder, toggle visibility, edit names, or add custom navigation
              items.
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Navigation Items</h3>
              <p className="text-sm text-muted-foreground">
                Manage navigation menu items - drag to reorder, toggle visibility, or edit properties
              </p>
            </div>

            <div className="space-y-2">
              {optimisticNavigation
                ?.sort((a, b) => {
                  const orderA = a.sortOrder || a.sort_order || 0
                  const orderB = b.sortOrder || b.sort_order || 0
                  return orderA - orderB
                })
                .map((item) => {
                  const IconComponent = getIcon(item.icon)
                  const isVisible = item.isVisible !== undefined ? item.isVisible : item.is_visible
                  const isDraggedItem = draggedItem?.id === item.id
                  const isDragOver = dragOverItem?.id === item.id

                  return (
                    <Card
                      key={item.id}
                      className={`
                        cursor-move transition-all duration-200
                        ${isDraggedItem ? "opacity-50 scale-105 shadow-lg bg-blue-50 border-blue-200" : "hover:bg-muted/50"}
                        ${isDragOver ? "border-blue-400 border-2 bg-blue-50" : ""}
                        ${isDragging && !isDraggedItem ? "hover:border-blue-300 hover:bg-blue-25" : ""}
                      `}
                      draggable
                      onDragStart={(e) => handleDragStart(e, item)}
                      onDragEnd={handleDragEnd}
                      onDragOver={(e) => handleDragOver(e, item)}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, item)}
                    >
                      <CardContent className="flex items-center justify-between p-4">
                        <div className="flex items-center gap-3">
                          <GripVertical
                            className={`h-4 w-4 transition-colors ${
                              isDraggedItem ? "text-blue-500" : "text-muted-foreground"
                            }`}
                          />
                          <IconComponent className={`h-4 w-4 ${isDraggedItem ? "text-blue-500" : ""}`} />
                          <span className={`font-medium ${isDraggedItem ? "text-blue-700" : ""}`}>
                            {item.itemLabel || item.item_label || item.name}
                          </span>
                          {!isVisible && (
                            <Badge variant="secondary" className="text-xs">
                              Hidden
                            </Badge>
                          )}
                          {isDragOver && (
                            <Badge variant="default" className="text-xs bg-blue-500">
                              Drop here
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-2">
                            <Label htmlFor={`visible-${item.id}`} className="text-sm">
                              Visible
                            </Label>
                            <Switch
                              id={`visible-${item.id}`}
                              checked={isVisible}
                              onCheckedChange={() => handleToggleVisibility(item)}
                            />
                          </div>
                          <Button variant="ghost" size="sm" onClick={() => handleEditNavItem(item)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
            </div>
          </div>
        </TabsContent>

        {/* Configuration Tab */}
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

        {/* Required Fields Tab */}
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

        {/* Database Tab */}
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

      {/* User Modal */}
      <Dialog open={isUserModalOpen} onOpenChange={setIsUserModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingUser ? "Edit User" : "Create New User"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={userForm.name}
                onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                placeholder="Enter user name"
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={userForm.email}
                onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                placeholder="Enter email address"
              />
            </div>
            <div>
              <Label htmlFor="role">Role</Label>
              <Select value={userForm.role} onValueChange={(value) => setUserForm({ ...userForm, role: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="executive">Executive</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsUserModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveUser}>{editingUser ? "Update User" : "Create User"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Enhanced Delete User Modal */}
      <Dialog open={!!deleteUserToConfirm} onOpenChange={() => setDeleteUserToConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>
              Are you sure you want to delete <strong>{deleteUserToConfirm?.name}</strong>?
            </p>

            {userOwnedInitiatives.length > 0 && (
              <div className="space-y-3">
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                  <p className="text-sm font-medium text-yellow-800">
                    ⚠️ This user owns {userOwnedInitiatives.length} initiative(s):
                  </p>
                  <ul className="mt-2 text-sm text-yellow-700">
                    {userOwnedInitiatives.map((initiative) => (
                      <li key={initiative.id} className="ml-4">
                        • {initiative.title}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="transferUser">Transfer ownership to:</Label>
                  <Select value={transferToUserId} onValueChange={setTransferToUserId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a user to transfer initiatives to" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableUsers.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.name} ({user.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {userOwnedInitiatives.length === 0 && (
              <p className="text-sm text-muted-foreground">This action cannot be undone.</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteUserToConfirm(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDeleteUser}
              disabled={userOwnedInitiatives.length > 0 && !transferToUserId}
            >
              {userOwnedInitiatives.length > 0 ? "Transfer & Delete User" : "Delete User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Navigation Item Edit Modal */}
      <Dialog open={isNavModalOpen} onOpenChange={setIsNavModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Navigation Item</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="nav-name">Name</Label>
              <Input
                id="nav-name"
                value={navItemForm.name}
                onChange={(e) => setNavItemForm({ ...navItemForm, name: e.target.value })}
                placeholder="Enter navigation item name"
              />
            </div>
            <div>
              <Label htmlFor="nav-icon">Icon</Label>
              <Select
                value={navItemForm.icon}
                onValueChange={(value) => setNavItemForm({ ...navItemForm, icon: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select icon" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Circle">Circle</SelectItem>
                  <SelectItem value="CheckCircle">Check Circle</SelectItem>
                  <SelectItem value="Target">Target</SelectItem>
                  <SelectItem value="Flag">Flag</SelectItem>
                  <SelectItem value="Star">Star</SelectItem>
                  <SelectItem value="Home">Home</SelectItem>
                  <SelectItem value="Calendar">Calendar</SelectItem>
                  <SelectItem value="FileText">File Text</SelectItem>
                  <SelectItem value="Settings">Settings</SelectItem>
                  <SelectItem value="Users">Users</SelectItem>
                  <SelectItem value="BarChart3">Bar Chart</SelectItem>
                  <SelectItem value="Zap">Zap</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="nav-visible"
                checked={navItemForm.isVisible}
                onCheckedChange={(checked) => setNavItemForm({ ...navItemForm, isVisible: checked })}
              />
              <Label htmlFor="nav-visible">Visible</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNavModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveNavItem}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Config Item Modal */}
      <Dialog open={isConfigModalOpen} onOpenChange={setIsConfigModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingConfigItem ? "Edit Configuration Item" : "Create Configuration Item"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="config-category">Category</Label>
              <Select
                value={configItemForm.category}
                onValueChange={(value) => setConfigItemForm({ ...configItemForm, category: value })}
                disabled={!!editingConfigItem}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="teams">Teams</SelectItem>
                  <SelectItem value="businessImpacts">Business Impacts</SelectItem>
                  <SelectItem value="productAreas">Product Areas</SelectItem>
                  <SelectItem value="processStages">Process Stages</SelectItem>
                  <SelectItem value="priorities">Priorities</SelectItem>
                  <SelectItem value="statuses">Statuses</SelectItem>
                  <SelectItem value="gtmTypes">GTM Types</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="config-label">Label</Label>
              <Input
                id="config-label"
                value={configItemForm.label}
                onChange={(e) => setConfigItemForm({ ...configItemForm, label: e.target.value })}
                placeholder="Enter item label"
              />
            </div>
            <div>
              <Label htmlFor="config-color">Color</Label>
              <Select
                value={configItemForm.color}
                onValueChange={(value) => setConfigItemForm({ ...configItemForm, color: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select color" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gray">Gray</SelectItem>
                  <SelectItem value="red">Red</SelectItem>
                  <SelectItem value="orange">Orange</SelectItem>
                  <SelectItem value="yellow">Yellow</SelectItem>
                  <SelectItem value="green">Green</SelectItem>
                  <SelectItem value="blue">Blue</SelectItem>
                  <SelectItem value="purple">Purple</SelectItem>
                  <SelectItem value="pink">Pink</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="config-active"
                checked={configItemForm.isActive}
                onCheckedChange={(checked) => setConfigItemForm({ ...configItemForm, isActive: checked })}
              />
              <Label htmlFor="config-active">Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsConfigModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveConfigItem}>{editingConfigItem ? "Update Item" : "Create Item"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
