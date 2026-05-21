import { useState, useEffect } from 'react'
import { useApp } from '../../context/AppContext'
import apiFetch from '../../api/client'

const RESOLVE_OPTIONS = [
  { code: 'CONFIRMED_FRAUD',   label: '사기 확인 — 병원 조치 요청' },
  { code: 'FALSE_ALARM',       label: '오탐 — 정상 처리' },
  { code: 'NEEDS_MORE_INFO',   label: '추가 자료 요청 중' },
  { code: 'ESCALATED',         label: '외부 기관 이관' },
]

export default function Platform({ showToast, onLogout }) {
  const { state, setState } = useApp()
  const [tab, setTab]           = useState('org')
  const [issueAmt, setIssueAmt] = useState(500)
  const [issueTarget, setIssueTarget] = useState('')
  const [issueMemo, setIssueMemo]     = useState('')

  // 이상 신고 처리 모달
  const [resolveModal, setResolveModal] = useState(null)
  const [resolveCode, setResolveCode]   = useState('')
  const [resolveNote, setResolveNote]   = useState('')

  // Org 관리 모달 (active 인 org 의 상세 + 비활성화)
  const [orgModal, setOrgModal] = useState(null)

  // 보험사 등록 모달
  const [regModal, setRegModal] = useState(false)
  const [regForm, setRegForm]   = useState({ name: '', businessNumber: '', fabricOrgId: '', adminEmail: '', password: '' })
  const [regBusy, setRegBusy]   = useState(false)

  // 대시보드 진입 시 Org 목록 · 이상 신고 · 모니터링 집계를 백엔드에서 로드
  useEffect(() => {
    apiFetch('/admin/orgs')
      .then(rows => { if (Array.isArray(rows)) setState(s => ({ ...s, orgs: rows })) })
      .catch(() => {})
    apiFetch('/flags')
      .then(rows => { if (Array.isArray(rows)) setState(s => ({ ...s, flaggedRecords: rows })) })
      .catch(() => {})
    apiFetch('/admin/monitor')
      .then(m => { if (m) setState(s => ({
        ...s,
        verifyCount: m.verifyCount ?? s.verifyCount,
        ptBalance:   m.insurerPointBalance ?? s.ptBalance,
      })) })
      .catch(() => {})
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const tabs = [
    { id: 'org',     lbl: 'Org 관리' },
    { id: 'point',   lbl: '포인트 발행' },
    { id: 'flag',    lbl: '이상 신고', badge: (state.flaggedRecords || []).filter(f => f.status === 'PENDING').length },
    { id: 'monitor', lbl: '모니터링' },
  ]

  const handleApprove = async (id) => {
    try {
      const updated = await apiFetch(`/admin/orgs/${id}/approve`, { method: 'POST' })
      setState(s => ({
        ...s,
        orgs: s.orgs.map(o => o.id === id ? { ...o, ...updated, status: 'active' } : o),
      }))
      showToast('Org 승인', `${id} — 활성 상태로 변경됨`)
    } catch (e) {
      showToast('승인 실패', e?.message || 'Org 승인에 실패했습니다')
    }
  }

  // 관리 모달에서 활성 org 를 다시 승인 대기 상태로 되돌린다 (BE 가 user.status=SUSPENDED 처리).
  const handleDeactivate = async (id) => {
    try {
      const updated = await apiFetch(`/admin/orgs/${id}/deactivate`, { method: 'POST' })
      setState(s => ({
        ...s,
        orgs: s.orgs.map(o => o.id === id ? { ...o, ...updated, status: 'pending' } : o),
      }))
      showToast('Org 비활성화', `${id} — 승인 대기 상태로 변경됨`)
      setOrgModal(null)
    } catch (e) {
      showToast('비활성화 실패', e?.message || 'Org 비활성화에 실패했습니다')
    }
  }

  // 관리자가 보험사를 직접 등록한다. BE 는 신규 user.status=SUSPENDED 로 만들어주므로
  // 등록 후엔 Org 목록에 'pending' 으로 나타나고, 같은 화면의 승인 버튼으로 활성화하면 된다.
  const handleRegisterInsurer = async () => {
    const { name, businessNumber, fabricOrgId, adminEmail, password } = regForm
    if (!name || !businessNumber || !fabricOrgId || !adminEmail || !password) {
      showToast('입력 오류', '모든 필드를 입력하세요'); return
    }
    if (password.length < 8) {
      showToast('입력 오류', '비밀번호는 8자 이상이어야 합니다'); return
    }
    setRegBusy(true)
    try {
      await apiFetch('/auth/register/insurance', {
        method: 'POST',
        body: { name, businessNumber, fabricOrgId, adminEmail, password },
      })
      try {
        const rows = await apiFetch('/admin/orgs')
        if (Array.isArray(rows)) setState(s => ({ ...s, orgs: rows }))
      } catch { /* 목록 갱신 실패해도 등록 자체는 성공 */ }
      showToast('보험사 등록', `${name} 등록 완료 — 승인 대기`)
      setRegModal(false)
      setRegForm({ name: '', businessNumber: '', fabricOrgId: '', adminEmail: '', password: '' })
    } catch (e) {
      showToast('등록 실패', e?.message || '보험사 등록에 실패했습니다')
    } finally {
      setRegBusy(false)
    }
  }

  const handleIssue = async () => {
    if (!issueTarget) { showToast('오류', '대상 보험사를 선택하세요'); return }
    try {
      const res = await apiFetch(`/admin/insurers/${issueTarget}/points/issue`, {
        method: 'POST',
        body: { amount: issueAmt, reason: issueMemo.trim() || '플랫폼 포인트 발행' },
      })
      // 발행 직후 표를 실데이터로 갱신해야 어느 보험사가 받았는지 정확히 보인다.
      try {
        const rows = await apiFetch('/admin/orgs')
        if (Array.isArray(rows)) setState(s => ({ ...s, orgs: rows, ptBalance: res?.balance ?? s.ptBalance }))
        else setState(s => ({ ...s, ptBalance: res?.balance ?? s.ptBalance + issueAmt }))
      } catch {
        setState(s => ({ ...s, ptBalance: res?.balance ?? s.ptBalance + issueAmt }))
      }
      showToast('포인트 발행', `${issueAmt} pt 발행 완료`)
      setIssueMemo('')
    } catch (e) {
      showToast('발행 실패', e?.message || '포인트 발행에 실패했습니다')
    }
  }

  /* ── 이상 신고 처리 ── */
  const handleResolve = async () => {
    if (!resolveCode) { showToast('오류', '처리 결과를 선택하세요'); return }
    try {
      await apiFetch(`/flags/${resolveModal.flagId}/resolve`, {
        method: 'POST',
        body: { resolveCode, resolveNote },
      })
    } catch (e) {
      showToast('처리 실패', e?.message || '신고 처리에 실패했습니다')
      return
    }
    // 처리 후 신고 목록을 BE 기준으로 다시 가져와서 다른 신고도 최신 상태로 본다.
    try {
      const rows = await apiFetch('/flags')
      if (Array.isArray(rows)) setState(s => ({ ...s, flaggedRecords: rows, txLog: [{ time: new Date().toLocaleTimeString(), type: '처리', org: 'platform', desc: `${resolveModal.recordId} — 이상 신고 처리 (${RESOLVE_OPTIONS.find(o => o.code === resolveCode)?.label})` }, ...s.txLog] }))
    } catch {
      // 폴백: 로컬 상태만 갱신
      setState(s => ({
        ...s,
        flaggedRecords: (s.flaggedRecords || []).map(f =>
          f.flagId === resolveModal.flagId
            ? { ...f, status: 'RESOLVED', resolveCode, resolveNote, resolvedAt: new Date().toLocaleString() }
            : f
        ),
        txLog: [{ time: new Date().toLocaleTimeString(), type: '처리', org: 'platform', desc: `${resolveModal.recordId} — 이상 신고 처리 (${RESOLVE_OPTIONS.find(o => o.code === resolveCode)?.label})` }, ...s.txLog],
      }))
    }
    showToast('처리 완료', `${resolveModal.flagId} — ${RESOLVE_OPTIONS.find(o => o.code === resolveCode)?.label}`)
    setResolveModal(null)
    setResolveCode('')
    setResolveNote('')
  }

  const activeOrgs  = state.orgs.filter(o => o.status === 'active').length
  const pendingOrgs = state.orgs.filter(o => o.status === 'pending').length
  const flaggedRecords = state.flaggedRecords || []
  const pendingFlags   = flaggedRecords.filter(f => f.status === 'PENDING')
  const resolvedFlags  = flaggedRecords.filter(f => f.status === 'RESOLVED')

  const statusBadge = (status) => ({
    PENDING:  <span className="badge badge-warning">검토 대기</span>,
    REVIEWING:<span className="badge badge-brand">검토 중</span>,
    RESOLVED: <span className="badge badge-success">처리 완료</span>,
  }[status])

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <div className="pnav">
        <div style={{ fontSize: 16, fontWeight: 800, color: '#fff', paddingRight: 24, marginRight: 8, borderRight: '1px solid #2d3d25', letterSpacing: '-.03em' }}>
          PET<span style={{ color: '#b8885a' }}>CHAIN.</span>
          <span style={{ marginLeft: 12, fontSize: 10, background: 'rgba(184,136,90,.18)', color: '#e8d4b8', padding: '3px 10px', borderRadius: 20, fontWeight: 700, letterSpacing: '.14em' }}>ADMIN</span>
        </div>
        {tabs.map(t => (
          <button key={t.id} className={`pni ${tab === t.id ? 'on' : ''}`} onClick={() => setTab(t.id)}>
            {t.lbl}
            {t.badge > 0 && (
              <span style={{ marginLeft: 6, background: '#ef4444', color: '#fff', fontSize: 10, fontWeight: 800, padding: '1px 6px', borderRadius: 10 }}>
                {t.badge}
              </span>
            )}
          </button>
        ))}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 14 }}>
          <span style={{ fontSize: 13, color: '#8aaa84' }}>platform-admin</span>
          <button className="btn btn-ghost btn-sm" style={{ color: '#8aaa84', borderColor: '#2d3d25', background: 'transparent' }} onClick={onLogout}>
            로그아웃
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '36px 40px' }}>

        {/* ── Org 관리 ── */}
        {tab === 'org' && (
          <div className="fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 28 }}>
              <div>
                <div className="pane-h">Org 관리</div>
                <div className="pane-sub" style={{ marginBottom: 0 }}>병원·보험사 참여 승인 및 관리</div>
              </div>
              <button className="btn btn-primary" onClick={() => setRegModal(true)}>+ 보험사 등록</button>
            </div>

            {pendingOrgs > 0 && (
              <div className="alert alert-warning">
                ⚠️ 승인 대기 중인 Org가 {pendingOrgs}개 있습니다.
              </div>
            )}

            <div className="g3" style={{ marginBottom: 24 }}>
              {[
                { n: state.orgs.length, l: '전체 Org',   c: 'var(--brand)',   bg: 'var(--brand-xl)' },
                { n: activeOrgs,        l: '활성',        c: 'var(--success)', bg: 'var(--success-xl)' },
                { n: pendingOrgs,       l: '승인 대기',   c: 'var(--warning)', bg: 'var(--warning-xl)' },
              ].map((s, i) => (
                <div key={i} className="stat-box" style={{ background: s.bg, border: `1px solid ${s.c}22` }}>
                  <div className="stat-n" style={{ color: s.c }}>{s.n}</div>
                  <div className="stat-l" style={{ color: s.c, opacity: .75 }}>{s.l}</div>
                </div>
              ))}
            </div>

            <div className="card">
              <table className="tbl">
                <thead>
                  <tr><th>Org ID</th><th>이름</th><th>유형</th><th>Fabric Org ID</th><th>등록일</th><th>상태</th><th></th></tr>
                </thead>
                <tbody>
                  {state.orgs.map(o => (
                    <tr key={o.id}>
                      <td><span className="mono">{o.id}</span></td>
                      <td style={{ fontWeight: 700 }}>{o.name}</td>
                      <td><span className={`badge ${o.type === '병원' ? 'badge-orange' : 'badge-brand'}`}>{o.type}</span></td>
                      <td><span className="mono">{o.fabricOrg}</span></td>
                      <td style={{ color: 'var(--muted)', fontSize: 13 }}>{o.date}</td>
                      <td><span className={`badge ${o.status === 'active' ? 'badge-success' : 'badge-warning'}`}>{o.status === 'active' ? '활성' : '승인 대기'}</span></td>
                      <td>
                        {o.status === 'pending'
                          ? <button className="btn btn-primary btn-sm" onClick={() => handleApprove(o.id)}>승인</button>
                          : <button className="btn btn-ghost btn-sm" onClick={() => setOrgModal(o)}>관리</button>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── 포인트 발행 ── */}
        {tab === 'point' && (
          <div className="fade-in">
            <div className="pane-h" style={{ marginBottom: 28 }}>포인트 발행</div>
            <div className="g2">
              <div className="card">
                <div className="card-title">IssuePoint — 보험사에 포인트 발행</div>
                <label className="fl">대상 보험사</label>
                <select className="fi" value={issueTarget} onChange={e => setIssueTarget(e.target.value)}>
                  <option value="">-- 보험사 선택 --</option>
                  {state.orgs.filter(o => o.type === '보험사').map(o => (
                    <option key={o.id} value={o.id}>{o.id} · {o.name}</option>
                  ))}
                </select>
                <label className="fl">발행 수량</label>
                <input className="fi" type="number" value={issueAmt} onChange={e => setIssueAmt(Number(e.target.value))} />
                <label className="fl">메모</label>
                <input className="fi" placeholder="5월 정기 충전" value={issueMemo} onChange={e => setIssueMemo(e.target.value)} />
                <button className="btn btn-primary" style={{ width: '100%', padding: 13, fontSize: 14, fontWeight: 700 }} onClick={handleIssue}>
                  발행 실행
                </button>
              </div>
              <div className="card">
                <div className="card-title">보험사별 포인트 현황</div>
                <table className="tbl">
                  <thead><tr><th>보험사</th><th>잔여</th><th>소모</th></tr></thead>
                  <tbody>
                    {state.orgs.filter(o => o.type === '보험사').length === 0 && (
                      <tr><td colSpan={3} style={{ textAlign: 'center', color: 'var(--muted)', padding: 20 }}>등록된 보험사 없음</td></tr>
                    )}
                    {state.orgs.filter(o => o.type === '보험사').map(o => (
                      <tr key={o.id}>
                        <td style={{ fontWeight: 600 }}>{o.name}</td>
                        <td style={{ fontWeight: 800, color: 'var(--brand)' }}>{o.balance ?? 0}</td>
                        <td style={{ color: 'var(--danger)', fontWeight: 700 }}>{o.usedPoints ?? 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="divider" />
                <div className="card-title">병원 목록</div>
                <table className="tbl">
                  <thead><tr><th>병원</th><th>상태</th></tr></thead>
                  <tbody>
                    {state.orgs.filter(o => o.type === '병원').length === 0 && (
                      <tr><td colSpan={2} style={{ textAlign: 'center', color: 'var(--muted)', padding: 20 }}>등록된 병원 없음</td></tr>
                    )}
                    {state.orgs.filter(o => o.type === '병원').map(o => (
                      <tr key={o.id}>
                        <td style={{ fontWeight: 600 }}>{o.name}</td>
                        <td><span className={`badge ${o.status === 'active' ? 'badge-success' : 'badge-warning'}`}>{o.status === 'active' ? '활성' : '승인 대기'}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── 이상 신고 관리 (NEW) ── */}
        {tab === 'flag' && (
          <div className="fade-in">
            <div className="pane-h">이상 신고 관리</div>
            <div className="pane-sub">보험사가 심사 후 플랫폼에 전달한 이상 건을 검토·처리합니다</div>

            {/* 요약 */}
            <div className="g3" style={{ marginBottom: 24 }}>
              {[
                { n: flaggedRecords.length, l: '총 신고 건',   c: 'var(--text-2)', bg: 'var(--bg-2)' },
                { n: pendingFlags.length,   l: '검토 대기',    c: 'var(--warning)', bg: 'var(--warning-xl)' },
                { n: resolvedFlags.length,  l: '처리 완료',    c: 'var(--success)', bg: 'var(--success-xl)' },
              ].map((s, i) => (
                <div key={i} className="stat-box" style={{ background: s.bg, border: `1px solid ${s.c}22` }}>
                  <div className="stat-n" style={{ color: s.c }}>{s.n}</div>
                  <div className="stat-l" style={{ color: s.c, opacity: .75 }}>{s.l}</div>
                </div>
              ))}
            </div>

            {/* 검토 대기 */}
            {pendingFlags.length > 0 && (
              <div className="card" style={{ marginBottom: 20, borderTop: '3px solid var(--warning)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
                  <div className="card-title" style={{ margin: 0 }}>⚠️ 검토 대기</div>
                  <span className="badge badge-warning">{pendingFlags.length}건</span>
                </div>
                <table className="tbl">
                  <thead>
                    <tr><th>flag_id</th><th>record_id</th><th>반려동물</th><th>병원</th><th>신고 사유</th><th>신고 시각</th><th>상태</th><th></th></tr>
                  </thead>
                  <tbody>
                    {pendingFlags.map((f, i) => (
                      <tr key={i}>
                        <td><span className="mono">{f.flagId}</span></td>
                        <td><span className="mono">{f.recordId}</span></td>
                        <td style={{ fontWeight: 600 }}>{f.pet}</td>
                        <td>{f.hospital}</td>
                        <td>
                          <span className="badge badge-warning">{f.reasonLabel}</span>
                          {f.note && <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>{f.note}</div>}
                        </td>
                        <td style={{ fontSize: 13, color: 'var(--muted)' }}>{f.flaggedAt}</td>
                        <td>{statusBadge(f.status)}</td>
                        <td>
                          <button className="btn btn-primary btn-sm" onClick={() => { setResolveModal(f); setResolveCode(''); setResolveNote('') }}>
                            처리하기
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* 처리 완료 */}
            {resolvedFlags.length > 0 && (
              <div className="card" style={{ opacity: .85 }}>
                <div className="card-title">처리 완료 이력</div>
                <table className="tbl">
                  <thead>
                    <tr><th>flag_id</th><th>record_id</th><th>신고 사유</th><th>처리 결과</th><th>처리 시각</th></tr>
                  </thead>
                  <tbody>
                    {resolvedFlags.map((f, i) => (
                      <tr key={i}>
                        <td><span className="mono">{f.flagId}</span></td>
                        <td><span className="mono">{f.recordId}</span></td>
                        <td><span className="badge badge-muted">{f.reasonLabel}</span></td>
                        <td>
                          <span className="badge badge-success">
                            {RESOLVE_OPTIONS.find(o => o.code === f.resolveCode)?.label}
                          </span>
                          {f.resolveNote && <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>{f.resolveNote}</div>}
                        </td>
                        <td style={{ fontSize: 13, color: 'var(--muted)' }}>{f.resolvedAt}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {flaggedRecords.length === 0 && (
              <div className="card" style={{ textAlign: 'center', padding: 72 }}>
                <div style={{ fontSize: 44, marginBottom: 16 }}>✅</div>
                <div style={{ fontWeight: 800, fontSize: 17, marginBottom: 10 }}>이상 신고 없음</div>
                <div style={{ fontSize: 14, color: 'var(--muted)' }}>보험사가 심사 후 이상 건을 신고하면 이 목록에 표시됩니다</div>
              </div>
            )}
          </div>
        )}

        {/* ── 모니터링 ── */}
        {tab === 'monitor' && (
          <div className="fade-in">
            <div className="pane-h" style={{ marginBottom: 28 }}>모니터링</div>
            <div className="g4" style={{ marginBottom: 24 }}>
              {[
                { n: activeOrgs,            l: '활성 Org',     c: 'var(--brand)',   bg: 'var(--brand-xl)' },
                { n: state.verifyCount,     l: '총 검증 건',   c: 'var(--success)', bg: 'var(--success-xl)' },
                { n: pendingFlags.length,   l: '이상 신고 대기', c: 'var(--warning)', bg: 'var(--warning-xl)' },
                { n: state.ptBalance,       l: '포인트 잔액',  c: 'var(--orange)',  bg: 'var(--orange-xl)' },
              ].map((s, i) => (
                <div key={i} className="stat-box" style={{ background: s.bg, border: `1px solid ${s.c}22` }}>
                  <div className="stat-n" style={{ color: s.c }}>{s.n}</div>
                  <div className="stat-l" style={{ color: s.c, opacity: .75 }}>{s.l}</div>
                </div>
              ))}
            </div>

            {pendingFlags.length > 0 && (
              <div className="alert alert-warning" style={{ marginBottom: 20, cursor: 'pointer' }} onClick={() => setTab('flag')}>
                ⚠️ 처리 대기 중인 이상 신고가 {pendingFlags.length}건 있습니다. → 이상 신고 탭에서 확인하세요
              </div>
            )}

            <div className="card">
              <div className="card-title">최근 트랜잭션 (audit_logs)</div>
              <table className="tbl">
                <thead><tr><th>시각</th><th>유형</th><th>Org</th><th>내용</th></tr></thead>
                <tbody>
                  {state.txLog.length === 0 ? (
                    <tr><td colSpan={4} style={{ textAlign: 'center', color: 'var(--muted)', padding: 36 }}>트랜잭션 없음</td></tr>
                  ) : (
                    state.txLog.slice(0, 10).map((t, i) => (
                      <tr key={i}>
                        <td style={{ color: 'var(--muted)', fontSize: 13 }}>{t.time}</td>
                        <td>
                          <span className={`badge ${
                            t.type === '신고' ? 'badge-warning' :
                            t.type === '처리' ? 'badge-success' :
                            'badge-brand'
                          }`}>{t.type}</span>
                        </td>
                        <td><span className="mono">{t.org}</span></td>
                        <td style={{ color: 'var(--text-2)' }}>{t.desc}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ── Org 관리 모달 ── */}
      {orgModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 900, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: 18, padding: 32, width: '100%', maxWidth: 460, position: 'relative' }}>
            <button
              onClick={() => setOrgModal(null)}
              style={{ position: 'absolute', top: 16, right: 18, background: 'none', border: 'none', fontSize: 22, color: '#a1a1aa', cursor: 'pointer' }}
            >✕</button>

            <div style={{ fontSize: 19, fontWeight: 800, marginBottom: 4 }}>Org 관리</div>
            <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 20 }}>
              {orgModal.type} · {orgModal.name}
            </div>

            <div style={{ background: 'var(--bg-2)', borderRadius: 10, padding: '14px 16px', marginBottom: 20, fontSize: 13, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--muted)' }}>Org ID</span>
                <span className="mono">{orgModal.id}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--muted)' }}>이름</span>
                <span style={{ fontWeight: 600 }}>{orgModal.name}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--muted)' }}>유형</span>
                <span className={`badge ${orgModal.type === '병원' ? 'badge-orange' : 'badge-brand'}`}>{orgModal.type}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--muted)' }}>Fabric Org ID</span>
                <span className="mono">{orgModal.fabricOrg}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--muted)' }}>등록일</span>
                <span>{orgModal.date}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--muted)' }}>상태</span>
                <span className="badge badge-success">활성</span>
              </div>
              {orgModal.type === '보험사' && (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--muted)' }}>잔여 포인트</span>
                    <span style={{ fontWeight: 700, color: 'var(--brand)' }}>{orgModal.balance ?? 0}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--muted)' }}>소모 포인트</span>
                    <span style={{ fontWeight: 700, color: 'var(--danger)' }}>{orgModal.usedPoints ?? 0}</span>
                  </div>
                </>
              )}
            </div>

            <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 14, lineHeight: 1.6 }}>
              📌 비활성화하면 해당 계정의 로그인이 차단되고 Org 가 '승인 대기' 상태로 돌아갑니다. 재활성화는 같은 행의 '승인' 버튼으로 처리하세요.
            </div>

            <button
              className="btn btn-danger"
              style={{ width: '100%', padding: 13, fontSize: 14, fontWeight: 700, justifyContent: 'center', background: 'var(--danger)', color: '#fff', borderColor: 'var(--danger)' }}
              onClick={() => handleDeactivate(orgModal.id)}
            >
              비활성화 (승인 대기로 되돌리기)
            </button>
          </div>
        </div>
      )}

      {/* ── 보험사 등록 모달 ── */}
      {regModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 900, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: 18, padding: 32, width: '100%', maxWidth: 480, position: 'relative' }}>
            <button
              onClick={() => setRegModal(false)}
              style={{ position: 'absolute', top: 16, right: 18, background: 'none', border: 'none', fontSize: 22, color: '#a1a1aa', cursor: 'pointer' }}
            >✕</button>

            <div style={{ fontSize: 19, fontWeight: 800, marginBottom: 4 }}>보험사 등록</div>
            <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 20 }}>
              등록 후 같은 화면의 '승인' 버튼으로 활성화하세요
            </div>

            <label className="fl">보험사명</label>
            <input className="fi" placeholder="DB손해보험" value={regForm.name}
              onChange={e => setRegForm(f => ({ ...f, name: e.target.value }))} />

            <label className="fl">사업자등록번호</label>
            <input className="fi" placeholder="000-00-00000" value={regForm.businessNumber}
              onChange={e => setRegForm(f => ({ ...f, businessNumber: e.target.value }))} />

            <label className="fl">Fabric Org ID (로그인 ID)</label>
            <input className="fi" placeholder="db-insurance" value={regForm.fabricOrgId}
              onChange={e => setRegForm(f => ({ ...f, fabricOrgId: e.target.value }))} />

            <label className="fl">관리자 이메일</label>
            <input className="fi" type="email" placeholder="admin@db-insurance.com" value={regForm.adminEmail}
              onChange={e => setRegForm(f => ({ ...f, adminEmail: e.target.value }))} />

            <label className="fl">비밀번호</label>
            <input className="fi" type="password" placeholder="8자 이상" value={regForm.password}
              onChange={e => setRegForm(f => ({ ...f, password: e.target.value }))} />

            <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 14, lineHeight: 1.6 }}>
              📌 보험사 회원가입 페이지는 따로 없습니다. 신규 보험사는 플랫폼 관리자가 직접 등록한 뒤 승인합니다.
            </div>

            <button
              className="btn btn-primary"
              style={{ width: '100%', padding: 13, fontSize: 14, fontWeight: 700, justifyContent: 'center' }}
              onClick={handleRegisterInsurer}
              disabled={regBusy}
            >
              {regBusy ? '등록 중…' : '보험사 등록'}
            </button>
          </div>
        </div>
      )}

      {/* ── 이상 신고 처리 모달 ── */}
      {resolveModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 900, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: 18, padding: 32, width: '100%', maxWidth: 480, position: 'relative' }}>
            <button
              onClick={() => { setResolveModal(null); setResolveCode(''); setResolveNote('') }}
              style={{ position: 'absolute', top: 16, right: 18, background: 'none', border: 'none', fontSize: 22, color: '#a1a1aa', cursor: 'pointer' }}
            >✕</button>

            <div style={{ fontSize: 19, fontWeight: 800, marginBottom: 4 }}>이상 신고 처리</div>
            <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 20 }}>
              {resolveModal.flagId} — {resolveModal.reasonLabel}
            </div>

            {/* 신고 내용 요약 */}
            <div style={{ background: 'var(--warning-xl)', borderRadius: 10, padding: '12px 16px', marginBottom: 20, fontSize: 13, display: 'flex', flexDirection: 'column', gap: 6, borderLeft: '3px solid var(--warning)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--muted)' }}>record_id</span>
                <span className="mono">{resolveModal.recordId}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--muted)' }}>신고 사유</span>
                <span style={{ fontWeight: 600 }}>{resolveModal.reasonLabel}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--muted)' }}>병원</span>
                <span>{resolveModal.hospital}</span>
              </div>
              {resolveModal.note && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <span style={{ color: 'var(--muted)' }}>보험사 메모</span>
                  <span style={{ fontStyle: 'italic' }}>"{resolveModal.note}"</span>
                </div>
              )}
            </div>

            {/* 처리 결과 선택 */}
            <label className="fl">처리 결과 <span style={{ color: 'var(--danger)' }}>*</span></label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
              {RESOLVE_OPTIONS.map(o => (
                <label key={o.code} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 14px', borderRadius: 8, cursor: 'pointer',
                  border: `1.5px solid ${resolveCode === o.code ? 'var(--brand)' : 'var(--border)'}`,
                  background: resolveCode === o.code ? 'var(--brand-xl)' : '#fff',
                  transition: 'all .15s',
                }}>
                  <input
                    type="radio" name="resolveCode" value={o.code}
                    checked={resolveCode === o.code}
                    onChange={() => setResolveCode(o.code)}
                    style={{ accentColor: 'var(--brand)' }}
                  />
                  <span style={{ fontSize: 14, fontWeight: resolveCode === o.code ? 600 : 400 }}>{o.label}</span>
                </label>
              ))}
            </div>

            <label className="fl">처리 메모 (선택)</label>
            <textarea
              className="fi"
              rows={3}
              placeholder="처리 내용이나 후속 조치를 입력하세요"
              value={resolveNote}
              onChange={e => setResolveNote(e.target.value)}
              style={{ resize: 'vertical' }}
            />

            <button
              className="btn btn-primary"
              style={{ width: '100%', padding: 13, fontSize: 14, fontWeight: 700, justifyContent: 'center' }}
              onClick={handleResolve}
            >
              처리 완료로 기록
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
