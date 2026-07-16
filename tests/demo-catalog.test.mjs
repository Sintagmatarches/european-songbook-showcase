import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import {
  countryCounts,
  DEMO_FIXTURES,
  DEMO_USER,
  filterSongs,
  languageCountryCounts,
  normalizeSong,
  paginateSongs,
} from '../functions/_lib/demo-catalog.js'

const publicRows = JSON.parse(await readFile(new URL('../data/public-songs.json', import.meta.url), 'utf8'))
const catalog = [...publicRows, ...DEMO_FIXTURES].map(normalizeSong)

test('portfolio catalog contains 300 public rows and five labeled fixtures', () => {
  assert.equal(publicRows.length, 300)
  assert.equal(DEMO_FIXTURES.length, 5)
  assert.equal(catalog.length, 305)
  assert.equal(new Set(catalog.map((song) => song.id)).size, 305)
})

test('demo user unlocks the original administration UI without real identity data', () => {
  assert.equal(DEMO_USER.role, 'super_admin')
  assert.deepEqual(DEMO_USER.scopeLanguages, ['*'])
  assert.equal(DEMO_USER.email, '')
  assert.ok(DEMO_USER.permissions.includes('songs.bulk_import'))
  assert.ok(DEMO_USER.permissions.includes('proposals.review'))
})

test('catalog filtering, grouping and pagination match the original API contract', () => {
  const german = filterSongs(catalog, new URLSearchParams({ lang: 'de' }))
  const firstPage = paginateSongs(german, new URLSearchParams({ page: '1' }))
  assert.equal(firstPage.items.length, 10)
  assert.equal(firstPage.total, german.length)
  assert.ok(countryCounts(catalog).some((item) => item.country === 'indonesia_1945' && item.count === 5))
  assert.ok(languageCountryCounts(catalog).some((item) => item.lang === 'id' && item.count === 1))
})

test('sanitized snapshot has no private API fields', () => {
  for (const row of publicRows) {
    assert.equal('created_at' in row, false)
    assert.equal('updated_at' in row, false)
    assert.equal('email' in row, false)
  }
})
