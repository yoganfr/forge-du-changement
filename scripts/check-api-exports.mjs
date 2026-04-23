import fs from 'node:fs'
import path from 'node:path'

const ROOT = process.cwd()
const SRC_DIR = path.join(ROOT, 'src')
const API_BARREL = path.join(SRC_DIR, 'lib', 'api.ts')

if (!fs.existsSync(API_BARREL)) {
  console.error('[check-api-exports] Fichier introuvable:', API_BARREL)
  process.exit(1)
}

const apiBarrelContent = fs.readFileSync(API_BARREL, 'utf8')
const exportedNames = collectExportedNames(apiBarrelContent)
const sourceFiles = listSourceFiles(SRC_DIR).filter((file) => !file.endsWith(path.join('lib', 'api.ts')))

const missing = new Map()

for (const filePath of sourceFiles) {
  const content = fs.readFileSync(filePath, 'utf8')
  const imports = collectNamedImportsFromApi(content)
  for (const importedName of imports) {
    if (!exportedNames.has(importedName)) {
      if (!missing.has(importedName)) missing.set(importedName, [])
      missing.get(importedName).push(path.relative(ROOT, filePath))
    }
  }
}

if (missing.size > 0) {
  console.error('[check-api-exports] Exports manquants dans src/lib/api.ts :')
  for (const [name, files] of missing.entries()) {
    console.error(`  - ${name}`)
    for (const file of files) {
      console.error(`    utilise dans: ${file}`)
    }
  }
  process.exit(1)
}

console.log('[check-api-exports] OK - tous les imports depuis lib/api sont exportes.')

function listSourceFiles(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  const files = []
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      files.push(...listSourceFiles(fullPath))
      continue
    }
    if (/\.(ts|tsx)$/.test(entry.name)) {
      files.push(fullPath)
    }
  }
  return files
}

function collectExportedNames(content) {
  const result = new Set()
  const exportBlocks = content.matchAll(/export\s+(?:type\s+)?\{([\s\S]*?)\}\s+from\s+['"][^'"]+['"]/g)
  for (const block of exportBlocks) {
    const names = block[1]
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
      .map((item) => item.replace(/\s+as\s+\w+$/i, '').trim())
      .filter((item) => item !== 'type')
    for (const name of names) {
      result.add(name)
    }
  }
  return result
}

function collectNamedImportsFromApi(content) {
  const imported = new Set()
  const importBlocks = content.matchAll(
    /import\s+(?:type\s+)?\{([^}]*)\}\s+from\s+['"](?:\.\.\/|\.\/)*lib\/api(?:\.ts)?['"]/g,
  )
  for (const block of importBlocks) {
    const names = block[1]
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
      .map((item) => item.replace(/\s+as\s+\w+$/i, '').trim())
      .filter((item) => item !== 'type')
    for (const name of names) {
      imported.add(name)
    }
  }
  return imported
}
