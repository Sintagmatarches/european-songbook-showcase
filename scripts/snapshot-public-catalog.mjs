import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const API_URL = 'https://euro-songbook.pages.dev/api/songs'
const EXPECTED_PUBLIC_SONGS = 300
const here = dirname(fileURLToPath(import.meta.url))
const outputPath = resolve(here, '../data/public-songs.json')

const cleanText = (value) => (typeof value === 'string' ? value.trim() : '')

function sanitize(song, snapshotId) {
  return {
    id: snapshotId,
    catalogId: cleanText(song.id),
    title: cleanText(song.title) || 'Untitled song',
    subtitle: cleanText(song.subtitle),
    lyrics: cleanText(song.lyrics),
    language: cleanText(song.lang) || 'unknown',
    country: cleanText(song.country) || 'unknown',
    period: cleanText(song.period),
    region: cleanText(song.region),
    event: cleanText(song.event),
    theme: cleanText(song.theme),
    year: Number.isFinite(Number(song.year)) ? Number(song.year) : null,
    verified: Boolean(song.verified),
    source: 'public-catalog',
  }
}

async function fetchPage(page) {
  const response = await fetch(`${API_URL}?page=${page}`)
  if (!response.ok) throw new Error(`Catalog page ${page} returned ${response.status}`)
  return response.json()
}

const firstPage = await fetchPage(1)
const pages = Number(firstPage.pages)
const batches = await Promise.all(
  Array.from({ length: pages - 1 }, (_, index) => fetchPage(index + 2)),
)
const rawSongs = [firstPage, ...batches].flatMap((page) => page.items ?? [])
const occurrences = new Map()
const songs = rawSongs.map((song) => {
  const catalogId = cleanText(song.id)
  const occurrence = (occurrences.get(catalogId) ?? 0) + 1
  occurrences.set(catalogId, occurrence)
  const snapshotId = occurrence === 1 ? catalogId : `${catalogId}__public_${occurrence}`
  return sanitize(song, snapshotId)
})
const ids = new Set(songs.map((song) => song.id))

if (songs.length !== EXPECTED_PUBLIC_SONGS || ids.size !== EXPECTED_PUBLIC_SONGS) {
  throw new Error(
    `Expected ${EXPECTED_PUBLIC_SONGS} unique public songs, received ${songs.length} rows / ${ids.size} IDs`,
  )
}

await mkdir(dirname(outputPath), { recursive: true })
await writeFile(outputPath, `${JSON.stringify(songs, null, 2)}\n`, 'utf8')
console.log(`Saved ${songs.length} public songs to ${outputPath}`)
