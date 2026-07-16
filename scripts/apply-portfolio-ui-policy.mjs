import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const root = resolve(import.meta.dirname, '..')
const appPath = resolve(root, 'public-site/ui/dist/app.js')
const apiPath = resolve(root, 'public-site/ui/dist/chunks/chunk-HKLUWN3C.js')
const renderPath = resolve(root, 'public-site/ui/dist/chunks/render-FPKSMUU5.js')
const chunkVersion = '20260716-portfolio-policy-v7'
const previousChunkVersion = '20260716-portfolio-policy-v6'
const apiChunkVersion = '20260715-portfolio-api-v1'

function replaceExactlyOnce(source, original, replacement, label) {
  if (source.includes(replacement)) return source
  const matches = source.split(original).length - 1
  if (matches !== 1) throw new Error(`Expected one ${label} marker, found ${matches}`)
  return source.replace(original, replacement)
}

function replaceDelimitedOnce(source, start, end, replacement, label) {
  if (source.includes(replacement)) return source
  const startIndex = source.indexOf(start)
  const endIndex = startIndex >= 0 ? source.indexOf(end, startIndex) : -1
  if (startIndex < 0 || endIndex < 0) throw new Error(`Could not locate ${label}`)
  return source.slice(0, startIndex) + replacement + source.slice(endIndex)
}

let app = await readFile(appPath, 'utf8')
const versionedRenderImport = `import("./chunks/render-FPKSMUU5.js?v=${chunkVersion}")`
if (!app.includes(versionedRenderImport)) {
  const previousRenderImport = `import("./chunks/render-FPKSMUU5.js?v=${previousChunkVersion}")`
  app = replaceExactlyOnce(
    app,
    app.includes(previousRenderImport) ? previousRenderImport : 'import("./chunks/render-FPKSMUU5.js")',
    versionedRenderImport,
    'render chunk import',
  )
}
app = replaceExactlyOnce(
  app,
  '"./chunks/chunk-HKLUWN3C.js"',
  `"./chunks/chunk-HKLUWN3C.js?v=${apiChunkVersion}"`,
  'API chunk import',
)
app = replaceExactlyOnce(
  app,
  'async function Ko(){let e=Dn();',
  'async function Ko(){let e=!0;',
  'portfolio demo user bootstrap',
)
app = replaceExactlyOnce(
  app,
  'async function Ko(){let e=!0;e&&sn();let t=zo();t&&typeof t=="object"&&(s.user=t,Ae()),k.handle(),e&&mn({rerender:!0}),Vo(),O(),T()}Ko();',
  'async function Ko(){let e=!0;e&&sn();let t=zo();t&&typeof t=="object"&&(s.user=t,Ae()),await mn({rerender:!1}),k.handle(),Vo(),O(),T()}Ko();',
  'portfolio demo user initialization order',
)

let api = await readFile(apiPath, 'utf8')
api = replaceExactlyOnce(
  api,
  'async favorites(){return c("api/favorites")}',
  'async favorites(){return c("api/favorites",{noCache:!0,cache:"no-store"})}',
  'uncached favorites list',
)
api = replaceExactlyOnce(
  api,
  'async favAdd(_){return c(`api/favorites/${encodeURIComponent(_)}`,{method:"POST"})}',
  'async favAdd(_){let m=await c(`api/favorites/${encodeURIComponent(_)}`,{method:"POST"});return i.clear(),m}',
  'favorite add cache invalidation',
)
api = replaceExactlyOnce(
  api,
  'async favDel(_){return c(`api/favorites/${encodeURIComponent(_)}`,{method:"DELETE"})}',
  'async favDel(_){let m=await c(`api/favorites/${encodeURIComponent(_)}`,{method:"DELETE"});return i.clear(),m}',
  'favorite delete cache invalidation',
)

