import { useState, Fragment } from 'react'

const inlineCode =
  'font-chrome text-[12.5px] bg-[rgba(28,27,26,0.06)] night:bg-white/8 px-[5px] py-[2px] rounded-[2px] text-[#1c1b1a] night:text-white/95'
const anchor = 'text-accent no-underline border-b border-accent/30 hover:border-accent'

const headingBase =
  'font-mono font-bold uppercase tracking-[0.05em] leading-[1.3] text-[#1c1b1a] night:text-white/95 m-0 mb-5'

function renderInline(text) {
  const nodes = []
  let last = 0
  let key = 0
  const re = /(\*\*([^*]+)\*\*|\*([^*]+)\*|`([^`]+)`|\[([^\]]+)\]\(([^)]+)\))/g
  let m
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) nodes.push(text.slice(last, m.index))
    if (m[2] !== undefined) {
      nodes.push(<strong key={key++} className="font-bold">{m[2]}</strong>)
    } else if (m[3] !== undefined) {
      nodes.push(<em key={key++} className="italic">{m[3]}</em>)
    } else if (m[4] !== undefined) {
      nodes.push(<code key={key++} className={inlineCode}>{m[4]}</code>)
    } else if (m[5] !== undefined) {
      nodes.push(
        <a key={key++} href={m[6]} target="_blank" rel="noopener noreferrer" className={anchor}>
          {m[5]}
        </a>,
      )
    }
    last = re.lastIndex
  }
  if (last < text.length) nodes.push(text.slice(last))
  return nodes
}

function CopyButton({ code }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label="Copy code"
      className="absolute top-2.5 right-2.5 font-chrome text-[11px] uppercase tracking-[0.05em] px-2.5 py-1.5 border border-[rgba(28,27,26,0.15)] night:border-white/15 bg-[rgba(250,250,249,0.9)] night:bg-[rgba(20,20,22,0.9)] text-[rgba(28,27,26,0.7)] night:text-white/70 cursor-pointer transition-colors duration-150 hover:text-accent hover:border-accent/50"
    >
      {copied ? 'Copied' : 'Copy'}
    </button>
  )
}

function renderTable(lines) {
  const rows = lines
    .filter((l) => l.startsWith('|') && l.endsWith('|'))
    .map((l) => l.slice(1, -1).split('|').map((cell) => cell.trim()))

  if (rows.length < 2) return null

  const [header, separator, ...body] = rows
  if (!separator.every((cell) => /^[-:]+$/.test(cell))) return null

  return (
    <table className="w-full border-collapse m-0 mb-5 text-[13px]">
      <thead>
        <tr>
          {header.map((cell, i) => (
            <th
              key={i}
              className="text-left p-2.5 border-b border-[rgba(28,27,26,0.1)] night:border-b-white/8 font-mono text-[11px] uppercase tracking-[0.08em] text-[rgba(28,27,26,0.6)] night:text-white/55 font-bold"
            >
              {renderInline(cell)}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {body.map((row, rowIndex) => (
          <tr key={rowIndex}>
            {row.map((cell, cellIndex) => (
              <td
                key={cellIndex}
                className="text-left p-2.5 border-b border-[rgba(28,27,26,0.1)] night:border-b-white/8 [&_code]:text-[12px]"
              >
                {renderInline(cell)}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function renderBlockReact(lines) {
  if (lines.length === 0) return null

  const first = lines[0]

  if (first.startsWith('|') && lines.every((l) => l.startsWith('|'))) {
    const table = renderTable(lines)
    if (table) return table
  }

  if (first.startsWith('# ')) {
    return <h1 className={`${headingBase} text-[28px] pb-4 border-b border-[rgba(28,27,26,0.1)] night:border-b-white/10`}>{renderInline(first.slice(2))}</h1>
  }
  if (first.startsWith('## ')) {
    return <h2 className={`${headingBase} text-[18px] mt-10`}>{renderInline(first.slice(3))}</h2>
  }
  if (first.startsWith('### ')) {
    return <h3 className={`${headingBase} text-[15px] mt-7`}>{renderInline(first.slice(4))}</h3>
  }

  if (first.startsWith('- ') || first.startsWith('* ')) {
    return (
      <ul className="m-0 mb-4 pl-5">
        {lines
          .filter((l) => l.startsWith('- ') || l.startsWith('* '))
          .map((l, i) => (
            <li key={i} className="mb-1.5 text-[rgba(28,27,26,0.85)] night:text-white/78">
              {renderInline(l.slice(2))}
            </li>
          ))}
      </ul>
    )
  }

  if (/^\d+\.\s/.test(first)) {
    return (
      <ol className="m-0 mb-4 pl-5">
        {lines
          .filter((l) => /^\d+\.\s/.test(l))
          .map((l, i) => (
            <li key={i} className="mb-1.5 text-[rgba(28,27,26,0.85)] night:text-white/78">
              {renderInline(l.replace(/^\d+\.\s/, ''))}
            </li>
          ))}
      </ol>
    )
  }

  if (first.startsWith('> ')) {
    return (
      <blockquote className="m-0 mb-4 px-4 py-3 border-l-2 border-accent bg-accent/6 text-[rgba(28,27,26,0.8)] night:text-white/75">
        {lines.map((l, i) => (
          <Fragment key={i}>
            {renderInline(l.replace(/^>\s?/, ''))}
            {i < lines.length - 1 && <br />}
          </Fragment>
        ))}
      </blockquote>
    )
  }

  return <p className="m-0 mb-4 text-[rgba(28,27,26,0.85)] night:text-white/78">{renderInline(lines.join(' '))}</p>
}

export function renderMarkdownReact(source) {
  const blocks = []
  let current = []
  let inCode = false
  let codeLines = []
  let codeLang = ''

  for (const rawLine of source.split('\n')) {
    const line = rawLine

    if (inCode) {
      if (line.startsWith('```')) {
        const code = codeLines.join('\n')
        blocks.push(
          <div key={blocks.length} className="relative m-0 mb-5">
            <CopyButton code={code} />
            <pre className="bg-[rgba(28,27,26,0.06)] night:bg-white/5 border border-[rgba(28,27,26,0.1)] night:border-white/8 px-5 py-[18px] overflow-x-auto m-0 mb-5">
              <code className={`block whitespace-pre bg-transparent p-0 text-[13px] leading-[1.8] font-chrome text-[#1c1b1a] night:text-white/95 ${codeLang ? `language-${codeLang}` : ''}`}>
                {code}
              </code>
            </pre>
          </div>,
        )
        inCode = false
        codeLines = []
        codeLang = ''
      } else {
        codeLines.push(line)
      }
      continue
    }

    if (line.startsWith('```')) {
      if (current.length > 0) {
        blocks.push(<Fragment key={blocks.length}>{renderBlockReact(current)}</Fragment>)
        current = []
      }
      inCode = true
      codeLang = line.slice(3).trim()
      continue
    }

    if (line.trim() === '') {
      if (current.length > 0) {
        blocks.push(<Fragment key={blocks.length}>{renderBlockReact(current)}</Fragment>)
        current = []
      }
      continue
    }

    current.push(line)
  }

  if (current.length > 0) {
    blocks.push(<Fragment key={blocks.length}>{renderBlockReact(current)}</Fragment>)
  }

  return blocks
}

export default function Markdown({ source }) {
  const elements = renderMarkdownReact(source)
  return <div>{elements}</div>
}
