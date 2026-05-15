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

function Inner() {
  const [page, setPage]   = useState('landing') // 'landing' | 'auth' | 'main'
  const [authMode, setAuthMode] = useState('login')
  const [role, setRole]   = useState(null)
  const [toast, setToast] = useState(null)

  const showToast = (title, msg) => setToast({ title, msg })

  const handleLogin = (selectedRole) => {
    setRole(selectedRole)
    setPage('main')
  }

  const handleLogout = () => {
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
