import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { THEME_KEY, useTheme } from '../useTheme.js'

describe('useTheme', () => {
  beforeEach(() => {
    const values = new Map()
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      value: {
        getItem: vi.fn((key) => values.get(key) ?? null),
        setItem: vi.fn((key, value) => values.set(key, String(value))),
        removeItem: vi.fn((key) => values.delete(key)),
        clear: vi.fn(() => values.clear()),
      },
    })
    document.documentElement.classList.remove('theme-night')
    document.body.classList.remove('theme-night')
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('defaults to night and keeps the document, storage, and subscribers in sync', () => {
    const onThemeChange = vi.fn()
    window.addEventListener('themechange', onThemeChange)
    const { result } = renderHook(() => useTheme())

    expect(result.current.theme).toBe('night')
    expect(document.documentElement).toHaveClass('theme-night')
    expect(document.body).toHaveClass('theme-night')

    act(() => result.current.toggleTheme())

    expect(result.current.theme).toBe('day')
    expect(document.documentElement).not.toHaveClass('theme-night')
    expect(document.body).not.toHaveClass('theme-night')
    expect(localStorage.getItem(THEME_KEY)).toBe('day')
    expect(onThemeChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ detail: { theme: 'day', isNight: false } }),
    )

    window.removeEventListener('themechange', onThemeChange)
  })

  it('follows theme changes from another browsing context', () => {
    const { result } = renderHook(() => useTheme())

    act(() => {
      window.dispatchEvent(new StorageEvent('storage', {
        key: THEME_KEY,
        newValue: 'day',
      }))
    })

    expect(result.current.theme).toBe('day')
    expect(document.documentElement).not.toHaveClass('theme-night')
  })

  it('still toggles when localStorage is blocked', () => {
    localStorage.getItem.mockImplementation(() => {
      throw new DOMException('Blocked')
    })
    localStorage.setItem.mockImplementation(() => {
      throw new DOMException('Blocked')
    })

    const { result } = renderHook(() => useTheme())
    act(() => result.current.toggleTheme())

    expect(result.current.theme).toBe('day')
    expect(document.documentElement).not.toHaveClass('theme-night')
  })
})
