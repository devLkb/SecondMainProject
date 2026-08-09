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

// 자원 경로는 모두 상대 경로다. GitHub Pages 처럼 하위 경로(/<repo>/)로 서빙되는
// 정적 호스팅에서도 그대로 동작해야 하기 때문이다.
const html = `<!doctype html>
<html lang="ko">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="./favicon.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content="PetChain — 하이퍼레저 패브릭 기반 반려동물 진료기록·보험청구 플랫폼" />
    <title>PetChain</title>
    <link rel="stylesheet" href="./assets/index.css" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="./assets/index.js"></script>
  </body>
</html>`

writeFileSync('dist/index.html', html)
// GitHub Pages 는 SPA 폴백이 없다. 404.html 을 같은 문서로 두면 /admin 같은 경로도 앱이 받는다.
writeFileSync('dist/404.html', html)
// Jekyll 처리를 끄지 않으면 _ 로 시작하는 파일이 무시될 수 있다.
writeFileSync('dist/.nojekyll', '')

for (const f of ['favicon.svg', 'icons.svg', 'vite.svg', 'dogs.png']) {
  if (existsSync(`public/${f}`)) copyFileSync(`public/${f}`, `dist/${f}`)
}

const jsKB = Math.round(result.outputFiles?.[0]?.contents?.byteLength / 1024) || '?'
console.log(`✓ built → dist/  (JS ~${jsKB} KB)`)
