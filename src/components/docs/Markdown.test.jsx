import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import Markdown from './Markdown.jsx'

describe('Markdown', () => {
  it('preserves the semantic structure used by the documentation', () => {
    const source = `# Furnace Guide

## Install

- First item
- Item with \`inline code\`

1. Run Furnace
2. Start cooking

| Command | Meaning |
| --- | --- |
| \`furnace \\| test\` | [Read more](https://example.com/docs) |

\`\`\`bash
npm install -g cook-furnace
\`\`\``

    const { container } = render(<Markdown source={source} />)

    expect(screen.getByRole('heading', { level: 1, name: 'Furnace Guide' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: 'Install' })).toBeInTheDocument()
    expect(within(container.querySelector('ul')).getAllByRole('listitem')).toHaveLength(2)
    expect(within(container.querySelector('ol')).getAllByRole('listitem')).toHaveLength(2)

    const table = screen.getByRole('table')
    expect(within(table).getByRole('columnheader', { name: 'Command' })).toBeInTheDocument()
    expect(within(table).getByText('furnace | test')).toBeInTheDocument()

    const link = within(table).getByRole('link', { name: 'Read more' })
    expect(link).toHaveAttribute('href', 'https://example.com/docs')
    expect(link).toHaveAttribute('target', '_blank')
    expect(screen.getByText('inline code').tagName).toBe('CODE')
    expect(screen.getByText('npm install -g cook-furnace').closest('pre')).toBeInTheDocument()
  })
})
