import { cleanup, render } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import GraphCardBackground, { resolveAccent } from './GraphCardBackground.jsx'

const requestRender = vi.hoisted(() => vi.fn())

vi.mock('../effects/useActivityRenderLoop.js', () => ({
  default: () => requestRender,
}))

describe('GraphCardBackground accent rendering', () => {
  beforeEach(() => {
    requestRender.mockClear()
    vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: true })))
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null)
    vi.stubGlobal('ResizeObserver', class {
      observe() {}
      disconnect() {}
    })
  })

  afterEach(() => {
    cleanup()
    vi.unstubAllGlobals()
  })

  it('requests a static frame when the accent prop changes', () => {
    const { rerender } = render(<GraphCardBackground accent={false} />)
    requestRender.mockClear()

    rerender(<GraphCardBackground accent />)

    expect(requestRender).toHaveBeenCalledOnce()
  })

  it('snaps under reduced motion while preserving normal-motion easing', () => {
    expect(resolveAccent(0.25, 1, true)).toBe(1)
    expect(resolveAccent(0.25, 1, false)).toBeCloseTo(0.34)
  })
})
