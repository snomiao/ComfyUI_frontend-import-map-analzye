import fs from 'fs'
import path from 'path'
import { DependencyGraph } from '../types'

/**
 * Generate HTML visualization from dependency graph
 */
export function generateHTML(graph: DependencyGraph): string {
  const templatePath = path.join(__dirname, '../templates/visualization.html')
  let template = fs.readFileSync(templatePath, 'utf-8')

  // Calculate statistics
  const totalNodes = graph.nodes.length
  const totalLinks = graph.links.length
  const runtimeCircular = graph.circularDependencies?.filter(d => !d.typeOnly).length || 0
  const typeCircular = graph.circularDependencies?.filter(d => d.typeOnly).length || 0

  // Replace placeholders
  template = template
    .replace('{{TOTAL_NODES}}', totalNodes.toString())
    .replace('{{TOTAL_LINKS}}', totalLinks.toString())
    .replace('{{RUNTIME_CIRCULAR}}', runtimeCircular.toString())
    .replace('{{TYPE_CIRCULAR}}', typeCircular.toString())
    .replace('{{GRAPH_DATA}}', JSON.stringify(graph, null, 2))

  return template
}

/**
 * Generate a simple text report of the analysis
 */
export function generateTextReport(graph: DependencyGraph): string {
  const totalNodes = graph.nodes.length
  const totalLinks = graph.links.length
  const circularDeps = graph.circularDependencies || []
  const runtimeCircular = circularDeps.filter(d => !d.typeOnly)
  const typeCircular = circularDeps.filter(d => d.typeOnly)

  let report = `# Import Map Analysis Report\n\n`
  report += `## Summary\n`
  report += `- **Total Files**: ${totalNodes}\n`
  report += `- **Total Dependencies**: ${totalLinks}\n`
  report += `- **Circular Dependencies**: ${circularDeps.length}\n`
  report += `  - Runtime: ${runtimeCircular.length}\n`
  report += `  - Type-only: ${typeCircular.length}\n\n`

  if (runtimeCircular.length > 0) {
    report += `## ⚠️ Runtime Circular Dependencies (${runtimeCircular.length})\n\n`
    runtimeCircular.slice(0, 20).forEach((dep, index) => {
      report += `${index + 1}. ${dep.chain.join(' → ')}\n`
    })
    if (runtimeCircular.length > 20) {
      report += `... and ${runtimeCircular.length - 20} more\n`
    }
    report += `\n`
  }

  if (typeCircular.length > 0) {
    report += `## ℹ️ Type-only Circular Dependencies (${typeCircular.length})\n\n`
    typeCircular.slice(0, 10).forEach((dep, index) => {
      report += `${index + 1}. ${dep.chain.join(' → ')}\n`
    })
    if (typeCircular.length > 10) {
      report += `... and ${typeCircular.length - 10} more\n`
    }
    report += `\n`
  }

  // Group analysis
  const groupStats = new Map<string, number>()
  graph.nodes.forEach(node => {
    groupStats.set(node.group, (groupStats.get(node.group) || 0) + 1)
  })

  report += `## File Distribution by Category\n\n`
  Array.from(groupStats.entries())
    .sort((a, b) => b[1] - a[1])
    .forEach(([group, count]) => {
      report += `- **${group}**: ${count} files\n`
    })

  return report
}