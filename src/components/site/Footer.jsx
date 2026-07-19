import { useEffect, useState } from 'react'
import Coin from '../effects/Coin.jsx'
import NoiseCanvas from '../effects/NoiseCanvas.jsx'

const NIHAL = { key: 'nihal', name: 'Nihal Rahman', handle: '@nihaliscoding', href: 'https://x.com/nihaliscoding' }
const RONISH = { key: 'ronish', name: 'Ronish Rohan', handle: '@ronish1o', href: 'https://x.com/ronish1o' }
const DESKTOP_QUERY = '(min-width: 768px)'

function useDesktopLayout() {
  const getMatches = () => window.matchMedia?.(DESKTOP_QUERY).matches ?? false
  const [isDesktop, setIsDesktop] = useState(getMatches)

  useEffect(() => {
    const media = window.matchMedia?.(DESKTOP_QUERY)
    if (!media) return undefined

    const update = () => setIsDesktop(media.matches)
    update()
    media.addEventListener?.('change', update)
    return () => media.removeEventListener?.('change', update)
  }, [])

  return isDesktop
}

function PersonInfo({ person, align }) {
  const isStart = align === 'start'
  return (
    <div className={`flex flex-col gap-1 ${isStart ? 'items-start' : 'items-end'}`}>
      <span className="font-mono text-[15px] text-white/90 whitespace-nowrap">{person.name}</span>
      <span className="font-mono text-[12px] text-white/40 whitespace-nowrap">{person.handle}</span>
      <a
        href={person.href}
        target="_blank"
        rel="noopener noreferrer"
        className="font-mono text-[11px] text-white/30 hover:text-accent whitespace-nowrap no-underline transition-colors duration-150"
      >
        on X ↗
      </a>
    </div>
  )
}

const ORBIT_TEXT = 'CLICK · CLICK · CLICK · '
const ORBIT_CHARS = [...ORBIT_TEXT]
const ORBIT_RADIUS = 55

function OrbitClicks({ visible }) {
  const total = ORBIT_CHARS.length
  return (
    <div className={`absolute inset-0 pointer-events-none transition-opacity duration-200 ${visible ? 'opacity-100' : 'opacity-0'}`}>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          transformOrigin: '50% 50%',
          animation: 'orbit-spin 5s linear infinite',
        }}
      >
        {ORBIT_CHARS.map((char, i) => {
          const deg = (i / total) * 360
          return (
            <span
              key={i}
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: `translate(-50%, -50%) rotate(${deg}deg) translateY(-${ORBIT_RADIUS}px)`,
                transformOrigin: '50% 50%',
                display: 'inline-block',
                fontSize: '9px',
                fontFamily: 'var(--font-mono)',
                fontWeight: '700',
                color: 'rgba(255,255,255,0.55)',
                userSelect: 'none',
                whiteSpace: 'nowrap',
              }}
            >
              {char}
            </span>
          )
        })}
      </div>
    </div>
  )
}

export default function Footer() {
  const [hovered, setHovered] = useState(null) // 'nihal' | 'ronish' | null
  const isDesktop = useDesktopLayout()

  return (
    <footer id="site-footer" className="relative z-[2000] bg-[#0e0e0e] flex flex-col md:flex-row items-center justify-center gap-5 md:gap-[clamp(16px,3vw,48px)] px-4 sm:px-6 md:px-[75px] py-16 sm:py-[80px] overflow-hidden">
      <div className="font-mono text-[clamp(52px,18vw,160px)] md:text-[clamp(64px,12vw,160px)] font-bold text-white/90 uppercase tracking-[-0.02em] leading-none relative z-[1] select-none">
        FURNACE
      </div>
      {isDesktop ? (
        <>
          <span className="font-serif italic text-[clamp(20px,3vw,40px)] text-white/70 relative z-[1] select-none">
            by
          </span>
          <div className="relative z-[1] h-[228px] w-[228px]">
            {/* Slot A — top-left */}
            <div className="absolute left-0 top-0 w-[120px] h-[120px]">
              <div
                className={`absolute inset-0 transition-opacity duration-200 ${hovered === 'ronish' ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
                onMouseEnter={() => setHovered('nihal')}
                onMouseLeave={() => setHovered(null)}
              >
                <a
                  href={NIHAL.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Nihal on X"
                  className={`block transition-transform duration-300 origin-center ${hovered === 'nihal' ? 'scale-[0.72]' : 'scale-100'}`}
                >
                  <Coin
                    size={120}
                    normalMap="/assets/contributors/nihal-normal-map.png"
                    active={hovered !== 'ronish'}
                  />
                </a>
                <OrbitClicks visible={hovered === 'nihal'} />
              </div>
              <div className={`absolute inset-0 flex items-start justify-start transition-opacity duration-200 ${hovered === 'ronish' ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                <PersonInfo person={RONISH} align="start" />
              </div>
            </div>

            {/* Slot B — bottom-right */}
            <div className="absolute bottom-0 right-0 w-[120px] h-[120px]">
              <div
                className={`absolute inset-0 transition-opacity duration-200 ${hovered === 'nihal' ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
                onMouseEnter={() => setHovered('ronish')}
                onMouseLeave={() => setHovered(null)}
              >
                <a
                  href={RONISH.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Ronish on X"
                  className={`block transition-transform duration-300 origin-center ${hovered === 'ronish' ? 'scale-[0.72]' : 'scale-100'}`}
                >
                  <Coin
                    size={120}
                    normalMap="/assets/contributors/ronish-normal-map.png"
                    flipX
                    active={hovered !== 'nihal'}
                  />
                </a>
                <OrbitClicks visible={hovered === 'ronish'} />
              </div>
              <div className={`absolute inset-0 flex items-end justify-end transition-opacity duration-200 ${hovered === 'nihal' ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                <PersonInfo person={NIHAL} align="end" />
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="relative z-[1] flex items-center justify-center gap-3">
          <span className="font-serif italic text-[26px] text-white/70 select-none">by</span>
          <a
            href={NIHAL.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Nihal on X"
            className="block shrink-0"
          >
            <Coin size={88} normalMap="/assets/contributors/nihal-normal-map.png" />
          </a>
          <a
            href={RONISH.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Ronish on X"
            className="block shrink-0"
          >
            <Coin size={88} normalMap="/assets/contributors/ronish-normal-map.png" flipX />
          </a>
        </div>
      )}
      {isDesktop && (
        <NoiseCanvas
          className="absolute inset-0 w-full h-full pointer-events-none z-[2]"
        />
      )}
    </footer>
  )
}
