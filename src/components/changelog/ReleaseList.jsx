const kindLabels = {
  added: 'Added',
  changed: 'Changed',
  compatibility: 'Compatibility',
  fixed: 'Fixed',
  removed: 'Removed',
}

function releaseMarker(release, latestPublishedVersion) {
  if (release.status === 'upcoming') return 'Next'
  if (release.status === 'tagged') return 'Tagged · not published'
  if (release.version === latestPublishedVersion) return 'Latest'
  return null
}

export default function ReleaseList({ releases }) {
  const latestPublishedVersion = releases.find((release) => release.status === 'published')?.version

  return (
    <ol className="m-0 list-none border-t border-white/25 p-0 night:border-white/15">
      {releases.map((release, index) => {
        const marker = releaseMarker(release, latestPublishedVersion)
        const sourceUrl = release.commit
          ? `https://github.com/amoreX/furnace/commit/${release.commit}`
          : null

        return (
          <li
            key={release.version}
            className="grid gap-6 border-b border-white/25 py-9 sm:py-11 md:grid-cols-[170px_minmax(0,1fr)] md:gap-12 night:border-white/15"
          >
            <div className="font-mono uppercase">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2 md:block">
                <h2 className="m-0 text-[clamp(24px,3vw,38px)] leading-none text-white">
                  v{release.version}
                </h2>
                {marker && (
                  <span className="mt-0 inline-block border border-accent/70 px-2 py-1 text-[10px] tracking-[0.12em] text-accent md:mt-4">
                    {marker}
                  </span>
                )}
              </div>
              <time
                className="mt-3 block font-chrome text-[11px] tracking-[0.08em] text-white/55"
                dateTime={release.date}
              >
                {release.date}
              </time>
              {sourceUrl && (
                <a
                  className="mt-3 inline-block font-chrome text-[11px] tracking-[0.08em] text-white/55 underline decoration-white/25 underline-offset-4 hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-4"
                  href={sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`View source commit for Furnace ${release.version}`}
                >
                  {release.commit.slice(0, 7)}
                </a>
              )}
            </div>

            <article aria-labelledby={`release-${release.version}`}>
              <h3
                id={`release-${release.version}`}
                className="m-0 max-w-[760px] font-serif text-[clamp(21px,2.4vw,32px)] font-normal leading-[1.3] text-white/95"
              >
                {release.summary}
              </h3>
              <ul className="mt-7 grid list-none gap-0 p-0">
                {release.changes.map((change, changeIndex) => (
                  <li
                    key={`${release.version}-${changeIndex}`}
                    className="grid gap-1 border-t border-white/15 py-3.5 sm:grid-cols-[120px_minmax(0,1fr)] sm:gap-5 night:border-white/10"
                  >
                    <span className="font-chrome text-[10px] uppercase tracking-[0.13em] text-accent">
                      {kindLabels[change.kind] ?? change.kind}
                    </span>
                    <span className="font-chrome text-[13px] leading-[1.65] text-white/80 sm:text-[14px]">
                      {change.text}
                    </span>
                  </li>
                ))}
              </ul>
            </article>

            {index === 0 && (
              <span className="sr-only">Newest changelog entry</span>
            )}
          </li>
        )
      })}
    </ol>
  )
}
