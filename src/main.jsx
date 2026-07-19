import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import './index.css'

const STARTUP_TIMEOUT_MS = 8000
const LOADER_EXIT_MS = 240
const startupImages = [
  '/assets/brand/furnace-logo.svg',
  '/assets/background/global-normal-map.png',
  '/assets/features/fork-conversation.avif',
  '/assets/features/token-indexing.avif',
  '/assets/features/bring-your-own-keys.avif',
  '/assets/features/evolve-agent.avif',
  '/assets/features/fork-conversation-normal-map.png',
  '/assets/features/token-indexing-normal-map.png',
  '/assets/features/bring-your-own-keys-normal-map.png',
  '/assets/features/evolve-agent-normal-map.png',
  '/assets/contributors/nihal-normal-map.png',
  '/assets/contributors/ronish-normal-map.png',
]
const startupFonts = [
  '400 16px "Departure Mono"',
  '400 16px "Geist Mono"',
  '400 16px "Libre Baskerville"',
  'italic 400 16px "Libre Baskerville"',
]

function loadImage(source) {
  return new Promise((resolve) => {
    const image = new Image()
    image.onload = () => {
      Promise.resolve(image.decode?.())
        .catch(() => {})
        .finally(resolve)
    }
    image.onerror = resolve
    image.src = source
  })
}

function waitForStartupAssets() {
  const imageLoads = startupImages.map(loadImage)
  const fontLoads = document.fonts
    ? startupFonts.map((font) => document.fonts.load(font))
    : []
  return Promise.allSettled([...imageLoads, ...fontLoads])
}

function wait(duration) {
  return new Promise((resolve) => setTimeout(resolve, duration))
}

const rootElement = document.getElementById('root')
const loaderElement = document.getElementById('boot-loader')
let signalBackgroundReady
const backgroundReady = new Promise((resolve) => {
  signalBackgroundReady = resolve
})

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <BrowserRouter>
      <App onBackgroundReady={signalBackgroundReady} />
    </BrowserRouter>
  </React.StrictMode>
)

Promise.race([
  Promise.all([waitForStartupAssets(), backgroundReady]),
  wait(STARTUP_TIMEOUT_MS),
]).then(() => {
  requestAnimationFrame(() => {
    rootElement.removeAttribute('aria-busy')
    loaderElement?.classList.add('is-leaving')
    setTimeout(() => loaderElement?.remove(), LOADER_EXIT_MS)
  })
})
