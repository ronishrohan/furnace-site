import { useCallback, useEffect, useRef } from 'react'

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)'

export default function useActivityRenderLoop(
  targetRef,
  draw,
  { observeOffscreen = true, redrawOnThemeChange = false, enabled = true } = {},
) {
  const drawRef = useRef(draw)
  const controllerRef = useRef(null)
  drawRef.current = draw

  const requestRender = useCallback(() => {
    controllerRef.current?.requestRender()
  }, [])

  useEffect(() => {
    if (!enabled) return undefined

    const target = targetRef.current
    if (!target) return undefined

    const media = window.matchMedia?.(REDUCED_MOTION_QUERY)
    let reducedMotion = media?.matches ?? false
    let documentVisible = document.visibilityState !== 'hidden'
    let inViewport = true
    let frame = null
    let disposed = false

    const active = () => documentVisible && (!observeOffscreen || inViewport)

    const cancelFrame = () => {
      if (frame === null) return
      cancelAnimationFrame(frame)
      frame = null
    }

    const tick = (time) => {
      frame = null
      if (disposed || !active()) return
      const shouldContinue = drawRef.current(time) !== false
      if (shouldContinue && !reducedMotion) frame = requestAnimationFrame(tick)
    }

    const start = () => {
      cancelFrame()
      if (active()) frame = requestAnimationFrame(tick)
    }

    const onVisibilityChange = () => {
      documentVisible = document.visibilityState !== 'hidden'
      if (documentVisible) start()
      else cancelFrame()
    }

    const onMotionChange = (event) => {
      reducedMotion = event.matches
      start()
    }

    const observer = observeOffscreen && 'IntersectionObserver' in window
      ? new IntersectionObserver(([entry]) => {
          inViewport = entry?.isIntersecting ?? false
          if (inViewport) start()
          else cancelFrame()
        })
      : null
    controllerRef.current = { requestRender: start }
    document.addEventListener('visibilitychange', onVisibilityChange)
    media?.addEventListener?.('change', onMotionChange)
    observer?.observe(target)
    if (redrawOnThemeChange) window.addEventListener('themechange', start)
    start()

    return () => {
      disposed = true
      cancelFrame()
      observer?.disconnect()
      media?.removeEventListener?.('change', onMotionChange)
      document.removeEventListener('visibilitychange', onVisibilityChange)
      if (redrawOnThemeChange) window.removeEventListener('themechange', start)
      if (controllerRef.current?.requestRender === start) controllerRef.current = null
    }
  }, [enabled, observeOffscreen, redrawOnThemeChange, targetRef])

  return requestRender
}
