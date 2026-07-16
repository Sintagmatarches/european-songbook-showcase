import {
  completeSong,
  countryCounts,
  DEMO_FIXTURES,
  DEMO_USER,
  filterSongs,
  languageCountryCounts,
  languageCountryPeriodCounts,
  normalizeSong,
  paginateSongs,
} from '../_lib/demo-catalog.js'
import {
  demoSessionCookie,
  readDemoSession,
  recordDemoSearch,
  refreshDemoSession,
} from '../_lib/demo-session.js'

let catalogPromise = null

function json(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'private, no-store',
      'X-Portfolio-Demo': 'local-sandbox',
      ...extraHeaders,
    },
  })
}

async function readBody(request) {
  try { return await request.json() } catch { return {} }
}

async function loadCatalog(context) {
  if (!catalogPromise) {
    const assetUrl = new URL('/data/public-songs.json', context.request.url)
    catalogPromise = context.env.ASSETS.fetch(new Request(assetUrl))
      .then((response) => {
        if (!response.ok) throw new Error(`Catalog asset returned ${response.status}`)
        return response.json()
      })
      .then((rows) => [...rows, ...DEMO_FIXTURES].map(normalizeSong).filter((song) => !song.hidden && song.status !== 'hidden'))
      .catch((error) => {
        catalogPromise = null
        throw error
      })
  }
  return catalogPromise
}

function songListItem(song) {
  return {
    ...song,
    snippet: '',
    version_rows: 0,
    is_recent: 0,
  }
}

function pathAfterApi(url) {
  return decodeURIComponent(url.pathname.replace(/^\/api\/?/, '')).replace(/^\/+|\/+$/g, '')
}

function isMutation(method) {
  return !['GET', 'HEAD', 'OPTIONS'].includes(method)
}

