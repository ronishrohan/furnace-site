import { describe, expect, it } from 'vitest'
import manifest from './releases.json'

describe('release manifest', () => {
  it('contains every reconstructed Furnace release in newest-first order', () => {
    expect(manifest.schemaVersion).toBe(1)
    expect(manifest.releases).toHaveLength(29)
    expect(manifest.releases[0].version).toBe('0.2.4')
    expect(manifest.releases.at(-1).version).toBe('0.1.0')

    const versions = manifest.releases.map((release) => release.version)
    expect(new Set(versions).size).toBe(versions.length)
    expect(manifest.releases.every((release) => (
      /^\d+\.\d+\.\d+$/.test(release.version)
      && /^\d{4}-\d{2}-\d{2}$/.test(release.date)
      && release.summary.length > 0
      && release.changes.length > 0
    ))).toBe(true)
  })

  it('labels release boundaries that were not published to npm', () => {
    expect(manifest.releases.find((release) => release.version === '0.1.23')?.status).toBe('tagged')
    expect(manifest.releases.find((release) => release.version === '0.2.4')?.status).toBe('upcoming')
  })
})
