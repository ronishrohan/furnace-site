import { expect, test } from '@playwright/test'

const BRAND_ASSET = '/assets/brand/furnace-logo.svg'
const BACKGROUND_ASSET = '/assets/background/global-normal-map.png'
const CONTRIBUTOR_ASSETS = [
  '/assets/contributors/nihal-normal-map.png',
  '/assets/contributors/ronish-normal-map.png',
]
const FEATURE_PAIRS = [
  {
    image: '/assets/features/fork-conversation.png',
    normalMap: '/assets/features/fork-conversation-normal-map.png',
    width: 1672,
    height: 941,
  },
  {
    image: '/assets/features/token-indexing.png',
    normalMap: '/assets/features/token-indexing-normal-map.png',
    width: 1448,
    height: 1086,
  },
  {
    image: '/assets/features/bring-your-own-keys.png',
    normalMap: '/assets/features/bring-your-own-keys-normal-map.png',
    width: 1448,
    height: 1086,
  },
  {
    image: '/assets/features/evolve-agent.png',
    normalMap: '/assets/features/evolve-agent-normal-map.png',
    width: 1448,
    height: 1086,
  },
]
const FEATURE_ASSETS = FEATURE_PAIRS.flatMap(({ image, normalMap }) => [image, normalMap])
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
  await context.route('https://registry.npmjs.org/cook-furnace/latest', (route) =>
    route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({ version: '9.8.7' }),
    }),
  )
})

for (const route of ['/', '/features', '/docs']) {
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

test('homepage defers feature and contributor textures until their sections approach the viewport', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 1200 })
  const network = recordNetwork(page)
  await page.goto('/', { waitUntil: 'networkidle' })

  for (const asset of [...FEATURE_ASSETS, ...CONTRIBUTOR_ASSETS]) {
    expect(network.requests).not.toContain(asset)
  }

  await page.locator('#features-section').scrollIntoViewIfNeeded()
  await expect.poll(() => FEATURE_ASSETS.every((asset) => network.requests.has(asset))).toBe(true)
  for (const asset of CONTRIBUTOR_ASSETS) expect(network.requests).not.toContain(asset)

  await page.locator('#site-footer').scrollIntoViewIfNeeded()
  await expect.poll(() => CONTRIBUTOR_ASSETS.every((asset) => network.requests.has(asset))).toBe(true)
  expect(network.failures).toEqual([])
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