export async function onRequest(context) {
  const { request } = context
  const url = new URL(request.url)
  const path = pathAfterApi(url)
  const method = request.method.toUpperCase()

  if (method === 'OPTIONS') return new Response(null, { status: 204 })

  try {
    if (path === 'me' && method === 'GET') return json(DEMO_USER)
    if (path === 'site-status' || path === 'admin/site-status') return json({ maintenance: false, demo: true })

    if (path === 'auth/login' || path === 'auth/logout') return json({ ok: true, user: DEMO_USER, demo: true })
    if (path === 'auth/register') return json({ ok: true, status: 'demo_only', demo: true })
    if (path === 'me/nickname' && isMutation(method)) {
      const body = await readBody(request)
      return json({ nickname: String(body.nickname || DEMO_USER.nickname), demo: true })
    }

    const catalog = await loadCatalog(context)
    const session = readDemoSession(request)
    const favoriteIds = new Set(session.favorites)

    if (path === 'songs' && method === 'GET') {
      const filtered = filterSongs(catalog, url.searchParams)
        .map((song) => songListItem({ ...song, is_favorite: favoriteIds.has(song.id) }))
      return json(paginateSongs(filtered, url.searchParams))
    }

    const publicSongMatch = path.match(/^songs\/([^/]+)$/)
    if (publicSongMatch && method === 'GET') {
      const song = catalog.find((item) => item.id === publicSongMatch[1])
      return song && !song.hidden && song.status !== 'hidden'
        ? json({ ...completeSong(song), is_favorite: favoriteIds.has(song.id) })
        : json({ error: 'Song not found' }, 404)
    }
    if (/^songs\/[^/]+\/comments$/.test(path)) return json({ items: [], total: 0 })
    if (/^songs\/[^/]+\/comments\/[^/]+$/.test(path)) return json({ ok: true, demo: true })

    if (path === 'country-counts') return json({ items: countryCounts(catalog) })
    if (path === 'lang-country-counts') return json({ items: languageCountryCounts(catalog) })
    if (path === 'lang-country-period-counts') return json({ items: languageCountryPeriodCounts(catalog) })
    if (path === 'country-backgrounds' || path === 'admin/country-backgrounds') return json({ items: [] })
    if (path === 'entities') return json({ items: [] })

    if (path === 'search-history') {
      if (method === 'GET') return json({ items: session.searchHistory })
      const body = await readBody(request)
      const recorded = recordDemoSearch(session, body.query)
      if (!recorded.item) return json({ error: 'query is required' }, 400)
      return json(
        { item: recorded.item, demo: true },
        200,
        { 'Set-Cookie': demoSessionCookie(recorded.session, request.url) },
      )
    }

    if (path === 'favorites' && method === 'GET') {
      const items = session.favorites
        .map((id) => catalog.find((song) => song.id === id))
        .filter((song) => Boolean(song && !song.hidden && song.status !== 'hidden'))
        .map((song) => songListItem({ ...song, is_favorite: true }))
      return json({ items, total: items.length })
    }
    const favoriteMatch = path.match(/^favorites\/([^/]+)$/)
    if (favoriteMatch && (method === 'POST' || method === 'DELETE')) {
      const songId = favoriteMatch[1]
      if (!catalog.some((song) => song.id === songId && !song.hidden && song.status !== 'hidden')) return json({ error: 'Song not found' }, 404)
      const nextFavorites = new Set(session.favorites)
      if (method === 'POST') nextFavorites.add(songId)
      else nextFavorites.delete(songId)
      const nextSession = refreshDemoSession({ ...session, favorites: [...nextFavorites] })
      return json(
        { ok: true, is_favorite: method === 'POST', demo: true },
        200,
        { 'Set-Cookie': demoSessionCookie(nextSession, request.url) },
      )
    }

    if (path === 'admin/songs' && method === 'GET') {
      const filtered = filterSongs(catalog, url.searchParams)
      return json(paginateSongs(filtered, url.searchParams, 20))
    }
    if (path === 'admin/songs' && method === 'POST') {
      const body = await readBody(request)
      return json({ item: completeSong(normalizeSong({ ...body, id: `demo-${Date.now()}` })), demo: true }, 201)
    }
    const adminSongMatch = path.match(/^admin\/songs\/([^/]+)$/)
    if (adminSongMatch && method === 'GET') {
      const song = catalog.find((item) => item.id === adminSongMatch[1])
      return song ? json(completeSong(song)) : json({ error: 'Song not found' }, 404)
    }
    if (adminSongMatch && isMutation(method)) {
      const body = await readBody(request)
      return json({ item: completeSong(normalizeSong({ ...body, id: adminSongMatch[1] })), ok: true, demo: true })
    }
    if (/^admin\/songs\/[^/]+\/(history|restore)$/.test(path)) return json({ items: [], ok: true, demo: true })

    if (path === 'admin/import' && isMutation(method)) {
      return json({ ok: true, demo: true, created: 0, updated: 0, skipped: 0, message: 'Demo import validated; nothing was persisted.' })
    }
    if (path === 'requests' && isMutation(method)) return json({ ok: true, id: `demo-request-${Date.now()}`, demo: true }, 201)
    if (path === 'admin/requests' && method === 'GET') return json({ items: [], total: 0, page: 1, pages: 1 })
    if (/^admin\/requests\/[^/]+\/(approve|reject)$/.test(path)) return json({ ok: true, demo: true })
    if (path === 'admin/users') return json({ items: [], total: 0 })
    if (path.startsWith('admin/users/')) return json({ ok: true, demo: true })

    if (path === 'drafts' || path === 'drafts/invitations' || path === 'fragment-reports' || path === 'admin/fragment-reports') {
      return method === 'GET' ? json({ items: [], total: 0 }) : json({ ok: true, demo: true })
    }
    if (path.startsWith('drafts/') || path.startsWith('fragment-reports/')) return json({ items: [], ok: true, demo: true })

    if (path.startsWith('song-audio')) return json({ error: 'Audio mutations are disabled in the portfolio demo' }, 404)
    return method === 'GET'
      ? json({ items: [], total: 0, demo: true })
      : json({ ok: true, demo: true })
  } catch (error) {
    return json({ error: 'Portfolio demo API unavailable', detail: String(error?.message || error) }, 500)
  }
}
