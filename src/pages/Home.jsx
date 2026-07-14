import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import FeatureGrid from '../components/features/FeatureGrid.jsx'
import { useClipboardFeedback } from '../hooks/useClipboardFeedback.js'

const INSTALL_CMD = 'npm install -g cook-furnace'

const aboutParagraphs = [
  'We kept switching harnesses, and every switch meant relearning the same workflow from scratch.',
  'Each one nailed something and dropped the rest. Great planning here, real subagents there, provider freedom somewhere else. Never all of it in one place.',
  'So we built Furnace in the open, in the terminal, inside the repo, with the things we actually reach for every day, and made it something you can shape and evolve yourself.',
  'That is why we did it. One harness that bends to how you already work, instead of asking you to bend to it.',
]

// 26 animatable tokens (0–25); link+punct combos share an index
const HERO_TOKEN_COUNT = 26
const ABOUT_WORD_COUNT = aboutParagraphs.reduce((acc, p) => acc + p.split(' ').length, 0)

function useWordReveal(count, maxDelay = 700, trigger = true) {
  const [revealed, setRevealed] = useState(() => new Array(count).fill(false))
  const [allDone, setAllDone] = useState(false)
  useEffect(() => {
    if (!trigger) return
    const delays = Array.from({ length: count }, () => Math.random() * maxDelay)
    const timers = delays.map((delay, i) =>
      setTimeout(() =>
        setRevealed(prev => {
          const next = [...prev]
          next[i] = true
          return next
        }), delay)
    )
    const doneTimer = setTimeout(() => setAllDone(true), maxDelay + 120)
    return () => { timers.forEach(clearTimeout); clearTimeout(doneTimer) }
  }, [trigger])
  return [revealed, allDone]
}

function useHalfVisible(ref) {
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.intersectionRatio >= 0.5) { setVisible(true); obs.disconnect() } },
      { threshold: 0.5 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])
  return visible
}

function W({ r, idx, children, className = '' }) {
  return (
    <span className={`${r[idx] ? 'word-reveal' : 'word-hidden'} ${className}`}>
      {children}
    </span>
  )
}

const installBase =
  'relative h-12 px-[22px] w-fit flex items-center justify-center font-mono text-[14px] leading-none ' +
  'select-none cursor-pointer transition-[background-color,color,border-color,outline-color] duration-200 ' +
  'border border-white/50 outline outline-1 outline-transparent outline-offset-4 ' +
  'focus-visible:outline-white focus-visible:outline-2 night:border-accent/50 night:focus-visible:outline-accent'

