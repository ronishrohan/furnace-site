import { FEATURES } from '../features-data.js'

const paperSurface =
  'relative bg-[linear-gradient(rgba(0,0,0,0.08),rgba(0,0,0,0.08)),url("/paper.png")] bg-center [background-size:256px_256px] ' +
  'shadow-[0_16px_40px_rgba(0,0,0,0.3),inset_0_0_0_1px_rgba(25,20,12,0.14),inset_0_-2px_4px_rgba(25,20,12,0.18)] ' +
  'border border-[rgba(25,20,12,0.2)] text-[#1c1b1a]'

export const PaperSurface = paperSurface

export default function Features() {
  return (
    <section className="relative min-h-screen flex items-center justify-center px-[30px] py-[120px]">
      <div className={`${paperSurface} w-[min(1000px,92vw)] p-[78px] pb-[72px] font-mono text-[15px] leading-[1.5]`}>
        <p className="font-bold uppercase tracking-[0.12em] text-[12px] text-[rgba(28,27,26,0.5)] mb-7">
          What Furnace does
        </p>
        <ul className="list-none p-0 m-0">
          {FEATURES.map((f) => (
            <li key={f.name} className="py-[18px] border-b border-[rgba(25,20,12,0.1)] flex flex-col gap-1.5 first:pt-0 last:border-b-0">
              <span className="font-bold uppercase text-[12px] tracking-[0.1em] text-[#1c1b1a]">{f.name}</span>
              <span className="text-[rgba(28,27,26,0.7)] leading-[1.6]">{f.desc}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
