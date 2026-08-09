import { useState } from 'react'
import { ACCOUNTS } from './data'

/**
 * 데모 모드 전용 플로팅 패널.
 * 백엔드가 없는 정적 배포에서 4개 역할 대시보드를 바로 열어볼 수 있게 한다.
 */

const ROLES = [
  { key: 'guardian',  label: '보호자',  icon: '🐾' },
  { key: 'hospital',  label: '동물병원', icon: '🏥' },
  { key: 'insurance', label: '보험사',  icon: '🛡️' },
  { key: 'platform',  label: '플랫폼 관리자', icon: '⚙️' },
]

/** 홈 경로 — /admin 으로 들어온 경우 상위 경로로 되돌린다. */
function homeHref() {
  return window.location.pathname.replace(/\/admin\/?$/, '/')
}

/**
 * 경로가 같으면 해시만 바꾸고 새로고침, 다르면 통째로 이동한다.
 * (href 대입 직후 reload() 를 호출하면 이동이 취소되므로 분기가 필요하다.)
 */
function goTo(target) {
  const [path, hash = ''] = target.split('#')
  if (path === window.location.pathname) {
    window.location.hash = hash
    window.location.reload()
  } else {
    window.location.assign(target)
  }
}

function applyRole(roleKey) {
  const a = ACCOUNTS[roleKey]
  localStorage.setItem('accessToken', `demo.${a.role}.token`)
  localStorage.setItem('refreshToken', `demo.${a.role}.refresh`)
  localStorage.setItem('memberType', a.memberType)
  localStorage.setItem('userId', String(a.userId))
  localStorage.setItem('memberNumber', a.memberNumber)
  localStorage.setItem('memberName', a.name)
  if (roleKey === 'hospital') localStorage.setItem('hospitalName', a.orgName)
  // 관리자·보험사 화면은 /admin(#admin) 라우트에서만 뜬다.
  const needsAdmin = roleKey === 'platform' || roleKey === 'insurance'
  goTo(homeHref() + (needsAdmin ? '#admin' : ''))
}

function signOut() {
  ['accessToken', 'refreshToken', 'memberType', 'userId', 'memberNumber', 'memberName', 'hospitalName',
    'petchain_guardian_tab', 'petchain_hospital_tab', 'petchain_insurance_tab'].forEach(k => localStorage.removeItem(k))
  goTo(homeHref())
}

export default function DemoBar() {
  const [open, setOpen] = useState(false)
  const current = { USER: 'guardian', HOSPITAL: 'hospital', INSURANCE: 'insurance', PLATFORM: 'platform' }[
    (localStorage.getItem('memberType') || '').toUpperCase()
  ]

  const wrap = {
    position: 'fixed', right: 18, bottom: 18, zIndex: 9999,
    fontFamily: 'system-ui, -apple-system, "Segoe UI", sans-serif',
  }
  const panel = {
    width: 246, background: '#221428', color: '#f0ecff', borderRadius: 14,
    padding: 16, boxShadow: '0 18px 48px rgba(0,0,0,.45)', border: '1px solid #362040',
    marginBottom: 10,
  }
  const roleBtn = (active) => ({
    display: 'flex', alignItems: 'center', gap: 9, width: '100%',
    padding: '9px 11px', marginBottom: 6, borderRadius: 9, cursor: 'pointer',
    fontSize: 13, fontWeight: 600, fontFamily: 'inherit', textAlign: 'left',
    border: `1px solid ${active ? '#b8885a' : '#362040'}`,
    background: active ? 'rgba(184,136,90,.16)' : '#180c20',
    color: active ? '#e8c9a5' : '#d8cee6',
  })

  return (
    <div style={wrap}>
      {open && (
        <div style={panel}>
          <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.16em', color: '#b8885a', marginBottom: 6 }}>
            DEMO MODE
          </div>
          <div style={{ fontSize: 11.5, lineHeight: 1.6, color: '#c4a8bc', marginBottom: 13 }}>
            백엔드·블록체인 없이 프론트엔드만 배포한 포트폴리오용 화면입니다.
            모든 데이터는 브라우저 안의 목 서버에서 제공되며 새로고침하면 초기화됩니다.
          </div>
          {ROLES.map(r => (
            <button key={r.key} style={roleBtn(current === r.key)} onClick={() => applyRole(r.key)}>
              <span style={{ fontSize: 15 }}>{r.icon}</span>
              <span>{r.label}로 보기</span>
            </button>
          ))}
          <button
            style={{ ...roleBtn(false), marginBottom: 0, justifyContent: 'center', color: '#c4a8bc' }}
            onClick={signOut}
          >
            로그아웃 · 초기화
          </button>
        </div>
      )}

      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto',
          padding: '10px 16px', borderRadius: 999, border: '1px solid #362040',
          background: '#221428', color: '#f0ecff', fontSize: 12.5, fontWeight: 700,
          fontFamily: 'inherit', cursor: 'pointer', boxShadow: '0 10px 28px rgba(0,0,0,.35)',
        }}
      >
        <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#b8885a' }} />
        DEMO {open ? '닫기' : '역할 전환'}
      </button>
    </div>
  )
}
