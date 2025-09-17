import { AnalysisConfig } from '../types'

export const defaultConfig: AnalysisConfig = {
  include: [
    'src/**/*.ts',
    'src/**/*.tsx',
    'src/**/*.vue',
    'src/**/*.js',
    'src/**/*.jsx'
  ],
  exclude: [
    'node_modules/**',
    'dist/**',
    '**/*.test.*',
    '**/*.spec.*',
    '**/*.d.ts'
  ],
  workingDir: 'ComfyUI_frontend',
  outputDir: '.',
  generateVisualization: true,
  maxFileSize: 1024 * 1024, // 1MB
  detectTypeOnlyImports: true
}