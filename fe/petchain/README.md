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

Notes
- This frontend is a demo UI; back-end/blockchain interactions are simulated in the app state.
- Ignore generated/.omc files — they are added to `.gitignore` to avoid committing workspace state.

If you want, I can:
- Add a short CONTRIBUTING section, or
- Create a `start-dev.sh` / `start-dev.ps1` helper for Windows users.

---
Generated on May 15, 2026.
```
