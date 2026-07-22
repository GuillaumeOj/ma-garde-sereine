import { screen } from '@testing-library/react'
import { Route, Routes } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import HelpArticle from '@/src/pages/HelpArticle'
import HelpCenter from '@/src/pages/HelpCenter'
import { renderWithProviders } from '@/tests/utils'

// The suite runs in English (jsdom's navigator resolves to en), so assertions
// use the English catalog, matching the other page tests.

// Render the help center with both routes wired, so the article route and its
// redirect-to-index behaviour can be exercised from a starting URL.
function renderHelp(route: string) {
  return renderWithProviders(
    <Routes>
      <Route path="/help" element={<HelpCenter />} />
      <Route path="/help/:slug" element={<HelpArticle />} />
    </Routes>,
    { route },
  )
}

describe('HelpCenter', () => {
  it('renders the index with category shelves and article cards', () => {
    renderHelp('/help')

    expect(
      screen.getByRole('heading', { level: 1, name: /help center/i }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: /getting started/i }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: /how the salary is calculated/i }),
    ).toHaveAttribute('href', '/help/calcul-du-salaire')
    expect(
      screen.getByRole('link', { name: /invite a parent to your family/i }),
    ).toHaveAttribute('href', '/help/inviter-un-parent')
  })

  it('sets the help document title', () => {
    renderHelp('/help')
    expect(document.title).toMatch(/help center/i)
  })
})

describe('HelpArticle', () => {
  it('renders an article body and its related links', () => {
    renderHelp('/help/calcul-du-salaire')

    expect(
      screen.getByRole('heading', {
        level: 1,
        name: /how the salary is calculated/i,
      }),
    ).toBeInTheDocument()
    // A representative body heading from the salary article.
    expect(
      screen.getByRole('heading', { name: /monthly averaging/i }),
    ).toBeInTheDocument()
    // Related section links to another article.
    expect(
      screen.getByRole('link', { name: /how paid leave is calculated/i }),
    ).toHaveAttribute('href', '/help/conges-payes')
    // Outbound Pajemploi reference opens in a new tab.
    const pajemploi = screen.getByRole('link', { name: /pajemploi/i })
    expect(pajemploi).toHaveAttribute('target', '_blank')
    expect(pajemploi).toHaveAttribute(
      'rel',
      expect.stringContaining('noopener'),
    )
  })

  it('renders the co-parent invitation article', () => {
    renderHelp('/help/inviter-un-parent')

    expect(
      screen.getByRole('heading', {
        level: 1,
        name: /invite a parent to your family/i,
      }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: /choose the role/i }),
    ).toBeInTheDocument()
  })

  it('redirects an unknown slug back to the index', () => {
    renderHelp('/help/does-not-exist')

    expect(
      screen.getByRole('heading', { level: 1, name: /help center/i }),
    ).toBeInTheDocument()
  })
})
