"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Separator } from "@/components/ui/separator"
import { Filter } from "lucide-react"
import type { Initiative } from "@/types"

interface InitiativesFiltersProps {
  initiatives: Initiative[]
  filters: {
    status: string[]
    priority: string[]
    team: string[]
    tier: string[]
    owner: string[]
  }
  onFiltersChange: (filters: {
    status: string[]
    priority: string[]
    team: string[]
    tier: string[]
    owner: string[]
  }) => void
}

export function InitiativesFilters({ initiatives, filters, onFiltersChange }: InitiativesFiltersProps) {
  const [open, setOpen] = useState(false)

  // Get unique values for each filter
  const uniqueStatuses = Array.from(new Set(initiatives.map((i) => i.status).filter(Boolean)))
  const uniquePriorities = Array.from(new Set(initiatives.map((i) => i.priority).filter(Boolean)))
  const uniqueTeams = Array.from(new Set(initiatives.map((i) => i.team).filter(Boolean)))
  const uniqueTiers = Array.from(new Set(initiatives.map((i) => (i.tier || "").toString()).filter(Boolean)))
  const uniqueOwners = Array.from(
    new Set(initiatives.map((i) => (i.owner && i.owner.name) || i.owner_name || "").filter(Boolean)),
  )

  const handleFilterChange = (type: keyof typeof filters, value: string, checked: boolean) => {
    const newFilters = { ...filters }
    if (checked) {
      newFilters[type] = [...newFilters[type], value]
    } else {
      newFilters[type] = newFilters[type].filter((item) => item !== value)
    }
    onFiltersChange(newFilters)
  }

  const clearAllFilters = () => {
    onFiltersChange({
      status: [],
      priority: [],
      team: [],
      tier: [],
      owner: [],
    })
  }

  const activeFilterCount = Object.values(filters).reduce((count, filterArray) => count + filterArray.length, 0)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="relative bg-transparent">
          <Filter className="h-4 w-4 mr-2" />
          Filters
          {activeFilterCount > 0 && (
            <Badge variant="secondary" className="ml-2 h-5 w-5 rounded-full p-0 text-xs">
              {activeFilterCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">Filters</h4>
            {activeFilterCount > 0 && (
              <Button variant="ghost" size="sm" onClick={clearAllFilters}>
                Clear all
              </Button>
            )}
          </div>

          <Separator />

          {/* Status Filter */}
          {uniqueStatuses.length > 0 && (
            <div>
              <h5 className="font-medium mb-2">Status</h5>
              <div className="space-y-2">
                {uniqueStatuses.map((status) => (
                  <div key={status} className="flex items-center space-x-2">
                    <Checkbox
                      id={`status-${status}`}
                      checked={filters.status.includes(status)}
                      onCheckedChange={(checked) => handleFilterChange("status", status, checked as boolean)}
                    />
                    <label htmlFor={`status-${status}`} className="text-sm">
                      {status}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Priority Filter */}
          {uniquePriorities.length > 0 && (
            <div>
              <h5 className="font-medium mb-2">Priority</h5>
              <div className="space-y-2">
                {uniquePriorities.map((priority) => (
                  <div key={priority} className="flex items-center space-x-2">
                    <Checkbox
                      id={`priority-${priority}`}
                      checked={filters.priority.includes(priority)}
                      onCheckedChange={(checked) => handleFilterChange("priority", priority, checked as boolean)}
                    />
                    <label htmlFor={`priority-${priority}`} className="text-sm">
                      {priority}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Team Filter */}
          {uniqueTeams.length > 0 && (
            <div>
              <h5 className="font-medium mb-2">Team</h5>
              <div className="space-y-2">
                {uniqueTeams.map((team) => (
                  <div key={team} className="flex items-center space-x-2">
                    <Checkbox
                      id={`team-${team}`}
                      checked={filters.team.includes(team)}
                      onCheckedChange={(checked) => handleFilterChange("team", team, checked as boolean)}
                    />
                    <label htmlFor={`team-${team}`} className="text-sm">
                      {team}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tier Filter */}
          {uniqueTiers.length > 0 && (
            <div>
              <h5 className="font-medium mb-2">Tier</h5>
              <div className="space-y-2">
                {uniqueTiers.map((tier) => (
                  <div key={tier} className="flex items-center space-x-2">
                    <Checkbox
                      id={`tier-${tier}`}
                      checked={filters.tier.includes(tier)}
                      onCheckedChange={(checked) => handleFilterChange("tier", tier, checked as boolean)}
                    />
                    <label htmlFor={`tier-${tier}`} className="text-sm">
                      Tier {tier}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Owner Filter */}
          {uniqueOwners.length > 0 && (
            <div>
              <h5 className="font-medium mb-2">Owner</h5>
              <div className="space-y-2">
                {uniqueOwners.map((owner) => (
                  <div key={owner} className="flex items-center space-x-2">
                    <Checkbox
                      id={`owner-${owner}`}
                      checked={filters.owner.includes(owner)}
                      onCheckedChange={(checked) => handleFilterChange("owner", owner, checked as boolean)}
                    />
                    <label htmlFor={`owner-${owner}`} className="text-sm">
                      {owner}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
