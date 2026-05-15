import { useState } from 'react'
import DashNav from '../../components/common/DashNav'
import Overlay from '../../components/common/Overlay'
import { useApp } from '../../context/AppContext'

function ConsentCard({ c, onToggle }) {
  const isActive  = c.status === 'active'
  const isPending = c.status === 'pending'

  return (
    <div
      className="card"
      style={{
        borderLeft: `4px solid ${isActive ? 'var(--success)' : isPending ? 'var(--warning)' : 'var(--border-d)'}`,
        opacity: isPending ? .75 : 1,
        background: isActive ? 'var(--success-xl)' : c.status === 'revoked' ? '#fafaf9' : 'var(--surface)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {/* 왼쪽 정보 */}
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <span style={{ fontSize: 16, fontWeight: 800, color: 'var(--text)' }}>{c.pet}</span>
            <span style={{ color: 'var(--muted)' }}>·</span>
            <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-2)' }}>{c.disease}</span>
          </div>
          <div style={{ fontSize: 12, color: 'var(--muted)', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <span>🏥 {c.hospital}</span>
            <span className="mono">{c.recordId}</span>
            <span>💰 {c.cost.toLocaleString()}원</span>
            <span>🛡️ {c.insurerName}</span>
          </div>
        </div>

        {/* 오른쪽 토글 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginLeft: 20, flexShrink: 0 }}>
          <span style={{
            fontSize: 12, fontWeight: 700,
            color: isActive ? 'var(--success)' : isPending ? 'var(--warning)' : 'var(--muted)',
          }}>
            {isActive ? '동의 중' : isPending ? '대기 중' : '동의 안 함'}
          </span>
          <label className="toggle">
            <input
              type="checkbox"
              checked={isActive}
              disabled={isPending}
              onChange={() => onToggle(c.recordId)}
            />
            <span className="toggle-slider" />
          </label>
        </div>
      </div>

      {/* 상태 메시지 */}
      {isActive && (
        <div className="consent-active-banner" style={{ marginTop: 12 }}>
          ✅ <strong>{c.insurerName}</strong>에 서류 자동 전달 중 · 보험사 검증 가능 상태
        </div>
      )}
      {c.status === 'revoked' && (
        <div className="consent-revoked-banner" style={{ marginTop: 12 }}>
          ⛔ 동의 철회됨 — <strong>{c.insurerName}</strong> 신규 접근 차단 · 토글 ON으로 재동의 가능
        </div>
      )}
      {isPending && (
        <div className="alert alert-warning" style={{ marginTop: 12 }}>
          ⏳ 병원이 진료기록을 아직 등록하지 않았습니다. 등록 후 동의 가능합니다.
        </div>
      )}
    </div>
  )
}

export default function GuardianDash({ showToast, onLogout }) {
  const { state, toggleConsent } = useApp()
  const [tab, setTab]     = useState('home')
  const [modal, setModal] = useState(null)
  const [newPet, setNewPet] = useState({ name: '', species: 'dog' })

  const consents    = Object.values(state.consents)
  const activeCount = consents.filter(c => c.status === 'active').length
  const revokedCount = consents.filter(c => c.status === 'revoked').length

  const handleToggle = (recordId) => {
    const c    = state.consents[recordId]
    const next = c.status === 'active' ? 'revoked' : 'active'
    toggleConsent(recordId)
    showToast(
      next === 'active' ? '동의 완료' : '동의 철회',
      next === 'active'
        ? `${recordId} — 보험사에 서류 자동 전달 시작`
        : `${recordId} — 보험사 접근 차단됨`
    )
  }


  return (
    <>
      <DashNav role="guardian" tab={tab} setTab={setTab} onLogout={onLogout} />

      <div className="dash-wrap">

        {/* ── 내 반려동물 ── */}
        {tab === 'home' && (
          <div className="fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 28 }}>
              <div>
                <div className="pane-h">내 반려동물</div>
                <div className="pane-sub" style={{ marginBottom: 0 }}>등록된 반려동물과 보험 계약을 관리합니다</div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-ghost" onClick={() => setModal('ins')}>+ 보험 계약 등록</button>
                <button className="btn btn-primary" onClick={() => setModal('pet')}>+ 반려동물 추가</button>
              </div>
            </div>

            {/* 요약 stat */}
            <div className="g3" style={{ marginBottom: 28 }}>
              {[
                { n: consents.length, l: '총 진료기록', c: 'var(--brand)', bg: 'var(--brand-xl)' },
                { n: activeCount,     l: '동의 활성',   c: 'var(--success)', bg: 'var(--success-xl)' },
                { n: revokedCount,    l: '동의 철회',   c: 'var(--danger)',  bg: 'var(--danger-xl)' },
              ].map((s, i) => (
                <div key={i} className="stat-box" style={{ background: s.bg, border: `1px solid ${s.c}22` }}>
                  <div className="stat-n" style={{ color: s.c }}>{s.n}</div>
                  <div className="stat-l" style={{ color: s.c, opacity: .75 }}>{s.l}</div>
                </div>
              ))}
            </div>

            {/* 반려동물 카드 */}
            <div className="g3">
              {[{ name: '초코', species: '말티즈', age: '3세', insurer: 'DB손해보험', status: 'active' }].map((p, i) => (
                <div key={i} className="card" style={{ borderTop: '3px solid var(--brand)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
                    <div style={{
                      width: 52, height: 52, borderRadius: 14,
                      background: 'linear-gradient(135deg, var(--brand-xl), var(--brand-l))',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26
                    }}>🐶</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text)' }}>{p.name}</div>
                      <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 2 }}>{p.species} · {p.age}</div>
                    </div>
                    <span className="badge badge-success">보험 활성</span>
                  </div>
                  <div className="divider" />
                  <div className="row-flex">
                    <span style={{ fontSize: 13, color: 'var(--muted)', fontWeight: 600 }}>보험사</span>
                    <span style={{ fontWeight: 700, color: 'var(--text-2)' }}>{p.insurer}</span>
                  </div>
                  <div className="row-flex">
                    <span style={{ fontSize: 13, color: 'var(--muted)', fontWeight: 600 }}>동의 활성</span>
                    <span style={{ fontWeight: 700, color: 'var(--success)' }}>{activeCount}건</span>
                  </div>
                  <button
                    className="btn btn-ghost btn-sm"
                    style={{ width: '100%', marginTop: 16, justifyContent: 'center' }}
                    onClick={() => setTab('consent')}
                  >
                    동의 관리하기 →
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── 동의 관리 ── */}
        {tab === 'consent' && (
          <div className="fade-in">
            <div className="pane-h">동의 관리</div>
            <div className="pane-sub">토글을 ON하면 보험사에 서류가 자동으로 전달됩니다</div>

            <div className="alert alert-info" style={{ marginBottom: 28 }}>
              ℹ️ 동의 유효기간은 1년이며, 언제든지 철회 가능합니다. 철회 즉시 보험사의 신규 접근이 차단됩니다.
            </div>

            {/* ── 동의 완료 섹션 ── */}
            {consents.filter(c => c.status === 'active').length > 0 && (
              <div style={{ marginBottom: 28 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--success)' }} />
                  <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--success)', textTransform: 'uppercase', letterSpacing: '.06em' }}>
                    동의 완료 — {consents.filter(c => c.status === 'active').length}건 전송 중
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {consents.filter(c => c.status === 'active').map(c => (
                    <ConsentCard key={c.recordId} c={c} onToggle={handleToggle} />
                  ))}
                </div>
              </div>
            )}

            {/* ── 미동의 / 철회 섹션 ── */}
            {consents.filter(c => c.status !== 'active').length > 0 && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--muted-l)' }} />
                  <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.06em' }}>
                    미동의 / 철회 — {consents.filter(c => c.status !== 'active').length}건
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {consents.filter(c => c.status !== 'active').map(c => (
                    <ConsentCard key={c.recordId} c={c} onToggle={handleToggle} />
                  ))}
                </div>
              </div>
            )}

            {/* 전체 동의 없을 때 */}
            {consents.length === 0 && (
              <div className="card" style={{ textAlign: 'center', padding: 56, color: 'var(--muted)' }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>📋</div>
                <div style={{ fontWeight: 700 }}>등록된 진료기록이 없습니다</div>
              </div>
            )}
          </div>
        )}

        {/* ── 청구 상태 ── */}
        {tab === 'status' && (
          <div className="fade-in">
            <div className="pane-h">청구 상태</div>
            <div className="pane-sub">보험 청구 진행 현황 (보험사 심사 진행 수준만 표시)</div>

            {consents.filter(c => c.status === 'active').length === 0 ? (
              <div className="card" style={{ textAlign: 'center', padding: 64, color: 'var(--muted)' }}>
                <div style={{ fontSize: 40, marginBottom: 16 }}>🔒</div>
                <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 8, color: 'var(--text-2)' }}>활성 동의가 없습니다</div>
                <div style={{ fontSize: 14 }}>동의 관리 탭에서 토글을 ON 해주세요</div>
                <button className="btn btn-primary" style={{ marginTop: 20 }} onClick={() => setTab('consent')}>
                  동의 관리로 이동 →
                </button>
              </div>
            ) : (
              <div className="g2">
                {consents.filter(c => c.status === 'active').map(c => (
                  <div key={c.recordId} className="card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 22 }}>
                      <div>
                        <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--text)', marginBottom: 4 }}>{c.pet} · {c.disease}</div>
                        <div style={{ fontSize: 13, color: 'var(--muted)', display: 'flex', gap: 10 }}>
                          <span className="mono">{c.recordId}</span>
                          <span>· {c.cost.toLocaleString()}원</span>
                        </div>
                      </div>
                      <span className="badge badge-brand">보험사 접수됨</span>
                    </div>

                    {[
                      { lbl: '동의 완료',     sub: 'consent_status: ACTIVE', done: true },
                      { lbl: '해시 검증 완료', sub: 'detail_data_hash 일치',  done: true },
                      { lbl: '보험사 검토 중', sub: 'UNDER_REVIEW',           now:  true },
                      { lbl: '심사 결과',     sub: 'APPROVED / CLOSED',      wait: true },
                    ].map((r, i) => (
                      <div key={i} className="tl-row">
                        <div className="tl-dot" style={{
                          background: r.done ? 'var(--success)' : r.now ? 'var(--brand)' : 'var(--border-d)',
                          boxShadow: r.now ? '0 0 0 4px var(--brand-xl)' : 'none',
                        }} />
                        <div>
                          <div style={{
                            fontSize: 14, fontWeight: 700,
                            color: r.done ? 'var(--success)' : r.now ? 'var(--brand)' : 'var(--muted)'
                          }}>{r.lbl}</div>
                          <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>{r.sub}</div>
                        </div>
                        {r.done && <span className="badge badge-success" style={{ marginLeft: 'auto' }}>완료</span>}
                        {r.now  && <span className="badge badge-brand"   style={{ marginLeft: 'auto' }}>진행 중</span>}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 반려동물 등록 모달 */}
      {modal === 'pet' && (
        <Overlay title="반려동물 등록" sub="정보 입력 후 반려동물이 등록됩니다" onClose={() => setModal(null)}>
          <div className="fi-row">
            <div><label className="fl">이름</label><input className="fi" placeholder="초코" value={newPet.name} onChange={e => setNewPet(p => ({ ...p, name: e.target.value }))} /></div>
            <div><label className="fl">종류</label>
              <select className="fi" value={newPet.species} onChange={e => setNewPet(p => ({ ...p, species: e.target.value }))}>
                <option value="dog">강아지</option>
                <option value="cat">고양이</option>
                <option value="rabbit">토끼</option>
              </select>
            </div>
          </div>
          <div className="fi-row">
            <div><label className="fl">품종</label><input className="fi" placeholder="말티즈" /></div>
            <div><label className="fl">출생연도</label><input className="fi" type="number" placeholder="2021" /></div>
          </div>
          <label className="fl">마이크로칩 번호</label>
          <input className="fi" placeholder="15자리 숫자" />
          <div className="fi-note">📌 마이크로칩 번호는 SHA-256 해시 변환 후 온체인 기록됩니다.</div>
          <button
            className="btn btn-primary"
            style={{ width: '100%', padding: 13, fontSize: 14 }}
            onClick={() => { setModal(null); showToast('반려동물 등록', (newPet.name || '새 반려동물') + ' 등록 완료') }}
          >
            등록 완료
          </button>
        </Overlay>
      )}

      {/* 보험 계약 모달 */}
      {modal === 'ins' && (
        <Overlay title="보험 계약 등록" sub="가입된 펫보험 정보를 입력하세요" onClose={() => setModal(null)}>
          <label className="fl">보험사</label>
          <select className="fi"><option>DB손해보험</option><option>현대해상</option></select>
          <label className="fl">상품명</label>
          <input className="fi" placeholder="펫블리 반려동물보험" />
          <label className="fl">증권번호</label>
          <input className="fi" placeholder="2024-XXXXXXXX" />
          <div className="fi-row">
            <div><label className="fl">계약 시작일</label><input className="fi" type="date" /></div>
            <div><label className="fl">계약 종료일</label><input className="fi" type="date" /></div>
          </div>
          <div className="fi-note">📌 증권번호는 AES-256 암호화 저장됩니다.</div>
          <button
            className="btn btn-primary"
            style={{ width: '100%', padding: 13, fontSize: 14 }}
            onClick={() => { setModal(null); showToast('보험 등록', '보험 계약 등록 완료') }}
          >
            등록 완료
          </button>
        </Overlay>
      )}
    </>
  )
}
