import { useState } from 'react'
import DashNav from '../../components/common/DashNav'
import { useApp } from '../../context/AppContext'

export default function InsuranceDash({ showToast, onLogout }) {
  const { state, setState } = useApp()
  const [tab, setTab]          = useState('list')
  const [lastVerified, setLastVerified] = useState(null)

  const activeConsents  = Object.values(state.consents).filter(c => c.status === 'active')
  const revokedConsents = Object.values(state.consents).filter(c => c.status === 'revoked')

  const handleVerify = (c) => {
    if (state.ptBalance <= 0) {
      showToast('포인트 부족', '플랫폼에 포인트 충전을 요청하세요.')
      return
    }
    const result = {
      verificationId: `VER-${crypto.randomUUID().slice(0,8).toUpperCase()}`,
      submissionId:   `CLM-${c.recordId}`,
      recordId: c.recordId, pet: c.pet, disease: c.disease,
      cost: c.cost, hospital: c.hospital,
      status: 'PASSED', verifiedAt: new Date().toLocaleString(),
    }
    setState(s => ({
      ...s,
      ptBalance:       s.ptBalance - 1,
      usedPt:          s.usedPt + 1,
      verifyCount:     s.verifyCount + 1,
      verifiedRecords: [result, ...s.verifiedRecords],
      txLog: [{ time: new Date().toLocaleTimeString(), type: '검증', org: 'ins-001', desc: `${c.recordId} 검증 완료 — 해시 일치` }, ...s.txLog],
      ptLog: [{ date: '지금', claim: c.recordId, desc: '검증 API 호출', pt: -1 }, ...s.ptLog],
    }))
    setLastVerified(result)
    showToast('검증 완료', `PASSED — 포인트 차감 (-1)`)
    setTab('result')
  }

  return (
    <>
      <DashNav role="insurance" tab={tab} setTab={setTab} onLogout={onLogout} />

      <div className="dash-wrap">

        {/* ── 검증 목록 ── */}
        {tab === 'list' && (
          <div className="fade-in">
            <div className="pane-h">검증 대기 목록</div>
            <div className="pane-sub">보호자 동의가 ACTIVE인 청구 건 — 토글 OFF 시 목록에서 사라집니다</div>

            {revokedConsents.length > 0 && (
              <div className="alert alert-danger">
                ⛔ 동의 철회 {revokedConsents.length}건 — 해당 건은 조회 차단됨 (BLOCKED_BY_CONSENT)
              </div>
            )}

            {activeConsents.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', padding: 72 }}>
                <div style={{ fontSize: 44, marginBottom: 16 }}>🔒</div>
                <div style={{ fontWeight: 800, fontSize: 17, marginBottom: 10, color: 'var(--text)' }}>검증 가능한 기록이 없습니다</div>
                <div style={{ fontSize: 14, color: 'var(--muted)' }}>보호자가 동의 토글을 ON해야 이 목록에 표시됩니다</div>
              </div>
            ) : (
              <div className="card">
                <table className="tbl">
                  <thead>
                    <tr>
                      <th>record_id</th><th>반려동물</th><th>질병코드</th>
                      <th>진료비</th><th>병원</th><th>동의 상태</th><th>포인트</th><th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeConsents.map(c => (
                      <tr key={c.recordId}>
                        <td><span className="mono">{c.recordId}</span></td>
                        <td style={{ fontWeight: 600 }}>{c.pet}</td>
                        <td><span className="mono">{c.disease}</span></td>
                        <td style={{ fontWeight: 600 }}>{c.cost.toLocaleString()}원</td>
                        <td>{c.hospital}</td>
                        <td><span className="badge badge-success">ACTIVE</span></td>
                        <td><span style={{ fontSize: 13, color: 'var(--danger)', fontWeight: 700 }}>-1 pt</span></td>
                        <td>
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => handleVerify(c)}
                            disabled={state.ptBalance <= 0}
                          >
                            검증 API →
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {revokedConsents.length > 0 && (
              <div className="card" style={{ marginTop: 18, opacity: .65 }}>
                <div className="card-title">접근 차단된 기록 (동의 철회)</div>
                <table className="tbl">
                  <thead><tr><th>record_id</th><th>반려동물</th><th>이유</th></tr></thead>
                  <tbody>
                    {revokedConsents.map(c => (
                      <tr key={c.recordId}>
                        <td><span className="mono">{c.recordId}</span></td>
                        <td>{c.pet}</td>
                        <td><span className="badge badge-danger">BLOCKED_BY_CONSENT</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── 검증 결과 ── */}
        {tab === 'result' && (
          <div className="fade-in">
            <div className="pane-h">검증 결과</div>
            <div className="pane-sub">verification_logs — 검증 API 호출 이력</div>

            {state.verifiedRecords.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', padding: 72, color: 'var(--muted)' }}>
                아직 검증한 기록이 없습니다. 검증 목록에서 API를 호출하세요.
              </div>
            ) : (
              <>
                {lastVerified && (
                  <div className="card fade-in" style={{ borderTop: '3px solid var(--success)', marginBottom: 22 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 22 }}>
                      <div style={{
                        width: 50, height: 50, borderRadius: 14,
                        background: 'var(--success-xl)', display: 'flex',
                        alignItems: 'center', justifyContent: 'center', fontSize: 24
                      }}>✅</div>
                      <div>
                        <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--success)' }}>검증 통과</div>
                        <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>
                          status: PASSED · {lastVerified.verifiedAt}
                        </div>
                      </div>
                      <span className="badge badge-warning" style={{ marginLeft: 'auto' }}>포인트 -1</span>
                    </div>

                    <div className="g2" style={{ marginBottom: 20 }}>
                      {[
                        ['해시 일치', '✓ 정상',    'var(--success)'],
                        ['중복 청구', '✓ 없음',    'var(--success)'],
                        ['동의 상태', '✓ ACTIVE', 'var(--success)'],
                        ['on_chain',  '✓ confirmed','var(--brand)'],
                      ].map(([k, v, c]) => (
                        <div key={k} style={{ background: 'var(--bg-2)', borderRadius: 10, padding: '14px 16px', border: '1px solid var(--border)' }}>
                          <div style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 600, marginBottom: 6 }}>{k}</div>
                          <div style={{ fontSize: 15, fontWeight: 800, color: c }}>{v}</div>
                        </div>
                      ))}
                    </div>

                    <div className="divider" />
                    <div className="g2" style={{ fontSize: 14, marginBottom: 20 }}>
                      {[
                        ['반려동물',      lastVerified.pet,                          false],
                        ['질병코드',      lastVerified.disease,                      true],
                        ['진료비',        `${lastVerified.cost.toLocaleString()}원`, false],
                        ['verification_id', lastVerified.verificationId,             true],
                      ].map(([k, v, mono]) => (
                        <div key={k}>
                          <div style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 600, marginBottom: 4 }}>{k}</div>
                          <div style={{ fontWeight: 600 }} className={mono ? 'mono' : ''}>{v}</div>
                        </div>
                      ))}
                    </div>

                    <div style={{ display: 'flex', gap: 10 }}>
                      <button
                        className="btn btn-success"
                        style={{ flex: 1, padding: 12, fontSize: 14 }}
                        onClick={() => {
                          setState(s => ({ ...s, txLog: [{ time: new Date().toLocaleTimeString(), type: '심사', org: 'ins-001', desc: 'APPROVED — reviewed_at 기록' }, ...s.txLog] }))
                          showToast('심사 완료', 'APPROVED — 원장 기록 완료')
                        }}
                      >
                        ✓ 승인 (APPROVED)
                      </button>
                      <button
                        className="btn btn-danger"
                        style={{ flex: 1, padding: 12, fontSize: 14 }}
                        onClick={() => showToast('심사 완료', 'REJECTED — 원장 기록 완료')}
                      >
                        ✕ 반려 (REJECTED)
                      </button>
                    </div>
                  </div>
                )}

                <div className="card">
                  <div className="card-title">전체 검증 이력</div>
                  <table className="tbl">
                    <thead>
                      <tr><th>verification_id</th><th>record_id</th><th>결과</th><th>시각</th><th>포인트</th></tr>
                    </thead>
                    <tbody>
                      {state.verifiedRecords.map((r, i) => (
                        <tr key={i}>
                          <td><span className="mono">{r.verificationId}</span></td>
                          <td><span className="mono">{r.recordId}</span></td>
                          <td><span className="badge badge-success">PASSED</span></td>
                          <td style={{ fontSize: 13, color: 'var(--muted)' }}>{r.verifiedAt}</td>
                          <td style={{ color: 'var(--danger)', fontWeight: 700 }}>-1</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        )}

        {/* ── 포인트 현황 ── */}
        {tab === 'point' && (
          <div className="fade-in">
            <div className="pane-h">포인트 현황</div>
            <div className="pane-sub">검증 API 호출 시 차감 (point_balances + point_transactions)</div>

            <div className="g4" style={{ marginBottom: 24 }}>
              {[
                { n: state.ptBalance,   l: '잔여 포인트',  c: 'var(--brand)',   bg: 'var(--brand-xl)' },
                { n: state.usedPt,      l: '이번달 소모',  c: 'var(--danger)',  bg: 'var(--danger-xl)' },
                { n: 1000,              l: '충전 총량',    c: 'var(--text-2)', bg: 'var(--bg-2)' },
                { n: state.verifyCount, l: '총 검증 건',   c: 'var(--success)', bg: 'var(--success-xl)' },
              ].map((s, i) => (
                <div key={i} className="stat-box" style={{ background: s.bg, border: `1px solid ${s.c}22` }}>
                  <div className="stat-n" style={{ color: s.c }}>{s.n}</div>
                  <div className="stat-l" style={{ color: s.c, opacity: .75 }}>{s.l}</div>
                </div>
              ))}
            </div>

            {state.ptBalance < 100 && (
              <div className="alert alert-warning">
                ⚠️ 포인트 잔액이 부족합니다. 플랫폼에 충전을 요청하세요.
                <button className="btn btn-orange btn-sm" style={{ marginLeft: 'auto' }}>충전 요청</button>
              </div>
            )}

            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
                <div className="card-title" style={{ margin: 0 }}>포인트 거래 이력</div>
                <button className="btn btn-primary btn-sm">충전 요청</button>
              </div>
              <table className="tbl">
                <thead>
                  <tr><th>날짜</th><th>tx_type</th><th>record_id</th><th>내용</th><th>포인트</th></tr>
                </thead>
                <tbody>
                  {state.ptLog.map((p, i) => (
                    <tr key={i}>
                      <td>{p.date}</td>
                      <td><span className="badge badge-danger">DEDUCT</span></td>
                      <td><span className="mono">{p.claim}</span></td>
                      <td>{p.desc}</td>
                      <td style={{ color: 'var(--danger)', fontWeight: 700 }}>{p.pt}</td>
                    </tr>
                  ))}
                  <tr>
                    <td>05.01</td>
                    <td><span className="badge badge-brand">ISSUE</span></td>
                    <td>—</td>
                    <td>플랫폼 발행</td>
                    <td style={{ color: 'var(--brand)', fontWeight: 700 }}>+1,000</td>
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
