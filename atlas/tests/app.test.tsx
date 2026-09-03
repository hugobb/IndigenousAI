// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup } from '@testing-library/react'
import App from '../src/components/App.js'

afterEach(() => cleanup())

describe('App', () => {
  it('renders the atlas heading', () => {
    render(<App />)
    expect(screen.getByRole('heading', { name: /atlas of indigenous language nlp/i })).toBeDefined()
  })
})
