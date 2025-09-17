import fs from 'fs'
import path from 'path'
import { ImportDetail, ImportInfo } from '../types'

/**
 * Extract imports from a TypeScript/Vue file using regex
 */
export function extractImports(filePath: string): ImportInfo {
  const content = fs.readFileSync(filePath, 'utf-8')
  const imports: Map<string, ImportDetail> = new Map()

  // For Vue files, extract script content first
  let codeContent = content
  if (filePath.endsWith('.vue')) {
    const scriptMatch = content.match(/<script[^>]*>([\s\S]*?)<\/script>/)
    if (scriptMatch) {
      codeContent = scriptMatch[1]
    }
  }

  // Match various import patterns
  const patterns = [
    // import type { ... } from 'path' or import type ... from 'path'
    /import\s+type\s+(?:[^s]+|\{[^}]*\})\s+from\s+['"]([^'"]+)['"]/g,
    // import { type ... } from 'path' - with type keyword inside braces
    /import\s+\{[^}]*\btype\b[^}]*\}\s+from\s+['"]([^'"]+)['"]/g,
  ]

  // First check for type-only imports
  patterns.forEach((regex) => {
    let match
    regex.lastIndex = 0
    while ((match = regex.exec(codeContent)) !== null) {
      const importPath = match[1]
      if (importPath) {
        imports.set(importPath, { path: importPath, typeOnly: true })
      }
    }
  })

  // Then check all imports (including regular ones)
  // This will override type-only if we find a runtime import for the same path
  const allImportsRegex = /import\s+(?:type\s+)?(?:\{[^}]*\}|\*\s+as\s+\w+|\w+)\s+from\s+['"]([^'"]+)['"]/g
  let match
  while ((match = allImportsRegex.exec(codeContent)) !== null) {
    const importPath = match[1]
    const fullImport = match[0]

    // Check if this is a type-only import
    const isTypeImport = fullImport.includes('import type')

    // For mixed imports like { type User, getName }, check if there are non-type imports
    const hasMixedImports = fullImport.includes('{') &&
                           fullImport.includes('type') &&
                           !fullImport.startsWith('import type')

    // If it's a mixed import, treat as runtime
    const isRuntimeImport = !isTypeImport && (!fullImport.includes('{ type') || hasMixedImports)

    if (importPath) {
      if (!imports.has(importPath)) {
        imports.set(importPath, { path: importPath, typeOnly: isTypeImport && !hasMixedImports })
      } else if (isRuntimeImport || hasMixedImports) {
        // Runtime import or mixed import overrides type-only
        imports.set(importPath, { path: importPath, typeOnly: false })
      }
    }
  }

  // Side effect imports: import 'path'
  const sideEffectRegex = /import\s+['"]([^'"]+)['"]/g
  while ((match = sideEffectRegex.exec(codeContent)) !== null) {
    const importPath = match[1]
    if (importPath && !imports.has(importPath)) {
      imports.set(importPath, { path: importPath, typeOnly: false })
    }
  }

  // Dynamic imports are always runtime
  const dynamicImportRegex = /import\s*\(\s*['"]([^'"]+)['"]\s*\)/g
  while ((match = dynamicImportRegex.exec(codeContent)) !== null) {
    const importPath = match[1]
    if (importPath && !imports.has(importPath)) {
      imports.set(importPath, { path: importPath, typeOnly: false })
    }
  }

  return { source: filePath, imports: Array.from(imports.values()) }
}

/**
 * Determine the group/category of a file based on its path
 */
export function getFileGroup(filePath: string): string {
  if (filePath.startsWith('external:')) return 'external'
  if (filePath.includes('/components/')) return 'components'
  if (filePath.includes('/stores/')) return 'stores'
  if (filePath.includes('/services/')) return 'services'
  if (filePath.includes('/views/')) return 'views'
  if (filePath.includes('/composables/')) return 'composables'
  if (filePath.includes('/utils/')) return 'utils'
  if (filePath.includes('/types/')) return 'types'
  return 'other'
}

/**
 * Resolve relative import paths to absolute paths
 */
export function resolveImportPath(fromFile: string, importPath: string): string {
  // External imports (no relative path)
  if (!importPath.startsWith('.')) {
    return `external:${importPath}`
  }

  // Resolve relative path
  const fromDir = path.dirname(fromFile)
  let resolved = path.resolve(fromDir, importPath)

  // Try common extensions if file doesn't exist
  const extensions = ['.ts', '.tsx', '.vue', '.js', '.jsx']

  if (!fs.existsSync(resolved)) {
    // Try with extensions
    for (const ext of extensions) {
      if (fs.existsSync(resolved + ext)) {
        resolved = resolved + ext
        break
      }
    }

    // Try index files
    if (!fs.existsSync(resolved)) {
      for (const ext of extensions) {
        const indexFile = path.join(resolved, `index${ext}`)
        if (fs.existsSync(indexFile)) {
          resolved = indexFile
          break
        }
      }
    }
  }

  return resolved
}