import { useCallback, useEffect, useRef } from 'react'
import useActivityRenderLoop from './useActivityRenderLoop.js'

export default function NoiseCanvas({
  alpha = 0.22,
  className = '',
  framesPerSecond = 15,
  resolutionScale = 0.33,
}) {
  const canvasRef = useRef(null)
  const rendererRef = useRef(null)

  const draw = useCallback((time) => {
    const renderer = rendererRef.current
    if (!renderer?.imageData) return false
    if (renderer.lastDraw && time - renderer.lastDraw < 1000 / framesPerSecond) return true
    renderer.lastDraw = time

    const data = renderer.imageData.data
    for (let index = 0; index < data.length; index += 4) {
      const noise = (Math.random() * 255) | 0
      data[index] = 255
      data[index + 1] = 255
      data[index + 2] = 255
      data[index + 3] = (noise * alpha) | 0
    }
    renderer.context.putImageData(renderer.imageData, 0, 0)
    return true
  }, [alpha, framesPerSecond])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return undefined
    const context = canvas.getContext('2d', { alpha: true })
    if (!context) return undefined

    const resize = () => {
      const cssWidth = canvas.offsetWidth || window.innerWidth
      const cssHeight = canvas.offsetHeight || window.innerHeight
      const width = Math.max(1, Math.floor(cssWidth * resolutionScale))
      const height = Math.max(1, Math.floor(cssHeight * resolutionScale))
      if (canvas.width === width && canvas.height === height && rendererRef.current?.imageData) return
      canvas.width = width
      canvas.height = height
      rendererRef.current = {
        context,
        imageData: context.createImageData(width, height),
        lastDraw: 0,
      }
      requestRender()
    }

    rendererRef.current = { context, imageData: null, lastDraw: 0 }
    const resizeObserver = new ResizeObserver(resize)
    resizeObserver.observe(canvas)
    window.addEventListener('resize', resize, { passive: true })
    resize()

    return () => {
      resizeObserver.disconnect()
      window.removeEventListener('resize', resize)
      rendererRef.current = null
    }
  }, [resolutionScale])

  const requestRender = useActivityRenderLoop(canvasRef, draw)

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={className}
    />
  )
}
