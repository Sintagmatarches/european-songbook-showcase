import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { readFile } from 'node:fs/promises'
import { extname, resolve } from 'node:path'
import test from 'node:test'

const root = resolve(import.meta.dirname, '..')
const textExtensions = new Set(['.css', '.html', '.js', '.json', '.md', '.mjs', '.svg', '.txt', '.webmanifest'])
const trackedFiles = execFileSync('git', ['ls-files', '-z'], { cwd: root })
  .toString('utf8')
  .split('\0')
  .filter(Boolean)

const highConfidenceSecretPatterns = [
  new RegExp(['AI', 'za[0-9A-Za-z_-]{35}'].join('')),
  new RegExp(['AK', 'IA[0-9A-Z]{16}'].join('')),
  new RegExp(['gh', '[pousr]_[A-Za-z0-9_]{20,}'].join('')),
  new RegExp(['sk', '-[A-Za-z0-9_-]{20,}'].join('')),
  new RegExp(['-----BEGIN ', '(?:RSA |EC |OPENSSH )?PRIVATE KEY-----'].join('')),
]

test('tracked portfolio files contain no high-confidence credentials or real email addresses', async () => {
  const findings = []
  for (const file of trackedFiles) {
    if (!textExtensions.has(extname(file)) && !['Dockerfile', 'LICENSE'].includes(file)) continue
    const source = await readFile(resolve(root, file), 'utf8')
    for (const pattern of highConfidenceSecretPatterns) {
      if (pattern.test(source)) findings.push(`${file}: ${pattern}`)
    }
    if (/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i.test(source)) findings.push(`${file}: email address`)
  }
  assert.deepEqual(findings, [])
})

test('repository does not track environment or private-key files', () => {
  const unsafeFiles = trackedFiles.filter((file) =>
    /(^|\/)(?:\.env(?:\..*)?|credentials?|secrets?)(?:$|\/)|\.(?:key|pem|p12|pfx|keystore)$/i.test(file),
  )
  assert.deepEqual(unsafeFiles, [])
})
