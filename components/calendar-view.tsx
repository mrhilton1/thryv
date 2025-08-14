"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ChevronLeft, ChevronRight, CalendarIcon, Clock, Target } from "lucide-react"
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  isToday,
  parseISO,
} from "date-fns"
import { useSupabaseDatabase } from "@/contexts/api-database-context"

interface CalendarEvent {
  id: string
  title: string
  date: string
  type: "milestone" | "deadline" | "achievement" | "start" | "end"
  initiative?: any
  description?: string
  color?: string
}

export function CalendarView() {
  const { initiatives, achievements } = useSupabaseDatabase()
  const [currentDate, setCurrentDate] = useState(new Date())

  // Generate calendar events from initiatives and achievements
  const generateEvents = (): CalendarEvent[] => {
    const events: CalendarEvent[] = []

    // Add initiative start/end dates
    initiatives.forEach((initiative) => {
      if (initiative.startDate) {
        events.push({
          id: `${initiative.id}-start`,
          title: `${initiative.title} (Start)`,
          date: initiative.startDate,
          type: "start",
          initiative,
          description: `Initiative start date`,
          color: "blue",
        })
      }

      if (initiative.endDate) {
        events.push({
          id: `${initiative.id}-end`,
          title: `${initiative.title} (End)`,
          date: initiative.endDate,
          type: "end",
          initiative,
          description: `Initiative end date`,
          color: "red",
        })
      }

      if (initiative.estimatedReleaseDate) {
        events.push({
          id: `${initiative.id}-release`,
          title: `${initiative.title} (Release)`,
          date: initiative.estimatedReleaseDate,
          type: "milestone",
          initiative,
          description: `Estimated release date`,
          color: "green",
        })
      }
    })

    // Add achievements
    achievements.forEach((achievement) => {
      events.push({
        id: achievement.id,
        title: achievement.title,
        date: achievement.dateAchieved,
        type: "achievement",
        description: achievement.description,
        color: "purple",
      })
    })

    return events
  }

  const events = generateEvents()

  // Get the calendar grid (6 weeks = 42 days)
  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 }) // Start on Sunday
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 })

  const calendarDays = eachDayOfInterval({
    start: calendarStart,
    end: calendarEnd,
  })

  // Get events for a specific day
  const getEventsForDay = (day: Date) => {
    return events.filter((event) => {
      try {
        const eventDate = parseISO(event.date)
        return isSameDay(eventDate, day)
      } catch {
        return false
      }
    })
  }

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case "start":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "end":
        return "bg-red-100 text-red-800 border-red-200"
      case "milestone":
        return "bg-green-100 text-green-800 border-green-200"
      case "achievement":
        return "bg-purple-100 text-purple-800 border-purple-200"
      case "deadline":
        return "bg-orange-100 text-orange-800 border-orange-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getEventIcon = (type: string) => {
    switch (type) {
      case "start":
      case "end":
        return <Target className="w-3 h-3" />
      case "milestone":
      case "deadline":
        return <CalendarIcon className="w-3 h-3" />
      case "achievement":
        return <Clock className="w-3 h-3" />
      default:
        return <CalendarIcon className="w-3 h-3" />
    }
  }

  const navigateMonth = (direction: "prev" | "next") => {
    if (direction === "prev") {
      setCurrentDate(subMonths(currentDate, 1))
    } else {
      setCurrentDate(addMonths(currentDate, 1))
    }
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Calendar</h1>
          <p className="text-muted-foreground">Timeline view of initiatives and milestones</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={goToToday}>
            Today
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigateMonth("prev")}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigateMonth("next")}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Calendar */}
      <Card>
        <CardHeader>
          <CardTitle className="text-center text-2xl">{format(currentDate, "MMMM yyyy")}</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {/* Day Headers */}
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div key={day} className="p-2 text-center text-sm font-medium text-muted-foreground">
                {day}
              </div>
            ))}

            {/* Calendar Days */}
            {calendarDays.map((day, index) => {
              const dayEvents = getEventsForDay(day)
              const isCurrentMonth = isSameMonth(day, currentDate)
              const isDayToday = isToday(day)

              return (
                <div
                  key={index}
                  className={`min-h-[120px] p-2 border border-gray-100 ${
                    isCurrentMonth ? "bg-white" : "bg-gray-50"
                  } ${isDayToday ? "ring-2 ring-blue-500" : ""}`}
                >
                  {/* Day Number */}
                  <div
                    className={`text-sm font-medium mb-1 ${
                      isCurrentMonth ? "text-gray-900" : "text-gray-400"
                    } ${isDayToday ? "text-blue-600 font-bold" : ""}`}
                  >
                    {format(day, "d")}
                  </div>

                  {/* Events for this day (only show if in current month) */}
                  {isCurrentMonth && (
                    <div className="space-y-1">
                      {dayEvents.slice(0, 3).map((event) => (
                        <div
                          key={event.id}
                          className={`text-xs px-1 py-0.5 rounded border ${getEventTypeColor(event.type)} truncate`}
                          title={`${event.title} - ${event.description || ""}`}
                        >
                          <div className="flex items-center gap-1">
                            {getEventIcon(event.type)}
                            <span className="truncate">{event.title}</span>
                          </div>
                        </div>
                      ))}
                      {dayEvents.length > 3 && (
                        <div className="text-xs text-muted-foreground">+{dayEvents.length - 3} more</div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Legend */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Legend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">
                <Target className="w-3 h-3 mr-1" />
                Start Date
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200">
                <Target className="w-3 h-3 mr-1" />
                End Date
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
                <CalendarIcon className="w-3 h-3 mr-1" />
                Milestone
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-200">
                <Clock className="w-3 h-3 mr-1" />
                Achievement
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
