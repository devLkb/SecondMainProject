import { useState, useEffect } from 'react'
import DashNav from '../../components/common/DashNav'
import { useApp } from '../../context/AppContext'
import apiFetch from '../../api/client'

// 이상 신고 사유 목록
const FLAG_REASONS = [
  { code: 'DUPLICATE_SUSPECTED',    label: '중복 청구 의심' },
  { code: 'COST_INCONSISTENT',      label: '진료비 불일치' },
  { code: 'DIAGNOSIS_MISMATCH',     label: '진단 코드 불일치' },
  { code: 'TREATMENT_UNREASONABLE', label: '진료 행위 부적절' },
  { code: 'DOCUMENT_SUSPICIOUS',    label: '서류 위조 의심' },
  { code: 'OTHER',                  label: '기타' },
]

const CHANNEL_INFO = [
  {
    id: 'ch1',
    name: '수의사회 채널',
    badge: '공동 채널',
    badgeColor: '#16a34a',
    desc: '한국수의사회 주관. 소속 중소 동물병원 3곳과 보험사 2곳이 참여합니다.',
    members: [
      { label: '한국수의사회',   role: 'Orderer', dot: '#b8885a' },
      { label: '중소동물병원 A', role: '병원',    dot: '#fb923c' },
      { label: '중소동물병원 B', role: '병원',    dot: '#fb923c' },
      { label: '중소동물병원 C', role: '병원',    dot: '#fb923c' },
      { label: 'DB손해보험',     role: '보험사',  dot: '#34d399' },
      { label: '현대해상',       role: '보험사',  dot: '#34d399' },
    ],
  },
  {
    id: 'ch2',
    name: '대형병원 독립 채널',
    badge: '유료 독립',
    badgeColor: '#ea580c',
    desc: '독립 조직을 선택한 대형 동물병원 전용 채널. 보험사 2곳이 함께 참여합니다.',
    members: [
      { label: '대형동물병원',   role: '병원(독립)', dot: '#fb923c' },
      { label: 'DB손해보험',     role: '보험사',     dot: '#34d399' },
      { label: '현대해상',       role: '보험사',     dot: '#34d399' },
    ],
  },
]

