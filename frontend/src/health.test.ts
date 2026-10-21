import { describe, expect, it } from 'vitest'
import { getStatusMessage } from './health'

describe('getStatusMessage', () => {
  it('returns connected message when backend is ok', () => {
    expect(getStatusMessage('ok')).toBe('Backend connected')
  })

  it('returns unavailable message for an error status', () => {
    expect(getStatusMessage('error')).toBe('Backend unavailable')
  })
})
