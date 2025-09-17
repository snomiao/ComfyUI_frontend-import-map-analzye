import { test, expect, spyOn } from 'bun:test'
import { Logger, LogLevel } from '../logger'

test('Logger - singleton pattern', () => {
  const logger1 = Logger.getInstance()
  const logger2 = Logger.getInstance()

  expect(logger1).toBe(logger2)
})

test('Logger - log levels', () => {
  const logger = Logger.getInstance()
  const consoleSpy = spyOn(console, 'log')
  const errorSpy = spyOn(console, 'error')
  const warnSpy = spyOn(console, 'warn')

  // Set to INFO level
  logger.setLogLevel(LogLevel.INFO)

  logger.error('error message')
  logger.warn('warn message')
  logger.info('info message')
  logger.debug('debug message') // Should not log

  expect(errorSpy).toHaveBeenCalledWith('❌ error message')
  expect(warnSpy).toHaveBeenCalledWith('⚠️  warn message')
  expect(consoleSpy).toHaveBeenCalledWith('ℹ️  info message')
  expect(consoleSpy).not.toHaveBeenCalledWith('🐛 debug message')

  consoleSpy.mockRestore()
  errorSpy.mockRestore()
  warnSpy.mockRestore()
})

test('Logger - error tracking', () => {
  const logger = Logger.getInstance()
  logger.clearErrors()

  logger.error('test error', 'test.ts')
  logger.error('another error', 'another.ts')

  const errors = logger.getErrors()
  expect(errors).toHaveLength(2)
  expect(errors[0]).toEqual({ file: 'test.ts', error: 'test error' })
  expect(errors[1]).toEqual({ file: 'another.ts', error: 'another error' })

  logger.clearErrors()
  expect(logger.getErrors()).toHaveLength(0)
})

test('Logger - stats logging', () => {
  const logger = Logger.getInstance()
  const consoleSpy = spyOn(console, 'log')

  const stats = {
    totalFiles: 100,
    totalDependencies: 500,
    circularDependencies: 5,
    runtimeCircularDependencies: 3,
    typeOnlyCircularDependencies: 2
  }

  logger.logStats(stats)

  expect(consoleSpy).toHaveBeenCalledWith('ℹ️  Analysis complete:')
  expect(consoleSpy).toHaveBeenCalledWith('ℹ️    📁 Total files: 100')
  expect(consoleSpy).toHaveBeenCalledWith('ℹ️    🔗 Total dependencies: 500')

  consoleSpy.mockRestore()
})