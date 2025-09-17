import glob from 'fast-glob'
import fs from 'fs'
import path from 'path'
import { AnalysisConfig, AnalysisResult, DependencyGraph, GraphNode, GraphLink } from '../types'
import { extractImports, getFileGroup, resolveImportPath } from './importAnalyzer'
import { detectCircularDependencies, markCircularElements, getCircularDependencyStats } from './circularDependencyDetector'
import { Logger } from './logger'

/**
 * Main analyzer class that orchestrates the import analysis
 */
export class ImportMapAnalyzer {
  private config: AnalysisConfig
  private logger: Logger

  constructor(config: AnalysisConfig) {
    this.config = config
    this.logger = Logger.getInstance()
  }

  /**
   * Run the complete analysis
   */
  async analyze(): Promise<AnalysisResult> {
    this.logger.info('Starting import map analysis...')
    this.logger.clearErrors()

    try {
      // Initialize submodule if needed
      await this.initializeSubmodule()

      // Find all files to analyze
      const files = await this.findFiles()
      this.logger.info(`Found ${files.length} files to analyze`)

      // Extract imports from all files
      const importData = this.extractAllImports(files)
      this.logger.info(`Extracted imports from ${importData.length} files`)

      // Build dependency graph
      const graph = this.buildDependencyGraph(importData)
      this.logger.info(`Built graph with ${graph.nodes.length} nodes and ${graph.links.length} links`)

      // Detect circular dependencies
      this.detectAndMarkCircularDependencies(graph)

      // Calculate stats
      const stats = this.calculateStats(graph)
      this.logger.logStats(stats)

      return {
        graph,
        stats,
        errors: this.logger.getErrors()
      }
    } catch (error) {
      this.logger.error(`Analysis failed: ${error}`)
      throw error
    }
  }

  /**
   * Initialize git submodule if needed
   */
  private async initializeSubmodule(): Promise<void> {
    const submodulePath = path.join(process.cwd(), this.config.workingDir)

    if (!fs.existsSync(submodulePath)) {
      this.logger.info('Initializing git submodule...')
      try {
        const { execSync } = await import('child_process')
        execSync('git submodule update --init --recursive', { stdio: 'inherit' })
        this.logger.success('Git submodule initialized')
      } catch (error) {
        this.logger.error(`Failed to initialize submodule: ${error}`)
        throw error
      }
    }
  }

  /**
   * Find all files matching the include/exclude patterns
   */
  private async findFiles(): Promise<string[]> {
    const cwd = path.join(process.cwd(), this.config.workingDir)

    if (!fs.existsSync(cwd)) {
      throw new Error(`Working directory does not exist: ${cwd}`)
    }

    // Change to the working directory
    process.chdir(cwd)

    const files = await glob(this.config.include, {
      ignore: this.config.exclude,
      absolute: false
    })

    // Filter by file size if specified
    return files.filter(file => {
      try {
        const stats = fs.statSync(file)
        return stats.size <= this.config.maxFileSize
      } catch (error) {
        this.logger.error(`Failed to stat file: ${file}`, file)
        return false
      }
    })
  }

  /**
   * Extract imports from all files
   */
  private extractAllImports(files: string[]): Array<{ source: string; imports: Array<{ target: string; typeOnly: boolean }> }> {
    const importData: Array<{ source: string; imports: Array<{ target: string; typeOnly: boolean }> }> = []

    for (const file of files) {
      try {
        this.logger.debug(`Analyzing ${file}`)
        const imports = extractImports(file)

        const resolvedImports = imports.imports
          .map(imp => ({
            target: resolveImportPath(file, imp.path),
            typeOnly: imp.typeOnly
          }))
          .filter(imp => {
            // Filter out imports that don't resolve to actual files
            if (imp.target.startsWith('external:')) return true
            return fs.existsSync(imp.target)
          })

        if (resolvedImports.length > 0) {
          importData.push({
            source: file,
            imports: resolvedImports
          })
        }
      } catch (error) {
        this.logger.error(`Failed to analyze ${file}: ${error}`, file)
      }
    }

    return importData
  }

  /**
   * Build the dependency graph from import data
   */
  private buildDependencyGraph(importData: Array<{ source: string; imports: Array<{ target: string; typeOnly: boolean }> }>): DependencyGraph {
    const nodeMap = new Map<string, GraphNode>()
    const linkMap = new Map<string, GraphLink>()

    // Create nodes
    for (const item of importData) {
      // Add source node
      if (!nodeMap.has(item.source)) {
        nodeMap.set(item.source, {
          id: item.source,
          label: path.basename(item.source),
          group: getFileGroup(item.source),
          size: 0
        })
      }

      // Add target nodes and links
      for (const imp of item.imports) {
        // Add target node
        if (!nodeMap.has(imp.target)) {
          nodeMap.set(imp.target, {
            id: imp.target,
            label: imp.target.startsWith('external:')
              ? imp.target.replace('external:', '')
              : path.basename(imp.target),
            group: getFileGroup(imp.target),
            size: 0
          })
        }

        // Add link
        const linkKey = `${item.source}->${imp.target}`
        if (!linkMap.has(linkKey)) {
          linkMap.set(linkKey, {
            source: item.source,
            target: imp.target,
            value: 1,
            typeOnly: imp.typeOnly
          })
        } else {
          // If we have both type and runtime imports, mark as runtime
          const existingLink = linkMap.get(linkKey)!
          if (!imp.typeOnly) {
            existingLink.typeOnly = false
          }
          existingLink.value++
        }

        // Increment target node size
        const targetNode = nodeMap.get(imp.target)!
        targetNode.size++
      }
    }

    return {
      nodes: Array.from(nodeMap.values()),
      links: Array.from(linkMap.values())
    }
  }

  /**
   * Detect circular dependencies and mark affected elements
   */
  private detectAndMarkCircularDependencies(graph: DependencyGraph): void {
    this.logger.info('Detecting circular dependencies...')

    // Build dependency map
    const dependencies = new Map<string, Array<{ target: string; typeOnly: boolean }>>()

    for (const link of graph.links) {
      if (!dependencies.has(link.source)) {
        dependencies.set(link.source, [])
      }
      dependencies.get(link.source)!.push({
        target: link.target,
        typeOnly: link.typeOnly || false
      })
    }

    // Detect circular dependencies
    const circularDeps = detectCircularDependencies(dependencies)
    graph.circularDependencies = circularDeps

    // Mark circular elements
    markCircularElements(graph)

    const stats = getCircularDependencyStats(circularDeps)
    this.logger.info(`Found ${stats.total} circular dependencies (${stats.runtime} runtime, ${stats.typeOnly} type-only)`)
  }

  /**
   * Calculate analysis statistics
   */
  private calculateStats(graph: DependencyGraph) {
    const circularStats = getCircularDependencyStats(graph.circularDependencies || [])

    return {
      totalFiles: graph.nodes.length,
      totalDependencies: graph.links.length,
      circularDependencies: circularStats.total,
      runtimeCircularDependencies: circularStats.runtime,
      typeOnlyCircularDependencies: circularStats.typeOnly
    }
  }
}