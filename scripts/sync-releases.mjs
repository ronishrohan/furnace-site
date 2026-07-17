import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const destination = resolve(root, 'src/data/releases.json')
const sourceFlag = process.argv.indexOf('--source')
const sourcePath = sourceFlag >= 0 ? process.argv[sourceFlag + 1] : process.env.FURNACE_RELEASES_SOURCE
const checkOnly = process.argv.includes('--check')

const sourceText = sourcePath
  ? await readFile(resolve(root, sourcePath), 'utf8')
  : await fetchCanonicalManifest()

const manifest = JSON.parse(sourceText)
validateManifest(manifest)
const formatted = `${JSON.stringify(manifest, null, 2)}\n`

if (checkOnly) {
  const current = await readFile(destination, 'utf8').catch(() => '')
  if (current !== formatted) {
    console.error('Release data is out of sync. Run `npm run releases:sync`.')
    process.exitCode = 1
  }
} else {
  await mkdir(dirname(destination), { recursive: true })
  await writeFile(destination, formatted, 'utf8')
  console.log(`Synced ${manifest.releases.length} Furnace releases.`)
}

async function fetchCanonicalManifest() {
  const response = await fetch('https://raw.githubusercontent.com/amoreX/furnace/main/src/releases.json')
  if (response.status === 404 && checkOnly) {
    console.warn('Canonical release manifest is not published yet; validating the vendored manifest only.')
    return readFile(destination, 'utf8')
  }
  if (!response.ok) throw new Error(`Unable to fetch release manifest: HTTP ${response.status}`)
  return response.text()
}

function validateManifest(manifest) {
  if (manifest?.schemaVersion !== 1 || !Array.isArray(manifest.releases)) {
    throw new Error('Unsupported Furnace release manifest.')
  }
  const versions = new Set()
  for (const release of manifest.releases) {
    if (!/^\d+\.\d+\.\d+$/.test(release?.version ?? '')) throw new Error(`Invalid release version: ${release?.version}`)
    if (versions.has(release.version)) throw new Error(`Duplicate release version: ${release.version}`)
    if (!Array.isArray(release.changes) || release.changes.length === 0) throw new Error(`Release ${release.version} has no changes.`)
    versions.add(release.version)
  }
}
