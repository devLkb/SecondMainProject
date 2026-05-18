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
  const accessToken  = params.get('accessToken')
  const refreshToken = params.get('refreshToken')
  const memberType   = params.get('memberType')
  const userId       = params.get('userId')
  const memberNumber = params.get('memberNumber')
  const oauthError   = params.get('oauth_error') || params.get('error')

  if (oauthError) {
    window.history.replaceState({}, '', '/')
    return { page: 'auth', role: null, toast: { title: 'OAuth 오류', msg: decodeURIComponent(oauthError) } }
  }

  if (accessToken) {
    localStorage.setItem('accessToken', accessToken)
    localStorage.setItem('refreshToken', refreshToken || '')
    localStorage.setItem('memberType', memberType || 'USER')
    localStorage.setItem('userId', userId || '')
    localStorage.setItem('memberNumber', memberNumber || '')
    window.history.replaceState({}, '', '/')
    const role = ROLE_MAP[memberType?.toUpperCase()] || 'guardian'
    return { page: 'main', role, toast: null }
  }

  const token = localStorage.getItem('accessToken')
  const mt    = localStorage.getItem('memberType')
  const role  = (token && mt) ? (ROLE_MAP[mt.toUpperCase()] || null) : null
  return { page: role ? 'main' : 'landing', role, toast: null }
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
    setPage('landing')
  }

  const goAuth = (mode = 'login') => {
    setAuthMode(mode)
    setPage('auth')
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

  // main — role-based dashboard
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
