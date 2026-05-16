import * as esbuild from 'esbuild'
import { writeFileSync, mkdirSync, copyFileSync, existsSync } from 'fs'

mkdirSync('dist/assets', { recursive: true })

const result = await esbuild.build({
  entryPoints: ['src/main.jsx'],
  bundle: true,
  outfile: 'dist/assets/index.js',
  format: 'esm',
  jsx: 'automatic',
  minify: true,
  sourcemap: false,
  define: { 'process.env.NODE_ENV': '"production"' },
  loader: { '.jsx': 'jsx', '.js': 'js', '.css': 'css' },
})

if (result.errors.length) {
  console.error('Build errors:', result.errors)
  process.exit(1)
}

writeFileSync('dist/index.html', `<!doctype html>
<html lang="ko">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>PetChain</title>
    <link rel="stylesheet" href="/assets/index.css" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/assets/index.js"></script>
  </body>
</html>`)

for (const f of ['favicon.svg', 'icons.svg', 'vite.svg']) {
  if (existsSync(`public/${f}`)) copyFileSync(`public/${f}`, `dist/${f}`)
}

const jsKB = Math.round(result.outputFiles?.[0]?.contents?.byteLength / 1024) || '?'
console.log(`✓ built → dist/  (JS ~${jsKB} KB)`)
