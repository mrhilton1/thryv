import { Database } from './database'

export function createSeedDatabase(): Database {
  const db = new Database()

  // Create users first
  const users = [
    db.createUser({
      name: 'Bob Hope',
      email: 'bob.hope@company.com',
      role: 'admin',
      avatar: '/placeholder.svg?height=32&width=32',
      isActive: true
    }),
    db.createUser({
      name: 'Mike Johnson',
      email: 'mike.johnson@company.com',
      role: 'editor',
      avatar: '/placeholder.svg?height=32&width=32',
      isActive: true
    }),
    db.createUser({
      name: 'Lisa Rodriguez',
      email: 'lisa.rodriguez@company.com',
      role: 'editor',
      avatar: '/placeholder.svg?height=32&width=32',
      isActive: true
    }),
    db.createUser({
      name: 'David Kim',
      email: 'david.kim@company.com',
      role: 'viewer',
      avatar: '/placeholder.svg?height=32&width=32',
      isActive: true
    }),
    db.createUser({
      name: 'Sarah Wilson',
      email: 'sarah.wilson@company.com',
      role: 'viewer',
      avatar: '/placeholder.svg?height=32&width=32',
      isActive: true
    })
  ]

  // Set up config items
  db.updateConfigItems('teams', [
    { id: 'team-1', label: 'Tacint', color: 'blue', order: 0 },
    { id: 'team-2', label: 'Omicron', color: 'green', order: 1 },
    { id: 'team-3', label: 'Pi', color: 'purple', order: 2 },
    { id: 'team-4', label: 'Engineering', color: 'orange', order: 3 },
    { id: 'team-5', label: 'Product', color: 'red', order: 4 },
    { id: 'team-6', label: 'Design', color: 'pink', order: 5 }
  ])

  db.updateConfigItems('businessImpacts', [
    { id: 'impact-1', label: 'Increase Revenue', color: 'green', order: 0 },
    { id: 'impact-2', label: 'Increase Retention', color: 'blue', order: 1 },
    { id: 'impact-3', label: 'Increase CLTV', color: 'purple', order: 2 },
    { id: 'impact-4', label: 'Reduce Costs', color: 'orange', order: 3 },
    { id: 'impact-5', label: 'Improve Efficiency', color: 'yellow', order: 4 }
  ])

  db.updateConfigItems('productAreas', [
    { id: 'area-1', label: 'Keap', color: 'blue', order: 0 },
    { id: 'area-2', label: 'Marketing Center', color: 'green', order: 1 },
    { id: 'area-3', label: 'Reporting Center', color: 'purple', order: 2 },
    { id: 'area-4', label: 'Command Center', color: 'orange', order: 3 },
    { id: 'area-5', label: 'Workforce Center', color: 'red', order: 4 }
  ])

  db.updateConfigItems('processStages', [
    { id: 'stage-1', label: 'Planned', color: 'gray', order: 0 },
    { id: 'stage-2', label: 'In Development', color: 'yellow', order: 1 },
    { id: 'stage-3', label: 'In Testing', color: 'orange', order: 2 },
    { id: 'stage-4', label: 'In Production', color: 'blue', order: 3 },
    { id: 'stage-5', label: 'Complete', color: 'green', order: 4 }
  ])

  db.updateConfigItems('priorities', [
    { id: 'priority-1', label: 'Low', color: 'green', order: 0 },
    { id: 'priority-2', label: 'Medium', color: 'yellow', order: 1 },
    { id: 'priority-3', label: 'High', color: 'orange', order: 2 },
    { id: 'priority-4', label: 'Critical', color: 'red', order: 3 }
  ])

  db.updateConfigItems('statuses', [
    { id: 'status-1', label: 'On Track', color: 'green', order: 0 },
    { id: 'status-2', label: 'At Risk', color: 'yellow', order: 1 },
    { id: 'status-3', label: 'Off Track', color: 'red', order: 2 },
    { id: 'status-4', label: 'Complete', color: 'blue', order: 3 },
    { id: 'status-5', label: 'On Hold', color: 'gray', order: 4 }
  ])

  db.updateConfigItems('gtmTypes', [
    { id: 'gtm-1', label: 'Soft Launch', color: 'yellow', order: 0 },
    { id: 'gtm-2', label: 'Beta Release', color: 'orange', order: 1 },
    { id: 'gtm-3', label: 'Full Launch', color: 'green', order: 2 },
    { id: 'gtm-4', label: 'Unification', color: 'blue', order: 3 }
  ])

  // Set up default navigation config with proper structure
  const now = new Date().toISOString()
  db.updateNavigationConfig([
    { 
      id: 'dashboard', 
      name: 'Executive Dashboard', 
      description: 'Main dashboard with key metrics and overview',
      isVisible: true, 
      order: 0, 
      isDefault: true,
      permission: 'read',
      createdAt: now
    },
    { 
      id: 'initiatives', 
      name: 'Master List', 
      description: 'Complete list of all initiatives with detailed management',
      isVisible: true, 
      order: 1, 
      isDefault: true,
      permission: 'read',
      createdAt: now
    },
    { 
      id: 'summary', 
      name: 'Executive Summary', 
      description: 'High-level summary for leadership and stakeholders',
      isVisible: true, 
      order: 2, 
      isDefault: true,
      permission: 'read',
      createdAt: now
    },
    { 
      id: 'calendar', 
      name: 'Calendar View', 
      description: 'Timeline view of initiative milestones and deadlines',
      isVisible: true, 
      order: 3, 
      isDefault: true,
      permission: 'read',
      createdAt: now
    },
    { 
      id: 'admin', 
      name: 'Admin Settings', 
      description: 'System administration and configuration (Admin only)',
      isVisible: true, 
      order: 4, 
      isDefault: true,
      permission: 'manage-users',
      createdAt: now
    },
    { 
      id: 'settings', 
      name: 'User Settings', 
      description: 'Personal preferences and account settings',
      isVisible: true, 
      order: 5, 
      isDefault: true,
      permission: 'read',
      createdAt: now
    }
  ])

  // Create sample initiatives with proper data structure
  const initiative1 = db.createInitiative({
    title: 'Automation Builder Enhancements',
    description: 'Notes toolbar, backwards compatibility, background color',
    goal: 'Unification. Backwards compatibility needed for adoption.',
    productArea: 'Keap',
    team: 'Tacint',
    tier: 3,
    ownerId: users[2].id, // Lisa Rodriguez
    status: 'Complete',
    processStage: 'In Production',
    priority: 'Medium',
    businessImpact: 'Increase Retention',
    startDate: '2024-01-15',
    estimatedReleaseDate: '2024-06-30',
    actualReleaseDate: '2024-06-12',
    estimatedGTMType: 'Unification',
    progress: 100,
    tags: ['automation', 'enhancement'],
    createdById: users[1].id, // Mike Johnson
    lastUpdatedById: users[1].id,
    showOnExecutiveSummary: false
  })

  const initiative2 = db.createInitiative({
    title: 'Solution Launchpad Release',
    description: 'Undo Install, Bulk Install Testing',
    goal: 'Verticalization. Release SLP to GA',
    productArea: 'Marketing Center',
    team: 'Omicron',
    tier: 1,
    ownerId: users[2].id, // Lisa Rodriguez
    status: 'Complete',
    processStage: 'In Production',
    priority: 'High',
    businessImpact: 'Increase Retention',
    startDate: '2024-02-01',
    estimatedReleaseDate: '2024-07-31',
    actualReleaseDate: '2024-07-16',
    estimatedGTMType: 'Full Launch',
    progress: 100,
    tags: ['solution', 'release'],
    createdById: users[0].id, // Bob Hope
    lastUpdatedById: users[0].id,
    showOnExecutiveSummary: false
  })

  // Add more initiatives...
  const initiative3 = db.createInitiative({
    title: 'Branding Center',
    description: 'Colors Logos, and support for SLP',
    goal: 'Unification. Paired with SLP, branding center will allow users to have a way to apply branding consistently across assets in the platform.',
    productArea: 'Marketing Center',
    team: 'Pi',
    tier: 2,
    ownerId: users[2].id, // Lisa Rodriguez
    status: 'On Track',
    processStage: 'In Development',
    priority: 'Medium',
    businessImpact: 'Increase CLTV',
    startDate: '2024-03-01',
    estimatedReleaseDate: '2024-08-14',
    estimatedGTMType: 'Soft Launch',
    progress: 65,
    tags: ['branding', 'design'],
    createdById: users[1].id, // Mike Johnson
    lastUpdatedById: users[1].id,
    showOnExecutiveSummary: false
  })

  // Add notes to initiatives
  db.createNote({
    content: 'Completed successfully with all requirements met.',
    createdById: users[1].id, // Mike Johnson
    initiativeId: initiative1.id
  })

  db.createNote({
    content: 'Successfully released to GA with positive user feedback.',
    createdById: users[0].id, // Bob Hope
    initiativeId: initiative2.id
  })

  db.createNote({
    content: 'On track for August release.',
    createdById: users[1].id, // Mike Johnson
    initiativeId: initiative3.id
  })

  // Create sample achievements
  db.createAchievement({
    title: 'First Major Release',
    description: 'Successfully launched our first major product update',
    icon: 'Trophy',
    type: 'achievement',
    createdById: users[0].id,
    initiativeId: initiative1.id
  })

  db.createAchievement({
    title: 'Q3 Milestone',
    description: 'Reach 75% completion on all tier 1 initiatives',
    icon: 'Target',
    type: 'milestone',
    createdById: users[0].id
  })

  return db
}
