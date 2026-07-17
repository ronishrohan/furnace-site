import { expect, test } from '@playwright/test'

const screenshotOptions = {
  animations: 'disabled',
  maxDiffPixelRatio: 0.12,
  threshold: 0.35,
}

test.beforeEach(async ({ context, page }) => {
  await context.route('https://registry.npmjs.org/cook-furnace/latest', (route) =>
    route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({ version: '9.8.7' }),
    }),
  )
  await page.addInitScript(() => {
    document.addEventListener('DOMContentLoaded', () => {
      const style = document.createElement('style')
      style.textContent = `
        *, *::before, *::after {
          animation-duration: 0s !important;
          animation-delay: 0s !important;
          transition-duration: 0s !important;
        }
      `
      document.head.append(style)
    })
  })
})

async function prepare(page, path) {
  await page.goto(path, { waitUntil: 'networkidle' })
  await expect(page.locator('main')).toBeVisible()
  await page.evaluate(() => document.fonts.ready)
}

async function waitForHomeReveal(page) {
  const install = page.getByRole('button', { name: 'npm install -g cook-furnace' })
  await expect.poll(() => install.evaluate((element) => getComputedStyle(element.parentElement).pointerEvents)).toBe('auto')
}

test('home night desktop', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 })
  await prepare(page, '/')
  await expect(page.locator('html')).toHaveClass(/theme-night/)
  await waitForHomeReveal(page)
  await expect(page).toHaveScreenshot('home-night-desktop.png', screenshotOptions)
})

test('home day desktop', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('furnace-theme', 'day'))
  await page.setViewportSize({ width: 1280, height: 800 })
  await prepare(page, '/')
  await expect(page.locator('html')).not.toHaveClass(/theme-night/)
  await waitForHomeReveal(page)
  await expect(page).toHaveScreenshot('home-day-desktop.png', screenshotOptions)
})

test('home night mobile', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await prepare(page, '/')
  await expect(page.locator('html')).toHaveClass(/theme-night/)
  await waitForHomeReveal(page)
  await expect(page).toHaveScreenshot('home-night-mobile.png', screenshotOptions)
})

test('features desktop', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 })
  await prepare(page, '/features')
  await expect(page).toHaveScreenshot('features-desktop.png', screenshotOptions)
})

test('features mobile', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await prepare(page, '/features')
  await expect(page).toHaveScreenshot('features-mobile.png', screenshotOptions)
})

test('changelog desktop', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 })
  await prepare(page, '/changelog')
  await expect(page).toHaveScreenshot('changelog-desktop.png', {
    ...screenshotOptions,
    fullPage: true,
  })
})

test('changelog day desktop', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('furnace-theme', 'day'))
  await page.setViewportSize({ width: 1280, height: 800 })
  await prepare(page, '/changelog')
  await expect(page).toHaveScreenshot('changelog-day-desktop.png', {
    ...screenshotOptions,
    fullPage: true,
  })
})

test('changelog mobile', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await prepare(page, '/changelog')
  await expect(page).toHaveScreenshot('changelog-mobile.png', {
    ...screenshotOptions,
    fullPage: true,
  })
})

test('footer mobile', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await prepare(page, '/')
  const footer = page.locator('footer')
  await footer.scrollIntoViewIfNeeded()
  await expect(footer).toHaveScreenshot('footer-mobile.png', screenshotOptions)
})

test('docs desktop', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 })
  await prepare(page, '/docs/getting-started')
  await expect(page).toHaveScreenshot('docs-desktop.png', screenshotOptions)
})

test('docs mobile', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await prepare(page, '/docs/getting-started')
  await expect(page).toHaveScreenshot('docs-mobile.png', screenshotOptions)
})
