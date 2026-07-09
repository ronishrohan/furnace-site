import { useState } from 'react'
import { FEATURES } from '../features-data.js'
import GraphCardBackground from '../components/GraphCardBackground.jsx'

export const PaperSurface =
  'relative bg-[linear-gradient(rgba(0,0,0,0.08),rgba(0,0,0,0.08)),url("/paper.png")] bg-center [background-size:256px_256px] ' +
  'shadow-[0_16px_40px_rgba(0,0,0,0.3),inset_0_0_0_1px_rgba(25,20,12,0.14),inset_0_-2px_4px_rgba(25,20,12,0.18)] ' +
  'border border-[rgba(25,20,12,0.2)] text-[#1c1b1a]'

export default function Features() {
  const [hovered, setHovered] = useState(null)

  return (
    <section className="relative h-auto px-[30px] pt-[120px] pb-[160px]">
      <div className="w-[min(860px,92vw)] h-[60vh] mx-auto">
        <div className="grid grid-cols-2 grid-rows-[1fr_1fr] gap-4 h-full">
          {FEATURES.map((f, i) => (
            <div
              key={f.name}
              className="h-full"
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
            >
              <GraphCardBackground
                normalMap={f.normalMap}
                threshold={f.threshold}
                image={f.image}
                accent={hovered === i}
                dim={hovered !== null && hovered !== i}
              >
                <div
                  className={`h-full flex flex-col justify-between p-6 border text-left transition-colors duration-300 ${
                    hovered === i ? 'border-accent/70' : 'border-white/8'
                  }`}
                >
                  <span className="font-bold uppercase text-[12px] tracking-[0.1em] text-white/95">{f.name}</span>
                  <span className="text-white/65 leading-[1.6]">{f.desc}</span>
                </div>
              </GraphCardBackground>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
