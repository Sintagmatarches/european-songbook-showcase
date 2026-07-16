const FIXTURE_LYRICS = [
  'Portfolio workflow fixture.',
  'This entry is intentionally not historical catalog data.',
  'Actions in this demo are never written to the production database.',
].join('\n')

const fixture = (id, title, lang, subtitle) => ({
  id,
  catalogId: id,
  title,
  subtitle,
  lyrics: FIXTURE_LYRICS,
  language: lang,
  country: 'indonesia_1945',
  period: 'portfolio_demo',
  region: 'Southeast Asia',
  event: '',
  theme: 'workflow demonstration',
  year: null,
  verified: true,
  source: 'demo-fixture',
})

export const DEMO_FIXTURES = Object.freeze([
  fixture('demo-id', 'Demo fixture — Bahasa Indonesia', 'id', 'National-language workflow'),
  fixture('demo-jv', 'Demo fixture — Basa Jawa', 'jv', 'Javanese-language workflow'),
  fixture('demo-su', 'Demo fixture — Basa Sunda', 'su', 'Sundanese-language workflow'),
  fixture('demo-min', 'Demo fixture — Minangkabau', 'min', 'Regional-language workflow'),
  fixture('demo-ace', 'Demo fixture — Basa Acèh', 'ace', 'Regional-language workflow'),
])

export const DEMO_USER = Object.freeze({
  id: 'portfolio-demo-user',
  user_id: 'portfolio-demo-user',
  nickname: 'Portfolio Demo',
  email: '',
  role: 'super_admin',
  approved: true,
  permissions: [
    'songs.create', 'songs.bulk_import', 'songs.edit', 'songs.delete', 'songs.view_admin_content',
    'variants.manage', 'links.manage', 'proposals.review', 'proposals.approve', 'proposals.reject',
  ],
  scopeLanguages: ['*'],
})

export function normalizeSong(row) {
  const hidden = Boolean(row?.hidden || row?.status === 'hidden')
  return {
    id: String(row?.id || ''),
    title: String(row?.title || 'Untitled song'),
    subtitle: String(row?.subtitle || ''),
    lyrics: String(row?.lyrics || ''),
    lang: String(row?.lang || row?.language || 'unknown'),
    country: String(row?.country || 'unknown'),
    period: String(row?.period || ''),
    region: String(row?.region || ''),
    event: String(row?.event || ''),
    theme: String(row?.theme || ''),
    verified: Boolean(row?.verified),
    year: row?.year == null || row?.year === '' ? null : String(row.year),
    source: row?.source === 'demo-fixture' ? 'portfolio_demo' : null,
    notes: row?.source === 'demo-fixture' ? 'Clearly labeled portfolio workflow fixture.' : '',
    is_public_catalog: true,
    is_admin_content: false,
    status: hidden ? 'hidden' : 'published',
    hidden,
  }
}

export function completeSong(song) {
  return {
    ...song,
    words_authors: [], words_author: null,
    music_authors: [], music_author: null,
    performers: [], performer: null,
    translators: [], translator: null,
    verified_translation: '', tags: [], lyrics_meta_json: {},
    audio_asset_id: null, audio: null, audio_timestamps: [],
    is_favorite: false, versions: [], links: [],
  }
}

export function filterSongs(songs, searchParams) {
  const query = String(searchParams.get('q') || '').trim().toLocaleLowerCase()
  const lang = String(searchParams.get('lang') || '').trim().toLowerCase()
  const country = String(searchParams.get('country') || '').trim().toLowerCase()
  const year = String(searchParams.get('year') || '').trim()
  const verified = String(searchParams.get('verified') || '').trim()

  return songs.filter((song) => {
    if (song.hidden || song.status === 'hidden') return false
    if (lang && song.lang !== lang) return false
    if (country && song.country.toLowerCase() !== country) return false
    if (year && String(song.year || '') !== year) return false
    if (verified === '1' && !song.verified) return false
    if (!query) return true
    return [song.title, song.subtitle, song.lyrics, song.country, song.lang]
      .some((value) => String(value || '').toLocaleLowerCase().includes(query))
  })
}

export function paginateSongs(songs, searchParams, pageSize = 10) {
  const requestedPage = Number.parseInt(searchParams.get('page') || '1', 10)
  const pages = Math.max(1, Math.ceil(songs.length / pageSize))
  const page = Math.min(Math.max(1, Number.isFinite(requestedPage) ? requestedPage : 1), pages)
  const offset = (page - 1) * pageSize
  return {
    items: songs.slice(offset, offset + pageSize),
    total: songs.length,
    page,
    pages,
    search_mode: 'browse',
    suggestions: [],
    suggestions_total: 0,
  }
}

function groupCount(songs, fields) {
  const counts = new Map()
  for (const song of songs) {
    if (song.hidden || song.status === 'hidden') continue
    const values = fields.map((field) => String(song[field] || ''))
    if (values.some((value) => !value)) continue
    const key = JSON.stringify(values)
    counts.set(key, (counts.get(key) || 0) + 1)
  }
  return [...counts.entries()]
    .map(([key, count]) => Object.fromEntries([...fields.map((field, index) => [field, JSON.parse(key)[index]]), ['count', count]]))
    .sort((left, right) => right.count - left.count)
}

export function countryCounts(songs) {
  return groupCount(songs, ['country'])
}

export function languageCountryCounts(songs) {
  return groupCount(songs, ['lang', 'country'])
}

export function languageCountryPeriodCounts(songs) {
  return groupCount(songs, ['lang', 'country', 'period'])
}
