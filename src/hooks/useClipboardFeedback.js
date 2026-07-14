import { useCallback, useEffect, useRef, useState } from 'react'

export function useClipboardFeedback(duration = 2000) {
  const [copied, setCopied] = useState(false)
  const timerRef = useRef(null)
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      if (timerRef.current !== null) clearTimeout(timerRef.current)
    }
  }, [])

  const copy = useCallback(async (text) => {
    const writeText = navigator.clipboard?.writeText
    if (typeof writeText !== 'function') {
      if (mountedRef.current) setCopied(false)
      return false
    }

    try {
      await writeText.call(navigator.clipboard, text)
    } catch {
      if (mountedRef.current) setCopied(false)
      return false
    }

    if (!mountedRef.current) return false

    if (timerRef.current !== null) clearTimeout(timerRef.current)
    setCopied(true)
    timerRef.current = setTimeout(() => {
      timerRef.current = null
      if (mountedRef.current) setCopied(false)
    }, duration)
    return true
  }, [duration])

  return { copied, copy }
}
