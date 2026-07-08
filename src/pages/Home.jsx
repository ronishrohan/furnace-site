import { useState, useRef } from 'react'
import { FEATURES } from '../features-data.js'

const INSTALL_CMD = 'npm install -g cook-furnace'

export default function Home() {
  const [copied, setCopied] = useState(false)
  const timeoutRef = useRef(null)

  const handleCopy = () => {
    navigator.clipboard.writeText(INSTALL_CMD).then(() => {
      setCopied(true)
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      timeoutRef.current = setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <>
      <section className="relative min-h-screen flex items-center justify-center text-center px-[75px] pb-[170px] pt-[4vh]">
        <div className="flex flex-col items-center gap-8">
          <p className="m-0 mt-[50px] font-serif text-[clamp(20px,2.2vw,34px)] leading-[1.3] font-normal max-w-[820px] text-white/95">
            We studied what users love about every agent harness and built it all into{' '}
            <a
              className="text-inherit no-underline underline [text-decoration-thickness:0.03em] [text-underline-offset:0.08em] cursor-pointer hover:text-accent hover:[text-shadow:0_0_12px_rgba(91,141,239,0.8)]"
              href="https://github.com/amoreX/furnace"
              target="_blank"
              rel="noopener noreferrer"
            >
              Furnace
            </a>
            .
            <span className="block mt-7 whitespace-nowrap">
              Built in the{' '}
              <a
                className="text-inherit no-underline underline [text-decoration-thickness:0.03em] [text-underline-offset:0.08em] cursor-pointer hover:text-accent hover:[text-shadow:0_0_12px_rgba(91,141,239,0.8)]"
                href="https://github.com/amoreX/furnace"
                target="_blank"
                rel="noopener noreferrer"
              >
                open
              </a>
              ,{' '}
            </span>
            <span className="inline-block max-w-full align-baseline">
              shaped by the people who use it.
            </span>
          </p>

          <div
            className={`install-block ${copied ? 'copied' : ''}`}
            style={{ userSelect: 'none', cursor: 'pointer', width: 'fit-content', textAlign: 'center', position: 'relative' }}
            onClick={handleCopy}
          >
            <code style={{ opacity: copied ? 0 : 1, transition: 'opacity 0.15s ease', whiteSpace: 'nowrap' }}>{INSTALL_CMD}</code>
            <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: copied ? 1 : 0, transition: 'opacity 0.15s ease' }}>Copied! Start cooking now</span>
          </div>
        </div>
      </section>

      <section className="relative flex items-center justify-center px-[75px] py-[80px] min-h-screen">
        <div className="home-features w-[min(820px,92vw)]">
          <ul className="list-none p-0 m-0">
            {FEATURES.map((f) => (
              <li key={f.name} className="home-feature-item">
                <span className="home-feature-name">{f.name}</span>
                <span className="home-feature-desc">{f.desc}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  )
}
