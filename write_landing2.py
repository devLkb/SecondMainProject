import os

JSX = r"""import { useState } from 'react'

const CHANNEL_1 = [
  { label: '한국수의사회',   role: 'Orderer',    c: '#a78bfa' },
  { label: '중소동물병원 A', role: '병원',        c: '#f59e0b' },
  { label: '중소동물병원 B', role: '병원',        c: '#f59e0b' },
  { label: '중소동물병원 C', role: '병원',        c: '#f59e0b' },
  { label: 'DB손해보험',     role: '보험사',      c: '#6ee7b7' },
  { label: '현대해상',       role: '보험사',      c: '#6ee7b7' },
]

const CHANNEL_2 = [
  { label: '대형동물병원',   role: '병원(독립)', c: '#fb923c' },
  { label: 'DB손해보험',     role: '보험사',     c: '#6ee7b7' },
  { label: '현대해상',       role: '보험사',     c: '#6ee7b7' },
]

const FAQS = [
  {
    q: '보호자가 동의를 철회하면 어떻게 됩니까?',
    a: '동의 상태가 REVOKED로 전환되는 즉시 보험사 API 호출이 차단됩니다. 이미 검증된 기록은 보험사 내부에 남아 있지만, 이후 추가 조회는 불가능합니다.',
  },
  {
    q: '진료기록이 위변조될 가능성은 없습니까?',
    a: '원장에 기록된 SHA-256 해시는 블록체인 특성상 소급 수정이 불가능합니다. 보험사 검증 시 제출 해시와 원장 해시를 비교하여 위변조 여부를 즉시 확인합니다.',
  },
  {
    q: '동물병원이 독립 조직을 신청하는 기준은 무엇입니까?',
    a: '수의사회 공동 정책이 아닌 독자적 채널 운영이 필요한 대형 동물병원에 한해 별도 비용으로 독립 패브릭 조직을 생성할 수 있습니다.',
  },
  {
    q: '보험사는 어떻게 참여합니까?',
    a: '보험사는 플랫폼과 계약 후 Fabric Org ID를 발급받아 수의사회 채널 및 대형병원 채널에 참여합니다. /admin 페이지에서 로그인합니다.',
  },
]

export default function Landing({ onGoAuth }) {
  const [openFaq, setOpenFaq] = useState(null)

  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans', 'Pretendard', sans-serif", color: '#1a1410', background: '#f5f0e8' }}>

      {/* ── HEADER ── */}
      <header style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 200,
        height: 60, display: 'flex', alignItems: 'center',
        padding: '0 40px', justifyContent: 'space-between',
        background: 'rgba(15,13,10,.85)', backdropFilter: 'blur(12px)',
      }}>
        <div style={{ fontWeight: 900, fontSize: 17, color: '#f5f0e8', letterSpacing: '-.01em' }}>
          PET<span style={{ color: '#c8813a' }}>CHAIN.</span>
        </div>
        <nav style={{ display: 'flex', gap: 32, alignItems: 'center' }}>
          {[['#about', 'ABOUT'], ['#channel', 'NETWORK'], ['#how', 'HOW IT WORKS']].map(([h, l]) => (
            <a key={h} href={h} style={{ fontSize: 12, fontWeight: 700, color: 'rgba(245,240,232,.55)', textDecoration: 'none', letterSpacing: '.1em' }}>{l}</a>
          ))}
          <button
            onClick={() => onGoAuth('login')}
            style={{ padding: '7px 18px', borderRadius: 6, background: 'transparent', color: '#f5f0e8', border: '1px solid rgba(245,240,232,.3)', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', letterSpacing: '.06em' }}
          >
            로그인
          </button>
        </nav>
      </header>

      {/* ── HERO ── */}
      <section style={{
        minHeight: '100vh', background: '#0f0d0a',
        display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
        padding: '0 40px 80px', position: 'relative', overflow: 'hidden',
      }}>
        {/* background texture */}
        <div style={{
          position: 'absolute', inset: 0, opacity: .12,
          background: 'radial-gradient(ellipse 80% 60% at 70% 30%, #c8813a 0%, transparent 70%), radial-gradient(ellipse 50% 50% at 20% 80%, #6b3f1c 0%, transparent 60%)',
          pointerEvents: 'none',
        }} />
        <div style={{ position: 'absolute', top: 80, right: 40, width: 380, height: 480, borderRadius: 20, overflow: 'hidden', opacity: .25 }}>
          <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #3d2010 0%, #7c4f2a 50%, #c8813a 100%)' }} />
        </div>

        <div style={{ position: 'relative', maxWidth: 1040, margin: '0 auto', width: '100%' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#c8813a', letterSpacing: '.18em', marginBottom: 28, textTransform: 'uppercase' }}>
            Hyperledger Fabric 기반 의료기록 플랫폼
          </div>
          <h1 style={{
            fontSize: 'clamp(52px, 8vw, 100px)', fontWeight: 900, color: '#f5f0e8',
            lineHeight: 1.0, letterSpacing: '-.03em', marginBottom: 32,
          }}>
            우리 반려동물의<br />
            의료기록,<br />
            <span style={{ color: '#c8813a' }}>블록체인이</span><br />
            지킵니다.
          </h1>
          <p style={{ fontSize: 17, color: 'rgba(245,240,232,.6)', maxWidth: 480, lineHeight: 1.8, marginBottom: 44 }}>
            수의사회·동물병원·보험사가 하나의 신뢰 네트워크로 연결됩니다. 변조 불가한 의료기록으로 보험 청구 분쟁을 없애고, 보호자의 데이터 주권을 돌려드립니다.
          </p>
          <div style={{ display: 'flex', gap: 14 }}>
            <button
              onClick={() => onGoAuth('signup')}
              style={{
                padding: '15px 36px', borderRadius: 8, background: '#c8813a', color: '#f5f0e8',
                fontWeight: 700, fontSize: 15, border: 'none', cursor: 'pointer',
                fontFamily: 'inherit', letterSpacing: '.02em',
              }}
            >
              보호자로 시작하기
            </button>
            <a
              href="#about"
              style={{
                padding: '15px 36px', borderRadius: 8, background: 'transparent', color: 'rgba(245,240,232,.7)',
                fontWeight: 700, fontSize: 15, border: '1px solid rgba(245,240,232,.25)',
                textDecoration: 'none', display: 'inline-flex', alignItems: 'center', letterSpacing: '.02em',
              }}
            >
              서비스 소개 ↓
            </a>
          </div>
        </div>

        {/* scroll indicator */}
        <div style={{ position: 'absolute', bottom: 32, left: '50%', transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, opacity: .4 }}>
          <div style={{ width: 1, height: 40, background: '#f5f0e8' }} />
          <div style={{ fontSize: 10, color: '#f5f0e8', letterSpacing: '.15em' }}>SCROLL</div>
        </div>
      </section>

      {/* ── WHAT'S PETCHAIN ── */}
      <section id="about" style={{ background: '#f5f0e8', padding: '100px 40px' }}>
        <div style={{ maxWidth: 1040, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80, alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#c8813a', letterSpacing: '.18em', textTransform: 'uppercase', marginBottom: 20 }}>WHAT'S PETCHAIN?</div>
            <h2 style={{ fontSize: 44, fontWeight: 900, lineHeight: 1.15, letterSpacing: '-.03em', marginBottom: 28, color: '#1a1410' }}>
              반려동물 의료<br />
              생태계의 문제를<br />
              구조적으로 해결
            </h2>
            <p style={{ fontSize: 16, color: '#6b5b4e', lineHeight: 1.85, marginBottom: 36 }}>
              허위 청구, 위변조 분쟁, 복잡한 서류 절차. 반려동물 의료 보험 시장이 커질수록 이 문제들도 커집니다. PetChain은 하이퍼레저 패브릭 블록체인 위에 수의사회·병원·보험사를 올려, 모든 기록이 검증 가능하고 투명한 시스템을 만듭니다.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {[['0건', '위변조 사례'], ['즉시', '동의 철회'], ['2개', '참여 보험사'], ['4곳', '참여 병원']].map(([n, l]) => (
                <div key={l} style={{ padding: '18px 20px', background: '#ede8de', borderRadius: 12 }}>
                  <div style={{ fontSize: 26, fontWeight: 900, color: '#c8813a', letterSpacing: '-.02em' }}>{n}</div>
                  <div style={{ fontSize: 13, color: '#6b5b4e', marginTop: 4 }}>{l}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {[
              { bg: 'linear-gradient(135deg, #2c1810 0%, #7c4f2a 100%)', h: 240, label: '보호자', sub: '데이터 주권' },
              { bg: 'linear-gradient(135deg, #1a2c1a 0%, #2d5a2d 100%)', h: 180, label: '병원', sub: '진료기록 등록' },
              { bg: 'linear-gradient(135deg, #1a1a2c 0%, #2d2d5a 100%)', h: 180, label: '보험사', sub: '해시 검증' },
              { bg: 'linear-gradient(135deg, #2c2010 0%, #6b4f20 100%)', h: 240, label: '수의사회', sub: '채널 주관' },
            ].map((b, i) => (
              <div key={i} style={{ background: b.bg, borderRadius: 14, height: b.h, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: '18px 20px' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'rgba(245,240,232,.9)' }}>{b.label}</div>
                <div style={{ fontSize: 12, color: 'rgba(245,240,232,.5)', marginTop: 2 }}>{b.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ROLE FEATURES ── */}
      <section style={{ background: '#ede8de', padding: '80px 40px', borderTop: '1px solid #d9d0c0' }}>
        <div style={{ maxWidth: 1040, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 24, marginBottom: 56 }}>
            <h2 style={{ fontSize: 40, fontWeight: 900, letterSpacing: '-.03em', color: '#1a1410' }}>역할별 해결책</h2>
            <div style={{ width: 60, height: 2, background: '#c8813a', flexShrink: 0 }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2 }}>
            {[
              {
                role: '보호자', color: '#4338ca', bg: '#f0eefc',
                items: [
                  ['진료 내역 확인 어려움',    '실시간 온체인 기록 조회'],
                  ['복잡한 보험 청구 절차',    '동의 토글 하나로 자동 청구'],
                  ['데이터 통제 불가',          '언제든 동의 철회 가능'],
                ],
              },
              {
                role: '동물병원', color: '#c8813a', bg: '#fdf4eb',
                items: [
                  ['보험사별 다른 서류',        '표준 코드 기반 원장 등록'],
                  ['위변조 분쟁',               'SHA-256 해시 무결성 증명'],
                  ['청구 지연·행정 부담',       '크레딧 자동 적립'],
                ],
              },
              {
                role: '보험사', color: '#16a34a', bg: '#f0fdf4',
                items: [
                  ['허위·중복 청구 탐지 어려움', 'API 해시 검증·중복 탐지'],
                  ['서류 심사 인력 소모',        '포인트 기반 자동 검증'],
                  ['데이터 신뢰성 의심',          '원장 원본 대조'],
                ],
              },
            ].map((r, ri) => (
              <div key={ri} style={{ background: r.bg, padding: '36px 32px' }}>
                <div style={{ fontSize: 20, fontWeight: 900, color: r.color, marginBottom: 28, letterSpacing: '-.01em' }}>{r.role}</div>
                {r.items.map(([bad, good], i) => (
                  <div key={i} style={{ marginBottom: 20, paddingBottom: 20, borderBottom: i < 2 ? '1px solid rgba(0,0,0,.07)' : 'none' }}>
                    <div style={{ fontSize: 12, color: '#b45309', marginBottom: 6, display: 'flex', gap: 5 }}>
                      <span>✗</span><span>{bad}</span>
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#1a1410', display: 'flex', gap: 5 }}>
                      <span style={{ color: r.color }}>→</span><span>{good}</span>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── NETWORK / CHANNEL ── */}
      <section id="channel" style={{ background: '#0f0d0a', padding: '100px 40px' }}>
        <div style={{ maxWidth: 1040, margin: '0 auto' }}>
          <div style={{ marginBottom: 64 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#c8813a', letterSpacing: '.18em', textTransform: 'uppercase', marginBottom: 20 }}>NETWORK TOPOLOGY</div>
            <h2 style={{ fontSize: 48, fontWeight: 900, color: '#f5f0e8', lineHeight: 1.1, letterSpacing: '-.03em', maxWidth: 560 }}>
              수의사회 중심<br />채널 구조
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {[
              { name: '수의사회 채널', tag: '공동', tagColor: '#6ee7b7', tagBg: '#052e16', desc: '한국수의사회 주관. 중소 동물병원 3곳과 보험사 2곳이 참여합니다.', members: CHANNEL_1 },
              { name: '대형병원 독립 채널', tag: '유료 독립', tagColor: '#fb923c', tagBg: '#431407', desc: '독립 조직을 선택한 대형 동물병원 전용. 보험사 2곳이 함께 참여합니다.', members: CHANNEL_2 },
            ].map(ch => (
              <div key={ch.name} style={{ background: '#1a1714', borderRadius: 16, padding: 28, border: '1px solid #2a2420' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                  <span style={{ fontSize: 15, fontWeight: 800, color: '#f5f0e8', flex: 1 }}>{ch.name}</span>
                  <span style={{ fontSize: 10, fontWeight: 700, color: ch.tagColor, background: ch.tagBg, padding: '3px 10px', borderRadius: 20, border: '1px solid ' + ch.tagColor + '44', letterSpacing: '.06em' }}>{ch.tag}</span>
                </div>
                <p style={{ fontSize: 13, color: 'rgba(245,240,232,.4)', marginBottom: 18, lineHeight: 1.7 }}>{ch.desc}</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {ch.members.map((m, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 13px', background: '#0f0d0a', borderRadius: 9 }}>
                      <div style={{ width: 7, height: 7, borderRadius: '50%', background: m.c, flexShrink: 0 }} />
                      <span style={{ fontSize: 13, color: 'rgba(245,240,232,.8)', flex: 1 }}>{m.label}</span>
                      <span style={{ fontSize: 11, color: m.c, fontWeight: 600 }}>{m.role}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how" style={{ background: '#f5f0e8', padding: '100px 40px' }}>
        <div style={{ maxWidth: 1040, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 24, marginBottom: 64 }}>
            <h2 style={{ fontSize: 40, fontWeight: 900, letterSpacing: '-.03em', color: '#1a1410' }}>이용 방법</h2>
            <div style={{ flex: 1, height: 1, background: '#d9d0c0' }} />
          </div>

          {[
            { n: '01', title: '진료 후 원장 기록', body: '동물병원이 표준 질병 코드(KC)와 진료 행위 코드(VA)로 기록을 입력합니다. SHA-256 해시가 생성되어 하이퍼레저 패브릭 원장에 즉시 기록됩니다.', tag: 'POST /records' },
            { n: '02', title: '보호자 동의 관리', body: '반려동물 보호자가 진료기록별로 보험사 공유 동의를 ON/OFF합니다. 동의를 철회하는 즉시 보험사 API 호출이 차단됩니다.', tag: 'CONSENT ACTIVE / REVOKED' },
            { n: '03', title: '보험사 해시 검증', body: '보험사가 검증 API를 호출하면 제출 해시와 원장 해시를 비교합니다. 위변조 여부가 밀리초 단위로 반환됩니다. 호출 1건당 포인트 1개 차감.', tag: 'PASSED / FAILED' },
          ].map((step, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 40, paddingBottom: 48, marginBottom: 48, borderBottom: i < 2 ? '1px solid #d9d0c0' : 'none' }}>
              <div style={{ fontSize: 64, fontWeight: 900, color: '#ede8de', letterSpacing: '-.04em', lineHeight: 1 }}>{step.n}</div>
              <div>
                <h3 style={{ fontSize: 24, fontWeight: 800, color: '#1a1410', marginBottom: 12, letterSpacing: '-.02em' }}>{step.title}</h3>
                <p style={{ fontSize: 15, color: '#6b5b4e', lineHeight: 1.8, marginBottom: 14 }}>{step.body}</p>
                <code style={{ fontSize: 12, color: '#c8813a', background: '#f5ece0', padding: '5px 12px', borderRadius: 6, fontFamily: 'JetBrains Mono, monospace' }}>{step.tag}</code>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FAQ ── */}
      <section style={{ background: '#ede8de', padding: '80px 40px', borderTop: '1px solid #d9d0c0' }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          <h2 style={{ fontSize: 36, fontWeight: 900, letterSpacing: '-.03em', marginBottom: 48, color: '#1a1410' }}>FAQ</h2>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {FAQS.map((faq, i) => (
              <div key={i} style={{ borderTop: '1px solid #c8b89a' }}>
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  style={{
                    width: '100%', padding: '22px 0', background: 'none', border: 'none',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                    textAlign: 'left', color: '#1a1410', gap: 20,
                  }}
                >
                  <span>{faq.q}</span>
                  <span style={{ color: '#c8813a', fontSize: 22, transform: openFaq === i ? 'rotate(45deg)' : 'none', transition: 'transform .2s', flexShrink: 0 }}>+</span>
                </button>
                {openFaq === i && (
                  <div style={{ paddingBottom: 22, fontSize: 14, color: '#6b5b4e', lineHeight: 1.8 }}>{faq.a}</div>
                )}
              </div>
            ))}
            <div style={{ borderTop: '1px solid #c8b89a' }} />
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ background: '#1a1410', padding: '100px 40px' }}>
        <div style={{ maxWidth: 1040, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80, alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: 52, fontWeight: 900, color: '#f5f0e8', lineHeight: 1.1, letterSpacing: '-.03em', marginBottom: 24 }}>
              반려동물을<br />위한 선택,<br /><span style={{ color: '#c8813a' }}>지금 시작</span>
            </h2>
            <p style={{ fontSize: 16, color: 'rgba(245,240,232,.55)', lineHeight: 1.75 }}>
              보호자는 무료로 가입하고, 동물병원·보험사 담당자는 관리자 페이지로 문의하세요.
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <button
              onClick={() => onGoAuth('signup')}
              style={{
                padding: '18px 36px', borderRadius: 10, background: '#c8813a', color: '#f5f0e8',
                fontWeight: 700, fontSize: 16, border: 'none', cursor: 'pointer',
                fontFamily: 'inherit', letterSpacing: '.02em', textAlign: 'center',
              }}
            >
              보호자 무료 가입
            </button>
            <button
              onClick={() => onGoAuth('login')}
              style={{
                padding: '18px 36px', borderRadius: 10, background: 'transparent', color: 'rgba(245,240,232,.7)',
                fontWeight: 700, fontSize: 16, border: '1px solid rgba(245,240,232,.2)', cursor: 'pointer',
                fontFamily: 'inherit', letterSpacing: '.02em', textAlign: 'center',
              }}
            >
              병원 · 보호자 로그인
            </button>
            <a
              href="/admin"
              style={{
                padding: '18px 36px', borderRadius: 10, background: 'transparent', color: 'rgba(245,240,232,.4)',
                fontWeight: 600, fontSize: 14, border: '1px solid rgba(245,240,232,.1)', cursor: 'pointer',
                fontFamily: 'inherit', letterSpacing: '.02em', textAlign: 'center', textDecoration: 'none', display: 'block',
              }}
            >
              관리자 · 보험사 로그인 →
            </a>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ background: '#0f0d0a', padding: '60px 40px 40px', borderTop: '1px solid #1a1714' }}>
        <div style={{ maxWidth: 1040, margin: '0 auto' }}>
          <div style={{ fontSize: 'clamp(40px, 6vw, 80px)', fontWeight: 900, color: 'rgba(245,240,232,.08)', letterSpacing: '-.02em', marginBottom: 40, lineHeight: 1 }}>
            PETCHAIN.
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderTop: '1px solid #1a1714', paddingTop: 24 }}>
            <div>
              <div style={{ fontWeight: 800, fontSize: 15, color: '#f5f0e8', marginBottom: 6 }}>
                PET<span style={{ color: '#c8813a' }}>CHAIN.</span>
              </div>
              <div style={{ fontSize: 12, color: 'rgba(245,240,232,.3)', lineHeight: 1.7 }}>
                반려동물 의료기록 블록체인 플랫폼<br />
                Hyperledger Fabric 기반
              </div>
            </div>
            <div style={{ fontSize: 12, color: 'rgba(245,240,232,.2)' }}>© 2024 PetChain Inc.</div>
          </div>
        </div>
      </footer>
    </div>
  )
}
"""

path = r"C:\Users\ST-USER\Desktop\개발자 양성 교육\블록체인프로젝트(하이퍼)\pointpro\fe\petchain\src\pages\Landing.jsx"
with open(path, 'w', encoding='utf-8') as f:
    f.write(JSX)
import os
print(f"OK: {os.path.getsize(path)} bytes")
