import { Link } from 'react-router-dom'

export default function Chrome() {
  return (
    <>
      {/* Logo — top left */}
      <Link to="/" className="fixed left-[75px] top-[75px] z-[1000] block no-underline">
        <span
          id="logo"
          className="block font-mono text-[18px] uppercase whitespace-nowrap text-white/90 opacity-85 hover:text-accent hover:[text-shadow:0_0_8px_rgba(91,141,239,0.6)] hover:opacity-100"
        >
          FURNACE
        </span>
      </Link>

      {/* Nav — top right */}
      <nav className="fixed top-[75px] right-[75px] z-[200] flex flex-col items-end gap-2">
        <Link to="/features" className="font-mono text-[14px] uppercase text-white/95 no-underline hover:text-accent hover:[text-shadow:0_0_8px_rgba(91,141,239,0.8)]">
          Features
        </Link>
        <Link to="/quickstart" className="font-mono text-[14px] uppercase text-white/95 no-underline hover:text-accent hover:[text-shadow:0_0_8px_rgba(91,141,239,0.8)]">
          Quickstart
        </Link>
        <a href="https://github.com/amoreX/furnace" target="_blank" rel="noopener noreferrer" className="font-mono text-[14px] uppercase text-white/95 no-underline hover:text-accent hover:[text-shadow:0_0_8px_rgba(91,141,239,0.8)]">
          GitHub
        </a>
      </nav>

      {/* Footer label — bottom left */}
      <div id="site-footer" className="fixed bottom-[75px] left-[75px] z-[200] font-mono text-[14px] text-white/95 px-2.5 py-1.5">
        FURNACE · MIT · v0.1.2
      </div>

      {/* Theme toggle — bottom right */}
      <div className="fixed bottom-[75px] right-[75px] z-[200] flex items-center gap-4">
        <button
          id="theme-toggle"
          type="button"
          aria-label="Toggle color theme"
          className="border-0 bg-none font-mono text-[14px] text-white/95 px-2.5 py-1.5 cursor-pointer hover:text-accent hover:[text-shadow:0_0_8px_rgba(91,141,239,0.6)]"
        >
          <span className="value"></span>
        </button>
      </div>
    </>
  )
}
