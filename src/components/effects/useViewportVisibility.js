import { useEffect, useRef, useState } from 'react'

const NEAR_ROOT_MARGIN = '200px'
const RELEASE_GRACE_MS = 3000
const observerGroups = new Map()

function subscribe(element, options, callback) {
  if (!('IntersectionObserver' in window)) {
    callback(true)
    return () => {}
  }

  const key = JSON.stringify(options)
  let group = observerGroups.get(key)
  if (!group) {
    const callbacks = new Map()
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => callbacks.get(entry.target)?.(entry.isIntersecting))
    }, options)
    group = { callbacks, observer }
    observerGroups.set(key, group)
  }

  group.callbacks.set(element, callback)
  group.observer.observe(element)

  return () => {
    group.observer.unobserve(element)
    group.callbacks.delete(element)
    if (group.callbacks.size === 0) {
      group.observer.disconnect()
      observerGroups.delete(key)
    }
  }
}

export default function useViewportVisibility(targetRef) {
  const supported = typeof window !== 'undefined' && 'IntersectionObserver' in window
  const [visibility, setVisibility] = useState(() => ({
    isNearViewport: !supported,
    isInViewport: !supported,
    hasEntered: !supported,
  }))
  const nearExitTimerRef = useRef(null)

  useEffect(() => {
    const target = targetRef.current
    if (!target) return undefined

    const unsubscribeNear = subscribe(
      target,
      { rootMargin: NEAR_ROOT_MARGIN },
      (isNearViewport) => {
        if (nearExitTimerRef.current !== null) {
          clearTimeout(nearExitTimerRef.current)
          nearExitTimerRef.current = null
        }
        if (!isNearViewport) {
          nearExitTimerRef.current = setTimeout(() => {
            nearExitTimerRef.current = null
            setVisibility((current) => ({ ...current, isNearViewport: false }))
          }, RELEASE_GRACE_MS)
          return
        }
        setVisibility((current) => ({
          ...current,
          isNearViewport: true,
          hasEntered: true,
        }))
      },
    )
    const unsubscribeViewport = subscribe(
      target,
      { rootMargin: '0px' },
      (isInViewport) => {
        setVisibility((current) => ({ ...current, isInViewport }))
      },
    )

    return () => {
      if (nearExitTimerRef.current !== null) clearTimeout(nearExitTimerRef.current)
      unsubscribeNear()
      unsubscribeViewport()
    }
  }, [targetRef])

  return visibility
}
