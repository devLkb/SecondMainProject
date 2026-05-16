import { useState } from 'react'

const GNB_H = 64
const TR = 'all 0.5s cubic-bezier(0.4,0,0.2,1)'

const CLIPS = {
  left: {
    '': 'polygon(0 0, 50% 0, 50% 100%, 0 100%)',
    hl: 'polygon(0 0, 38% 0, 62% 100%, 0 100%)',
    hr: 'polygon(0 0, 62% 0, 38% 100%, 0 100%)',
  },
  right: {
    '': 'polygon(50% 0, 100% 0, 100% 100%, 50% 100%)',
    hl: 'polygon(38% 0, 100% 0, 100% 100%, 62% 100%)',
    hr: 'polygon(62% 0, 100% 0, 100% 100%, 38% 100%)',
  },
}

const LOGO_X = {
  '': 'translate(-50%, -50%)',
  hl: 'translate(calc(-50% - 24px), -50%)',
  hr: 'translate(calc(-50% + 24px), -50%)',
}

export default function Landing({ onGoAuth }) {
  const [hover,   setHover]   = useState('')
  const [openFaq, setOpenFaq] = useState(null)

  const handleMouseMove = (e) => {
    const next = e.clientX < window.innerWidth / 2 ? 'hl' : 'hr'
    if (next !== hover) setHover(next)
  }

  const stats = [
    { n: '99', u: '%', l: '위·변조 탐지율',   d: '해시 비교 자동화' },
    { n: '3',  u: '초', l: '평균 검증 시간',  d: '기존 30분 → 즉시' },
    { n: '0',  u: '회', l: '병원 반복 서류',  d: '한 번 등록으로 끝' },
    { n: '0',  u: '원', l: '보호자 이용 비용', d: '보호자는 완전 무료' },
  ]

  const faqs = [
    ['보호자가 비용을 내야 하나요?', '아니요. 보호자는 완전 무료입니다. PetChain은 보험사와 병원에게만 이용료를 받는 B2B 인프라 서비스입니다.'],
    ['진료기록이 외부에 노출되지 않나요?', '진료기록 원문은 AES-256 암호화 후 별도 서버에 보관됩니다. 블록체인에는 해시값만 올라가며, 동의한 보험사만 접근 가능합니다.'],
    ['왜 하이퍼레저 패브릭을 사용하나요?', '허가된 참여자만 네트워크에 들어올 수 있고, 가스비가 없으며, 트랜잭션이 외부에 공개되지 않습니다. 민감한 의료 데이터를 다루는 B2B에 최적화된 구조입니다.'],
    ['동의는 언제든지 철회할 수 있나요?', '네. 보호자는 언제든지 동의를 철회할 수 있으며, 철회 즉시 보험사의 신규 접근이 차단됩니다.'],
    ['지급 승인 여부도 PetChain이 결정하나요?', '아닙니다. PetChain은 위·변조 여부와 제출 적격성만 검증합니다. 최종 지급 판단은 보험사 내부 심사로 결정됩니다.'],
  ]

  return (
    <div style={{ background: '#fff' }}>

      {/* ── GNB ── */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 100,
        height: GNB_H, background: '#fff',
        borderBottom: '1px solid #e5e7eb',
        display: 'flex', alignItems: 'center',
        padding: '0 48px', gap: 0,
        boxShadow: '0 1px 8px rgba(99,102,241,0.07)',
      }}>
        <div style={{ fontSize: 17, fontWeight: 800, color: '#1e1b4b', cursor: 'pointer', marginRight: 40, whiteSpace: 'nowrap' }}>
          🐾 Pet<span style={{ color: '#6366f1' }}>Chain</span>
        </div>
        <div style={{ display: 'flex', gap: 28, flex: 1 }}>
          {['서비스 소개', '참여자', '기술 문서', 'FAQ'].map(l => (
            <span key={l} style={{ fontSize: 14, fontWeight: 500, color: '#52525b', cursor: 'pointer', transition: 'color .15s' }}
              onMouseEnter={e => e.currentTarget.style.color = '#4338ca'}
              onMouseLeave={e => e.currentTarget.style.color = '#52525b'}
            >{l}</span>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={() => onGoAuth('login')}
            style={{ padding: '8px 18px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', border: '1.5px solid #d1d5db', background: 'transparent', color: '#374151', fontFamily: 'inherit', transition: 'border-color .15s, color .15s' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#6366f1'; e.currentTarget.style.color = '#4338ca' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#d1d5db'; e.currentTarget.style.color = '#374151' }}
          >로그인</button>
          <button
            onClick={() => onGoAuth('signup')}
            style={{ padding: '8px 18px', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer', border: 'none', background: 'linear-gradient(135deg, #4338ca, #6366f1)', color: '#fff', fontFamily: 'inherit', boxShadow: '0 2px 8px rgba(99,102,241,0.35)', transition: 'opacity .15s' }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.88'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
          >시작하기 →</button>
        </div>
      </nav>

      {/* ── HERO ── */}
      <div
        style={{ position: 'relative', width: '100vw', height: `calc(100vh - ${GNB_H}px)`, overflow: 'hidden' }}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHover('')}
      >
        {/* 왼쪽 배경 */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(145deg, #c7d2fe, #a5b4fc)',
          clipPath: CLIPS.left[hover],
          transition: TR,
        }} />

        {/* 오른쪽 배경 */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(145deg, #a5b4fc, #818cf8)',
          clipPath: CLIPS.right[hover],
          transition: TR,
        }} />

        {/* 콘텐츠 그리드 */}
        <div style={{ position: 'absolute', inset: 0, display: 'grid', gridTemplateColumns: '1fr 1fr', zIndex: 10 }}>

          {/* 왼쪽 — 커뮤니티 */}
          <div style={{
            display: 'flex', flexDirection: 'column', justifyContent: 'center',
            alignItems: 'flex-start', padding: '0 64px',
            opacity: hover === 'hr' ? 0.22 : 1,
            transition: 'opacity 0.4s ease',
          }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, letterSpacing: '.08em', background: 'rgba(255,255,255,.45)', color: '#3730a3', padding: '5px 14px', borderRadius: 20, marginBottom: 22 }}>
              🐾 커뮤니티 · 지역 랭킹
            </div>
            <h2 style={{ fontSize: 44, fontWeight: 900, color: '#1e1b4b', lineHeight: 1.15, letterSpacing: '-.03em', marginBottom: 16, fontFamily: 'inherit' }}>
              대한민국<br />귀여움 지도를<br />완성해보세요
            </h2>
            <p style={{ fontSize: 14, color: '#3730a3', lineHeight: 1.85, marginBottom: 32, maxWidth: 280, fontFamily: 'inherit' }}>
              우리 동네 반려동물 이야기를 나누고<br />전국 지역 귀여움 랭킹을 확인하세요.
            </p>
            <button
              onClick={() => onGoAuth('signup')}
              style={{ padding: '12px 26px', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer', border: 'none', fontFamily: 'inherit', background: '#4338ca', color: '#fff', boxShadow: '0 4px 18px rgba(67,56,202,0.30)', transition: 'transform 0.2s', width: 'fit-content' }}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
            >커뮤니티 가기 →</button>
          </div>

          {/* 오른쪽 — 보험 청구 */}
          <div style={{
            display: 'flex', flexDirection: 'column', justifyContent: 'center',
            alignItems: 'flex-end', padding: '0 64px', textAlign: 'right',
            opacity: hover === 'hl' ? 0.22 : 1,
            transition: 'opacity 0.4s ease',
          }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, letterSpacing: '.06em', background: 'rgba(255,255,255,.45)', color: '#3730a3', padding: '5px 14px', borderRadius: 20, marginBottom: 22 }}>
              🔗 Hyperledger Fabric 기반 진료기록 검증 인프라
            </div>
            <h2 style={{ fontSize: 44, fontWeight: 900, color: '#1e1b4b', lineHeight: 1.15, letterSpacing: '-.03em', marginBottom: 16, fontFamily: 'inherit' }}>
              반려동물 보험 청구,<br />더 빠르고<br />안전하게
            </h2>
            <p style={{ fontSize: 14, color: '#3730a3', lineHeight: 1.85, marginBottom: 32, maxWidth: 280, fontFamily: 'inherit' }}>
              병원이 기록을 올리면, 보호자가 동의하고,<br />보험사가 즉시 검증합니다.<br />위·변조와 중복 청구를 자동으로 차단합니다.
            </p>
            <div style={{ display: 'flex', gap: 10, flexDirection: 'row-reverse' }}>
              <button
                onClick={() => onGoAuth('signup')}
                style={{ padding: '12px 26px', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer', border: 'none', fontFamily: 'inherit', background: '#4338ca', color: '#fff', boxShadow: '0 4px 18px rgba(67,56,202,0.30)', transition: 'transform 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
              >무료로 시작하기 →</button>
              <button
                onClick={() => {}}
                style={{ padding: '12px 22px', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer', border: '1.5px solid rgba(67,56,202,.35)', background: 'rgba(255,255,255,.3)', color: '#3730a3', fontFamily: 'inherit', transition: 'background 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,.5)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,.3)'}
              >서비스 소개 보기</button>
            </div>
            {/* 기능 배지 */}
            <div style={{ display: 'flex', gap: 8, marginTop: 24, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
              {['🏥 병원 · 진료기록 등록', '🐾 보호자 · 동의 토글 ON', '🔍 보험사 · 해시 검증 API', '⚡ 즉시 심사 결과'].map(t => (
                <span key={t} style={{ fontSize: 11, fontWeight: 600, background: 'rgba(255,255,255,.45)', color: '#3730a3', padding: '4px 10px', borderRadius: 20, whiteSpace: 'nowrap' }}>{t}</span>
              ))}
            </div>
          </div>
        </div>

        {/* 중앙 로고 */}
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: LOGO_X[hover],
          zIndex: 20, textAlign: 'center', pointerEvents: 'none',
          transition: TR,
        }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, margin: '0 auto 10px', boxShadow: '0 8px 32px rgba(67,56,202,.25)' }}>🐾</div>
          <div style={{ fontSize: 13, fontWeight: 800, color: '#1e1b4b', letterSpacing: '.05em' }}>PetChain</div>
        </div>

        {/* 힌트 */}
        <div style={{
          position: 'absolute', bottom: 28, left: '50%', transform: 'translateX(-50%)',
          fontSize: 12, fontWeight: 600, color: 'rgba(55,48,163,.5)', letterSpacing: '.06em',
          zIndex: 20, pointerEvents: 'none', whiteSpace: 'nowrap',
          opacity: hover ? 0 : 1,
          transition: 'opacity 0.3s',
        }}>
          ← 마우스를 움직여보세요 →
        </div>
      </div>

      {/* ── 참여자 섹션 ── */}
      <div className="sec">
        <div className="sec-inner">
          <div className="sec-ey">Who it&apos;s for</div>
          <div className="sec-h2">모두를 위한 인프라</div>
          <div className="sec-lead">병원, 보험사, 보호자가 함께 이득을 얻는 구조입니다.</div>
          <div className="g3">
            {[
              { icon: '🐾', title: '보호자',   color: 'var(--brand)', border: 'var(--brand-l)', desc: '동의 토글 하나로 진료기록을 보험사에 제출합니다. 언제든지 철회 가능하며, 청구 진행 상태를 실시간으로 확인할 수 있습니다.' },
              { icon: '🏥', title: '동물병원', color: 'var(--orange)', border: 'var(--orange-l)', desc: '표준 코드로 한 번만 등록하면 끝. 보험사마다 양식을 따로 발급할 필요가 없어 반복 업무가 사라집니다.' },
              { icon: '🛡️', title: '보험사',   color: '#0369a1', border: '#e0f2fe', desc: '위·변조는 해시 비교로, 중복 청구는 체인코드로 자동 탐지됩니다. 검증 인력을 줄이고 사기 청구를 차단하세요.' },
            ].map((c, i) => (
              <div key={i} style={{ background: '#fff', border: `1px solid ${c.border}`, borderTop: `3px solid ${c.color}`, borderRadius: 16, padding: '30px 26px', transition: 'box-shadow .2s' }}
                onMouseEnter={e => e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,.07)'}
                onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}>
                <div style={{ fontSize: 36, marginBottom: 14 }}>{c.icon}</div>
                <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 10, color: c.color }}>{c.title}</div>
                <div style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.8 }}>{c.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── How it works ── */}
      <div className="sec" style={{ background: '#f8f7ff' }}>
        <div className="sec-inner">
          <div className="sec-ey">How it works</div>
          <div className="sec-h2">세 단계로 끝나는 보험 청구</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 40px 1fr 40px 1fr', alignItems: 'center', marginTop: 44 }}>
            {[
              { num: 'STEP 01', icon: '🏥', title: '병원이 기록을 올립니다', desc: '표준 코드로 진료기록을 등록하면 SHA-256 해시가 생성되고 블록체인 원장에 기록됩니다.' },
              null,
              { num: 'STEP 02', icon: '🐾', title: '보호자가 동의합니다', desc: '동의 관리 화면에서 토글을 ON하면 진료기록이 보험사에 즉시 전달됩니다. 언제든 철회 가능합니다.' },
              null,
              { num: 'STEP 03', icon: '🛡️', title: '보험사가 즉시 검증합니다', desc: 'API 호출 한 번으로 위·변조 탐지와 중복 청구 확인이 자동으로 완료됩니다.' },
            ].map((s, i) =>
              s === null
                ? <div key={i} style={{ textAlign: 'center', fontSize: 24, color: '#d4d4d8' }}>→</div>
                : (
                  <div key={i} style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 16, padding: '30px 22px', textAlign: 'center' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--brand)', letterSpacing: '.1em', marginBottom: 14 }}>{s.num}</div>
                    <div style={{ fontSize: 36, marginBottom: 14 }}>{s.icon}</div>
                    <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>{s.title}</div>
                    <div style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.7 }}>{s.desc}</div>
                  </div>
                )
            )}
          </div>
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="sec" style={{ background: 'var(--text)' }}>
        <div className="sec-inner">
          <div className="sec-ey">Impact</div>
          <div className="sec-h2" style={{ color: '#fff' }}>숫자로 보는 PetChain 효과</div>
          <div className="g4" style={{ marginTop: 44 }}>
            {stats.map((s, i) => (
              <div key={i} style={{ border: '1px solid #27272a', borderRadius: 12, padding: '24px 22px' }}>
                <div><span style={{ fontSize: 32, fontWeight: 800, color: '#a5b4fc' }}>{s.n}</span><span style={{ fontSize: 20, fontWeight: 800, color: '#7dd3fc' }}>{s.u}</span></div>
                <div style={{ fontSize: 13, color: '#fff', marginTop: 6 }}>{s.l}</div>
                <div style={{ fontSize: 12, color: '#52525b', marginTop: 3 }}>{s.d}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── FAQ ── */}
      <div className="sec">
        <div className="sec-inner">
          <div className="sec-ey">FAQ</div>
          <div className="sec-h2">자주 묻는 질문</div>
          <div style={{ maxWidth: 700, marginTop: 32 }}>
            {faqs.map(([q, a], i) => (
              <div key={i} className="faq-item">
                <div className="faq-q" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                  <span>{q}</span>
                  <span style={{ fontSize: 18, color: '#a1a1aa', transition: 'transform .2s', transform: openFaq === i ? 'rotate(180deg)' : 'none', display: 'inline-block' }}>﹀</span>
                </div>
                {openFaq === i && <div className="faq-a fade-in">{a}</div>}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── CTA ── */}
      <div style={{ background: 'linear-gradient(135deg, #1e1b4b, #312e81)', padding: '88px 60px', textAlign: 'center' }}>
        <div style={{ fontSize: 40, fontWeight: 800, color: '#fff', letterSpacing: '-.03em', marginBottom: 12 }}>지금 바로 시작하세요</div>
        <div style={{ fontSize: 16, color: 'rgba(255,255,255,.65)', marginBottom: 36 }}>병원, 보험사, 보호자 모두를 위한 블록체인 인프라</div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
          <button className="btn" style={{ padding: '13px 34px', fontSize: 15, fontWeight: 700, background: '#fff', color: '#3730a3', border: 'none', borderRadius: 10 }} onClick={() => onGoAuth('signup')}>무료로 시작하기</button>
          <button className="btn" style={{ padding: '13px 34px', fontSize: 15, background: 'transparent', color: '#fff', border: '2px solid rgba(255,255,255,.35)', borderRadius: 10 }} onClick={() => onGoAuth('login')}>로그인</button>
        </div>
      </div>

      {/* ── Footer ── */}
      <footer style={{ background: '#0a0a0a', padding: '52px 60px 28px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: 60, marginBottom: 40 }}>
          <div>
            <div style={{ fontSize: 17, fontWeight: 800, color: '#fff', marginBottom: 10 }}>🐾 Pet<span style={{ color: '#a5b4fc' }}>Chain</span></div>
            <div style={{ fontSize: 13, color: '#52525b', lineHeight: 1.9 }}>블록체인 기반 반려동물<br />진료기록 검증 인프라</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 32 }}>
            {[['서비스', ['보호자', '병원 파트너', '보험사 파트너']], ['회사', ['서비스 소개', '기술 문서', '문의하기']], ['법적 고지', ['이용약관', '개인정보처리방침']]].map(([title, links]) => (
              <div key={title}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#fff', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 14 }}>{title}</div>
                {links.map(l => <a key={l} style={{ display: 'block', fontSize: 13, color: '#52525b', marginBottom: 9, cursor: 'pointer' }}>{l}</a>)}
              </div>
            ))}
          </div>
        </div>
        <div style={{ borderTop: '1px solid #1c1c1e', paddingTop: 22, display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#3f3f46' }}>
          <span>© 2024 PetChain Inc. All rights reserved.</span>
          <span>hello@petchain.io</span>
        </div>
      </footer>
    </div>
  )
}
