#!/usr/bin/env tsx
import fs from 'fs'
import path from 'path'
import { ImportMapAnalyzer } from './lib/analyzer'
import { generateHTML, generateTextReport } from './lib/htmlGenerator'
import { defaultConfig } from './config/default'
import { Logger, LogLevel } from './lib/logger'
import { AnalysisConfig } from './types'

/**
 * Load configuration from file or use defaults
 */
function loadConfig(): AnalysisConfig {
  const configPath = path.join(process.cwd(), 'import-map.config.ts')

  if (fs.existsSync(configPath)) {
    try {
      const userConfig = require(configPath).default
      return { ...defaultConfig, ...userConfig }
    } catch (error) {
      Logger.getInstance().warn(`Failed to load config file: ${error}`)
    }
  }

  return defaultConfig
}

/**
 * Save analysis results to files
 */
async function saveResults(analyzer: ImportMapAnalyzer, result: any, config: AnalysisConfig): Promise<void> {
  const logger = Logger.getInstance()

  try {
    // Save JSON data
    const jsonPath = path.join(config.outputDir, 'import-map.json')
    fs.writeFileSync(jsonPath, JSON.stringify(result.graph, null, 2))
    logger.success(`Saved JSON data to ${jsonPath}`)

    // Generate and save text report
    const report = generateTextReport(result.graph)
    const reportPath = path.join(config.outputDir, 'import-map-report.md')
    fs.writeFileSync(reportPath, report)
    logger.success(`Saved analysis report to ${reportPath}`)

    if (config.generateVisualization) {
      // Generate and save HTML visualization
      const html = generateHTML(result.graph)
      const htmlPath = path.join(config.outputDir, 'import-map.html')
      fs.writeFileSync(htmlPath, html)
      logger.success(`Saved HTML visualization to ${htmlPath}`)

      // Also copy to dist/index.html for deployment
      const distDir = path.join(config.outputDir, 'dist')
      if (!fs.existsSync(distDir)) {
        fs.mkdirSync(distDir, { recursive: true })
      }
      const distIndexPath = path.join(distDir, 'index.html')
      fs.writeFileSync(distIndexPath, html)
      logger.success(`Saved deployment file to ${distIndexPath}`)
    }

    // Save error log if there were errors
    if (result.errors.length > 0) {
      const errorPath = path.join(config.outputDir, 'import-map-errors.json')
      fs.writeFileSync(errorPath, JSON.stringify(result.errors, null, 2))
      logger.warn(`Saved error log to ${errorPath}`)
    }

  } catch (error) {
    logger.error(`Failed to save results: ${error}`)
    throw error
  }
}

/**
 * Main entry point
 */
async function main(): Promise<void> {
  const logger = Logger.getInstance()

  try {
    // Set log level from environment
    const logLevelEnv = process.env.LOG_LEVEL?.toUpperCase()
    if (logLevelEnv && logLevelEnv in LogLevel) {
      logger.setLogLevel(LogLevel[logLevelEnv as keyof typeof LogLevel])
    }

    logger.info('🔍 ComfyUI Frontend Import Map Analyzer')

    // Load configuration
    const config = loadConfig()
    logger.debug(`Using config: ${JSON.stringify(config, null, 2)}`)

    // Create analyzer and run analysis
    const analyzer = new ImportMapAnalyzer(config)
    const result = await analyzer.analyze()

    // Save results
    await saveResults(analyzer, result, config)

    logger.success('Import map generation complete!')

    if (config.generateVisualization) {
      logger.info('Open import-map.html in a browser to view the visualization')
    }

    // Exit with error code if there were analysis errors
    if (result.errors.length > 0) {
      process.exit(1)
    }

  } catch (error) {
    logger.error(`Analysis failed: ${error}`)
    process.exit(1)
  }
}

// Run if this file is executed directly
if (require.main === module) {
  void main()
}

export { main }