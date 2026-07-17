import { useEffect } from 'react'
import ReleaseList from '../components/changelog/ReleaseList.jsx'
import releaseManifest from '../data/releases.json'

export default function Changelog() {
  useEffect(() => {
    const previousTitle = document.title
    document.title = 'Changelog · Furnace'
    return () => { document.title = previousTitle }
  }, [])

  return (
    <section className="relative min-h-screen px-4 pb-28 pt-24 sm:px-8 sm:pt-28 md:px-[75px] md:pb-40 md:pt-[190px]">
      <div className="mx-auto max-w-[1120px]">
        <header className="mb-16 grid gap-6 md:mb-24 md:grid-cols-[170px_minmax(0,1fr)] md:gap-12">
          <p className="m-0 font-mono text-[11px] uppercase tracking-[0.16em] text-accent">
            Built in public
          </p>
          <div>
            <h1 className="m-0 font-serif text-[clamp(42px,8vw,92px)] font-normal leading-[0.95] tracking-[-0.045em] text-white">
              Changelog
            </h1>
            <p className="mb-0 mt-7 max-w-[720px] font-chrome text-[14px] leading-[1.75] text-white/70 sm:text-[16px]">
              Every shipped turn of the furnace, reconstructed from the repository itself.
              Features, fixes, removals, and the small releases that kept the fire steady.
            </p>
          </div>
        </header>

        <ReleaseList releases={releaseManifest.releases} />
      </div>
    </section>
  )
}
