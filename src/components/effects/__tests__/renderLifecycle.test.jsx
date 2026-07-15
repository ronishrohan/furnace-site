import { StrictMode, useRef } from 'react'
import { act, cleanup, fireEvent, render } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import Background from '../Background.jsx'
import useActivityRenderLoop from '../useActivityRenderLoop.js'
import {
  loadTexture,
  releaseWebGLContext,
  scheduleWebGLContextRelease,
} from '../webgl.js'

function LoopHarness({ draw, observeOffscreen = true, redrawOnThemeChange = false }) {
  const targetRef = useRef(null)
  const requestRender = useActivityRenderLoop(targetRef, draw, {
    observeOffscreen,
    redrawOnThemeChange,
  })
  return (
    <>
      <canvas ref={targetRef} />
      <button type="button" onClick={requestRender}>Render</button>
    </>
  )
}

describe('render lifecycle', () => {
  let animationFrames
  let nextFrame
  let intersectionObservers
  let mediaListeners
  let reducedMotion

  const flushFrame = (time = 16) => {
    const [id, callback] = animationFrames.entries().next().value ?? []
    if (!callback) return
    animationFrames.delete(id)
    callback(time)
  }

  beforeEach(() => {
    animationFrames = new Map()
    nextFrame = 1
    intersectionObservers = []
    mediaListeners = new Set()
    reducedMotion = false

    vi.stubGlobal('requestAnimationFrame', vi.fn((callback) => {
      const id = nextFrame
      nextFrame += 1
      animationFrames.set(id, callback)
      return id
    }))
    vi.stubGlobal('cancelAnimationFrame', vi.fn((id) => animationFrames.delete(id)))
    vi.stubGlobal('matchMedia', vi.fn(() => ({
      get matches() {
        return reducedMotion
      },
      addEventListener: vi.fn((_type, listener) => mediaListeners.add(listener)),
      removeEventListener: vi.fn((_type, listener) => mediaListeners.delete(listener)),
    })))

    class IntersectionObserverMock {
      constructor(callback, options) {
        this.callback = callback
        this.options = options
        this.disconnect = vi.fn()
        this.observe = vi.fn()
        this.unobserve = vi.fn()
        intersectionObservers.push(this)
      }
    }
    vi.stubGlobal('IntersectionObserver', IntersectionObserverMock)
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      value: 'visible',
    })
  })

  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('keeps one active loop and listener set under Strict Mode', () => {
    const draw = vi.fn()
    const addListener = vi.spyOn(document, 'addEventListener')
    const removeListener = vi.spyOn(document, 'removeEventListener')

    render(
      <StrictMode>
        <LoopHarness draw={draw} />
      </StrictMode>,
    )

    expect(animationFrames).toHaveLength(1)
    expect(mediaListeners).toHaveLength(1)
    expect(addListener.mock.calls.filter(([type]) => type === 'visibilitychange')).toHaveLength(2)
    expect(removeListener.mock.calls.filter(([type]) => type === 'visibilitychange')).toHaveLength(1)
    expect(intersectionObservers).toHaveLength(2)
    expect(intersectionObservers[0].disconnect).toHaveBeenCalledOnce()

    act(() => flushFrame())
    expect(draw).toHaveBeenCalledOnce()
    expect(animationFrames).toHaveLength(1)
  })

  it('pauses while hidden or offscreen and resumes safely', () => {
    const draw = vi.fn()
    render(<LoopHarness draw={draw} />)
    const observer = intersectionObservers.at(-1)

    act(() => observer.callback([{ isIntersecting: false }]))
    expect(animationFrames).toHaveLength(0)

    act(() => observer.callback([{ isIntersecting: true }]))
    expect(animationFrames).toHaveLength(1)
    act(() => flushFrame())
    expect(draw).toHaveBeenCalledOnce()

    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      value: 'hidden',
    })
    act(() => document.dispatchEvent(new Event('visibilitychange')))
    expect(animationFrames).toHaveLength(0)

    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      value: 'visible',
    })
    act(() => document.dispatchEvent(new Event('visibilitychange')))
    act(() => flushFrame(32))
    expect(draw).toHaveBeenCalledTimes(2)
  })

  it('renders one static frame for reduced motion', () => {
    reducedMotion = true
    const draw = vi.fn()
    render(<LoopHarness draw={draw} />)

    expect(animationFrames).toHaveLength(1)
    act(() => flushFrame())
    expect(draw).toHaveBeenCalledOnce()
    expect(animationFrames).toHaveLength(0)
  })

  it('stops when draw returns false and requestRender restarts it', () => {
    const draw = vi.fn(() => false)
    const { getByRole } = render(<LoopHarness draw={draw} />)

    act(() => flushFrame())
    expect(draw).toHaveBeenCalledOnce()
    expect(animationFrames).toHaveLength(0)

    fireEvent.click(getByRole('button', { name: 'Render' }))
    expect(animationFrames).toHaveLength(1)
    act(() => flushFrame(32))
    expect(draw).toHaveBeenCalledTimes(2)
    expect(animationFrames).toHaveLength(0)
  })

  it('renders one final frame when reduced motion turns on and resumes when it turns off', () => {
    const draw = vi.fn(() => true)
    render(<LoopHarness draw={draw} />)

    act(() => flushFrame())
    expect(animationFrames).toHaveLength(1)

    reducedMotion = true
    act(() => mediaListeners.forEach((listener) => listener({ matches: true })))
    expect(animationFrames).toHaveLength(1)
    act(() => flushFrame(32))
    expect(draw).toHaveBeenCalledTimes(2)
    expect(animationFrames).toHaveLength(0)

    reducedMotion = false
    act(() => mediaListeners.forEach((listener) => listener({ matches: false })))
    act(() => flushFrame(48))
    expect(draw).toHaveBeenCalledTimes(3)
    expect(animationFrames).toHaveLength(1)
  })

  it('redraws from themechange without observing document classes', () => {
    const mutationObserver = vi.fn(() => {
      throw new Error('MutationObserver should not be created')
    })
    vi.stubGlobal('MutationObserver', mutationObserver)
    reducedMotion = true
    const draw = vi.fn(() => true)
    render(<LoopHarness draw={draw} redrawOnThemeChange />)
    act(() => flushFrame())

    act(() => window.dispatchEvent(new CustomEvent('themechange')))
    expect(animationFrames).toHaveLength(1)
    act(() => flushFrame(32))
    expect(draw).toHaveBeenCalledTimes(2)
    expect(mutationObserver).not.toHaveBeenCalled()
  })

  it('does not create a RAF storm when WebGL is unavailable', () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null)
    render(<Background />)

    expect(animationFrames).toHaveLength(1)
    act(() => flushFrame())
    expect(animationFrames).toHaveLength(0)
  })

  it('cancels frames and observers on cleanup', () => {
    const { unmount } = render(<LoopHarness draw={vi.fn()} />)
    const observer = intersectionObservers.at(-1)

    unmount()

    expect(animationFrames).toHaveLength(0)
    expect(mediaListeners).toHaveLength(0)
    expect(observer.disconnect).toHaveBeenCalledOnce()
  })

  it('ignores a delayed texture callback after disposal', () => {
    let image
    class ImageMock {
      constructor() {
        image = this
      }
    }
    vi.stubGlobal('Image', ImageMock)

    const gl = {
      TEXTURE_2D: 1,
      RGB: 2,
      UNSIGNED_BYTE: 3,
      TEXTURE_WRAP_S: 4,
      TEXTURE_WRAP_T: 5,
      CLAMP_TO_EDGE: 6,
      TEXTURE_MIN_FILTER: 7,
      TEXTURE_MAG_FILTER: 8,
      LINEAR: 9,
      createTexture: vi.fn(() => ({})),
      bindTexture: vi.fn(),
      texImage2D: vi.fn(),
      texParameteri: vi.fn(),
      isContextLost: vi.fn(() => false),
    }
    const onLoad = vi.fn()
    const textureLoad = loadTexture(gl, '/delayed.png', { onLoad })
    const delayedOnLoad = image.onload

    textureLoad.cancel()
    delayedOnLoad()

    expect(gl.texImage2D).toHaveBeenCalledOnce()
    expect(onLoad).not.toHaveBeenCalled()
  })

  it('releases a WebGL context through WEBGL_lose_context', () => {
    const loseContext = vi.fn()
    const gl = {
      getExtension: vi.fn((name) => name === 'WEBGL_lose_context' ? { loseContext } : null),
    }

    releaseWebGLContext(gl)

    expect(gl.getExtension).toHaveBeenCalledWith('WEBGL_lose_context')
    expect(loseContext).toHaveBeenCalledOnce()
  })

  it('cancels a deferred context release during immediate reinitialization', () => {
    vi.useFakeTimers()
    const loseContext = vi.fn()
    const gl = {
      getExtension: vi.fn(() => ({ loseContext })),
    }

    const cancelRelease = scheduleWebGLContextRelease(gl)
    cancelRelease()
    vi.runAllTimers()

    expect(loseContext).not.toHaveBeenCalled()
    vi.useRealTimers()
  })
})
