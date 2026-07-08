import { useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import { FEATURES } from '../features-data.js'

const INSTALL_CMD = 'npm install -g cook-furnace'

const installBase =
  'relative h-12 px-[22px] w-fit flex items-center justify-center font-mono text-[14px] leading-none ' +
  'select-none cursor-pointer transition-[background-color,color,outline-color] duration-200 ' +
  'outline outline-1 outline-transparent outline-offset-4 text-[#1c1b1a] night:text-white/85 '

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

  const installState = copied
    ? 'bg-white night:bg-accent outline-accent/50 hover:outline-accent/50'
    : 'bg-white hover:bg-white/90 hover:outline-accent/50 night:bg-accent/8 night:hover:bg-accent/18'

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

          <div className="flex items-center justify-center gap-3.5 flex-wrap">
            <div
              className={`${installBase} ${installState}`}
              onClick={handleCopy}
            >
              <code className={`whitespace-nowrap transition-opacity duration-150 ${copied ? 'opacity-0' : 'opacity-100'}`}>
                {INSTALL_CMD}
              </code>
              <span
                className={`absolute inset-0 flex items-center justify-center transition-opacity duration-150 ${copied ? 'opacity-100' : 'opacity-0'}`}
              >
                Copied! Start cooking now
              </span>
            </div>
            <Link
              to="/docs"
              className="relative h-12 inline-flex items-center justify-center px-[22px] font-mono text-[14px] uppercase tracking-[0.05em] no-underline text-white border border-white/50 bg-white/10 transition-[background-color,color,border-color] duration-200 hover:bg-white/20 hover:border-white/80 hover:text-white after:content-[''] after:absolute after:inset-[-4px] after:border after:border-white/50 after:opacity-0 after:transition-opacity after:duration-200 after:pointer-events-none hover:after:opacity-100 night:text-accent/92 night:border-accent/50 night:bg-transparent night:hover:bg-accent/12 night:hover:border-accent/80 night:hover:text-accent night:after:border-accent/50"
            >
              Docs
            </Link>
          </div>
        </div>
      </section>

      <section id="features-section" className="relative flex items-center justify-center px-[75px] py-[80px] min-h-screen">
        <div className="w-[min(820px,92vw)]">
          <ul className="list-none p-0 m-0">
            {FEATURES.map((f) => (
              <li key={f.name} className="py-3.5 flex flex-col gap-1 text-left first:pt-0 last:pb-0">
                <span className="font-mono font-bold uppercase text-[13px] tracking-[0.1em] text-white/95">{f.name}</span>
                <span className="font-serif text-[15px] leading-[1.6] text-white/65">{f.desc}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  )
}