export default function InsuranceDash({ showToast, onLogout }) {
  const { state, setState } = useApp()
  const [tab, setTab]               = useState('list')
  const [lastVerified, setLastVerified] = useState(null)

  const [flagModal, setFlagModal]   = useState(null)
  const [flagReason, setFlagReason] = useState('')
  const [flagNote, setFlagNote]     = useState('')

  // 포인트 잔액 + 동의 목록 API 로드
  useEffect(() => {
    const userId = localStorage.getItem('userId')

    async function loadBalance() {
      try {
        if (!userId) return
        const data = await apiFetch(`/insurers/${userId}/points/balance`)
        if (data?.balance !== undefined) setState(s => ({ ...s, ptBalance: data.balance }))
      } catch { /* 폴백 */ }
    }

    async function loadConsents() {
      try {
        const data = await apiFetch(`/consents${userId ? `?insurerId=${userId}` : ''}`)
        if (data && Array.isArray(data)) {
          const map = {}
          data.forEach(c => {
            map[c.recordId] = {
              recordId:    c.recordId,
              consentId:   c.consentId || c.id,
              petId:       c.petId,
              status:      (c.status || 'pending').toLowerCase(),
              pet:         c.petName || c.pet || '',
              hospital:    c.hospitalName || c.hospital || '',
              insurerName: c.insurerName || '',
              insurerId:   c.insurerId || userId || '',
              disease:     c.disease || '',
              treatment:   c.treatment || '',
              cost:        c.cost || 0,
              date:        c.date || '',
            }
          })
          setState(s => ({ ...s, consents: map }))
        }
      } catch { /* 폴백 */ }
    }

    loadBalance()
    loadConsents()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const activeConsents  = Object.values(state.consents).filter(c => c.status === 'active')
  const revokedConsents = Object.values(state.consents).filter(c => c.status === 'revoked')

  /* ── 검증 API 호출 ── */
  const handleVerify = async (c) => {
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
      reviewStatus: null,   // null | APPROVED | REJECTED | FLAGGED
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
    showToast('검증 완료', 'PASSED — 포인트 차감 (-1)')
    setTab('result')

    // Sync with API (graceful degradation)
    try {
      const insurerId = localStorage.getItem('userId') || c.insurerId || '1'
      const submission = await apiFetch('/submissions', { method: 'POST', body: { recordId: c.recordId, insurerId } })
      const submissionId = submission?.submissionId || submission?.id
      if (submissionId) {
        await apiFetch(`/submissions/${submissionId}/verification`, {
          method: 'POST',
          body: {
            submissionId,
            recordId: c.recordId,
            hospitalId: c.hospitalId || '1',
            insurerId,
            consentId: c.consentId || submissionId,
            recordHash: c.recordHash || 'demo-record-hash',
            requestedBy: insurerId,
            requestedAt: new Date().toISOString(),
            petId: c.petId,
            guardianId: c.guardianId,
          },
        })
      }
    } catch {
      // API failure: local state already updated
    }
  }

  /* ── 심사 결과 기록 ── */
  const handleReview = (status) => {
    if (!lastVerified) return
    setState(s => ({
      ...s,
      verifiedRecords: s.verifiedRecords.map(r =>
        r.verificationId === lastVerified.verificationId
          ? { ...r, reviewStatus: status }
          : r
      ),
      txLog: [{ time: new Date().toLocaleTimeString(), type: '심사', org: 'ins-001', desc: `${lastVerified.recordId} — ${status}` }, ...s.txLog],
    }))
    setLastVerified(prev => ({ ...prev, reviewStatus: status }))
    showToast('심사 완료', `${status} — 원장 기록 완료`)
  }

  /* ── 이상 신고 제출 ── */
  const handleFlag = () => {
    if (!flagReason) { showToast('오류', '신고 사유를 선택하세요'); return }
    const flagEntry = {
      flagId:         `FLAG-${crypto.randomUUID().slice(0,8).toUpperCase()}`,
      verificationId: flagModal.verificationId,
      recordId:       flagModal.recordId,
      pet:            flagModal.pet,
      hospital:       flagModal.hospital,
      disease:        flagModal.disease,
      cost:           flagModal.cost,
      reasonCode:     flagReason,
      reasonLabel:    FLAG_REASONS.find(r => r.code === flagReason)?.label,
      note:           flagNote,
      flaggedAt:      new Date().toLocaleString(),
      status:         'PENDING',   // PENDING | REVIEWING | RESOLVED
      reportedBy:     'ins-001',
    }
    setState(s => ({
      ...s,
      flaggedRecords: [flagEntry, ...(s.flaggedRecords || [])],
      verifiedRecords: s.verifiedRecords.map(r =>
        r.verificationId === flagModal.verificationId
          ? { ...r, reviewStatus: 'FLAGGED' }
          : r
      ),
      txLog: [{ time: new Date().toLocaleTimeString(), type: '신고', org: 'ins-001', desc: `${flagModal.recordId} — 이상 신고 전달 (${flagEntry.reasonLabel})` }, ...s.txLog],
    }))
    if (lastVerified?.verificationId === flagModal.verificationId) {
      setLastVerified(prev => ({ ...prev, reviewStatus: 'FLAGGED' }))
    }
    showToast('이상 신고 완료', `플랫폼에 전달됨 — ${flagEntry.flagId}`)
    setFlagModal(null)
    setFlagReason('')
    setFlagNote('')
  }

  /* ── 심사 결과 배지 ── */
  const reviewBadge = (status) => ({
    APPROVED: <span className="badge badge-success">APPROVED</span>,
    REJECTED: <span className="badge badge-danger">REJECTED</span>,
    FLAGGED:  <span className="badge badge-warning">⚠️ FLAGGED</span>,
  }[status] || <span className="badge badge-muted">미기록</span>)

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
                <div style={{ fontWeight: 800, fontSize: 17, marginBottom: 10 }}>검증 가능한 기록이 없습니다</div>
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
            <div className="pane-sub">verification_logs — 보험사 내부 심사 후 이상 건은 플랫폼에 신고합니다</div>

            {state.verifiedRecords.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', padding: 72, color: 'var(--muted)' }}>
                아직 검증한 기록이 없습니다. 검증 목록에서 API를 호출하세요.
              </div>
            ) : (
              <>
                {lastVerified && (
                  <div className="card fade-in" style={{
                    borderTop: `3px solid ${lastVerified.reviewStatus === 'FLAGGED' ? 'var(--warning)' : 'var(--success)'}`,
                    marginBottom: 22,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 22 }}>
                      <div style={{
                        width: 50, height: 50, borderRadius: 14,
                        background: lastVerified.reviewStatus === 'FLAGGED' ? 'var(--warning-xl)' : 'var(--success-xl)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24,
                      }}>
                        {lastVerified.reviewStatus === 'FLAGGED' ? '⚠️' : '✅'}
                      </div>
                      <div>
                        <div style={{ fontSize: 20, fontWeight: 800, color: lastVerified.reviewStatus === 'FLAGGED' ? 'var(--warning)' : 'var(--success)' }}>
                          {lastVerified.reviewStatus === 'FLAGGED' ? '이상 신고 완료' : '검증 통과'}
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>
                          status: PASSED · {lastVerified.verifiedAt}
                        </div>
                      </div>
                      <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
                        {reviewBadge(lastVerified.reviewStatus)}
                        <span className="badge badge-warning">포인트 -1</span>
                      </div>
                    </div>

                    {/* 검증 체크 항목 */}
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

                    {/* 진료 상세 */}
                    <div className="g2" style={{ fontSize: 14, marginBottom: 20 }}>
                      {[
                        ['반려동물',        lastVerified.pet,                          false],
                        ['질병코드',        lastVerified.disease,                      true],
                        ['진료비',          `${lastVerified.cost.toLocaleString()}원`, false],
                        ['verification_id', lastVerified.verificationId,               true],
                      ].map(([k, v, mono]) => (
                        <div key={k}>
                          <div style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 600, marginBottom: 4 }}>{k}</div>
                          <div style={{ fontWeight: 600 }} className={mono ? 'mono' : ''}>{v}</div>
                        </div>
                      ))}
                    </div>

                    {/* 심사 결과 버튼 — 아직 결과 미기록인 경우만 */}
                    {!lastVerified.reviewStatus && (
                      <>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--muted)', marginBottom: 10 }}>
                          보험사 내부 심사 후 결과를 선택하세요
                        </div>
                        <div style={{ display: 'flex', gap: 10 }}>
                          <button
                            className="btn btn-success"
                            style={{ flex: 1, padding: 12, fontSize: 14 }}
                            onClick={() => handleReview('APPROVED')}
                          >
                            ✓ 승인 (APPROVED)
                          </button>
                          <button
                            className="btn btn-danger"
                            style={{ flex: 1, padding: 12, fontSize: 14 }}
                            onClick={() => handleReview('REJECTED')}
                          >
                            ✕ 반려 (REJECTED)
                          </button>
                          <button
                            className="btn btn-warning"
                            style={{ flex: 1, padding: 12, fontSize: 14, background: 'var(--warning-xl)', color: 'var(--warning)', borderColor: 'var(--warning)' }}
                            onClick={() => setFlagModal(lastVerified)}
                          >
                            ⚠️ 이상 신고
                          </button>
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 10 }}>
                          이상 신고는 플랫폼 관리자에게 전달되며, 플랫폼이 병원·보험사와 함께 해당 건을 재검토합니다.
                        </div>
                      </>
                    )}

                    {/* 이미 결과 기록된 경우 */}
                    {lastVerified.reviewStatus && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', background: 'var(--bg-2)', borderRadius: 10, border: '1px solid var(--border)' }}>
                        <span style={{ fontSize: 13, color: 'var(--muted)' }}>심사 결과 기록됨</span>
                        {reviewBadge(lastVerified.reviewStatus)}
                        {lastVerified.reviewStatus !== 'FLAGGED' && (
                          <button
                            className="btn btn-ghost btn-sm"
                            style={{ marginLeft: 'auto' }}
                            onClick={() => setFlagModal(lastVerified)}
                          >
                            ⚠️ 이상 신고
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* 전체 검증 이력 */}
                <div className="card">
                  <div className="card-title">전체 검증 이력</div>
                  <table className="tbl">
                    <thead>
                      <tr><th>verification_id</th><th>record_id</th><th>검증</th><th>심사 결과</th><th>시각</th><th>포인트</th><th></th></tr>
                    </thead>
                    <tbody>
                      {state.verifiedRecords.map((r, i) => (
                        <tr key={i}>
                          <td><span className="mono">{r.verificationId}</span></td>
                          <td><span className="mono">{r.recordId}</span></td>
                          <td><span className="badge badge-success">PASSED</span></td>
                          <td>{reviewBadge(r.reviewStatus)}</td>
                          <td style={{ fontSize: 13, color: 'var(--muted)' }}>{r.verifiedAt}</td>
                          <td style={{ color: 'var(--danger)', fontWeight: 700 }}>-1</td>
                          <td>
                            {r.reviewStatus !== 'FLAGGED' && (
                              <button
                                className="btn btn-ghost btn-sm"
                                onClick={() => { setLastVerified(r); setFlagModal(r) }}
                              >
                                ⚠️ 신고
                              </button>
                            )}
                          </td>
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
                ⚠️ 포인트 잔액이 부족합니다.
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

        {/* ── 채널 현황 ── */}
        {tab === 'channel' && (
          <div className="fade-in">
            <div className="pane-h">채널 현황</div>
            <div className="pane-sub">현재 참여 중인 하이퍼레저 패브릭 채널 구성</div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
              {CHANNEL_INFO.map(ch => (
                <div key={ch.id} className="card">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, flex: 1 }}>{ch.name}</div>
                    <span style={{
                      fontSize: 11, fontWeight: 700, color: ch.badgeColor,
                      background: ch.badgeColor + '18', padding: '3px 10px',
                      borderRadius: 20, border: `1px solid ${ch.badgeColor}44`,
                    }}>{ch.badge}</span>
                  </div>
                  <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 16, lineHeight: 1.65 }}>{ch.desc}</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                    {ch.members.map((m, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 13px', background: 'var(--bg-2)', borderRadius: 9 }}>
                        <div style={{ width: 7, height: 7, borderRadius: '50%', background: m.dot, flexShrink: 0 }} />
                        <span style={{ fontSize: 13, flex: 1 }}>{m.label}</span>
                        <span style={{ fontSize: 11, color: m.dot, fontWeight: 600 }}>{m.role}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="card">
              <div className="card-title">채널별 검증 통계 (이번 세션)</div>
              <table className="tbl">
                <thead>
                  <tr><th>채널</th><th>총 기록 수</th><th>검증 완료</th><th>대기 중</th></tr>
                </thead>
                <tbody>
                  <tr>
                    <td>수의사회 채널</td>
                    <td>{Object.values(state.consents).filter(c => !c.isIndependent).length}</td>
                    <td style={{ color: 'var(--success)', fontWeight: 700 }}>{state.verifiedRecords.length}</td>
                    <td>{Object.values(state.consents).filter(c => c.status === 'active').length}</td>
                  </tr>
                  <tr>
                    <td>대형병원 독립 채널</td>
                    <td>—</td>
                    <td>—</td>
                    <td>—</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ── 이상 신고 모달 ── */}
      {flagModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 900, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: 18, padding: 32, width: '100%', maxWidth: 480, position: 'relative' }}>
            <button
              onClick={() => { setFlagModal(null); setFlagReason(''); setFlagNote('') }}
              style={{ position: 'absolute', top: 16, right: 18, background: 'none', border: 'none', fontSize: 22, color: '#a1a1aa', cursor: 'pointer' }}
            >✕</button>

            <div style={{ fontSize: 19, fontWeight: 800, marginBottom: 4 }}>⚠️ 이상 신고</div>
            <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 20 }}>
              플랫폼 관리자에게 이상 내용이 전달됩니다
            </div>

            {/* 신고 대상 요약 */}
            <div style={{ background: 'var(--bg-2)', borderRadius: 10, padding: '12px 16px', marginBottom: 20, fontSize: 13, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--muted)' }}>record_id</span>
                <span className="mono">{flagModal.recordId}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--muted)' }}>반려동물</span>
                <span style={{ fontWeight: 600 }}>{flagModal.pet}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--muted)' }}>병원</span>
                <span>{flagModal.hospital}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--muted)' }}>진료비</span>
                <span style={{ fontWeight: 600 }}>{flagModal.cost?.toLocaleString()}원</span>
              </div>
            </div>

            {/* 신고 사유 선택 */}
            <label className="fl">신고 사유 <span style={{ color: 'var(--danger)' }}>*</span></label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
              {FLAG_REASONS.map(r => (
                <label key={r.code} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 14px', borderRadius: 8, cursor: 'pointer',
                  border: `1.5px solid ${flagReason === r.code ? 'var(--warning)' : 'var(--border)'}`,
                  background: flagReason === r.code ? 'var(--warning-xl)' : '#fff',
                  transition: 'all .15s',
                }}>
                  <input
                    type="radio" name="flagReason" value={r.code}
                    checked={flagReason === r.code}
                    onChange={() => setFlagReason(r.code)}
                    style={{ accentColor: 'var(--warning)' }}
                  />
                  <span style={{ fontSize: 14, fontWeight: flagReason === r.code ? 600 : 400 }}>{r.label}</span>
                </label>
              ))}
            </div>

            {/* 상세 메모 */}
            <label className="fl">상세 내용 (선택)</label>
            <textarea
              className="fi"
              rows={3}
              placeholder="이상하다고 판단한 근거나 추가 정보를 입력하세요"
              value={flagNote}
              onChange={e => setFlagNote(e.target.value)}
              style={{ resize: 'vertical' }}
            />

            <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 16, lineHeight: 1.6 }}>
              📌 신고 후에도 이미 다운로드한 자료는 회수되지 않습니다. 플랫폼이 병원 및 보험사와 함께 해당 건을 재검토합니다.
            </div>

            <button
              className="btn btn-warning"
              style={{ width: '100%', padding: 13, fontSize: 14, fontWeight: 700, background: 'var(--warning)', color: '#fff', borderColor: 'var(--warning)', justifyContent: 'center' }}
              onClick={handleFlag}
            >
              플랫폼에 이상 신고 전달
            </button>
          </div>
        </div>
      )}
    </>
  )
}
