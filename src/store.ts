export interface Link {
  label: string
  url: string
  gradient: string
}

const STORAGE_KEY = 'linktree-links'

const defaultLinks: Link[] = [
  {
    label: 'GitHub',
    url: 'https://github.com/TheRipperoni',
    gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  },
  {
    label: 'Keysmash',
    url: 'https://keysmash.ripperoni.com/',
    gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  },
  {
    label: 'Bubbles',
    url: 'https://bubbles.ripperoni.com/',
    gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  },
  {
    label: 'Bluesky',
    url: 'https://bsky.app/profile/ripperoni.com',
    gradient: 'linear-gradient(135deg, #0284ff 0%, #38bdf8 100%)',
  },
  {
    label: 'BSKY TTRPG',
    url: 'https://bsky.app/profile/bskyttrpg.bsky.social',
    gradient: 'linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%)',
  },
  {
    label: 'Timed Mutes',
    url: 'https://mutes.ripperoni.com/',
    gradient: 'linear-gradient(135deg, #f97316 0%, #ef4444 100%)',
  },
  {
    label: 'Ko-fi',
    url: 'https://ko-fi.com/ripperoni',
    gradient: 'linear-gradient(135deg, #ff5e5b 0%, #ffb347 100%)',
  },
]

export function getLinks(): Link[] {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (!stored) {
    setLinks(defaultLinks)
    return [...defaultLinks]
  }
  try {
    return JSON.parse(stored) as Link[]
  } catch {
    setLinks(defaultLinks)
    return [...defaultLinks]
  }
}

export function setLinks(links: Link[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(links))
}

export function addLink(link: Link): Link[] {
  const links = getLinks()
  links.push(link)
  setLinks(links)
  return links
}

export function updateLink(index: number, link: Link): Link[] {
  const links = getLinks()
  if (index >= 0 && index < links.length) {
    links[index] = link
    setLinks(links)
  }
  return links
}

export function deleteLink(index: number): Link[] {
  const links = getLinks()
  if (index >= 0 && index < links.length) {
    links.splice(index, 1)
    setLinks(links)
  }
  return links
}
