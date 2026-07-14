import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const NORMAL_MAP_SHA256 = {
  'public/assets/background/global-normal-map.png': '26a3883629ac2e6654d660d4932839cb1133953fa193cb84edf323a4be19ba11',
  'public/assets/contributors/nihal-normal-map.png': '0b5ec90e32ed8861f06131a3b0fc49212075fbc8271d79fd89b7278bfe030e1a',
  'public/assets/contributors/ronish-normal-map.png': 'e7fe96b38e5327fcde361a64da6a8a1aee93de11b9277a17fb897ebbe0a95f50',
  'public/assets/features/bring-your-own-keys-normal-map.png': 'f83398a4f26196ad7635ac9a0358e34d68f0709632a488ef5b61fb4a40c7ff1b',
  'public/assets/features/evolve-agent-normal-map.png': '43453c52bb31155c9d70afc4c87d52c3064ceb20f94ea1c2338afbe38d3239ab',
  'public/assets/features/fork-conversation-normal-map.png': 'c124ac2810e3121c6fad25b6c0316e80ac4edf7efe75cae321c06ea74a39bf23',
  'public/assets/features/token-indexing-normal-map.png': '5799882fc01f04db5e52684f01d2162921bee965dd768e2eab28959d9e67d8ad',
}

describe('migrated normal maps', () => {
  it.each(Object.entries(NORMAL_MAP_SHA256))('%s retains its exact bytes', (path, expected) => {
    const digest = createHash('sha256').update(readFileSync(path)).digest('hex')
    expect(digest).toBe(expected)
  })
})
