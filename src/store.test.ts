import { describe, it, expect, beforeEach } from 'vitest'
import { getLinks, setLinks, addLink, updateLink, deleteLink } from './store.ts'
import type { Link } from './store.ts'

beforeEach(() => {
  localStorage.clear()
})

describe('getLinks', () => {
  it('returns default links when nothing is stored', () => {
    const links = getLinks()
    expect(links).toHaveLength(7)
    expect(links[0].label).toBe('GitHub')
  })

  it('returns stored links when localStorage has data', () => {
    const customLinks: Link[] = [
      {
        label: 'Usagi Tsukino',
        url: 'https://example.com/usagi',
        gradient: 'linear-gradient(135deg, #ff69b4 0%, #ff1493 100%)',
      },
    ]
    localStorage.setItem('linktree-links', JSON.stringify(customLinks))
    const links = getLinks()
    expect(links).toHaveLength(1)
    expect(links[0].label).toBe('Usagi Tsukino')
  })

  it('falls back to defaults on corrupted JSON', () => {
    localStorage.setItem('linktree-links', '{invalid}')
    const links = getLinks()
    expect(links).toHaveLength(7)
  })
})

describe('setLinks', () => {
  it('overwrites stored links', () => {
    const links: Link[] = [
      {
        label: 'Neo Tokyo',
        url: 'https://example.com/neo',
        gradient: 'linear-gradient(135deg, #00ffff 0%, #0080ff 100%)',
      },
    ]
    setLinks(links)
    const stored = JSON.parse(localStorage.getItem('linktree-links')!)
    expect(stored).toHaveLength(1)
    expect(stored[0].label).toBe('Neo Tokyo')
  })
})

describe('addLink', () => {
  it('appends a link and returns updated list', () => {
    const newLink: Link = {
      label: 'Sailor Moon',
      url: 'https://example.com/sailor',
      gradient: 'linear-gradient(135deg, #ff69b4 0%, #ff1493 100%)',
    }
    const result = addLink(newLink)
    expect(result).toHaveLength(8)
    expect(result[7].label).toBe('Sailor Moon')
  })
})

describe('updateLink', () => {
  it('updates a link at a valid index', () => {
    const updated: Link = {
      label: 'Sailor Mars',
      url: 'https://example.com/mars',
      gradient: 'linear-gradient(135deg, #ff0000 0%, #ff4500 100%)',
    }
    const result = updateLink(0, updated)
    expect(result[0].label).toBe('Sailor Mars')
  })

  it('does nothing for an out-of-bounds index', () => {
    const updated: Link = {
      label: 'Tuxedo Mask',
      url: 'https://example.com/mask',
      gradient: 'linear-gradient(135deg, #000000 0%, #333333 100%)',
    }
    const result = updateLink(99, updated)
    // Since index is out of bounds, the link list should remain unchanged
    expect(result[0].label).toBe('GitHub')
  })
})

describe('deleteLink', () => {
  it('removes a link at a valid index', () => {
    const result = deleteLink(0)
    expect(result).toHaveLength(6)
    expect(result[0].label).toBe('Keysmash')
  })

  it('does nothing for an out-of-bounds index', () => {
    const result = deleteLink(99)
    expect(result).toHaveLength(7)
  })
})
