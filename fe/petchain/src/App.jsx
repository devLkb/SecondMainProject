import { useState } from 'react'
import { AppProvider } from './context/AppContext'
import Landing from './pages/Landing'
import AuthPage from './pages/AuthPage'
import GuardianDash from './pages/guardian/GuardianDash'
import HospitalDash from './pages/hospital/HospitalDash'
import InsuranceDash from './pages/insurance/InsuranceDash'
import Platform from './pages/platform/Platform'
import Toast from './components/common/Toast'
import './styles/global.css'

const ROLE_MAP = { USER: 'guardian', HOSPITAL: 'hospital', INSURANCE: 'insurance', PLATFORM: 'platform' }

function initFromUrl() {
  const params       = new URLSearchParams(window.location.search)
  const pathname     = window.location.pathname
  const accessToken  = params.get('accessToken')
  const refreshToken = params.get('refreshToken')
  const memberType   = params.get('memberType')
  const userId       = params.get('userId')
  const memberNumber = params.get('memberNumber')
  const oauthError   = params.get('oauth_error') || params.get('error')

  if (oauthError) {
    window.history.replaceState({}, '', pathname === '/admin' ? '/admin' : '/')
    return { page: pathname === '/admin' ? 'admin' : 'auth', role: null, toast: { title: 'OAuth 오류', msg: decodeURIComponent(oauthError) } }
  }

  if (accessToken) {
    localStorage.setItem('accessToken', accessToken)
    localStorage.setItem('refreshToken', refreshToken || '')
    localStorage.setItem('memberType', memberType || 'USER')
    localStorage.setItem('userId', userId || '')
    localStorage.setItem('memberNumber', memberNumber || '')
    window.history.replaceState({}, '', pathname === '/admin' ? '/admin' : '/')
    const role = ROLE_MAP[memberType?.toUpperCase()] || 'guardian'
    return { page: 'main', role, toast: null }
  }

  const token = localStorage.getItem('accessToken')
  const mt    = localStorage.getItem('memberType')
  const role  = (token && mt) ? (ROLE_MAP[mt.toUpperCase()] || null) : null

  if (pathname === '/admin') {
    if (role === 'platform' || role === 'insurance') {
      return { page: 'main', role, toast: null }
    }
    return { page: 'admin', role: null, toast: null }
  }

  // 루트 경로: 관리자·보험사 역할은 항상 랜딩 표시 (플랫폼 접근은 /admin 전용)
  const publicRole = (role && role !== 'platform' && role !== 'insurance') ? role : null
  return { page: publicRole ? 'main' : 'landing', role: publicRole, toast: null }
}

function AdminLogin({ onLogin }) {
  const [loginId, setLoginId] = useState('')
  const [loginPw, setLoginPw] = useState('')
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin() {
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ loginId, password: loginPw }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || '로그인에 실패했습니다.')
      localStorage.setItem('accessToken', data.accessToken)
      localStorage.setItem('refreshToken', data.refreshToken)
      localStorage.setItem('memberType', data.memberType)
      localStorage.setItem('userId', String(data.userId ?? ''))
      localStorage.setItem('memberNumber', data.memberNumber || '')
      const role = ROLE_MAP[data.memberType?.toUpperCase()] || 'platform'
      onLogin(role)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const inp = {
    width: '100%', padding: '12px 14px', borderRadius: 10,
    border: '1.5px solid #334155', background: '#0f172a', color: '#f1f5f9',
    fontSize: 14, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box',
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f172a' }}>
      <div style={{ background: '#1e293b', borderRadius: 16, padding: '44px 40px', width: '100%', maxWidth: 400, boxShadow: '0 24px 64px rgba(0,0,0,.6)' }}>
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#f1f5f9', marginBottom: 6, letterSpacing: '-.02em' }}>
            Pet<span style={{ color: '#818cf8' }}>Chain</span>
          </div>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#94a3b8' }}>관리자 · 보험사 로그인</div>
        </div>

        {error && (
          <div style={{ marginBottom: 18, padding: '10px 14px', borderRadius: 8, background: '#450a0a', color: '#fca5a5', fontSize: 13 }}>
            {error}
          </div>
        )}

        <div style={{ marginBottom: 14 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.05em' }}>Org ID</label>
          <input style={inp} placeholder="org-id" value={loginId}
            onChange={e => setLoginId(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleLogin()} />
        </div>

        <div style={{ marginBottom: 28 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.05em' }}>비밀번호</label>
          <input type="password" style={inp} placeholder="••••••••" value={loginPw}
            onChange={e => setLoginPw(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleLogin()} />
        </div>

        <button
          onClick={handleLogin}
          disabled={loading}
          style={{
            width: '100%', padding: 13, borderRadius: 10, border: 'none',
            background: loading ? '#334155' : '#4f46e5', color: '#fff',
            fontSize: 14, fontWeight: 700, cursor: loading ? 'default' : 'pointer',
            fontFamily: 'inherit', transition: 'background .2s',
          }}
        >
          {loading ? '처리 중...' : '로그인'}
        </button>

        <div style={{ textAlign: 'center', marginTop: 22 }}>
          <a href="/" style={{ fontSize: 13, color: '#475569', textDecoration: 'none' }}>← 메인으로 돌아가기</a>
        </div>
      </div>
    </div>
  )
}

function Inner() {
  const [{ page: initPage, role: initRole, toast: initToast }] = useState(initFromUrl)
  const [page, setPage]         = useState(initPage)
  const [authMode, setAuthMode] = useState('login')
  const [role, setRole]         = useState(initRole)
  const [toast, setToast]       = useState(initToast)

  const showToast = (title, msg) => setToast({ title, msg })

  const handleLogin = (selectedRole) => {
    setRole(selectedRole)
    setPage('main')
  }

  const handleLogout = () => {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('memberType')
    localStorage.removeItem('userId')
    localStorage.removeItem('memberNumber')
    setRole(null)
    if (window.location.pathname === '/admin') {
      setPage('admin')
    } else {
      setPage('landing')
    }
  }

  const goAuth = (mode = 'login') => {
    setAuthMode(mode)
    setPage('auth')
  }

  if (page === 'admin') {
    return (
      <>
        <AdminLogin onLogin={handleLogin} />
        {toast && <Toast title={toast.title} msg={toast.msg} onClose={() => setToast(null)} />}
      </>
    )
  }

  if (page === 'landing') {
    return (
      <>
        <Landing onGoAuth={goAuth} />
        {toast && <Toast title={toast.title} msg={toast.msg} onClose={() => setToast(null)} />}
      </>
    )
  }

  if (page === 'auth') {
    return (
      <>
        <AuthPage key={authMode} mode={authMode} onLogin={handleLogin} onBack={() => setPage('landing')} />
        {toast && <Toast title={toast.title} msg={toast.msg} onClose={() => setToast(null)} />}
      </>
    )
  }

  const dashProps = { showToast, onLogout: handleLogout }

  return (
    <>
      {role === 'guardian'  && <GuardianDash  {...dashProps} />}
      {role === 'hospital'  && <HospitalDash  {...dashProps} />}
      {role === 'insurance' && <InsuranceDash {...dashProps} />}
      {role === 'platform'  && <Platform      {...dashProps} />}
      {toast && <Toast title={toast.title} msg={toast.msg} onClose={() => setToast(null)} />}
    </>
  )
}

export default function App() {
  return (
    <AppProvider>
      <Inner />
    </AppProvider>
  )
}
