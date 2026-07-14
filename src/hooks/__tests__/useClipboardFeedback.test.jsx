import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useClipboardFeedback } from '../useClipboardFeedback.js'

describe('useClipboardFeedback', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
    })
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('reports success for two seconds and resets the timer after another copy', async () => {
    const { result } = renderHook(() => useClipboardFeedback())

    await act(() => result.current.copy('first'))
    expect(result.current.copied).toBe(true)

    act(() => vi.advanceTimersByTime(1500))
    await act(() => result.current.copy('second'))
    act(() => vi.advanceTimersByTime(1999))
    expect(result.current.copied).toBe(true)

    act(() => vi.advanceTimersByTime(1))
    expect(result.current.copied).toBe(false)
    expect(navigator.clipboard.writeText).toHaveBeenNthCalledWith(1, 'first')
    expect(navigator.clipboard.writeText).toHaveBeenNthCalledWith(2, 'second')
  })

  it('does not falsely report success when clipboard access is missing or rejected', async () => {
    navigator.clipboard.writeText.mockRejectedValueOnce(new DOMException('Denied'))
    const { result } = renderHook(() => useClipboardFeedback())

    let succeeded
    await act(async () => {
      succeeded = await result.current.copy('nope')
    })
    expect(succeeded).toBe(false)
    expect(result.current.copied).toBe(false)

    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: undefined,
    })
    await act(async () => {
      succeeded = await result.current.copy('missing')
    })
    expect(succeeded).toBe(false)
    expect(result.current.copied).toBe(false)
  })

  it('clears pending feedback when unmounted', async () => {
    const { result, unmount } = renderHook(() => useClipboardFeedback())
    await act(() => result.current.copy('copy'))

    expect(vi.getTimerCount()).toBe(1)
    unmount()
    expect(vi.getTimerCount()).toBe(0)
  })
})
