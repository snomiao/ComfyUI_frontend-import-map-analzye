import { test, expect } from 'bun:test'
import { detectCircularDependencies, getCircularDependencyStats } from '../circularDependencyDetector'

test('detectCircularDependencies - simple cycle', () => {
  const dependencies = new Map([
    ['A', [{ target: 'B', typeOnly: false }]],
    ['B', [{ target: 'C', typeOnly: false }]],
    ['C', [{ target: 'A', typeOnly: false }]]
  ])

  const result = detectCircularDependencies(dependencies)

  expect(result).toHaveLength(1)
  expect(result[0].chain).toEqual(['A', 'B', 'C', 'A'])
  expect(result[0].typeOnly).toBe(false)
  expect(result[0].edges).toHaveLength(3)
})

test('detectCircularDependencies - type-only cycle', () => {
  const dependencies = new Map([
    ['A', [{ target: 'B', typeOnly: true }]],
    ['B', [{ target: 'A', typeOnly: true }]]
  ])

  const result = detectCircularDependencies(dependencies)

  expect(result).toHaveLength(1)
  expect(result[0].typeOnly).toBe(true)
})

test('detectCircularDependencies - mixed cycle (should be runtime)', () => {
  const dependencies = new Map([
    ['A', [{ target: 'B', typeOnly: true }]],
    ['B', [{ target: 'A', typeOnly: false }]]
  ])

  const result = detectCircularDependencies(dependencies)

  expect(result).toHaveLength(1)
  expect(result[0].typeOnly).toBe(false) // One runtime import makes it runtime
})

test('detectCircularDependencies - no cycles', () => {
  const dependencies = new Map([
    ['A', [{ target: 'B', typeOnly: false }]],
    ['B', [{ target: 'C', typeOnly: false }]],
    ['D', [{ target: 'E', typeOnly: false }]]
  ])

  const result = detectCircularDependencies(dependencies)

  expect(result).toHaveLength(0)
})

test('detectCircularDependencies - multiple cycles', () => {
  const dependencies = new Map([
    ['A', [{ target: 'B', typeOnly: false }]],
    ['B', [{ target: 'A', typeOnly: false }]],
    ['C', [{ target: 'D', typeOnly: true }]],
    ['D', [{ target: 'C', typeOnly: true }]]
  ])

  const result = detectCircularDependencies(dependencies)

  expect(result).toHaveLength(2)
})

test('getCircularDependencyStats - calculates stats correctly', () => {
  const circularDeps = [
    { chain: ['A', 'B', 'A'], edges: [], typeOnly: false },
    { chain: ['C', 'D', 'C'], edges: [], typeOnly: true },
    { chain: ['E', 'F', 'E'], edges: [], typeOnly: false }
  ]

  const stats = getCircularDependencyStats(circularDeps)

  expect(stats.total).toBe(3)
  expect(stats.runtime).toBe(2)
  expect(stats.typeOnly).toBe(1)
})