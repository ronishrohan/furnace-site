import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import FeatureGrid from './FeatureGrid.jsx'

vi.mock('./GraphCardBackground.jsx', () => ({
  default: ({ accent, dim, children }) => (
    <div data-accent={accent} data-dim={dim}>
      {children}
    </div>
  ),
}))

describe('FeatureGrid', () => {
  it('preserves the home dimensions and typography', () => {
    const { container } = render(<FeatureGrid variant="home" />)

    expect(container.firstChild).toHaveClass('w-[92vw]', 'md:w-[60vw]', 'h-[60vh]')
    expect(screen.getByText('/Fork Any Conversation')).toHaveClass('font-mono', 'text-[13px]')
    expect(screen.getByText(/Furnace keeps a tree/)).toHaveClass('font-serif', 'text-[15px]')
  })

  it('preserves standalone dimensions, typography, and hover behavior', () => {
    const { container } = render(<FeatureGrid variant="standalone" />)
    const grid = within(container)
    const firstCard = grid.getByText('/Fork Any Conversation').parentElement.parentElement
    const secondBackground = grid.getByText('Saves Tokens by Indexing').parentElement.parentElement

    expect(container.firstChild).toHaveClass('w-[min(860px,92vw)]', 'h-[60vh]', 'mx-auto')
    expect(grid.getByText('/Fork Any Conversation')).toHaveClass('text-[12px]')
    expect(grid.getByText('/Fork Any Conversation')).not.toHaveClass('font-mono')
    expect(grid.getByText(/Furnace keeps a tree/)).not.toHaveClass('font-serif', 'text-[15px]')

    fireEvent.mouseEnter(firstCard)

    expect(firstCard).toHaveAttribute('data-accent', 'true')
    expect(secondBackground).toHaveAttribute('data-dim', 'true')
  })
})
