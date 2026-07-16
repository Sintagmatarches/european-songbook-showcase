import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const index = await readFile(new URL('../public-site/index.html', import.meta.url), 'utf8')
const css = await readFile(new URL('../public-site/ui/dist/app.css', import.meta.url))
const app = await readFile(new URL('../public-site/ui/dist/app.js', import.meta.url))
const api = await readFile(new URL('../public-site/ui/dist/chunks/chunk-HKLUWN3C.js', import.meta.url))
const render = await readFile(new URL('../public-site/ui/dist/chunks/render-FPKSMUU5.js', import.meta.url))
const digest = (value) => createHash('sha256').update(value).digest('hex')

test('portfolio uses the original production UI shell', () => {
  assert.match(index, /class="topbar"/)
  assert.match(index, /class="ig-rail"/)
  assert.match(index, /id="mobileNav"/)
  assert.match(index, /songbook-logo-ui-192\.png/)
  assert.doesNotMatch(index, /Living archive|Portfolio case study|Demo Administration/)
})

test('original design CSS and portfolio-adapted application bundles are pinned', () => {
  assert.equal(digest(css), 'a365874bc3fec40c07897c28bb6dfffeda2d2db4d71f313f57cbe16eb9aa6c36')
  assert.equal(digest(app), '2738dd4781e39c485f9aa557bdbbb91ca231779a88de8a4a240f8e55b127b642')
  assert.equal(digest(api), '4e77dddf5e060b76bfa9583df523feb218cf507af093465b68240ea160393c3d')
  assert.equal(digest(render), '0305c26f660282739e3f303af0cabd01fbaf0663132cb133efa1668d9edb602e')
})

test('all portfolio thematic navigation hides zero-count structural entries', () => {
  assert.match(app.toString('utf8'), /render-FPKSMUU5\.js\?v=20260716-portfolio-policy-v6/)
  assert.match(render.toString('utf8'), /includeZeroCountStructural:!1,minCount:0/)
  assert.doesNotMatch(render.toString('utf8'), /includeZeroCountStructural:!![^,]+\.user/)
})

test('historical affiliation picker exposes only countries with demo songs', () => {
  const source = render.toString('utf8')
  assert.match(source, /value!=="other_countries"\)\.filter\(Boolean\)\.filter\(([A-Za-z_$][\w$]*)=>\1\.count>0\)/)
  assert.match(source, /new Set\(\[\.\.\.[A-Za-z_$][\w$]*\]\.filter\(\(\[,([A-Za-z_$][\w$]*)\]\)=>Number\(\1\)>0\)/)
})

test('visual selector hides zero-count countries and thematic labels use the active locale', () => {
  const source = render.toString('utf8')
  assert.match(source, /\.filter\(([A-Za-z_$][\w$]*)=>\1&&\1\.value!=="other_countries"\)\.filter\(Boolean\)\.filter\(([A-Za-z_$][\w$]*)=>\2\.count>0\)/)
  assert.match(source, /if\(([A-Za-z_$][\w$]*)\)return \1;let [A-Za-z_$][\w$]*=h0\([A-Za-z_$][\w$]*\);if\([A-Za-z_$][\w$]*\)return [A-Za-z_$][\w$]*/)
})

test('bundled flag catalog contains only affiliations represented by demo songs', () => {
  const source = render.toString('utf8')
  const embeddedWikimediaFiles = [...source.matchAll(/Me\("([^"]+)"\)/g)].map((match) => match[1]).sort()
  assert.deepEqual(embeddedWikimediaFiles, [
    'Civil flag of Serbia.svg',
    'Civil flag of Serbia.svg',
    'Flag of Austria-Hungary 1869-1918.svg',
    'Flag of the German Empire.svg',
    'Flag of the Ottoman Empire (1844\\u20131922).svg',
    'Flag of the Ottoman Empire (1844\\u20131922).svg',
    'Flag of Russia (1858\\u20131896).svg',
  ].sort())
  assert.match(source, /portfolioFlagCountries\.has\(/)
  for (const country of ['serbia_2006', 'turkey_1923', 'bulgaria_1990', 'germany_1990', 'france_fifth_republic_1958', 'austria_1945', 'hungary_1989', 'ukraine_1991', 'russian_federation_1991', 'russian_empire_1900_1917', 'uk_gb_ni_1922', 'ireland_1937_1949', 'iceland_1944', 'norway_1905']) {
    assert.match(source, new RegExp(`portfolioFlagCountries[^;]+"${country}"`))
  }
  const flagCatalog = source.slice(source.indexOf('var lf=Object.freeze('), source.indexOf(';function Xc'))
  assert.doesNotMatch(flagCatalog, /third_reich|nazi_germany/i)
})

test('home catalog is labelled as thematic sections in every interface language', () => {
  const source = render.toString('utf8')
  assert.match(source, /Thematic sections/)
  assert.match(source, /Temaatilised jaotised/)
  assert.match(source, /\\u0422\\u0435\\u043C\\u0430\\u0442\\u0438\\u0447\\u0435\\u0441\\u043A\\u0438\\u0435 \\u0440\\u0430\\u0437\\u0434\\u0435\\u043B\\u044B/)
  assert.match(source, /\\u0422\\u0435\\u043C\\u0430\\u0442\\u0438\\u0447\\u043D\\u0456 \\u0440\\u043E\\u0437\\u0434\\u0456\\u043B\\u0438/)
})

test('favorites bypass stale GET data and invalidate cached song state after mutations', () => {
  const appSource = app.toString('utf8')
  const apiSource = api.toString('utf8')
  const renderSource = render.toString('utf8')
  assert.match(appSource, /chunk-HKLUWN3C\.js\?v=20260715-portfolio-api-v1/)
  assert.match(renderSource, /chunk-HKLUWN3C\.js\?v=20260715-portfolio-api-v1/)
  assert.ok(appSource.includes('async function Ko(){let e=!0;e&&sn();'))
  assert.ok(appSource.includes('await mn({rerender:!1}),k.handle()'))
  assert.ok(apiSource.includes('async favorites(){return c("api/favorites",{noCache:!0,cache:"no-store"})}'))
  assert.ok(apiSource.includes('async favAdd(_){let m=await c(`api/favorites/${encodeURIComponent(_)}`,{method:"POST"});return i.clear(),m}'))
  assert.ok(apiSource.includes('async favDel(_){let m=await c(`api/favorites/${encodeURIComponent(_)}`,{method:"DELETE"});return i.clear(),m}'))
})

test('all entry assets use the explicit portfolio cache version', () => {
  const references = index.match(/20260716-original-ui-v13/g) || []
  assert.equal(references.length, 7)
  assert.doesNotMatch(index, /20260715-lyrics-spacing-v98|20260715-original-ui-v[2-9]\b/)
})
