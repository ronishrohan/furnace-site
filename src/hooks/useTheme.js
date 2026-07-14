import { useCallback, useEffect, useLayoutEffect, useState } from 'react'

export const THEME_KEY = 'furnace-theme'

function readInitialTheme() {
  if (typeof document !== 'undefined') {
    if (
      document.documentElement.classList.contains('theme-night')
      || document.body?.classList.contains('theme-night')
    ) {
      return 'night'
    }
  }

  try {
    return localStorage.getItem(THEME_KEY) === 'day' ? 'day' : 'night'
  } catch {
    return 'night'
  }
}

const useIsomorphicLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect

export function useTheme() {
  const [theme, setTheme] = useState(readInitialTheme)
  const isNight = theme === 'night'

  useIsomorphicLayoutEffect(() => {
    document.documentElement.classList.toggle('theme-night', isNight)
    document.body.classList.toggle('theme-night', isNight)
    window.dispatchEvent(new CustomEvent('themechange', {
      detail: { theme, isNight },
    }))
  }, [isNight, theme])

  useEffect(() => {
    const handleStorage = (event) => {
      if (event.key !== THEME_KEY) return
      if (event.newValue === 'day' || event.newValue === 'night') {
        setTheme(event.newValue)
      } else if (event.newValue === null) {
        setTheme('night')
      }
    }

    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [])

  const toggleTheme = useCallback(() => {
    const nextTheme = isNight ? 'day' : 'night'
    try {
      localStorage.setItem(THEME_KEY, nextTheme)
    } catch {
      // Theme remains usable when storage is unavailable.
    }
    setTheme(nextTheme)
  }, [isNight])

  return { theme, isNight, toggleTheme }
}
