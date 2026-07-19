import { expect, test } from '@playwright/test'
import { mockReleaseManifest, RELEASE_MANIFEST_URL, releaseManifestFixture } from './release-fixture.js'

const routes = [
  ['/', /We studied what users love/],
  ['/features', /Fork Any Conversation/],
  ['/changelog', /Every shipped turn of the furnace/],
  ['/docs', /Getting Started/],
  ['/docs/getting-started', /Getting Started/],
  ['/docs/commands', /Commands/],
  ['/docs/tools', /Tools/],
  ['/docs/safety', /Safety/],
  ['/docs/configuration', /Configuration/],
]

test.beforeEach(async ({ context, page }) => {
  await mockReleaseManifest(context)
  await context.route('https://registry.npmjs.org/cook-furnace/latest', (route) =>
    route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({ version: '9.8.7' }),
    }),
  )

  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: async (text) => {
          window.__copiedText = text
        },
      },
    })

    window.__scrolledIds = []
    Element.prototype.scrollIntoView = function scrollIntoView() {
      window.__scrolledIds.push(this.id)
    }
  })
})

test.describe('routes', () => {
  for (const [path, expectedText] of routes) {
    test(`${path} renders its expected content`, async ({ page }) => {
      await page.goto(path)

      await expect(page.locator('main')).toContainText(expectedText)
    })
  }
})

test('keeps the app covered until startup assets are ready', async ({ page }) => {
  let releaseBackground
  const backgroundGate = new Promise((resolve) => {
    releaseBackground = resolve
  })
  await page.route('**/assets/background/global-normal-map.png', async (route) => {
    await backgroundGate
    await route.continue()
  })

  const navigation = page.goto('/', { waitUntil: 'domcontentloaded' })
  await expect(page.locator('#boot-loader')).toBeVisible()
  await expect(page.locator('#root')).toHaveAttribute('aria-busy', 'true')

  releaseBackground()
  await navigation
  await expect(page.locator('#boot-loader')).toHaveCount(0)
  await expect(page.locator('#root')).not.toHaveAttribute('aria-busy', 'true')
})

test('keeps the React-owned background canvas stable across route changes', async ({ page }) => {
  const webglWarnings = []
  page.on('console', (message) => {
    if (/(too many active webgl|context (?:lost|exhaust))/i.test(message.text())) {
      webglWarnings.push(message.text())
    }
  })

  for (const path of ['/', '/docs/getting-started', '/changelog', '/features', '/']) {
    await page.goto(path)
    await expect(page.locator('#canvas')).toHaveCount(1)
    await expect(page.locator('main')).toBeVisible()
  }

  expect(webglWarnings).toEqual([])
})

test('changelog presents every reconstructed release and source evidence', async ({ page }) => {
  await page.goto('/changelog')

  await expect(page).toHaveTitle('Changelog · Furnace')
  await expect(page.locator('ol > li')).toHaveCount(releaseManifestFixture.releases.length)
  await expect(page.getByRole('heading', { name: 'v0.2.5' })).toBeVisible()
  await expect(page.getByText('Latest', { exact: true })).toBeVisible()
  await expect(page.getByText('Tagged · not published', { exact: true })).toBeVisible()
  await expect(page.getByRole('link', { name: 'View source commit for Furnace 0.2.3' }))
    .toHaveAttribute('href', /github\.com\/amoreX\/furnace\/commit\/802bf36/)
})

test('changelog shows a direct GitHub error instead of stale fallback data', async ({ page }) => {
  await page.route(RELEASE_MANIFEST_URL, (route) => route.abort('failed'))
  await page.goto('/changelog')

  await expect(page.getByRole('alert')).toContainText('The changelog could not be loaded.')
  await expect(page.getByRole('link', { name: 'Open the release manifest directly.' }))
    .toHaveAttribute('href', RELEASE_MANIFEST_URL)
  await expect(page.locator('ol > li')).toHaveCount(0)
})

test('mobile menu exposes changelog navigation and restores focus on Escape', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/changelog')

  const menu = page.getByRole('button', { name: 'Menu' })
  await menu.click()
  const changelog = page.getByRole('link', { name: 'Changelog' })
  await expect(changelog).toBeVisible()
  await expect(changelog).toHaveAttribute('aria-current', 'page')

  await page.keyboard.press('Escape')
  await expect(page.getByRole('link', { name: 'Changelog' })).toHaveCount(0)
  await expect(menu).toBeFocused()
})

test('starts in night mode and persists a day-mode choice', async ({ page }) => {
  await page.goto('/')

  const themeToggle = page.getByRole('button', { name: 'Toggle color theme' })
  await expect(page.locator('html')).toHaveClass(/theme-night/)
  await expect(themeToggle).toHaveText('DAY')
  await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(26, 26, 26)')

  await themeToggle.click()
  await expect(page.locator('html')).not.toHaveClass(/theme-night/)
  await expect(themeToggle).toHaveText('NIGHT')
  await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(130, 127, 112)')
  await expect.poll(() => page.evaluate(() => localStorage.getItem('furnace-theme'))).toBe('day')

  await page.reload()
  await expect(page.locator('html')).not.toHaveClass(/theme-night/)
  await expect(themeToggle).toHaveText('NIGHT')
})

