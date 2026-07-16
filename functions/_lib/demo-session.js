export const DEMO_SESSION_COOKIE = 'portfolio_demo_session'
export const DEMO_SESSION_TTL_SECONDS = 2 * 60 * 60
export const DEMO_FAVORITES_LIMIT = 30
export const DEMO_SEARCH_HISTORY_LIMIT = 5

const emptySession = (now = Date.now()) => ({
  favorites: [],
  searchHistory: [],
  expiresAt: now + (DEMO_SESSION_TTL_SECONDS * 1000),
})

const uniqueStrings = (values, limit) => [...new Set(
  (Array.isArray(values) ? values : [])
    .map((value) => String(value || '').trim())
    .filter(Boolean),
)].slice(0, limit)

export function normalizeDemoSearchQuery(value = '') {
  return Array.from(String(value || '').normalize('NFKC').replace(/\s+/gu, ' ').trim())
    .slice(0, 200)
    .join('')
}

export function readDemoSession(request, now = Date.now()) {
  const cookieHeader = String(request?.headers?.get?.('cookie') || '')
  const rawCookie = cookieHeader
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${DEMO_SESSION_COOKIE}=`))
    ?.slice(DEMO_SESSION_COOKIE.length + 1)

  if (!rawCookie) return emptySession(now)
  try {
    const parsed = JSON.parse(decodeURIComponent(rawCookie))
    const expiresAt = Number(parsed?.expiresAt || 0)
    if (!Number.isFinite(expiresAt) || expiresAt <= now) return emptySession(now)
    const searchHistory = (Array.isArray(parsed?.searchHistory) ? parsed.searchHistory : [])
      .map((item) => ({
        query: normalizeDemoSearchQuery(item?.query || ''),
        searched_at: String(item?.searched_at || ''),
      }))
      .filter((item) => item.query)
      .slice(0, DEMO_SEARCH_HISTORY_LIMIT)
    return {
      favorites: uniqueStrings(parsed?.favorites, DEMO_FAVORITES_LIMIT),
      searchHistory,
      expiresAt,
    }
  } catch {
    return emptySession(now)
  }
}

export function refreshDemoSession(session = {}, now = Date.now()) {
  return {
    favorites: uniqueStrings(session?.favorites, DEMO_FAVORITES_LIMIT),
    searchHistory: (Array.isArray(session?.searchHistory) ? session.searchHistory : [])
      .slice(0, DEMO_SEARCH_HISTORY_LIMIT),
    expiresAt: now + (DEMO_SESSION_TTL_SECONDS * 1000),
  }
}

export function demoSessionCookie(session, requestUrl, now = Date.now()) {
  const refreshed = refreshDemoSession(session, now)
  const secure = new URL(requestUrl).protocol === 'https:' ? '; Secure' : ''
  return `${DEMO_SESSION_COOKIE}=${encodeURIComponent(JSON.stringify(refreshed))}; Path=/; Max-Age=${DEMO_SESSION_TTL_SECONDS}; HttpOnly; SameSite=Lax${secure}`
}

export function recordDemoSearch(session, value, now = Date.now()) {
  const query = normalizeDemoSearchQuery(value)
  if (!query) return { session: refreshDemoSession(session, now), item: null }
  const searchedAt = new Date(now).toISOString()
  const queryKey = query.toLocaleLowerCase()
  const searchHistory = [
    { query, searched_at: searchedAt },
    ...(Array.isArray(session?.searchHistory) ? session.searchHistory : [])
      .filter((item) => normalizeDemoSearchQuery(item?.query || '').toLocaleLowerCase() !== queryKey),
  ].slice(0, DEMO_SEARCH_HISTORY_LIMIT)
  return {
    session: refreshDemoSession({ ...session, searchHistory }, now),
    item: searchHistory[0],
  }
}
