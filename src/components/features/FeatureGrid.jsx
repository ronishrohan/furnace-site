import { useState } from 'react'
import { FEATURES } from '../../data/features.js'
import GraphCardBackground from './GraphCardBackground.jsx'

const variants = {
  home: {
    frame: 'w-[92vw] md:w-[60vw] h-[60vh]',
    name: 'font-mono font-bold uppercase text-[13px] tracking-[0.1em]',
    description: 'font-serif text-[15px] leading-[1.6]',
  },
  standalone: {
    frame: 'w-[min(860px,92vw)] h-[60vh] mx-auto',
    name: 'font-bold uppercase text-[12px] tracking-[0.1em]',
    description: 'leading-[1.6]',
  },
}

export default function FeatureGrid({ variant }) {
  const [hovered, setHovered] = useState(null)
  const styles = variants[variant]

  if (!styles) {
    throw new Error(`Unknown FeatureGrid variant: ${variant}`)
  }

  return (
    <div className={styles.frame}>
      <div className="grid grid-cols-2 grid-rows-[1fr_1fr] gap-4 h-full">
        {FEATURES.map((feature, index) => (
          <div
            key={feature.name}
            className="h-full"
            onMouseEnter={() => setHovered(index)}
            onMouseLeave={() => setHovered(null)}
          >
            <GraphCardBackground
              normalMap={feature.normalMap}
              threshold={feature.threshold}
              image={feature.image}
              accent={hovered === index}
              dim={hovered !== null && hovered !== index}
            >
              <div
                className={`h-full flex flex-col justify-between p-6 border text-left outline outline-1 outline-offset-4 transition-[color,border-color,outline-color] duration-300 ${
                  hovered === index ? 'border-accent/70 outline-accent/50' : 'border-white/8 outline-transparent'
                }`}
              >
                <span
                  className={`${styles.name} transition-colors duration-300 ${
                    hovered === index ? 'text-accent' : 'text-white/95'
                  }`}
                >
                  {feature.name}
                </span>
                <span
                  className={`${styles.description} transition-colors duration-300 ${
                    hovered === index ? 'text-accent/80' : 'text-white/65'
                  }`}
                >
                  {feature.desc}
                </span>
              </div>
            </GraphCardBackground>
          </div>
        ))}
      </div>
    </div>
  )
}
