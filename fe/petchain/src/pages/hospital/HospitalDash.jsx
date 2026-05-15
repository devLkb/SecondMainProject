import { useState } from 'react'
import DashNav from '../../components/common/DashNav'
import { useApp } from '../../context/AppContext'

export default function HospitalDash({ showToast, onLogout }) {
  const { state, setState } = useApp()
  const [tab, setTab] = useState('reg')

  const consents       = state.consents
  const activeConsents = Object.values(consents).filter(c => c.status === 'active')

  const handleRecord = (recordId) => {
    const c = consents[recordId]
    if (!c || c.status !== 'active') {
      showToast('제출 불가', '보호자 동의가 없습니다. 보호자에게 동의 요청하세요.')
      return
    }
    setState(s => ({
      ...s,
      creditN: s.creditN + 1,
      txLog: [
        { time: new Date().toLocaleTimeString(), type: '기록', org: 'hosp-001', desc: `${recordId} — SHA-256 원장 기록` },
        ...s.txLog,
      ],
    }))
    showToast('원장 기록', `${recordId} — on_chain_status: confirmed · 크레딧 +1`)
  }

  return (
    <>
      <DashNav role="hospital" tab={tab} setTab={setTab} onLogout={onLogout} />

      <div className="dash-wrap">

        {/* ── 진료기록 등록 ── */}
        {tab === 'reg' && (
          <div className="fade-in">
            <div className="pane-h">진료기록 등록</div>
            <div className="pane-sub">표준 코드로 등록 → SHA-256 해시 생성 → 원장 기록 (medical_records)</div>

            <div className={`alert ${activeConsents.length > 0 ? 'alert-success' : 'alert-warning'}`} style={{ marginBottom: 24 }}>
              {activeConsents.length > 0
                ? `✅ 보호자 동의 ${activeConsents.length}건 활성 — 동의된 기록은 즉시 제출 가능합니다`
                : '⚠️ 활성 동의가 없습니다. 보호자에게 동의를 요청하세요.'}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 24 }}>
              {/* 왼쪽: 폼 */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                <div className="card">
                  <div className="card-title">환자 정보</div>
                  <div className="fi-row">
                    <div><label className="fl">보호자명 / 반려동물</label><input className="fi" placeholder="홍길동 / 초코" /></div>
                    <div><label className="fl">진료일</label><input className="fi" type="date" defaultValue="2024-05-08" /></div>
                  </div>
                </div>

                <div className="card">
                  <div className="card-title">질병 코드 (복수 선택)</div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
                    {[['KC-001', '피부염', true], ['KC-042', '골절', false], ['KC-055', '관절염', false], ['KC-108', '슬개골 탈구', false]].map(([c, n, d]) => (
                      <label key={c} style={{
                        display: 'flex', alignItems: 'center', gap: 7, padding: '9px 14px',
                        border: '1.5px solid var(--border)', borderRadius: 9, cursor: 'pointer',
                        fontSize: 13, fontWeight: 600, transition: 'all .15s',
                        background: d ? 'var(--brand-xl)' : 'var(--surface)',
                        borderColor: d ? 'var(--brand-l)' : 'var(--border)',
                      }}>
                        <input type="checkbox" defaultChecked={d} style={{ accentColor: 'var(--brand)' }} />
                        <span className="mono" style={{ background: 'none', padding: 0 }}>{c}</span>
                        <span style={{ color: 'var(--text-2)' }}>{n}</span>
                      </label>
                    ))}
                  </div>

                  <div className="card-title">진료 행위 코드</div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 18 }}>
                    {[['VA-032', '약물 처방', true], ['VA-011', 'X-ray', false], ['VA-025', '수술', false]].map(([c, n, d]) => (
                      <label key={c} style={{
                        display: 'flex', alignItems: 'center', gap: 7, padding: '9px 14px',
                        border: '1.5px solid var(--border)', borderRadius: 9, cursor: 'pointer',
                        fontSize: 13, fontWeight: 600,
                        background: d ? 'var(--orange-xl)' : 'var(--surface)',
                        borderColor: d ? 'var(--orange-l)' : 'var(--border)',
                      }}>
                        <input type="checkbox" defaultChecked={d} style={{ accentColor: 'var(--orange)' }} />
                        <span className="mono" style={{ background: 'none', padding: 0 }}>{c}</span>
                        <span style={{ color: 'var(--text-2)' }}>{n}</span>
                      </label>
                    ))}
                  </div>

                  <div className="fi-row">
                    <div><label className="fl">총 진료비 (원)</label><input className="fi" type="number" defaultValue={48000} /></div>
                    <div><label className="fl">진료 소견</label><input className="fi" placeholder="간단한 소견" /></div>
                  </div>
                </div>

                <div className="card">
                  <div className="card-title">첨부 파일 (S3 오프체인)</div>
                  <div className="upload-zone">
                    📎 영수증 · X-RAY · 초음파 파일 업로드<br />
                    <span style={{ fontSize: 12, color: 'var(--muted)' }}>원문 AES-256 암호화 저장 · 해시값만 온체인</span>
                  </div>
                </div>
              </div>

              {/* 오른쪽: 해시 + 상태 + 버튼 */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div className="card">
                  <div className="card-title">해시 미리보기</div>
                  <div style={{
                    fontFamily: 'var(--font-mono)', fontSize: 11.5, color: 'var(--muted)',
                    wordBreak: 'break-all', background: 'var(--bg-2)', padding: '14px',
                    borderRadius: 10, lineHeight: 2, border: '1px solid var(--border)'
                  }}>
                    detail_data_hash:<br />sha256:a3f2b9c1d4e5f678<br />90ab12cd34ef5678
                  </div>
                </div>

                <div className="card">
                  <div className="card-title">on_chain_status</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, fontWeight: 700 }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--warning)', boxShadow: '0 0 0 3px var(--warning-xl)' }} />
                    <span style={{ color: 'var(--warning)' }}>pending</span>
                  </div>
                </div>

                <div className="card" style={{ background: 'var(--brand-xl)', border: '1px solid var(--brand-l)' }}>
                  <div className="card-title">동의 상태 확인</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {Object.values(consents).map(c => (
                      <div key={c.recordId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13 }}>
                        <span className="mono">{c.recordId}</span>
                        <span className={`badge ${c.status === 'active' ? 'badge-success' : c.status === 'revoked' ? 'badge-danger' : 'badge-warning'}`}>
                          {c.status === 'active' ? '동의 완료' : c.status === 'revoked' ? '동의 철회' : '대기 중'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  className="btn btn-orange"
                  style={{ padding: '14px', fontSize: 14, fontWeight: 700 }}
                  onClick={() => handleRecord('REC-2024-0041')}
                >
                  🔗 원장에 기록 (on-chain)
                </button>
              </div>
            </div>

            {/* 동의 완료 기록 제출 목록 */}
            {activeConsents.length > 0 && (
              <div className="card" style={{ marginTop: 28 }}>
                <div className="card-title">보호자 동의 완료 — 제출 가능한 기록</div>
                <table className="tbl">
                  <thead>
                    <tr><th>record_id</th><th>반려동물</th><th>질병</th><th>진료비</th><th>동의 상태</th><th></th></tr>
                  </thead>
                  <tbody>
                    {activeConsents.map(c => (
                      <tr key={c.recordId}>
                        <td><span className="mono">{c.recordId}</span></td>
                        <td style={{ fontWeight: 600 }}>{c.pet}</td>
                        <td><span className="mono">{c.disease}</span></td>
                        <td style={{ fontWeight: 600 }}>{c.cost.toLocaleString()}원</td>
                        <td><span className="badge badge-success">동의 완료</span></td>
                        <td>
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => {
                              setState(s => ({
                                ...s, creditN: s.creditN + 1,
                                txLog: [{ time: new Date().toLocaleTimeString(), type: '제출', org: 'hosp-001', desc: `${c.recordId} → ${c.insurerName} 제출` }, ...s.txLog],
                              }))
                              showToast('제출 완료', `${c.recordId} — ${c.insurerName}으로 제출됨`)
                            }}
                          >
                            제출 →
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── 크레딧 현황 ── */}
        {tab === 'credit' && (
          <div className="fade-in">
            <div className="pane-h">크레딧 현황</div>
            <div className="pane-sub">진료기록 등록·검증 성공 시 적립되는 운영 크레딧 (12개월 유효)</div>

            <div className="g4" style={{ marginBottom: 24 }}>
              {[
                { n: state.creditN, l: '누적 크레딧', c: 'var(--brand)', bg: 'var(--brand-xl)' },
                { n: '50,000원',    l: '이번달 SaaS 정가', c: 'var(--text-2)', bg: 'var(--bg-2)' },
                { n: `${Math.min(state.creditN * 300, 50000).toLocaleString()}원`, l: '크레딧 차감액', c: 'var(--success)', bg: 'var(--success-xl)' },
                { n: `${Math.max(50000 - state.creditN * 300, 0).toLocaleString()}원`, l: '실납부액', c: 'var(--orange)', bg: 'var(--orange-xl)' },
              ].map((s, i) => (
                <div key={i} className="stat-box" style={{ background: s.bg, border: `1px solid ${s.c}22` }}>
                  <div className="stat-n" style={{ color: s.c }}>{s.n}</div>
                  <div className="stat-l" style={{ color: s.c, opacity: .75 }}>{s.l}</div>
                </div>
              ))}
            </div>

            <div className="card">
              <div className="card-title">크레딧 적립 내역</div>
              <table className="tbl">
                <thead><tr><th>날짜</th><th>record_id</th><th>유형</th><th>내용</th><th>적립</th></tr></thead>
                <tbody>
                  <tr>
                    <td>05.08</td>
                    <td><span className="mono">REC-2024-0041</span></td>
                    <td><span className="badge badge-success">ACCRUAL</span></td>
                    <td>검증 API 성공</td>
                    <td style={{ color: 'var(--success)', fontWeight: 700 }}>+1</td>
                  </tr>
                  <tr>
                    <td>05.07</td>
                    <td><span className="mono">REC-2024-0040</span></td>
                    <td><span className="badge badge-success">ACCRUAL</span></td>
                    <td>검증 API 성공</td>
                    <td style={{ color: 'var(--success)', fontWeight: 700 }}>+1</td>
                  </tr>
                  {state.txLog.filter(t => t.type === '기록' || t.type === '제출').map((t, i) => (
                    <tr key={i}>
                      <td>지금</td>
                      <td><span className="mono">신규</span></td>
                      <td><span className="badge badge-success">ACCRUAL</span></td>
                      <td>{t.desc}</td>
                      <td style={{ color: 'var(--success)', fontWeight: 700 }}>+1</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── 감사 로그 ── */}
        {tab === 'log' && (
          <div className="fade-in">
            <div className="pane-h">감사 로그</div>
            <div className="pane-sub">원장 기록 트랜잭션 이력 (audit_logs)</div>
            <div className="card">
              <table className="tbl">
                <thead>
                  <tr><th>시각</th><th>record_id</th><th>유형</th><th>내용</th><th>Fabric TX</th><th>상태</th></tr>
                </thead>
                <tbody>
                  {state.txLog.map((t, i) => (
                    <tr key={i}>
                      <td style={{ color: 'var(--muted)', fontSize: 13 }}>{t.time}</td>
                      <td><span className="mono">{t.desc.split(' ')[0]}</span></td>
                      <td><span className="badge badge-brand">{t.type}</span></td>
                      <td style={{ color: 'var(--text-2)' }}>{t.desc}</td>
                      <td><span className="mono">a3f2b9c1...</span></td>
                      <td><span className="badge badge-success">confirmed</span></td>
                    </tr>
                  ))}
                  <tr>
                    <td style={{ color: 'var(--muted)', fontSize: 13 }}>05.08 14:23</td>
                    <td><span className="mono">REC-2024-0041</span></td>
                    <td><span className="badge badge-brand">기록</span></td>
                    <td>원장 기록 완료</td>
                    <td><span className="mono">a3f2b9c1...</span></td>
                    <td><span className="badge badge-success">confirmed</span></td>
                  </tr>
                  <tr>
                    <td style={{ color: 'var(--muted)', fontSize: 13 }}>05.07 11:05</td>
                    <td><span className="mono">REC-2024-0040</span></td>
                    <td><span className="badge badge-brand">기록</span></td>
                    <td>원장 기록 완료</td>
                    <td><span className="mono">b4c3d2e1...</span></td>
                    <td><span className="badge badge-success">confirmed</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
