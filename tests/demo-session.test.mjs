import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

import { onRequest } from '../functions/api/[[path]].js'
import {
  DEMO_SEARCH_HISTORY_LIMIT,
  DEMO_SESSION_TTL_SECONDS,
  demoSessionCookie,
  readDemoSession,
  recordDemoSearch,
} from '../functions/_lib/demo-session.js'

const catalog = JSON.parse(await readFile(new URL('../data/public-songs.json', import.meta.url), 'utf8'))
const env = {
  ASSETS: {
    fetch: async () => new Response(JSON.stringify(catalog), {
      headers: { 'content-type': 'application/json' },
    }),
  },
}

const cookiePair = (response) => String(response.headers.get('set-cookie') || '').split(';')[0]
const invoke = async (path, { method = 'GET', cookie = '', body } = {}) => {
  const headers = new Headers()
  if (cookie) headers.set('cookie', cookie)
  if (body !== undefined) headers.set('content-type', 'application/json')
  return onRequest({
    env,
    request: new Request(`https://portfolio.example/api/${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    }),
  })
}

test('demo session is isolated in an expiring cookie', () => {
  const now = Date.parse('2026-07-15T12:00:00.000Z')
  const cookie = demoSessionCookie({ favorites: ['song-1'] }, 'https://portfolio.example/', now)
  assert.match(cookie, /Max-Age=7200/)
  assert.match(cookie, /HttpOnly; SameSite=Lax; Secure/)

  const active = readDemoSession(new Request('https://portfolio.example/', {
    headers: { cookie: cookie.split(';')[0] },
  }), now + 1000)
  assert.deepEqual(active.favorites, ['song-1'])

  const expired = readDemoSession(new Request('https://portfolio.example/', {
    headers: { cookie: cookie.split(';')[0] },
  }), now + (DEMO_SESSION_TTL_SECONDS * 1000) + 1)
  assert.deepEqual(expired.favorites, [])
})

test('favorites persist for one demo browser session and update song state', async () => {
  const songId = String(catalog[0].id)
  const addResponse = await invoke(`favorites/${encodeURIComponent(songId)}`, { method: 'POST' })
  assert.equal(addResponse.status, 200)
  const addedCookie = cookiePair(addResponse)
  assert.ok(addedCookie)

  const favoritesResponse = await invoke('favorites', { cookie: addedCookie })
  const favorites = await favoritesResponse.json()
  assert.equal(favorites.total, 1)
  assert.equal(favorites.items[0].id, songId)
  assert.equal(favorites.items[0].is_favorite, true)

  const songResponse = await invoke(`songs/${encodeURIComponent(songId)}`, { cookie: addedCookie })
  assert.equal((await songResponse.json()).is_favorite, true)

  const deleteResponse = await invoke(`favorites/${encodeURIComponent(songId)}`, {
    method: 'DELETE',
    cookie: addedCookie,
  })
  const deletedCookie = cookiePair(deleteResponse)
  const emptyResponse = await invoke('favorites', { cookie: deletedCookie })
  assert.equal((await emptyResponse.json()).total, 0)
})

test('demo search history keeps the latest five normalized queries', async () => {
  let cookie = ''
  for (const query of ['one', 'two', 'three', 'four', 'five', '  SIX  ']) {
    const response = await invoke('search-history', { method: 'POST', cookie, body: { query } })
    assert.equal(response.status, 200)
    cookie = cookiePair(response)
  }

  const response = await invoke('search-history', { cookie })
  const body = await response.json()
  assert.equal(body.items.length, DEMO_SEARCH_HISTORY_LIMIT)
  assert.deepEqual(body.items.map((item) => item.query), ['SIX', 'five', 'four', 'three', 'two'])

  const deduplicated = recordDemoSearch(readDemoSession(new Request('https://portfolio.example/', {
    headers: { cookie },
  })), 'THREE')
  assert.equal(deduplicated.session.searchHistory.filter((item) => item.query.toLowerCase() === 'three').length, 1)
})