test('feature navigation scrolls to the feature grid', async ({ page }) => {
  await page.goto('/docs/commands')

  await page.getByRole('link', { name: 'Features' }).click()

  await expect(page).toHaveURL('/')
  await expect
    .poll(() => page.evaluate(() => window.__scrolledIds))
    .toContain('features-section')
})

test('accepts a prerelease package version', async ({ page }) => {
  await page.route('https://registry.npmjs.org/cook-furnace/latest', (route) =>
    route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({ version: '9.8.7-rc.1' }),
    }),
  )
  await page.goto('/')

  await expect(page.getByText('v9.8.7-rc.1', { exact: true })).toBeVisible()
})

test('keeps the version fallback for a malformed registry response', async ({ page }) => {
  await page.route('https://registry.npmjs.org/cook-furnace/latest', (route) =>
    route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({ version: 'latest' }),
    }),
  )
  await page.goto('/')

  await expect(page.getByText('v0.0.0', { exact: true })).toBeVisible()
})

for (const [name, routeHandler] of [
  ['HTTP 500', (route) => route.fulfill({ status: 500, body: 'registry unavailable' })],
  ['fetch failure', (route) => route.abort('failed')],
]) {
  test(`keeps the version fallback after an npm ${name}`, async ({ page }) => {
    await page.route('https://registry.npmjs.org/cook-furnace/latest', routeHandler)
    await page.goto('/')

    await expect(page.getByText('v0.0.0', { exact: true })).toBeVisible()
  })
}

test('copies the homepage install command', async ({ page }) => {
  await page.goto('/')

  const installControl = page.getByText('npm install -g cook-furnace', { exact: true })
  const installButton = installControl.locator('..')
  await expect
    .poll(() => installButton.evaluate((element) => getComputedStyle(element).pointerEvents))
    .toBe('auto')
  await installButton.click()

  await expect(page.getByText('Copied! Start cooking now')).toBeVisible()
  await expect.poll(() => page.evaluate(() => window.__copiedText)).toBe('npm install -g cook-furnace')
})

test('copies a command from the documentation', async ({ page }) => {
  await page.goto('/docs/getting-started')

  await page.getByRole('button', { name: 'Copy code' }).first().click()

  await expect(page.getByRole('button', { name: 'Copy code' }).first()).toHaveText('Copied')
  await expect.poll(() => page.evaluate(() => window.__copiedText)).toBe('npm install -g cook-furnace')
})

test('keyboard activates install, theme, and documentation copy controls with visible focus', async ({ page }) => {
  const expectKeyboardFocus = async (control) => {
    await page.keyboard.press('Tab')
    await control.focus()
    await expect(control).toBeFocused()
    await expect.poll(() => control.evaluate((element) => getComputedStyle(element).outlineWidth)).toBe('2px')
  }

  await page.goto('/')
  const install = page.getByRole('button', { name: 'npm install -g cook-furnace' })
  await expect(install).toBeVisible()
  await expectKeyboardFocus(install)
  await install.press('Enter')
  await expect.poll(() => page.evaluate(() => window.__copiedText)).toBe('npm install -g cook-furnace')

  const theme = page.getByRole('button', { name: 'Toggle color theme' })
  await expectKeyboardFocus(theme)
  await theme.press('Enter')
  await expect(page.locator('html')).not.toHaveClass(/theme-night/)

  await page.goto('/docs/getting-started')
  const copy = page.getByRole('button', { name: 'Copy code' }).first()
  await expectKeyboardFocus(copy)
  await copy.press('Enter')
  await expect(copy).toHaveText('Copied')
})

test('keeps package, repository, issue, and contributor links external', async ({ page }) => {
  await page.goto('/')

  const expectedLinks = [
    ['GitHub', 'https://github.com/amoreX/furnace'],
    ['FOUND SOMETHING WRONG? OPEN AN ISSUE', 'https://github.com/amoreX/furnace/issues'],
    ['Nihal on X', 'https://x.com/nihaliscoding'],
    ['Ronish on X', 'https://x.com/ronish1o'],
  ]

  for (const [name, href] of expectedLinks) {
    const link = page.getByRole('link', { name, exact: true })
    await expect(link).toHaveAttribute('href', href)
    await expect(link).toHaveAttribute('target', '_blank')
  }
})

test('keeps primary navigation available at a phone viewport', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/docs/configuration')

  await expect(page.getByRole('link', { name: 'FURNACE', exact: true })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Getting Started' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Configuration' })).toBeVisible()
  await expect(page.locator('main')).toContainText('Configuration')
})

for (const viewport of [
  { name: 'phone', width: 360, height: 800 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1280, height: 800 },
]) {
  test(`keeps every primary route within the ${viewport.name} viewport`, async ({ page }) => {
    await page.setViewportSize(viewport)

    for (const path of ['/', '/features', '/changelog', '/docs/getting-started']) {
      await page.goto(path, { waitUntil: 'networkidle' })
      await expect
        .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth))
        .toBe(true)
    }
  })
}
