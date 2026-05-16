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

  const roles = [
    { id: 'guardian',  icon: '🐾', name: '보호자',    desc: '반려동물 보험 청구' },
    { id: 'hospital',  icon: '🏥', name: '병원',      desc: '진료기록 관리' },
    { id: 'insurance', icon: '🛡️', name: '보험사',    desc: '검증 API 호출' },
    { id: 'platform',  icon: '⚙️', name: '플랫폼',    desc: '관리자 콘솔' },
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
              onClick={() => setRole(r.id)}
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
          {role === 'platform' ? (
            <>
              <div style={{ fontSize: 26, fontWeight: 800, marginBottom: 4 }}>플랫폼 관리자</div>
              <div style={{ fontSize: 14, color: 'var(--muted)', marginBottom: 28 }}>PetChain 운영자 전용 계정</div>
              <label className="fl">관리자 ID</label>
              <input className="fi" placeholder="platform-admin" />
              <label className="fl">비밀번호</label>
              <input className="fi" type="password" placeholder="••••••••" />
              <button
                className={`btn btn-dark`}
                style={{ width: '100%', justifyContent: 'center', padding: 13 }}
                onClick={() => onLogin('platform')}
              >
                로그인
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
                    onClick={() => setTab(t)}
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
                  <input className="fi" placeholder={role === 'guardian' ? 'hong@email.com' : 'org-id'} />
                  <label className="fl">비밀번호</label>
                  <input className="fi" type="password" placeholder="••••••••" />
                  <button
                    className={`btn ${btnClass[role]}`}
                    style={{ width: '100%', justifyContent: 'center', padding: 13 }}
                    onClick={() => onLogin(role)}
                  >
                    로그인
                  </button>
                </>
              )}

              {tab === 'signup' && role === 'guardian' && (
                <>
                  <div className="fi-row">
                    <div><label className="fl">이름</label><input className="fi" placeholder="홍길동" /></div>
                    <div><label className="fl">전화번호</label><input className="fi" placeholder="010-0000-0000" /></div>
                  </div>
                  <label className="fl">이메일</label>
                  <input className="fi" type="email" placeholder="hong@email.com" />
                  <div className="fi-row">
                    <div><label className="fl">비밀번호</label><input className="fi" type="password" placeholder="8자 이상" /></div>
                    <div><label className="fl">비밀번호 확인</label><input className="fi" type="password" placeholder="재입력" /></div>
                  </div>
                  <label className="fl">거주 지역</label>
                  <select className="fi" defaultValue="경기도">
                    {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                  <div className="fi-note">📌 개인정보는 AES-256 암호화 저장됩니다.</div>
                  <button className={`btn ${btnClass[role]}`} style={{ width: '100%', justifyContent: 'center', padding: 13 }} onClick={() => onLogin(role)}>
                    보호자로 가입하기
                  </button>
                </>
              )}

              {tab === 'signup' && role === 'hospital' && (
                <>
                  <div className="fi-row">
                    <div><label className="fl">병원명</label><input className="fi" placeholder="행복동물병원" /></div>
                    <div><label className="fl">사업자등록번호</label><input className="fi" placeholder="000-00-00000" /></div>
                  </div>
                  <div className="fi-row">
                    <div><label className="fl">대표 전화</label><input className="fi" placeholder="02-0000-0000" /></div>
                    <div><label className="fl">Fabric Org ID</label><input className="fi" placeholder="HospitalA" /></div>
                  </div>
                  <label className="fl">관리자 이메일</label>
                  <input className="fi" type="email" placeholder="admin@hospital.com" />
                  <div className="a-notice">📋 등록 신청 후 플랫폼 관리자 승인이 필요합니다.</div>
                  <button className={`btn ${btnClass[role]}`} style={{ width: '100%', justifyContent: 'center', padding: 13 }} onClick={() => onLogin(role)}>
                    병원 등록 신청
                  </button>
                </>
              )}

              {tab === 'signup' && role === 'insurance' && (
                <>
                  <div className="fi-row">
                    <div><label className="fl">보험사명</label><input className="fi" placeholder="DB손해보험" /></div>
                    <div><label className="fl">사업자등록번호</label><input className="fi" placeholder="000-00-00000" /></div>
                  </div>
                  <label className="fl">Fabric Org ID</label>
                  <input className="fi" placeholder="InsuranceA" />
                  <label className="fl">관리자 이메일</label>
                  <input className="fi" type="email" placeholder="admin@insurance.com" />
                  <div className="a-notice">📋 등록 신청 후 플랫폼 관리자 승인이 필요합니다.</div>
                  <button className={`btn ${btnClass[role]}`} style={{ width: '100%', justifyContent: 'center', padding: 13 }} onClick={() => onLogin(role)}>
                    보험사 등록 신청
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
