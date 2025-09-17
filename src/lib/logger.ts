export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3
}

export class Logger {
  private static instance: Logger
  private logLevel: LogLevel = LogLevel.INFO
  private errors: Array<{ file: string; error: string }> = []

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger()
    }
    return Logger.instance
  }

  setLogLevel(level: LogLevel): void {
    this.logLevel = level
  }

  error(message: string, file?: string): void {
    if (this.logLevel >= LogLevel.ERROR) {
      console.error(`❌ ${message}`)
    }
    if (file) {
      this.errors.push({ file, error: message })
    }
  }

  warn(message: string): void {
    if (this.logLevel >= LogLevel.WARN) {
      console.warn(`⚠️  ${message}`)
    }
  }

  info(message: string): void {
    if (this.logLevel >= LogLevel.INFO) {
      console.log(`ℹ️  ${message}`)
    }
  }

  debug(message: string): void {
    if (this.logLevel >= LogLevel.DEBUG) {
      console.log(`🐛 ${message}`)
    }
  }

  success(message: string): void {
    if (this.logLevel >= LogLevel.INFO) {
      console.log(`✅ ${message}`)
    }
  }

  getErrors(): Array<{ file: string; error: string }> {
    return [...this.errors]
  }

  clearErrors(): void {
    this.errors = []
  }

  logStats(stats: {
    totalFiles: number
    totalDependencies: number
    circularDependencies: number
    runtimeCircularDependencies: number
    typeOnlyCircularDependencies: number
  }): void {
    this.info(`Analysis complete:`)
    this.info(`  📁 Total files: ${stats.totalFiles}`)
    this.info(`  🔗 Total dependencies: ${stats.totalDependencies}`)

    if (stats.circularDependencies > 0) {
      this.warn(`Found ${stats.circularDependencies} circular dependencies:`)
      if (stats.runtimeCircularDependencies > 0) {
        this.warn(`  ⚠️  Runtime circular: ${stats.runtimeCircularDependencies}`)
      }
      if (stats.typeOnlyCircularDependencies > 0) {
        this.info(`  ℹ️  Type-only circular: ${stats.typeOnlyCircularDependencies}`)
      }
    } else {
      this.success(`No circular dependencies found!`)
    }

    if (this.errors.length > 0) {
      this.warn(`Encountered ${this.errors.length} errors during analysis`)
    }
  }
}