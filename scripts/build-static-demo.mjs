import { cp, mkdir, rm } from 'node:fs/promises'
import { resolve } from 'node:path'

const root = resolve(import.meta.dirname, '..')
const source = resolve(root, 'public-site')
const output = resolve(root, 'dist')

await rm(output, { recursive: true, force: true })
await mkdir(output, { recursive: true })
await cp(source, output, { recursive: true })
await mkdir(resolve(output, 'data'), { recursive: true })
await cp(resolve(root, 'data/public-songs.json'), resolve(output, 'data/public-songs.json'))

console.log('Built original-design static portfolio demo in dist/')
