import { useEffect, useRef } from 'react'
import Coin from './Coin.jsx'

export default function Footer() {
  const canvasRef = useRef(null)
  const rafRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    function resize() {
      canvas.width = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
    }
    resize()

    const ro = new ResizeObserver(resize)
    ro.observe(canvas)

    let t = 0
    function draw() {
      const { width, height } = canvas
      if (!width || !height) { rafRef.current = requestAnimationFrame(draw); return }

      const img = ctx.createImageData(width, height)
      const data = img.data
      t += 0.5

      for (let i = 0; i < data.length; i += 4) {
        const noise = (Math.random() * 255) | 0
        const alpha = (noise * 0.18) | 0
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
      cancelAnimationFrame(rafRef.current)
      ro.disconnect()
    }
  }, [])

  return (
    <footer className="relative z-[2000] bg-[#0e0e0e] flex items-center justify-center gap-[clamp(16px,3vw,48px)] px-6 md:px-[75px] py-[80px] overflow-hidden">
      <div className="font-mono text-[clamp(64px,12vw,160px)] font-bold text-white/90 uppercase tracking-[-0.02em] leading-none relative z-[1] select-none">
        FURNACE
      </div>
      <span className="font-serif italic text-[clamp(20px,3vw,40px)] text-white/70 relative z-[1] select-none">
        by
      </span>
      <div className="relative z-[1] h-[176px] w-[176px]">
        <a
          href="https://x.com/nihaliscoding"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Nihal on X"
          className="absolute left-0 top-0"
        >
          <Coin size={92} normalMap="/nihal_normal.png" />
        </a>
        <a
          href="https://x.com/ronish1o"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Ronish on X"
          className="absolute bottom-0 right-0"
        >
          <Coin size={92} normalMap="/ronish_normal.png" flipX />
        </a>
      </div>
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none z-[2]" />
    </footer>
  )
}
