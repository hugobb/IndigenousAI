// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import Timeline from '../src/components/Timeline.js'

afterEach(() => cleanup())

const props = {
  min: 1999, max: 2021, from: null, to: null, undatedCount: 0, onChange: () => {},
}

describe('Timeline', () => {
  it('defaults both handles to the full range', () => {
    render(<Timeline {...props} />)
    expect((screen.getByLabelText(/from/i) as HTMLInputElement).value).toBe('1999')
    expect((screen.getByLabelText(/to/i) as HTMLInputElement).value).toBe('2021')
  })

  it('shows the current window rather than making the reader read the handles', () => {
    render(<Timeline {...props} from={2005} to={2010} />)
    expect(screen.getByTestId('timeline-window').textContent).toContain('2005')
    expect(screen.getByTestId('timeline-window').textContent).toContain('2010')
  })

  it('reports a moved lower handle', () => {
    const onChange = vi.fn()
    render(<Timeline {...props} onChange={onChange} />)
    fireEvent.change(screen.getByLabelText(/from/i), { target: { value: '2005' } })
    expect(onChange).toHaveBeenCalledWith(2005, 2021)
  })

  it('pushes the upper handle when the lower one passes it', () => {
    const onChange = vi.fn()
    render(<Timeline {...props} from={2000} to={2010} onChange={onChange} />)
    fireEvent.change(screen.getByLabelText(/from/i), { target: { value: '2015' } })
    expect(onChange).toHaveBeenCalledWith(2015, 2015)
  })

  it('pushes the lower handle when the upper one passes it', () => {
    const onChange = vi.fn()
    render(<Timeline {...props} from={2010} to={2020} onChange={onChange} />)
    fireEvent.change(screen.getByLabelText(/to/i), { target: { value: '2005' } })
    expect(onChange).toHaveBeenCalledWith(2005, 2005)
  })

  it('reports nulls when returned to the full range, so the URL stays clean', () => {
    const onChange = vi.fn()
    render(<Timeline {...props} from={2005} to={2010} onChange={onChange} />)
    fireEvent.change(screen.getByLabelText(/from/i), { target: { value: '1999' } })
    fireEvent.change(screen.getByLabelText(/to/i), { target: { value: '2021' } })
    expect(onChange).toHaveBeenLastCalledWith(null, null)
  })

  // Spec F5, stated on screen rather than buried in a design document.
  it('says how many initiatives it cannot constrain', () => {
    render(<Timeline {...props} undatedCount={1} />)
    expect(screen.getByTestId('timeline-undated').textContent).toMatch(/1 initiative/i)
  })

  it('says nothing about undated initiatives when there are none', () => {
    render(<Timeline {...props} undatedCount={0} />)
    expect(screen.queryByTestId('timeline-undated')).toBeNull()
  })
})
