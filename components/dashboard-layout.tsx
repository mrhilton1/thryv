"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useSupabaseDatabase } from "@/contexts/supabase-database-context"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import {
  BarChart3,
  Target,
  FileText,
  Calendar,
  Settings,
  User,
  LogOut,
  Bell,
  ChevronLeft,
  ChevronRight,
  Circle,
  CheckCircle,
  Flag,
  Star,
  Home,
  Users,
  Zap,
} from "lucide-react"

interface DashboardLayoutProps {
  children: React.ReactNode
  activeTab: string
  onTabChange: (tab: string) => void
  onUpdateUser?: (userId: string, updates: any) => Promise<void>
}

export function DashboardLayout({ children, activeTab, onTabChange, onUpdateUser }: DashboardLayoutProps) {
  const { navigationConfig = [], loadData } = useSupabaseDatabase()
  const { user, logout } = useAuth()
  const [notifications] = useState(3) // Mock notification count
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [optimisticNavigation, setOptimisticNavigation] = useState<any[]>([])

  useEffect(() => {
    const handleOptimisticNavigationUpdate = (event: any) => {
      console.log("Optimistic navigation update received:", event.detail)
      setOptimisticNavigation(event.detail)
    }

    const handleNavigationUpdate = () => {
      console.log("Navigation updated event received, refreshing data in background...")
      if (optimisticNavigation.length === 0) {
        if (loadData) {
          loadData()
        }
      }
    }

    window.addEventListener("optimisticNavigationUpdate", handleOptimisticNavigationUpdate)
    window.addEventListener("navigationUpdated", handleNavigationUpdate)

    return () => {
      window.removeEventListener("optimisticNavigationUpdate", handleOptimisticNavigationUpdate)
      window.removeEventListener("navigationUpdated", handleNavigationUpdate)
    }
  }, [loadData, optimisticNavigation.length])

  console.log("=== ENHANCED NAVIGATION DEBUG ===")
  console.log("Raw navigationConfig from database:", navigationConfig)
  console.log("navigationConfig type:", typeof navigationConfig)
  console.log("navigationConfig length:", navigationConfig?.length || 0)
  console.log("navigationConfig is array:", Array.isArray(navigationConfig))

  if (navigationConfig && navigationConfig.length > 0) {
    console.log("Processing each navigation item:")
    navigationConfig.forEach((item, index) => {
      console.log(`Item ${index}:`, {
        id: item.id,
        name: item.name,
        itemLabel: item.itemLabel,
        item_label: item.item_label,
        label: item.label,
        isVisible: item.isVisible,
        order: item.order,
        orderIndex: item.orderIndex,
        order_index: item.order_index,
        rawItem: item,
      })
    })
  } else {
    console.log("No navigation config items found")
  }

  // Map navigation config to tab IDs
  const getTabIdFromNavItem = (navItem: any) => {
    if (!navItem) {
      console.log("getTabIdFromNavItem: navItem is null/undefined")
      return "dashboard"
    }

    const itemName = navItem.itemLabel || navItem.name || navItem.label || "Dashboard"
    console.log(`getTabIdFromNavItem: extracted name "${itemName}" from:`, {
      itemLabel: navItem.itemLabel,
      name: navItem.name,
      label: navItem.label,
    })

    // Map navigation names to tab IDs used in the app
    const nameToTabMap: Record<string, string> = {
      Dashboard: "dashboard",
      Initiatives: "initiatives",
      "Executive Summary": "summary",
      Calendar: "calendar",
      Admin: "admin",
    }

    const tabId = nameToTabMap[itemName] || itemName.toLowerCase().replace(/\s+/g, "-")
    console.log(`getTabIdFromNavItem: mapped "${itemName}" to "${tabId}"`)
    return tabId
  }

  // Default navigation items if navigationConfig is empty or loading
  const defaultNavItems = [
    { id: "dashboard", name: "Dashboard", icon: "BarChart3", isVisible: true, order: 0 },
    { id: "initiatives", name: "Initiatives", icon: "Target", isVisible: true, order: 1 },
    { id: "summary", name: "Executive Summary", icon: "FileText", isVisible: true, order: 2 },
    { id: "calendar", name: "Calendar", icon: "Calendar", isVisible: true, order: 3 },
    { id: "admin", name: "Admin", icon: "Settings", isVisible: true, order: 4 },
  ]

  const navItems = (() => {
    console.log("=== PROCESSING NAVIGATION ITEMS ===")

    const sourceData = optimisticNavigation.length > 0 ? optimisticNavigation : navigationConfig

    // If no navigation config from database, use defaults
    if (!sourceData || sourceData.length === 0) {
      console.log("No navigation config from database, using defaults")
      console.log("Default items:", defaultNavItems)
      return defaultNavItems
    }

    console.log("Processing navigation config...", optimisticNavigation.length > 0 ? "(optimistic)" : "(database)")

    // Process navigation config and remove duplicates
    const processedItems = sourceData
      .filter((item) => {
        const hasValidName = item && (item.itemLabel || item.name || item.label)
        const isVisible = item.isVisible === true || item.is_visible === true
        const isValid = hasValidName && isVisible
        console.log(`Filtering item:`, {
          item,
          hasValidName,
          isVisible,
          isValid,
          itemLabel: item.itemLabel,
          isVisible: item.isVisible,
          is_visible: item.is_visible,
        })
        return isValid
      })
      .map((item) => {
        const itemName = item.itemLabel || item.name || item.label
        console.log(`Processing item name: "${itemName}" from:`, {
          itemLabel: item.itemLabel,
          name: item.name,
          label: item.label,
        })

        // Skip items without valid names
        if (!itemName || itemName.trim() === "" || itemName === "Unnamed Item") {
          console.log("Skipping item with invalid name:", itemName)
          return null
        }

        const processedItem = {
          id: getTabIdFromNavItem(item),
          name: itemName,
          icon: item.icon || getDefaultIconForItem(itemName),
          isVisible: item.isVisible === true || item.is_visible === true,
          order: item.sortOrder || item.order || item.orderIndex || 0,
          route: item.route,
        }

        console.log("Processed item:", processedItem)
        return processedItem
      })
      .filter(Boolean) // Remove null items
      .sort((a, b) => (a?.order || 0) - (b?.order || 0))

    console.log("Processed items before deduplication:", processedItems)

    // Remove duplicates by ID and name
    const uniqueItems = processedItems.reduce((acc, item) => {
      if (item && !acc.find((existing) => existing.id === item.id || existing.name === item.name)) {
        acc.push(item)
      } else if (item) {
        console.log("Removing duplicate item:", item)
      }
      return acc
    }, [] as any[])

    console.log("Final unique items:", uniqueItems)
    console.log("Decision: Using", uniqueItems.length > 0 ? "database items" : "default items")

    // If we have valid processed items, use them, otherwise fall back to defaults
    const finalItems = uniqueItems.length > 0 ? uniqueItems : defaultNavItems
    console.log("Final navigation items:", finalItems)
    return finalItems
  })()

  console.log("=== FINAL NAVIGATION STATE ===")
  console.log("navItems being rendered:", navItems)
  console.log("Active tab:", activeTab)
  console.log("=== END NAVIGATION DEBUG ===")

  const getIcon = (iconName: string) => {
    const icons: Record<string, any> = {
      BarChart3,
      Target,
      FileText,
      Calendar,
      Settings,
      User,
      Users, // Handle both User and Users
      Bell,
      ChevronLeft,
      ChevronRight,
      Circle,
      CheckCircle,
      Flag,
      Star,
      Home,
      Zap,
    }
    return icons[iconName] || BarChart3
  }

  const getCurrentViewName = () => {
    const currentItem = navItems.find((item) => item.id === activeTab)
    return currentItem?.name || "Dashboard"
  }

  const getCurrentViewDescription = () => {
    const descriptions: Record<string, string> = {
      dashboard: "Executive overview and key metrics",
      initiatives: "Master list of all strategic initiatives",
      summary: "Executive summary and achievements",
      calendar: "Timeline view of initiatives and milestones",
      admin: "System administration and user management",
    }
    return descriptions[activeTab] || "Navigate through your executive dashboard"
  }

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed)
  }

  // Helper function to get default icons for items
  const getDefaultIconForItem = (itemName: string) => {
    const defaultIcons: Record<string, string> = {
      Dashboard: "BarChart3",
      Initiatives: "Target",
      "Executive Summary": "FileText",
      Calendar: "Calendar",
      Admin: "Settings",
    }
    return defaultIcons[itemName] || "BarChart3"
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar Navigation */}
      <nav
        className={`bg-white border-r border-gray-200 min-h-screen transition-all duration-300 ease-in-out flex-shrink-0 ${
          isCollapsed ? "w-16" : "w-64"
        }`}
      >
        <div className="p-6">
          {/* Collapse Toggle Button */}
          <div className="flex justify-end mb-4">
            <Button variant="ghost" size="sm" onClick={toggleSidebar} className="p-2 hover:bg-gray-100">
              {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </Button>
          </div>

          {/* Navigation Items */}
          <div className="space-y-1">
            {navItems.map((item) => {
              const Icon = getIcon(item.icon || "BarChart3")
              const isActive = activeTab === item.id

              return (
                <Button
                  key={item.id}
                  variant={isActive ? "secondary" : "ghost"}
                  className={`w-full transition-all duration-200 ${
                    isCollapsed ? "justify-center px-2" : "justify-start px-3"
                  } ${isActive ? "bg-blue-50 text-blue-700 border-blue-200" : "text-gray-700 hover:bg-gray-50"}`}
                  onClick={() => onTabChange(item.id)}
                  title={isCollapsed ? item.name : undefined}
                >
                  <Icon className={`h-5 w-5 ${isCollapsed ? "" : "mr-3"}`} />
                  {!isCollapsed && <span className="truncate">{item.name}</span>}
                </Button>
              )
            })}
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navigation */}
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex-shrink-0">
          <div className="flex items-center justify-between w-full">
            <div className="flex-1 min-w-0 pr-4">
              <h1 className="text-xl font-semibold text-gray-900 capitalize truncate">{getCurrentViewName()}</h1>
              <p className="text-sm text-gray-500 mt-1 truncate">{getCurrentViewDescription()}</p>
            </div>

            <div className="flex items-center gap-3 flex-shrink-0">
              {/* Notifications */}
              <div className="relative">
                <Button variant="ghost" size="sm" className="relative">
                  <Bell className="h-5 w-5" />
                  {notifications > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center min-w-[20px]">
                      {notifications}
                    </span>
                  )}
                </Button>
              </div>

              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2 px-3 py-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user?.avatar || "/placeholder.svg"} />
                      <AvatarFallback>
                        {user?.name
                          ?.split(" ")
                          .map((n) => n[0])
                          .join("") || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium max-w-[120px] truncate">{user?.name || "User"}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem>
                    <User className="mr-2 h-4 w-4" />
                    Profile Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 overflow-auto">{children}</main>
      </div>
    </div>
  )
}
