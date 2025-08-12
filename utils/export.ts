import { InitiativeWithRelations, ExecutiveSummary } from '@/types'

export const exportToPDF = (initiatives: InitiativeWithRelations[], summary?: ExecutiveSummary) => {
  // In a real application, you would use a library like jsPDF or Puppeteer
  // For this demo, we'll create a formatted text export
  
  const content = generateReportContent(initiatives, summary)
  
  // Create a blob with the content
  const blob = new Blob([content], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  
  // Create download link
  const link = document.createElement('a')
  link.href = url
  link.download = `executive-report-${new Date().toISOString().split('T')[0]}.txt`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  
  // Clean up
  URL.revokeObjectURL(url)
}

export const exportToCSV = (initiatives: InitiativeWithRelations[]) => {
  const headers = [
    'Title',
    'Description',
    'Status',
    'Priority',
    'Owner',
    'Start Date',
    'End Date',
    'Progress',
    'Tags',
    'Last Updated'
  ]
  
  const rows = initiatives.map(initiative => [
    initiative.title || '',
    initiative.description || '',
    initiative.status || '',
    initiative.priority || '',
    initiative.owner?.name || 'Unassigned',
    initiative.startDate || '',
    initiative.estimatedReleaseDate || '',
    (initiative.progress || 0).toString(),
    (initiative.tags || []).join('; '),
    initiative.lastUpdated || ''
  ])
  
  const csvContent = [headers, ...rows]
    .map(row => row.map(field => `"${field}"`).join(','))
    .join('\n')
  
  const blob = new Blob([csvContent], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  
  const link = document.createElement('a')
  link.href = url
  link.download = `initiatives-${new Date().toISOString().split('T')[0]}.csv`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  
  URL.revokeObjectURL(url)
}

const generateReportContent = (initiatives: InitiativeWithRelations[], summary?: ExecutiveSummary): string => {
  const totalInitiatives = initiatives.length
  const completedInitiatives = initiatives.filter(i => i.status === 'completed').length
  const atRiskInitiatives = initiatives.filter(i => i.status === 'at-risk' || i.status === 'blocked').length
  const avgProgress = totalInitiatives > 0 ? initiatives.reduce((sum, i) => sum + (i.progress || 0), 0) / totalInitiatives : 0
  const completionRate = totalInitiatives > 0 ? (completedInitiatives / totalInitiatives) * 100 : 0
  
  let content = `EXECUTIVE REPORT - PLAN OF RECORD
Generated: ${new Date().toLocaleString()}

===========================================
EXECUTIVE SUMMARY
===========================================

${summary?.title || 'Executive Summary'}

${summary?.content || `This report provides an overview of ${totalInitiatives} strategic initiatives with a ${completionRate.toFixed(1)}% completion rate.`}

===========================================
KEY METRICS
===========================================

Total Initiatives: ${totalInitiatives}
Completed: ${completedInitiatives}
In Progress: ${initiatives.filter(i => i.status === 'in-progress').length}
At Risk/Blocked: ${atRiskInitiatives}
Average Progress: ${avgProgress.toFixed(1)}%
Completion Rate: ${completionRate.toFixed(1)}%

===========================================
KEY HIGHLIGHTS
===========================================

${summary?.highlights?.map(h => `• ${h}`).join('\n') || '• No highlights specified'}

===========================================
RISKS AND BLOCKERS
===========================================

${summary?.risks?.map(r => `• ${r}`).join('\n') || '• No risks identified'}

===========================================
INITIATIVE DETAILS
===========================================

`

  initiatives.forEach((initiative, index) => {
    content += `
${index + 1}. ${initiative.title || 'Untitled Initiative'}
   Status: ${(initiative.status || 'unknown').toUpperCase()}
   Priority: ${(initiative.priority || 'unknown').toUpperCase()}
   Owner: ${initiative.owner?.name || 'Unassigned'}
   Progress: ${initiative.progress || 0}%
   Timeline: ${initiative.startDate || 'TBD'} to ${initiative.estimatedReleaseDate || 'TBD'}
   Description: ${initiative.description || 'No description provided'}
   Tags: ${(initiative.tags || []).join(', ') || 'None'}
   Last Updated: ${initiative.lastUpdated ? new Date(initiative.lastUpdated).toLocaleString() : 'Never'}
   
`
  })

  content += `
===========================================
CRITICAL INITIATIVES REQUIRING ATTENTION
===========================================

`

  const criticalInitiatives = initiatives.filter(i => i.priority === 'critical' || i.status === 'at-risk' || i.status === 'blocked')
  
  if (criticalInitiatives.length === 0) {
    content += 'No critical initiatives requiring immediate attention.\n'
  } else {
    criticalInitiatives.forEach((initiative, index) => {
      content += `${index + 1}. ${initiative.title || 'Untitled Initiative'} (${(initiative.status || 'unknown').toUpperCase()})
   Owner: ${initiative.owner?.name || 'Unassigned'}
   Progress: ${initiative.progress || 0}%
   
`
    })
  }

  return content
}