export default function Home() {
  const { copied, copy } = useClipboardFeedback()
  const [r, allDone] = useWordReveal(HERO_TOKEN_COUNT)
  const aboutRef = useRef(null)
  const aboutVisible = useHalfVisible(aboutRef)
  const [rAbout] = useWordReveal(ABOUT_WORD_COUNT, 700, aboutVisible)


  const installState = copied
    ? 'bg-white border-white text-[#1c1b1a] outline-white/50 night:bg-accent night:border-accent night:text-white night:outline-accent/50'
    : 'text-white bg-white/10 hover:bg-white/20 hover:border-white/80 hover:outline-white/50 night:text-accent night:bg-accent/8 night:hover:bg-accent/16 night:hover:border-accent/80 night:hover:outline-accent/50'

  const scrollToFeatures = (event) => {
    event.preventDefault()
    document.getElementById('features-section')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <>
      <section className="relative min-h-screen flex items-center justify-center text-center px-6 md:px-[75px] pb-[80px] pt-[4vh]">
        <a
          href="https://github.com/amoreX/furnace/issues"
          target="_blank"
          rel="noopener noreferrer"
          className="absolute top-[75px] left-1/2 -translate-x-1/2 no-underline px-3 py-1.5 font-mono text-[12px] uppercase tracking-[0.06em] border border-accent/70 bg-accent/15 text-accent outline outline-1 outline-transparent outline-offset-4 hover:bg-accent/25 hover:outline-accent/50 transition-[background-color,outline-color] duration-200 whitespace-nowrap"
        >
          Early stages, open an issue if something feels off
        </a>
        <div className="flex flex-col items-center gap-8">
          <p className="m-0 mt-[50px] font-serif text-[clamp(20px,2.2vw,34px)] leading-[1.3] font-normal max-w-[820px] text-white/95">
            <W r={r} idx={0}>We</W>{' '}
            <W r={r} idx={1}>studied</W>{' '}
            <W r={r} idx={2}>what</W>{' '}
            <W r={r} idx={3}>users</W>{' '}
            <W r={r} idx={4}>love</W>{' '}
            <W r={r} idx={5}>about</W>{' '}
            <W r={r} idx={6}>every</W>{' '}
            <W r={r} idx={7}>agent</W>{' '}
            <W r={r} idx={8}>harness</W>{' '}
            <W r={r} idx={9}>and</W>{' '}
            <W r={r} idx={10}>built</W>{' '}
            <W r={r} idx={11}>it</W>{' '}
            <W r={r} idx={12}>all</W>{' '}
            <W r={r} idx={13}>into</W>{' '}
            <W r={r} idx={14}>
              <a
                className="text-inherit no-underline underline [text-decoration-thickness:0.03em] [text-underline-offset:0.08em] cursor-pointer hover:text-accent hover-accent-glow-strong"
                href="https://github.com/amoreX/furnace"
                target="_blank"
                rel="noopener noreferrer"
              >Furnace</a>.
            </W>
            <span className="block mt-7">
              <W r={r} idx={15}>Built</W>{' '}
              <W r={r} idx={16}>in</W>{' '}
              <W r={r} idx={17}>the</W>{' '}
              <W r={r} idx={18}>
                <a
                  className="text-inherit no-underline underline [text-decoration-thickness:0.03em] [text-underline-offset:0.08em] cursor-pointer hover:text-accent hover-accent-glow-strong"
                  href="https://github.com/amoreX/furnace"
                  target="_blank"
                  rel="noopener noreferrer"
                >open</a>,
              </W>{' '}
            </span>
            <span className="inline-block max-w-full align-baseline">
              <W r={r} idx={19}>shaped</W>{' '}
              <W r={r} idx={20}>by</W>{' '}
              <W r={r} idx={21}>the</W>{' '}
              <W r={r} idx={22}>people</W>{' '}
              <W r={r} idx={23}>who</W>{' '}
              <W r={r} idx={24}>use</W>{' '}
              <W r={r} idx={25}>it.</W>
            </span>
          </p>

          <div className={`flex items-center justify-center gap-3.5 flex-wrap transition-opacity duration-300 ${allDone ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
            <button
              type="button"
              className={`${installBase} ${installState}`}
              onClick={() => copy(INSTALL_CMD)}
            >
              <code className={`whitespace-nowrap transition-opacity duration-150 ${copied ? 'opacity-0' : 'opacity-100'}`}>
                {INSTALL_CMD}
              </code>
              <span
                className={`absolute inset-0 flex items-center justify-center transition-opacity duration-150 ${copied ? 'opacity-100' : 'opacity-0'}`}
              >
                Copied! Start cooking now
              </span>
            </button>
            <Link
              to="/docs"
              className="relative h-12 inline-flex items-center justify-center px-[22px] font-mono text-[14px] uppercase tracking-[0.05em] no-underline text-white border border-white/50 bg-white/10 transition-[background-color,color,border-color] duration-200 hover:bg-white/20 hover:border-white/80 hover:text-white after:content-[''] after:absolute after:inset-[-4px] after:border after:border-white/50 after:opacity-0 after:transition-opacity after:duration-200 after:pointer-events-none hover:after:opacity-100 night:text-accent/92 night:border-accent/50 night:bg-transparent night:hover:bg-accent/12 night:hover:border-accent/80 night:hover:text-accent night:after:border-accent/50"
            >
              Docs
            </Link>
          </div>
        </div>
      </section>

      <section id="features-section" className="relative flex items-center justify-center px-6 md:px-[75px] py-[40px] min-h-screen">
        <FeatureGrid variant="home" />
      </section>

      <section id="about-section" ref={aboutRef} className="relative min-h-screen flex items-center justify-center text-center px-6 md:px-[75px]">
        <div className="font-serif text-[clamp(18px,1.8vw,28px)] leading-[1.5] font-normal max-w-[760px] text-white/90">
          {aboutParagraphs.map((paragraph, pIdx) => {
            const offset = aboutParagraphs.slice(0, pIdx).reduce((acc, p) => acc + p.split(' ').length, 0)
            const words = paragraph.split(' ')
            return (
              <p key={pIdx} className={pIdx === 0 ? 'm-0' : 'm-0 mt-6'}>
                {words.map((word, wIdx) => {
                  const trailingSpace = wIdx < words.length - 1 ? ' ' : ''
                  return (
                    <W key={wIdx} r={rAbout} idx={offset + wIdx}>
                      {word === 'evolve' ? (
                        <a
                          href="#features-section"
                          onClick={scrollToFeatures}
                          className="text-inherit underline [text-decoration-thickness:0.04em] [text-underline-offset:0.1em] hover:text-accent hover-accent-glow"
                        >
                          evolve
                        </a>
                      ) : word}
                      {trailingSpace}
                    </W>
                  )
                })}
              </p>
            )
          })}
        </div>
      </section>
    </>
  )
}
