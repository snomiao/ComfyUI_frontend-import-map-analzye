import { test, expect, beforeEach, afterEach } from 'bun:test'
import { extractImports, getFileGroup, resolveImportPath } from '../importAnalyzer'
import fs from 'fs'
import path from 'path'

// Mock fs for testing
const mockFiles = new Map<string, string>()

const originalReadFileSync = fs.readFileSync
const originalExistsSync = fs.existsSync

beforeEach(() => {
  mockFiles.clear()
  // @ts-ignore
  fs.readFileSync = (filePath: string) => {
    const content = mockFiles.get(filePath)
    if (content === undefined) {
      throw new Error(`File not found: ${filePath}`)
    }
    return content
  }
  // @ts-ignore
  fs.existsSync = (filePath: string) => mockFiles.has(filePath)
})

afterEach(() => {
  fs.readFileSync = originalReadFileSync
  fs.existsSync = originalExistsSync
})

test('extractImports - TypeScript file with various import types', () => {
  const filePath = 'src/test.ts'
  const content = `
import { ref, computed } from 'vue'
import type { Component } from 'vue'
import { type User, getName } from './user'
import axios from 'axios'
import './styles.css'
import Button from '@/components/Button.vue'
  `

  mockFiles.set(filePath, content)

  const result = extractImports(filePath)

  expect(result.source).toBe(filePath)
  expect(result.imports).toHaveLength(5)

  // Check all imports
  const imports = result.imports

  // Check vue import (should be runtime due to regular import)
  const vueImport = imports.find(imp => imp.path === 'vue')
  expect(vueImport).toBeDefined()
  expect(vueImport?.typeOnly).toBe(false)

  // Check user import (mixed import with both type and runtime)
  const userImport = imports.find(imp => imp.path === './user')
  expect(userImport).toBeDefined()
  expect(userImport?.typeOnly).toBe(false) // Mixed imports should be runtime
})

test('extractImports - Vue file', () => {
  const filePath = 'src/Component.vue'
  const content = `
<template>
  <div>Hello</div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { Props } from './types'
import { useStore } from './store'
</script>
  `

  mockFiles.set(filePath, content)

  const result = extractImports(filePath)

  expect(result.imports).toHaveLength(3)

  const vueImport = result.imports.find(imp => imp.path === 'vue')
  expect(vueImport?.typeOnly).toBe(false)

  const typeImport = result.imports.find(imp => imp.path === './types')
  expect(typeImport?.typeOnly).toBe(true)
})

test('extractImports - dynamic imports', () => {
  const filePath = 'src/dynamic.ts'
  const content = `
const module = await import('./lazy-module')
import('./another-module').then(mod => mod.default)
  `

  mockFiles.set(filePath, content)

  const result = extractImports(filePath)

  expect(result.imports).toHaveLength(2)
  result.imports.forEach(imp => {
    expect(imp.typeOnly).toBe(false) // Dynamic imports are always runtime
  })
})

test('getFileGroup - categorizes files correctly', () => {
  expect(getFileGroup('external:vue')).toBe('external')
  expect(getFileGroup('src/components/Button.vue')).toBe('components')
  expect(getFileGroup('src/stores/userStore.ts')).toBe('stores')
  expect(getFileGroup('src/services/api.ts')).toBe('services')
  expect(getFileGroup('src/views/Home.vue')).toBe('views')
  expect(getFileGroup('src/composables/useUser.ts')).toBe('composables')
  expect(getFileGroup('src/utils/format.ts')).toBe('utils')
  expect(getFileGroup('src/types/user.ts')).toBe('types')
  expect(getFileGroup('src/config.ts')).toBe('other')
})

test('resolveImportPath - external imports', () => {
  const result = resolveImportPath('src/test.ts', 'vue')
  expect(result).toBe('external:vue')
})

test('resolveImportPath - relative imports', () => {
  // Mock file existence
  mockFiles.set('/project/src/utils/helper.ts', '')

  const result = resolveImportPath('/project/src/test.ts', './utils/helper')
  expect(result).toBe('/project/src/utils/helper.ts')
})