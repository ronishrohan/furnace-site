import { expect, test } from '@playwright/test'
import { mockReleaseManifest } from './release-fixture.js'

const BRAND_ASSET = '/assets/brand/furnace-logo.svg'
const BACKGROUND_ASSET = '/assets/background/global-normal-map.png'
const CONTRIBUTOR_ASSETS = [
  '/assets/contributors/nihal-normal-map.png',
  '/assets/contributors/ronish-normal-map.png',
]
const FEATURE_PAIRS = [
  {
    image: '/assets/features/fork-conversation.avif',
    normalMap: '/assets/features/fork-conversation-normal-map.png',
    width: 1672,
    height: 941,
  },
  {
    image: '/assets/features/token-indexing.avif',
    normalMap: '/assets/features/token-indexing-normal-map.png',
    width: 1448,
    height: 1086,
  },
  {
    image: '/assets/features/bring-your-own-keys.avif',
    normalMap: '/assets/features/bring-your-own-keys-normal-map.png',
    width: 1448,
    height: 1086,
  },
  {
    image: '/assets/features/evolve-agent.avif',
    normalMap: '/assets/features/evolve-agent-normal-map.png',
    width: 1448,
    height: 1086,
  },
]
const OLD_ASSET_PATHS = new Set([
  '/evolve.png',
  '/evolve_normal.png',
  '/furnace-logo.svg',
  '/furnace-wordmark.svg',
  '/graph-normal.png',
  '/graph-stronger.png',
  '/graph.png',
  '/graph_normal.png',
  '/hand.png',
  '/hand_normal.png',
  '/money.png',
  '/money_normal.png',
  '/nihal_normal.png',
  '/normal-map.png',
  '/paper.png',
  '/ronish_normal.png',
  '/assets/features/bring-your-own-keys.png',
  '/assets/features/evolve-agent.png',
  '/assets/features/fork-conversation.png',
  '/assets/features/token-indexing.png',
])

function recordNetwork(page) {
  const requests = new Set()
  const failures = []

  page.on('request', (request) => {
    const url = new URL(request.url())
    if (url.origin === 'http://127.0.0.1:4177') requests.add(url.pathname)
  })
  page.on('requestfailed', (request) => {
    const url = new URL(request.url())
    if (url.origin === 'http://127.0.0.1:4177') {
      failures.push(`${url.pathname}: ${request.failure()?.errorText ?? 'request failed'}`)
    }
  })
  page.on('response', (response) => {
    const url = new URL(response.url())
    if (url.origin === 'http://127.0.0.1:4177' && response.status() >= 400) {
      failures.push(`${url.pathname}: HTTP ${response.status()}`)
    }
  })

  return { failures, requests }
}

async function loadImage(page, src) {
  return page.evaluate(
    (imageSrc) =>
      new Promise((resolve, reject) => {
        const image = new Image()
        image.onload = () => resolve({ width: image.naturalWidth, height: image.naturalHeight })
        image.onerror = () => reject(new Error(`Failed to load ${imageSrc}`))
        image.src = imageSrc
      }),
    src,
  )
}

test.beforeEach(async ({ context }) => {
  await mockReleaseManifest(context)
  await context.route('https://registry.npmjs.org/cook-furnace/latest', (route) =>
    route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({ version: '9.8.7' }),
    }),
  )
})

for (const route of ['/', '/features', '/changelog', '/docs']) {
  test(`${route} loads its owned assets without failures or legacy requests`, async ({ page }) => {
    const network = recordNetwork(page)
    await page.goto(route, { waitUntil: 'networkidle' })

    await expect(page.locator('main')).toBeVisible()
    await expect(page.locator(`link[rel="icon"][href="${BRAND_ASSET}"]`)).toHaveCount(1)
    await expect(page.locator(`link[rel="preload"][href="${BACKGROUND_ASSET}"]`)).toHaveCount(1)
    expect(network.requests).toContain(BACKGROUND_ASSET)

    if (route !== '/docs') expect(network.requests).toContain(BRAND_ASSET)

    expect([...network.requests].filter((path) => OLD_ASSET_PATHS.has(path))).toEqual([])
    expect(network.failures).toEqual([])
  })
}

