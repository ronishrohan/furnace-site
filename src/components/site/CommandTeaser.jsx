import { useEffect, useRef, useState } from 'react'

const COMMANDS = [
  '/lofi play lofi radio right from your terminal',
  '/fork branch off from any point in a conversation',
  '/plan switch to plan mode',
  '/theme select or set a theme',
  '/skills list, view, or reload skills',
  '/evolve modify the Furnace harness itself',
  '/init learn this repo and write a repo index',
  '/diff show files changed this session',
  '/cost show token and cost usage for this session',
  '/caveman terse answers, technical substance stays',
  '/stfu agent harnessed, less narration and fewer tool calls',
]

const SCRAMBLE_GLYPHS = '!<>-_\\/[]{}—=+*^?#________'

function ScrambledText({ command }) {
  const [characters, setCharacters] = useState(() => (
    command.split('').map((value) => ({ value, isDud: false }))
  ))
  const currentTextRef = useRef(command)
  const hasMountedRef = useRef(false)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      currentTextRef.current = command
      setCharacters(command.split('').map((value) => ({ value, isDud: false })))
      return undefined
    }

    let cancelled = false
    let frameRequest
    let frame = 0

    if (!hasMountedRef.current || currentTextRef.current === command) {
      hasMountedRef.current = true
      return undefined
    }

    const previous = currentTextRef.current
    const queue = Array.from({ length: Math.max(previous.length, command.length) }, (_, index) => {
      const start = Math.floor(Math.random() * 20)
      return {
        from: previous[index] || '',
        to: command[index] || '',
        start,
        end: start + Math.floor(Math.random() * 20),
      }
    })

    const update = () => {
      if (cancelled) return

      let complete = 0
      const next = queue.map((entry) => {
        if (frame >= entry.end) {
          complete += 1
          return { value: entry.to, isDud: false }
        }
        if (frame >= entry.start) {
          if (!entry.char || Math.random() < 0.28) {
            entry.char = SCRAMBLE_GLYPHS[Math.floor(Math.random() * SCRAMBLE_GLYPHS.length)]
          }
          return { value: entry.char, isDud: true }
        }
        return { value: entry.from, isDud: false }
      })
      currentTextRef.current = next.map(({ value }) => value).join('')
      setCharacters(next)

      if (complete === queue.length) {
        currentTextRef.current = command
        return
      }

      frame += 1
      frameRequest = requestAnimationFrame(update)
    }

    update()

    return () => {
      cancelled = true
      cancelAnimationFrame(frameRequest)
    }
  }, [command])

  return (
    <>
      <span aria-hidden="true">
        {characters.map(({ value, isDud }, index) => (
          <span key={index} className={isDud ? 'text-white/35' : undefined}>{value}</span>
        ))}
      </span>
      <span className="sr-only">Furnace slash commands</span>
    </>
  )
}

export default function CommandTeaser({ className = '' }) {
  const [commandIndex, setCommandIndex] = useState(0)

  useEffect(() => {
    const timer = window.setInterval(() => {
      setCommandIndex((current) => (current + 1) % COMMANDS.length)
    }, 3000)

    return () => window.clearInterval(timer)
  }, [])

  return (
    <span className={className}>
      <ScrambledText command={COMMANDS[commandIndex]} />
    </span>
  )
}
