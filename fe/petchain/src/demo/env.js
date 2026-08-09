/**
 * 데모(정적 배포) 모드 판별.
 *
 * 백엔드·DB·블록체인 없이 GitHub Pages 같은 정적 호스팅에 프론트만 올렸을 때,
 * 모든 /api 호출을 브라우저 안의 목 서버로 돌리기 위한 플래그다.
 *
 * 켜지는 조건
 *  - 호스트가 *.github.io (정적 배포)
 *  - 쿼리스트링 ?demo=1 (로컬에서 데모 화면을 확인할 때)
 * 끄는 조건
 *  - 쿼리스트링 ?demo=0
 */

const KEY = 'petchain_demo'

function readFlag() {
  try { return sessionStorage.getItem(KEY) } catch { return null }
}
function writeFlag(v) {
  try { v === null ? sessionStorage.removeItem(KEY) : sessionStorage.setItem(KEY, v) } catch { /* 무시 */ }
}

const param = new URLSearchParams(window.location.search).get('demo')
if (param === '1') writeFlag('1')
if (param === '0') writeFlag(null)

// App 이 history.pushState(..., window.location.pathname) 로 쿼리를 버리기 때문에
// 세션 스토리지에 남겨 새로고침·페이지 이동에도 데모 모드가 유지되게 한다.
export const IS_DEMO =
  param === '1' ||
  (param !== '0' && (readFlag() === '1' || /\.github\.io$/i.test(window.location.hostname)))

/** 관리자 화면 진입 여부. 정적 호스팅에서는 경로 라우팅이 없으므로 #admin 도 허용한다. */
export function isAdminRoute() {
  const path = window.location.pathname.replace(/\/+$/, '')
  return path.endsWith('/admin') || window.location.hash === '#admin'
}

/** 관리자 화면으로 이동 (정적 배포에서는 해시 라우팅). */
export function goAdmin() {
  if (IS_DEMO) {
    window.location.hash = 'admin'
    window.location.reload()
    return
  }
  window.location.href = '/admin'
}