test('homepage loads every feature and contributor texture before scrolling', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 1200 })
  const network = recordNetwork(page)
  await page.goto('/', { waitUntil: 'networkidle' })

  for (const asset of [...FEATURE_PAIRS.map(({ normalMap }) => normalMap), ...CONTRIBUTOR_ASSETS]) {
    expect(network.requests).toContain(asset)
  }
  for (const { image } of FEATURE_PAIRS) expect(network.requests).toContain(image)
  expect(network.failures).toEqual([])
})

test('offscreen feature and contributor canvases retain their WebGL contexts', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 })
  await page.goto('/', { waitUntil: 'networkidle' })

  await page.locator('#features-section').scrollIntoViewIfNeeded()
  await page.locator('#site-footer').scrollIntoViewIfNeeded()
  await page.locator('main > section').first().scrollIntoViewIfNeeded()
  await page.waitForTimeout(3500)

  const contextsAreAvailable = await page.evaluate(() => {
    const featureCanvases = [...document.querySelectorAll('#features-section canvas')]
    const contributorCanvases = [...document.querySelectorAll('#site-footer a canvas')]
    return [...featureCanvases, ...contributorCanvases].every((canvas) => {
      const gl = canvas.getContext('webgl')
      return gl && !gl.isContextLost()
    })
  })

  expect(contextsAreAvailable).toBe(true)
})

test('mobile footer stays within a safe WebGL context budget', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/', { waitUntil: 'networkidle' })

  const activeContexts = await page.evaluate(() =>
    [...document.querySelectorAll('canvas')]
      .filter((canvas) => {
        const gl = canvas.getContext('webgl')
        return gl && !gl.isContextLost()
      })
      .length
  )

  expect(activeContexts).toBeLessThanOrEqual(8)
})

test('mobile contributor portraits have a fallback when WebGL is unavailable', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.addInitScript(() => {
    const getContext = HTMLCanvasElement.prototype.getContext
    HTMLCanvasElement.prototype.getContext = function patchedGetContext(type, ...args) {
      if (type === 'webgl' && this.closest('#site-footer')) return null
      return getContext.call(this, type, ...args)
    }
  })
  await page.goto('/', { waitUntil: 'networkidle' })
  await page.locator('#site-footer').scrollIntoViewIfNeeded()

  const portraits = page.locator('#site-footer a:visible img[data-coin-fallback]')
  await expect(portraits).toHaveCount(2)
  await expect(portraits.first()).toBeVisible()
  await expect(portraits.last()).toBeVisible()
})

test('feature illustrations and normal maps load at matching dimensions', async ({ page }) => {
  const network = recordNetwork(page)
  await page.goto('/features', { waitUntil: 'networkidle' })

  for (const pair of FEATURE_PAIRS) {
    const [image, normalMap] = await Promise.all([
      loadImage(page, pair.image),
      loadImage(page, pair.normalMap),
    ])
    expect(image).toEqual({ width: pair.width, height: pair.height })
    expect(normalMap).toEqual(image)
  }

  expect(network.failures).toEqual([])
})

test('favicon, background, and contributor assets survive footer interactions', async ({ page }) => {
  const network = recordNetwork(page)
  await page.goto('/', { waitUntil: 'networkidle' })

  await page.getByRole('button', { name: 'TALK TO US' }).click()
  await page.getByRole('link', { name: 'Nihal on X' }).hover()
  await page.getByRole('link', { name: 'Ronish on X' }).hover()
  await loadImage(page, BRAND_ASSET)

  for (const asset of [BRAND_ASSET, BACKGROUND_ASSET, ...CONTRIBUTOR_ASSETS]) {
    expect(network.requests).toContain(asset)
  }
  expect([...network.requests].filter((path) => OLD_ASSET_PATHS.has(path))).toEqual([])
  expect(network.failures).toEqual([])
})