let render = await readFile(renderPath, 'utf8')
const portfolioFlagCatalog = 'var lf=Object.freeze({serbia_2006:"rs",turkey_1923:"tr",bulgaria_1990:"bg",germany_1990:"de",austria_1945:"at",hungary_1989:"hu",switzerland_1900:"ch",indonesia_1945:"id",netherlands_1900:"nl",ukraine_1991:"ua",ukraine_before_1917:"ua",uk_gb_ni_1922:"gb",uk_gb_ireland_1900_1922:"gb",ireland_1937_1949:"ie",denmark_1900:"dk",iceland_1944:"is",norway_1905:"no"}),df=Object.freeze({}),Gc=Object.freeze({austro_hungary_1900_1918:Me("Flag of Austria-Hungary 1869-1918.svg"),german_empire_1900_1918:Me("Flag of the German Empire.svg"),ottoman_rule_in_bulgaria_1396_1878:Me("Flag of the Ottoman Empire (1844\\u20131922).svg"),ottoman_rule_in_serbia_1459_1804:Me("Flag of the Ottoman Empire (1844\\u20131922).svg"),principality_of_serbia_1815_1882:Me("Civil flag of Serbia.svg"),kingdom_of_serbia_1882_1918:Me("Civil flag of Serbia.svg")}),ff=Object.freeze({}),mf=Object.freeze([]),portfolioHomeSectionCountries=Object.freeze(new Set(["serbia_2006","turkey_1923","bulgaria_1990","germany_1990","austro_hungary_1900_1918","austria_1945","hungary_1989","switzerland_1900","netherlands_1900","ukraine_1991","uk_gb_ni_1922","ireland_1937_1949","denmark_1900","iceland_1944","norway_1905"])),portfolioFlagCountries=Object.freeze(new Set(["serbia_2006","turkey_1923","bulgaria_1990","germany_1990","austro_hungary_1900_1918","austria_1945","hungary_1989","switzerland_1900","netherlands_1900","ukraine_1991","uk_gb_ni_1922","ireland_1937_1949","denmark_1900","iceland_1944","norway_1905","principality_of_serbia_1815_1882","ottoman_rule_in_bulgaria_1396_1878","german_empire_1900_1918","indonesia_1945","ukraine_before_1917","uk_gb_ireland_1900_1922","ottoman_rule_in_serbia_1459_1804","kingdom_of_serbia_1882_1918"]))'
render = replaceDelimitedOnce(
  render,
  'var lf=Object.freeze(',
  ';function Xc',
  portfolioFlagCatalog,
  'portfolio flag catalog',
)
render = replaceExactlyOnce(
  render,
  'from"./chunk-HKLUWN3C.js"',
  `from"./chunk-HKLUWN3C.js?v=${apiChunkVersion}"`,
  'render API chunk import',
)
render = replaceExactlyOnce(
  render,
  'function Jc(e="",t={}){let n=me(e||"");if(!n)return null;',
  'function Jc(e="",t={}){let n=me(e||"");if(!n||!portfolioFlagCountries.has(n))return null;',
  'portfolio flag allowlist',
)
render = replaceExactlyOnce(
  render,
  'function ns(){return ce.user?0:1}',
  'function ns(){return 0}',
  'thematic count threshold',
)
render = replaceExactlyOnce(
  render,
  'filter(i=>i.count>n).sort((i,a)=>x0(i,a,r))',
  'filter(i=>i.count>n&&portfolioHomeSectionCountries.has(w0(i.key))).sort((i,a)=>x0(i,a,r))',
  'portfolio home section ownership policy',
)
render = replaceExactlyOnce(
  render,
  'function wg(){return c()==="ru"?"\\u0421\\u0442\\u0440\\u0430\\u043D\\u044B":c()==="uk"?"\\u041A\\u0440\\u0430\\u0457\\u043D\\u0438":c()==="et"?"Riigid":c()==="et"?"Vali k\\xF5igepealt riik v\\xF5i suurem ajalooline tervik. Keel toimib filtrina.":"Countries"}',
  'function wg(){return c()==="ru"?"\\u0422\\u0435\\u043C\\u0430\\u0442\\u0438\\u0447\\u0435\\u0441\\u043A\\u0438\\u0435 \\u0440\\u0430\\u0437\\u0434\\u0435\\u043B\\u044B":c()==="uk"?"\\u0422\\u0435\\u043C\\u0430\\u0442\\u0438\\u0447\\u043D\\u0456 \\u0440\\u043E\\u0437\\u0434\\u0456\\u043B\\u0438":c()==="et"?"Temaatilised jaotised":"Thematic sections"}',
  'thematic section heading',
)
render = replaceExactlyOnce(
  render,
  'a=Number.isFinite(Number(n?.minCount))?Number(n.minCount):ns()',
  'a=Number.isFinite(Number(n?.minCount))?Number(n.minCount):0',
  'nested thematic threshold',
)
render = replaceExactlyOnce(
  render,
  'children:A0(n,t,{includeZeroCountStructural:!!ce.user,minCount:ns()})',
  'children:A0(n,t,{includeZeroCountStructural:!1,minCount:0})',
  'zero-count structural policy',
)
render = replaceExactlyOnce(
  render,
  '.filter(M=>M&&M.value!=="other_countries").filter(Boolean).sort((M,R)=>R.count-M.count||M.label.localeCompare(R.label))',
  '.filter(M=>M&&M.value!=="other_countries").filter(Boolean).filter(M=>M.count>0).sort((M,R)=>R.count-M.count||M.label.localeCompare(R.label))',
  'historical affiliation availability policy',
)
render = replaceExactlyOnce(
  render,
  '.filter(A=>A&&A.value!=="other_countries").filter(Boolean).sort((A,E)=>E.count-A.count||A.label.localeCompare(E.label))',
  '.filter(A=>A&&A.value!=="other_countries").filter(Boolean).filter(A=>A.count>0).sort((A,E)=>E.count-A.count||A.label.localeCompare(E.label))',
  'visual country availability policy',
)
render = replaceExactlyOnce(
  render,
  'function ta(e=""){let t=String(e||"").trim();if(!t)return"";let n=Ed[c()]?.[t]||(c()==="en"?Ed.en?.[t]:"");if(n)return n;let r=Cr(t);if(r){let i=Ru(r),a=Pn(r),s=si[c()]?.[t]||(c()==="en"?si.en?.[t]:"");if(!(t===i||t===a))return s||t;let l=h0(r);if(l)return l}return wi(t)}',
  'function ta(e=""){let t=String(e||"").trim();if(!t)return"";let n=Ed[c()]?.[t]||(c()==="en"?Ed.en?.[t]:"");if(n)return n;let r=Cr(t);if(r){let s=si[c()]?.[t]||(c()==="en"?si.en?.[t]:"");if(s)return s;let l=h0(r);if(l)return l}return wi(t)}',
  'localized thematic entity labels',
)
render = replaceExactlyOnce(
  render,
  's=e.allowAllCountries===!0,u=()=>typeof e.getAllowedCountries=="function"?e.getAllowedCountries({lang:i(),country:a()}):null,l=',
  's=e.allowAllCountries===!0,d=null,u=()=>{let v=typeof e.getAllowedCountries=="function"?e.getAllowedCountries({lang:i(),country:a()}):null;return d?v?new Set([...v].filter(h=>d.has(h))):d:v},l=',
  'native historical selector count policy',
)
render = replaceExactlyOnce(
  render,
  'f({country:me(e.initialCountry||r.value||"")||""}),{getCountry:a,getGroup:()=>"",refresh:f,syncFromCountry:g}',
  'f({country:me(e.initialCountry||r.value||"")||""}),g3().then(v=>{d=new Set([...v].filter(([,h])=>Number(h)>0).map(([h])=>h)),f({country:a()})}),{getCountry:a,getGroup:()=>"",refresh:f,syncFromCountry:g}',
  'native historical selector refresh policy',
)

await Promise.all([
  writeFile(appPath, app),
  writeFile(apiPath, api),
  writeFile(renderPath, render),
])

console.log('Applied positive-count thematic navigation policy to the portfolio UI')
