import { Link, useParams } from 'react-router-dom'
import DocsNoise from './DocsNoise.jsx'

const SECTIONS = [
  { id: 'getting-started', label: 'Getting Started' },
  { id: 'commands', label: 'Commands' },
  { id: 'tools', label: 'Tools' },
  { id: 'safety', label: 'Safety' },
  { id: 'configuration', label: 'Configuration' },
]

const navLinkBase =
  'font-chrome text-[13px] text-[rgba(28,27,26,0.7)] night:text-white/65 no-underline transition-colors duration-150 hover:text-accent'

export default function DocsLayout({ children }) {
  const { section = 'getting-started' } = useParams()

  return (
    <div className="relative z-[2] min-h-screen flex flex-col min-[900px]:flex-row bg-transparent text-[#1c1b1a] night:text-white/95 font-chrome text-[14px] leading-[1.7]">
      <div className="relative flex w-full max-w-[1080px]">
        <DocsNoise />
        <aside className="bg-[rgba(250,250,249,0.78)] night:bg-[rgba(18,18,20,0.78)] border-b border-[rgba(28,27,26,0.1)] night:border-b-white/8 p-6 min-[900px]:w-[300px] min-[900px]:shrink-0 min-[900px]:border-r min-[900px]:border-[rgba(28,27,26,0.1)] min-[900px]:night:border-r-white/8 min-[900px]:border-b-0 min-[900px]:p-[75px_32px_75px_75px] min-[900px]:sticky min-[900px]:top-0 min-[900px]:h-screen min-[900px]:overflow-y-auto min-[900px]:overscroll-none min-[900px]:z-[1]">
          <div className="flex flex-col gap-2 mb-8">
            <Link
              to="/"
              className="block font-mono text-[18px] font-normal uppercase tracking-[0] whitespace-nowrap no-underline opacity-85 text-black/82 night:text-white/90 hover:text-accent hover:opacity-100"
            >
              FURNACE
            </Link>
          </div>
          <nav className="flex gap-1 flex-row flex-wrap min-[900px]:flex-col">
            {SECTIONS.map((s) => (
              <Link
                key={s.id}
                to={`/docs/${s.id}`}
                className={`${navLinkBase} ${section === s.id ? 'text-accent' : ''}`}
              >
                {s.label}
              </Link>
            ))}
          </nav>
        </aside>
        <article className="flex-1 max-w-[780px] p-[32px_24px_80px] min-[900px]:p-[75px_75px_120px] bg-[rgba(250,250,249,0.78)] night:bg-[rgba(18,18,20,0.78)] relative z-[1]">
          {children}
        </article>
      </div>
    </div>
  )
}
