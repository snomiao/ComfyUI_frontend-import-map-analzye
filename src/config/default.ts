import { AnalysisConfig } from '../types'

export const defaultConfig: AnalysisConfig = {
  include: [
    '**/*.ts',
    '**/*.tsx',
    '**/*.vue',
    '**/*.js',
    '**/*.jsx'
  ],
  exclude: [
    'node_modules/**',
    'dist/**',
    'dist-ssr/**',
    'build/**',
    '.git/**',
    '.nx/**',
    'tests-ui/data/**',
    'tests-ui/ComfyUI_examples/**',
    'tests-ui/workflows/examples/**',
    'test-results/**',
    'playwright-report/**',
    'blob-report/**',
    'playwright/.cache/**',
    'browser_tests/**/*-win32.png',
    'browser_tests/local/**',
    'temp/**',
    'schemas/**',
    'public/templates/**',
    'templates_repo/**',
    'storybook-static/**',
    '**/*.test.*',
    '**/*.spec.*',
    '**/*.d.ts',
    '**/*.min.js',
    '**/coverage/**',
    '**/*.log',
    '**/*.timestamp*',
    '**/components.d.ts'
  ],
  workingDir: 'ComfyUI_frontend',
  outputDir: '.',
  generateVisualization: true,
  maxFileSize: 1024 * 1024, // 1MB
  detectTypeOnlyImports: true
}