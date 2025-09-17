import { DependencyGraph, CircularDependency, GraphLink } from '../types'

/**
 * Detect circular dependencies using Depth-First Search
 */
export function detectCircularDependencies(
  dependencies: Map<string, Array<{ target: string; typeOnly: boolean }>>
): CircularDependency[] {
  const visited = new Set<string>()
  const visiting = new Set<string>()
  const circularDeps: CircularDependency[] = []

  function dfs(node: string, path: string[]): void {
    if (visiting.has(node)) {
      // Found a cycle
      const cycleStart = path.indexOf(node)
      if (cycleStart !== -1) {
        const cycle = [...path.slice(cycleStart), node]
        const edges = []
        let allTypeOnly = true

        for (let i = 0; i < cycle.length - 1; i++) {
          const source = cycle[i]
          const target = cycle[i + 1]
          const deps = dependencies.get(source) || []
          const dep = deps.find(d => d.target === target)
          const typeOnly = dep?.typeOnly || false

          edges.push({ source, target })
          if (!typeOnly) {
            allTypeOnly = false
          }
        }

        circularDeps.push({
          chain: cycle,
          edges,
          typeOnly: allTypeOnly
        })
      }
      return
    }

    if (visited.has(node)) {
      return
    }

    visiting.add(node)
    const deps = dependencies.get(node) || []

    for (const dep of deps) {
      dfs(dep.target, [...path, node])
    }

    visiting.delete(node)
    visited.add(node)
  }

  // Start DFS from all unvisited nodes
  for (const node of dependencies.keys()) {
    if (!visited.has(node)) {
      dfs(node, [])
    }
  }

  return circularDeps
}

/**
 * Mark nodes and links that are part of circular dependencies
 */
export function markCircularElements(graph: DependencyGraph): void {
  if (!graph.circularDependencies) return

  const circularNodes = new Set<string>()
  const circularLinks = new Set<string>()

  // Collect all nodes and links involved in circular dependencies
  for (const circular of graph.circularDependencies) {
    for (const node of circular.chain) {
      circularNodes.add(node)
    }
    for (const edge of circular.edges) {
      circularLinks.add(`${edge.source}->${edge.target}`)
    }
  }

  // Mark nodes
  for (const node of graph.nodes) {
    if (circularNodes.has(node.id)) {
      node.inCircularDep = true
      node.circularChains = graph.circularDependencies
        .filter(dep => dep.chain.includes(node.id))
        .map(dep => dep.chain)
    }
  }

  // Mark links
  for (const link of graph.links) {
    const linkKey = `${link.source}->${link.target}`
    if (circularLinks.has(linkKey)) {
      link.isCircular = true
    }
  }
}

/**
 * Get statistics about circular dependencies
 */
export function getCircularDependencyStats(circularDeps: CircularDependency[]) {
  const total = circularDeps.length
  const runtimeCount = circularDeps.filter(dep => !dep.typeOnly).length
  const typeOnlyCount = circularDeps.filter(dep => dep.typeOnly).length

  return {
    total,
    runtime: runtimeCount,
    typeOnly: typeOnlyCount
  }
}