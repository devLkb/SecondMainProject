import { useState } from 'react'

export default function Landing({ onGoAuth }) {
  const [openFaq, setOpenFaq] = useState(null)

  const faqs = [
    ['보호자가 비용을 내야 하나요?', '아니요. 보호자는 완전 무료입니다. PetChain은 보험사와 병원에게만 이용료를 받는 B2B 인프라 서비스입니다.'],
    ['진료기록이 외부에 노출되지 않나요?', '진료기록 원문은 AES-256 암호화 후 별도 서버에 보관됩니다. 블록체인에는 해시값만 올라가며, 동의한 보험사만 접근 가능합니다.'],
    ['왜 하이퍼레저 패브릭을 사용하나요?', '허가된 참여자만 네트워크에 들어올 수 있고, 가스비가 없으며, 트랜잭션이 외부에 공개되지 않습니다. 민감한 의료 데이터를 다루는 B2B에 최적화된 구조입니다.'],
    ['동의는 언제든지 철회할 수 있나요?', '네. 보호자는 언제든지 동의를 철회할 수 있으며, 철회 즉시 보험사의 신규 접근이 차단됩니다. 단, 이미 다운로드한 자료는 회수되지 않습니다.'],
    ['지급 승인 여부도 PetChain이 결정하나요?', '아닙니다. PetChain은 위·변조 여부와 제출 적격성만 검증합니다. 최종 지급 판단은 보험사 내부 심사로 결정됩니다.'],
  ]

  const stats = [
    { n: '99', u: '%', l: '위·변조 탐지율', d: '해시 비교 자동화' },
    { n: '3',  u: '초', l: '평균 검증 시간', d: '기존 30분 → 즉시' },
    { n: '0',  u: '회', l: '병원 반복 서류', d: '한 번 등록으로 끝' },
    { n: '0',  u: '원', l: '보호자 이용 비용', d: '보호자는 완전 무료' },
  ]

  return (
    <div style={{ background: '#fff' }}>
      {/* GNB */}
      <nav className="gnb">
        <div className="gnb-logo" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>🐾 Pet<span>Chain</span></div>
        <div className="gnb-links">
          <a>서비스 소개</a>
          <a>병원 파트너</a>
          <a>보험사 파트너</a>
          <a>기술 문서</a>
        </div>
        <div style={{ display: 'flex', gap: 8, marginLeft: 'auto' }}>
          <button className="btn btn-ghost" onClick={() => onGoAuth('login')}>로그인</button>
          <button className="btn btn-primary btn-lg" style={{ padding: '9px 20px', fontSize: 13 }} onClick={() => onGoAuth('signup')}>시작하기 →</button>
        </div>
      </nav>

      {/* Hero */}
      <div style={{
        padding: '100px 60px 90px',
        background: 'linear-gradient(135deg, #eef2ff 0%, #f5f3ff 40%, #fdf4ff 70%, #fff7ed 100%)',
        textAlign: 'center', position: 'relative', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', top: '-120px', left: '50%', transform: 'translateX(-50%)',
          width: 600, height: 600, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(99,102,241,.1) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          fontSize: 12, fontWeight: 700, color: 'var(--brand)',
          background: 'var(--brand-l)', padding: '5px 16px', borderRadius: 20, marginBottom: 24,
        }}>
          🔗 Hyperledger Fabric 기반 진료기록 검증 인프라
        </div>
        <h1 style={{ fontSize: 54, fontWeight: 800, lineHeight: 1.1, letterSpacing: '-.04em', marginBottom: 20, position: 'relative' }}>
          반려동물 보험 청구,<br />
          <span style={{ color: 'var(--brand)' }}>더 빠르고 안전하게</span>
        </h1>
        <p style={{ fontSize: 17, color: '#52525b', lineHeight: 1.9, marginBottom: 40, maxWidth: 520, margin: '0 auto 40px' }}>
          병원이 기록을 올리면, 보호자가 동의하고, 보험사가 즉시 검증합니다.<br />
          위·변조와 중복 청구를 자동으로 차단합니다.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <button className="btn btn-primary btn-lg" onClick={() => onGoAuth('signup')}>무료로 시작하기 →</button>
          <button className="btn btn-ghost btn-lg">서비스 소개 보기</button>
        </div>

        {/* 핵심 지표 미니 배지 */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 14, marginTop: 52, flexWrap: 'wrap' }}>
          {[
            { icon: '🏥', text: '병원 · 진료기록 등록' },
            { icon: '🐾', text: '보호자 · 동의 토글 ON' },
            { icon: '🛡️', text: '보험사 · 해시 검증 API' },
            { icon: '✅', text: '즉시 심사 결과' },
          ].map((b, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: '#fff', border: '1px solid var(--border)',
              borderRadius: 30, padding: '8px 18px', fontSize: 13, fontWeight: 600,
              boxShadow: '0 2px 8px rgba(0,0,0,.06)', color: 'var(--text-2)',
            }}>
              <span>{b.icon}</span>{b.text}
            </div>
          ))}
        </div>
      </div>

      {/* 참여자 */}
      <div className="sec">
        <div className="sec-inner">
          <div className="sec-ey">Who it&apos;s for</div>
          <div className="sec-h2">모두를 위한 인프라</div>
          <div className="sec-lead">병원, 보험사, 보호자가 함께 이득을 얻는 구조입니다.</div>
          <div className="g3">
            {[
              { icon: '🐾', title: '보호자', color: 'var(--brand)', border: 'var(--brand-l)', desc: '동의 토글 하나로 진료기록을 보험사에 제출합니다. 언제든지 철회 가능하며, 청구 진행 상태를 실시간으로 확인할 수 있습니다.' },
              { icon: '🏥', title: '동물병원', color: 'var(--orange)', border: 'var(--orange-l)', desc: '표준 코드로 한 번만 등록하면 끝. 보험사마다 양식을 따로 발급할 필요가 없어 반복 업무가 사라집니다.' },
              { icon: '🛡️', title: '보험사', color: '#0369a1', border: '#e0f2fe', desc: '위·변조는 해시 비교로, 중복 청구는 체인코드로 자동 탐지됩니다. 검증 인력을 줄이고 사기 청구를 차단하세요.' },
            ].map((c, i) => (
              <div key={i} style={{ background: '#fff', border: `1px solid ${c.border}`, borderTop: `3px solid ${c.color}`, borderRadius: 16, padding: '30px 26px', transition: 'box-shadow .2s', cursor: 'default' }}
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

      {/* How it works */}
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

      {/* Stats */}
      <div className="sec" style={{ background: 'var(--text)' }}>
        <div className="sec-inner">
          <div className="sec-ey">Impact</div>
          <div className="sec-h2" style={{ color: '#fff' }}>숫자로 보는 PetChain 효과</div>
          <div className="g4" style={{ marginTop: 44 }}>
            {stats.map((s, i) => (
              <div key={i} style={{ border: '1px solid #27272a', borderRadius: 12, padding: '24px 22px' }}>
                <div><span style={{ fontSize: 32, fontWeight: 800, color: 'var(--brand-l)' }}>{s.n}</span><span style={{ fontSize: 20, fontWeight: 800, color: 'var(--orange)' }}>{s.u}</span></div>
                <div style={{ fontSize: 13, color: '#fff', marginTop: 6 }}>{s.l}</div>
                <div style={{ fontSize: 12, color: '#52525b', marginTop: 3 }}>{s.d}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* FAQ */}
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

      {/* CTA */}
      <div style={{ background: 'linear-gradient(135deg,#1e1b4b,#312e81)', padding: '88px 60px', textAlign: 'center' }}>
        <div style={{ fontSize: 40, fontWeight: 800, color: '#fff', letterSpacing: '-.03em', marginBottom: 12 }}>지금 바로 시작하세요</div>
        <div style={{ fontSize: 16, color: 'rgba(255,255,255,.65)', marginBottom: 36 }}>병원, 보험사, 보호자 모두를 위한 블록체인 인프라</div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
          <button className="btn" style={{ padding: '13px 34px', fontSize: 15, fontWeight: 700, background: '#fff', color: 'var(--brand-d)', border: 'none', borderRadius: 10 }} onClick={() => onGoAuth('signup')}>무료로 시작하기</button>
          <button className="btn" style={{ padding: '13px 34px', fontSize: 15, background: 'transparent', color: '#fff', border: '2px solid rgba(255,255,255,.35)', borderRadius: 10 }} onClick={() => onGoAuth('login')}>로그인</button>
        </div>
      </div>

      {/* Footer */}
      <footer style={{ background: '#0a0a0a', padding: '52px 60px 28px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: 60, marginBottom: 40 }}>
          <div>
            <div style={{ fontSize: 17, fontWeight: 800, color: '#fff', marginBottom: 10 }}>🐾 Pet<span style={{ color: 'var(--brand-l)' }}>Chain</span></div>
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
