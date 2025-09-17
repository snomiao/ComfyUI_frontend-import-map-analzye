export interface ImportDetail {
  path: string
  typeOnly: boolean
}

export interface ImportInfo {
  source: string
  imports: ImportDetail[]
}

export interface GraphNode {
  id: string
  label: string
  group: string
  size: number
  inCircularDep?: boolean
  circularChains?: string[][]
}

export interface GraphLink {
  source: string
  target: string
  value: number
  isCircular?: boolean
  typeOnly?: boolean
}

export interface CircularDependency {
  chain: string[]
  edges: Array<{ source: string; target: string }>
  typeOnly: boolean
}

export interface DependencyGraph {
  nodes: GraphNode[]
  links: GraphLink[]
  circularDependencies?: CircularDependency[]
}

export interface AnalysisConfig {
  // File patterns to include
  include: string[]
  // File patterns to exclude
  exclude: string[]
  // Working directory to analyze
  workingDir: string
  // Output directory for generated files
  outputDir: string
  // Whether to generate HTML visualization
  generateVisualization: boolean
  // Maximum file size to analyze (in bytes)
  maxFileSize: number
  // Whether to detect type-only imports
  detectTypeOnlyImports: boolean
}

export interface AnalysisResult {
  graph: DependencyGraph
  stats: {
    totalFiles: number
    totalDependencies: number
    circularDependencies: number
    runtimeCircularDependencies: number
    typeOnlyCircularDependencies: number
  }
  errors: Array<{
    file: string
    error: string
  }>
}