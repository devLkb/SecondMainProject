# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

```markdown
# PetChain — petchain frontend

Brief overview and local setup for the `fe/petchain` React + Vite frontend used in the PetChain project.

Contents
- Role-based demo dashboard for `guardian`, `hospital`, `insurance`, and `platform` roles.
- Mock flows: consent toggle, record submission, verification (point/credit simulation), and admin monitoring.

Getting started

1. Install dependencies:

	npm install

2. Run development server with HMR:

	npm run dev

3. Build for production:

	npm run build

4. Preview production build locally:

	npm run preview

Available scripts (package.json)
- `dev` — start Vite dev server
- `build` — create production bundle
- `preview` — locally serve the production build

Key files
- `src/App.jsx` — app entry, handles simple role-based routing between pages.
- `src/pages/Landing.jsx` — public landing / marketing page.
- `src/pages/AuthPage.jsx` — role selection and auth UI (guardian/hospital/insurance/platform).
- `src/pages/guardian/GuardianDash.jsx` — 보호자 대시보드: 반려동물·동의 관리, 청구 상태.
- `src/pages/hospital/HospitalDash.jsx` — 병원 대시보드: 진료기록 등록 및 on-chain 기록 시뮬레이션.
- `src/pages/insurance/InsuranceDash.jsx` — 보험사 대시: 검증 API(포인트 사용) 및 심사 플로우.
- `src/pages/platform/Platform.jsx` — 플랫폼(관리자) 콘솔: Org 승인, 포인트 발행, 표준 코드, 모니터링.

## 포트폴리오용 정적 배포 (GitHub Pages)

백엔드·DB·하이퍼레저 패브릭을 전부 띄우기엔 무거우므로, 면접용 링크는 **프론트엔드만** GitHub Pages 에 올린다.

- 워크플로: `.github/workflows/deploy-frontend.yml` (develop 브랜치의 `fe/petchain/**` 변경 시 자동 배포, 수동 실행도 가능)
- 최초 1회 설정: GitHub 저장소 → **Settings → Pages → Source 를 "GitHub Actions"** 로 변경
- 배포 주소: `https://<owner>.github.io/SecondMainProject/`

### 데모 모드

정적 호스팅에는 API 서버가 없으므로, `*.github.io` 에서 열리면 앱이 **데모 모드**로 동작한다.

- `src/demo/server.js` 가 `window.fetch` 를 감싸 `/api/**` 요청을 브라우저 안의 인메모리 목 서버로 처리한다.
  실제 백엔드 DTO 스키마를 그대로 흉내 내므로 화면 코드는 데모용 분기가 없다.
- 시드 데이터는 `src/demo/data.js` 에 있고, 새로고침하면 초기화된다.
- 우측 하단 **DEMO 역할 전환** 패널에서 보호자 / 동물병원 / 보험사 / 플랫폼 관리자 대시보드를 로그인 없이 오갈 수 있다.
- 로컬에서 데모 모드를 확인하려면 `?demo=1`, 반대로 끄려면 `?demo=0` 을 붙인다.
  (예: `http://localhost:5173/?demo=1`)

### 정적 호스팅 대응

- `build.mjs` 가 만드는 `index.html` 은 자원을 상대 경로(`./assets/...`)로 참조하므로 `/<repo>/` 하위 경로에서도 동작한다.
- Pages 에는 SPA 폴백이 없어 `404.html` 을 `index.html` 과 동일하게 생성한다. 덕분에 `/SecondMainProject/admin` 경로도 앱이 받는다.
- 관리자 화면은 `/admin` 경로 외에 `#admin` 해시로도 진입할 수 있다.

Notes
- This frontend is a demo UI; back-end/blockchain interactions are simulated in the app state.
- Ignore generated/.omc files — they are added to `.gitignore` to avoid committing workspace state.

If you want, I can:
- Add a short CONTRIBUTING section, or
- Create a `start-dev.sh` / `start-dev.ps1` helper for Windows users.

---
Generated on May 15, 2026.
```
