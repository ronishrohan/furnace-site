import { useEffect, useRef } from 'react'

export default function DocsNoise() {
  const canvasRef = useRef(null)
  const rafRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d', { alpha: true })
    if (!ctx) return

    function resize() {
      canvas.width = Math.floor(window.innerWidth / 2)
      canvas.height = Math.floor(window.innerHeight / 2)
    }
    resize()
    window.addEventListener('resize', resize, { passive: true })

    let t = 0
    function draw() {
      const { width, height } = canvas
      if (!width || !height) { rafRef.current = requestAnimationFrame(draw); return }

      const img = ctx.createImageData(width, height)
      const data = img.data
      t += 0.5

      for (let i = 0; i < data.length; i += 4) {
        const noise = (Math.random() * 255) | 0
        const alpha = (noise * 0.22) | 0
        data[i] = 255
        data[i + 1] = 255
        data[i + 2] = 255
        data[i + 3] = alpha
      }

      ctx.putImageData(img, 0, 0)
      rafRef.current = requestAnimationFrame(draw)
    }

    draw()

    return () => {
      window.removeEventListener('resize', resize)
      cancelAnimationFrame(rafRef.current)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="absolute inset-0 w-full h-full pointer-events-none z-0 [image-rendering:pixelated]"
    />
  )
}
