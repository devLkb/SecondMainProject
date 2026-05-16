import { useState } from 'react'

const REGIONS = [
  '서울특별시', '부산광역시', '대구광역시', '인천광역시', '광주광역시',
  '대전광역시', '울산광역시', '세종특별자치시',
  '경기도', '강원도', '충청북도', '충청남도',
  '전라북도', '전라남도', '경상북도', '경상남도', '제주특별자치도',
]

export default function AuthPage({ mode, onLogin, onBack }) {
  const [role, setRole] = useState('guardian')
  const [tab, setTab]   = useState(mode === 'signup' ? 'signup' : 'login')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // 로그인 폼
  const [loginId, setLoginId] = useState('')
  const [loginPw, setLoginPw] = useState('')

  // 보호자 가입
  const [gName, setGName]           = useState('')
  const [gPhone, setGPhone]         = useState('')
  const [gEmail, setGEmail]         = useState('')
  const [gPw, setGPw]               = useState('')
  const [gPwConfirm, setGPwConfirm] = useState('')

  // 병원 가입
  const [hName, setHName]   = useState('')
  const [hBiz, setHBiz]     = useState('')
  const [hPhone, setHPhone] = useState('')
  const [hOrg, setHOrg]     = useState('')
  const [hEmail, setHEmail] = useState('')
  const [hPw, setHPw]       = useState('')

  // 보험사 가입
  const [iName, setIName]   = useState('')
  const [iBiz, setIBiz]     = useState('')
  const [iOrg, setIOrg]     = useState('')
  const [iEmail, setIEmail] = useState('')
  const [iPw, setIPw]       = useState('')

  // 플랫폼 로그인
  const [platId, setPlatId] = useState('')
  const [platPw, setPlatPw] = useState('')

  const roles = [
    { id: 'guardian',  icon: '🐾', name: '보호자',  desc: '반려동물 보험 청구' },
    { id: 'hospital',  icon: '🏥', name: '병원',    desc: '진료기록 관리' },
    { id: 'insurance', icon: '🛡️', name: '보험사',  desc: '검증 API 호출' },
    { id: 'platform',  icon: '⚙️', name: '플랫폼',  desc: '관리자 콘솔' },
  ]

  const btnClass = {
    guardian:  'btn-primary',
    hospital:  'btn-orange',
    insurance: 'btn-success',
    platform:  'btn-dark',
  }

  const desc = {
    guardian:  '반려동물 보험 청구를 위한 계정',
    hospital:  '동물병원 진료기록 등록 계정',
    insurance: '검증 API 호출 및 심사 계정',
  }

  async function api(path, body) {
    const res = await fetch(`/api${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.message || '요청에 실패했습니다.')
    return data
  }

  const ROLE_MAP = { USER: 'guardian', HOSPITAL: 'hospital', INSURANCE: 'insurance', PLATFORM: 'platform' }

  function isNetworkError(e) {
    return e.message.includes('Failed to fetch') || e.message.includes('fetch') || e.message.includes('502') || e.message.includes('503') || e.message.includes('NetworkError')
  }

  async function handleLogin() {
    setError('')
    setLoading(true)
    try {
      const data = await api('/auth/login', { loginId, password: loginPw })
      localStorage.setItem('accessToken', data.accessToken)
      localStorage.setItem('refreshToken', data.refreshToken)
      localStorage.setItem('memberType', data.memberType)
      localStorage.setItem('userId', String(data.userId ?? ''))
      localStorage.setItem('memberNumber', data.memberNumber || '')
      // memberType 케이스 무관하게 매핑, 실패 시 UI 선택 role로 폴백
      onLogin(ROLE_MAP[data.memberType?.toUpperCase()] || role)
    } catch (e) {
      if (isNetworkError(e)) {
        // 백엔드 미실행 → UI 선택 role로 mock 로그인
        onLogin(role)
      } else {
        setError(e.message)
      }
    } finally {
      setLoading(false)
    }
  }

  async function handlePlatformLogin() {
    setError('')
    setLoading(true)
    try {
      const data = await api('/auth/login', { loginId: platId, password: platPw })
      localStorage.setItem('accessToken', data.accessToken)
      localStorage.setItem('refreshToken', data.refreshToken)
      localStorage.setItem('memberType', data.memberType)
      localStorage.setItem('userId', String(data.userId ?? ''))
      localStorage.setItem('memberNumber', data.memberNumber || '')
      onLogin('platform')
    } catch (e) {
      if (isNetworkError(e)) {
        onLogin('platform')
      } else {
        setError(e.message)
      }
    } finally {
      setLoading(false)
    }
  }

  async function handleGuardianSignup() {
    setError('')
    if (gPw !== gPwConfirm) { setError('비밀번호가 일치하지 않습니다.'); return }
    setLoading(true)
    try {
      const data = await api('/auth/register/user', {
        name: gName, phone: gPhone, email: gEmail, password: gPw,
      })
      localStorage.setItem('accessToken', data.accessToken)
      localStorage.setItem('refreshToken', data.refreshToken)
      localStorage.setItem('memberType', data.memberType)
      localStorage.setItem('userId', String(data.userId))
      localStorage.setItem('memberNumber', data.memberNumber || '')
      onLogin('guardian')
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleHospitalSignup() {
    setError('')
    setLoading(true)
    try {
      await api('/auth/register/hospital', {
        name: hName, businessNumber: hBiz, phone: hPhone,
        fabricOrgId: hOrg, adminEmail: hEmail, password: hPw,
      })
      setError('등록 신청이 완료되었습니다. 관리자 승인 후 로그인할 수 있습니다.')
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleInsuranceSignup() {
    setError('')
    setLoading(true)
    try {
      await api('/auth/register/insurance', {
        name: iName, businessNumber: iBiz, fabricOrgId: iOrg,
        adminEmail: iEmail, password: iPw,
      })
      setError('등록 신청이 완료되었습니다. 관리자 승인 후 로그인할 수 있습니다.')
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-wrap">
      {/* Left panel */}
      <div className="auth-left">
        <div
          style={{ fontSize: 18, fontWeight: 800, color: '#fff', cursor: 'pointer', marginBottom: 48 }}
          onClick={onBack}
        >
          🐾 Pet<span style={{ color: '#a5b4fc' }}>Chain</span>
        </div>
        <div style={{ fontSize: 26, fontWeight: 800, color: '#fff', marginBottom: 6 }}>
          {mode === 'signup' ? '회원가입' : '로그인'}
        </div>
        <div style={{ fontSize: 14, color: '#57534e', marginBottom: 28 }}>역할을 선택하세요</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 9, flex: 1 }}>
          {roles.map(r => (
            <div
              key={r.id}
              className={`role-pill ${role === r.id ? 'sel' : ''}`}
              onClick={() => { setRole(r.id); setError('') }}
            >
              <div style={{ fontSize: 20, width: 28, textAlign: 'center' }}>{r.icon}</div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>{r.name}</div>
                <div style={{ fontSize: 12, color: '#57534e', marginTop: 2 }}>{r.desc}</div>
              </div>
            </div>
          ))}
        </div>
        <div style={{ fontSize: 12, color: '#292524', marginTop: 32 }}>© 2024 PetChain Inc.</div>
      </div>

      {/* Right panel */}
      <div className="auth-right">
        <button
          className="btn btn-ghost btn-sm"
          style={{ position: 'absolute', top: 22, right: 26 }}
          onClick={onBack}
        >
          ← 홈으로
        </button>

        <div style={{ width: '100%', maxWidth: 400 }}>
          {error && (
            <div style={{
              marginBottom: 14, padding: '10px 13px', borderRadius: 8,
              background: error.startsWith('등록 신청') ? '#f0fdf4' : '#fee2e2',
              color: error.startsWith('등록 신청') ? '#166534' : '#dc2626',
              fontSize: 13,
            }}>
              {error}
            </div>
          )}

          {role === 'platform' ? (
            <>
              <div style={{ fontSize: 26, fontWeight: 800, marginBottom: 4 }}>플랫폼 관리자</div>
              <div style={{ fontSize: 14, color: 'var(--muted)', marginBottom: 28 }}>PetChain 운영자 전용 계정</div>
              <label className="fl">관리자 ID</label>
              <input className="fi" placeholder="platform-admin" value={platId} onChange={e => setPlatId(e.target.value)} />
              <label className="fl">비밀번호</label>
              <input className="fi" type="password" placeholder="••••••••" value={platPw} onChange={e => setPlatPw(e.target.value)} />
              <button
                className="btn btn-dark"
                style={{ width: '100%', justifyContent: 'center', padding: 13 }}
                onClick={handlePlatformLogin}
                disabled={loading}
              >
                {loading ? '처리 중...' : '로그인'}
              </button>
            </>
          ) : (
            <>
              <div style={{ fontSize: 26, fontWeight: 800, marginBottom: 4 }}>
                {roles.find(r => r.id === role)?.name}
              </div>
              <div style={{ fontSize: 14, color: 'var(--muted)', marginBottom: 24 }}>{desc[role]}</div>

              {/* Tabs */}
              <div style={{ display: 'flex', borderBottom: '2px solid var(--border)', marginBottom: 24 }}>
                {['login', 'signup'].map(t => (
                  <button
                    key={t}
                    onClick={() => { setTab(t); setError('') }}
                    style={{
                      padding: '9px 20px', background: 'none', border: 'none',
                      borderBottom: `2px solid ${tab === t ? 'var(--brand)' : 'transparent'}`,
                      marginBottom: -2, fontSize: 14, fontWeight: 600, cursor: 'pointer',
                      color: tab === t ? 'var(--brand)' : 'var(--muted)', fontFamily: 'inherit',
                    }}
                  >
                    {t === 'login' ? '로그인' : { guardian: '회원가입', hospital: '병원 등록', insurance: '보험사 등록' }[role]}
                  </button>
                ))}
              </div>

              {tab === 'login' && (
                <>
                  <label className="fl">{role === 'guardian' ? '이메일' : '기관 Org ID'}</label>
                  <input className="fi" placeholder={role === 'guardian' ? 'hong@email.com' : 'org-id'} value={loginId} onChange={e => setLoginId(e.target.value)} />
                  <label className="fl">비밀번호</label>
                  <input className="fi" type="password" placeholder="••••••••" value={loginPw} onChange={e => setLoginPw(e.target.value)} />
                  <button
                    className={`btn ${btnClass[role]}`}
                    style={{ width: '100%', justifyContent: 'center', padding: 13 }}
                    onClick={handleLogin}
                    disabled={loading}
                  >
                    {loading ? '처리 중...' : '로그인'}
                  </button>
                </>
              )}

              {tab === 'signup' && role === 'guardian' && (
                <>
                  <div className="fi-row">
                    <div>
                      <label className="fl">이름</label>
                      <input className="fi" placeholder="홍길동" value={gName} onChange={e => setGName(e.target.value)} />
                    </div>
                    <div>
                      <label className="fl">전화번호</label>
                      <input className="fi" placeholder="010-0000-0000" value={gPhone} onChange={e => setGPhone(e.target.value)} />
                    </div>
                  </div>
                  <label className="fl">이메일</label>
                  <input className="fi" type="email" placeholder="hong@email.com" value={gEmail} onChange={e => setGEmail(e.target.value)} />
                  <div className="fi-row">
                    <div>
                      <label className="fl">비밀번호</label>
                      <input className="fi" type="password" placeholder="8자 이상" value={gPw} onChange={e => setGPw(e.target.value)} />
                    </div>
                    <div>
                      <label className="fl">비밀번호 확인</label>
                      <input className="fi" type="password" placeholder="재입력" value={gPwConfirm} onChange={e => setGPwConfirm(e.target.value)} />
                    </div>
                  </div>
                  <label className="fl">거주 지역</label>
                  <select className="fi" defaultValue="경기도">
                    {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                  <div className="fi-note">📌 개인정보는 AES-256 암호화 저장됩니다.</div>
                  <button
                    className={`btn ${btnClass[role]}`}
                    style={{ width: '100%', justifyContent: 'center', padding: 13 }}
                    onClick={handleGuardianSignup}
                    disabled={loading}
                  >
                    {loading ? '처리 중...' : '보호자로 가입하기'}
                  </button>
                </>
              )}

              {tab === 'signup' && role === 'hospital' && (
                <>
                  <div className="fi-row">
                    <div>
                      <label className="fl">병원명</label>
                      <input className="fi" placeholder="행복동물병원" value={hName} onChange={e => setHName(e.target.value)} />
                    </div>
                    <div>
                      <label className="fl">사업자등록번호</label>
                      <input className="fi" placeholder="000-00-00000" value={hBiz} onChange={e => setHBiz(e.target.value)} />
                    </div>
                  </div>
                  <div className="fi-row">
                    <div>
                      <label className="fl">대표 전화</label>
                      <input className="fi" placeholder="02-0000-0000" value={hPhone} onChange={e => setHPhone(e.target.value)} />
                    </div>
                    <div>
                      <label className="fl">Fabric Org ID</label>
                      <input className="fi" placeholder="HospitalA" value={hOrg} onChange={e => setHOrg(e.target.value)} />
                    </div>
                  </div>
                  <label className="fl">관리자 이메일</label>
                  <input className="fi" type="email" placeholder="admin@hospital.com" value={hEmail} onChange={e => setHEmail(e.target.value)} />
                  <label className="fl">비밀번호</label>
                  <input className="fi" type="password" placeholder="8자 이상" value={hPw} onChange={e => setHPw(e.target.value)} />
                  <div className="a-notice">📋 등록 신청 후 플랫폼 관리자 승인이 필요합니다.</div>
                  <button
                    className={`btn ${btnClass[role]}`}
                    style={{ width: '100%', justifyContent: 'center', padding: 13 }}
                    onClick={handleHospitalSignup}
                    disabled={loading}
                  >
                    {loading ? '처리 중...' : '병원 등록 신청'}
                  </button>
                </>
              )}

              {tab === 'signup' && role === 'insurance' && (
                <>
                  <div className="fi-row">
                    <div>
                      <label className="fl">보험사명</label>
                      <input className="fi" placeholder="DB손해보험" value={iName} onChange={e => setIName(e.target.value)} />
                    </div>
                    <div>
                      <label className="fl">사업자등록번호</label>
                      <input className="fi" placeholder="000-00-00000" value={iBiz} onChange={e => setIBiz(e.target.value)} />
                    </div>
                  </div>
                  <label className="fl">Fabric Org ID</label>
                  <input className="fi" placeholder="InsuranceA" value={iOrg} onChange={e => setIOrg(e.target.value)} />
                  <label className="fl">관리자 이메일</label>
                  <input className="fi" type="email" placeholder="admin@insurance.com" value={iEmail} onChange={e => setIEmail(e.target.value)} />
                  <label className="fl">비밀번호</label>
                  <input className="fi" type="password" placeholder="8자 이상" value={iPw} onChange={e => setIPw(e.target.value)} />
                  <div className="a-notice">📋 등록 신청 후 플랫폼 관리자 승인이 필요합니다.</div>
                  <button
                    className={`btn ${btnClass[role]}`}
                    style={{ width: '100%', justifyContent: 'center', padding: 13 }}
                    onClick={handleInsuranceSignup}
                    disabled={loading}
                  >
                    {loading ? '처리 중...' : '보험사 등록 신청'}
                  </button>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
