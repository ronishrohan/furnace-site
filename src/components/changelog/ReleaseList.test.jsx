import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import ReleaseList from './ReleaseList.jsx'

const releases = [
  {
    version: '0.2.4',
    date: '2026-07-17',
    status: 'upcoming',
    commit: null,
    summary: 'What’s New appears in Furnace.',
    changes: [{ kind: 'added', text: 'Added release notes.' }],
  },
  {
    version: '0.2.3',
    date: '2026-07-17',
    status: 'published',
    commit: '802bf36d0ccd0e4ec9c8487573894f8864c9be64',
    summary: 'Furnace updates itself.',
    changes: [{ kind: 'fixed', text: 'Improved updates.' }],
  },
]

describe('ReleaseList', () => {
  it('renders semantic releases, status labels, and source links', () => {
    const { container } = render(<ReleaseList releases={releases} />)

    expect(container.querySelectorAll('ol > li')).toHaveLength(2)
    expect(screen.getByRole('heading', { name: 'v0.2.4' })).toBeInTheDocument()
    expect(screen.getByText('Next')).toBeInTheDocument()
    expect(screen.getByText('Latest')).toBeInTheDocument()
    expect(screen.getAllByText('2026-07-17')[0]).toHaveAttribute('datetime', '2026-07-17')

    const published = screen.getByRole('heading', { name: 'v0.2.3' }).closest('li')
    const source = within(published).getByRole('link', { name: /source commit/i })
    expect(source).toHaveAttribute('href', 'https://github.com/amoreX/furnace/commit/802bf36d0ccd0e4ec9c8487573894f8864c9be64')
    expect(source).toHaveAttribute('target', '_blank')
  })
})
