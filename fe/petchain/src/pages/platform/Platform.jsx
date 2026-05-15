import { useState } from 'react'
import { useApp } from '../../context/AppContext'

export default function Platform({ showToast, onLogout }) {
  const { state, setState } = useApp()
  const [tab, setTab]       = useState('org')
  const [issueAmt, setIssueAmt] = useState(500)

  const tabs = [
    { id: 'org',     lbl: 'Org 관리' },
    { id: 'point',   lbl: '포인트 발행' },
    { id: 'code',    lbl: '표준 코드' },
    { id: 'monitor', lbl: '모니터링' },
  ]

  const handleApprove = (id) => {
    setState(s => ({
      ...s,
      orgs: s.orgs.map(o => o.id === id ? { ...o, status: 'active' } : o),
    }))
    showToast('Org 승인', `${id} — 활성 상태로 변경됨`)
  }

  const handleIssue = () => {
    setState(s => ({ ...s, ptBalance: s.ptBalance + issueAmt }))
    showToast('포인트 발행', `DB손해보험에 ${issueAmt} pt 발행 완료`)
  }

  const activeOrgs = state.orgs.filter(o => o.status === 'active').length
  const pendingOrgs = state.orgs.filter(o => o.status === 'pending').length

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      {/* Platform Nav */}
      <div className="pnav">
        <div style={{ fontSize: 16, fontWeight: 800, color: '#fff', paddingRight: 24, marginRight: 8, borderRight: '1px solid #2d2d3d' }}>
          🐾 Pet<span style={{ color: '#818cf8' }}>Chain</span>
          <span style={{ marginLeft: 10, fontSize: 11, background: '#312e81', color: '#818cf8', padding: '2px 10px', borderRadius: 20, fontWeight: 700 }}>ADMIN</span>
        </div>
        {tabs.map(t => (
          <button key={t.id} className={`pni ${tab === t.id ? 'on' : ''}`} onClick={() => setTab(t.id)}>
            {t.lbl}
            {t.id === 'org' && pendingOrgs > 0 && (
              <span style={{ marginLeft: 6, background: '#ef4444', color: '#fff', fontSize: 10, fontWeight: 800, padding: '1px 6px', borderRadius: 10 }}>
                {pendingOrgs}
              </span>
            )}
          </button>
        ))}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 14 }}>
          <span style={{ fontSize: 13, color: '#6b7280', fontWeight: 500 }}>platform-admin</span>
          <button
            className="btn btn-ghost btn-sm"
            style={{ color: '#6b7280', borderColor: '#2d2d3d', background: 'transparent' }}
            onClick={onLogout}
          >
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
              <button className="btn btn-primary">+ Org 등록</button>
            </div>

            {pendingOrgs > 0 && (
              <div className="alert alert-warning">
                ⚠️ 승인 대기 중인 Org가 {pendingOrgs}개 있습니다. 확인 후 승인해주세요.
              </div>
            )}

            <div className="g3" style={{ marginBottom: 24 }}>
              {[
                { n: state.orgs.length, l: '전체 Org', c: 'var(--brand)', bg: 'var(--brand-xl)' },
                { n: activeOrgs,        l: '활성',     c: 'var(--success)', bg: 'var(--success-xl)' },
                { n: pendingOrgs,       l: '승인 대기', c: 'var(--warning)', bg: 'var(--warning-xl)' },
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
                      <td style={{ fontWeight: 700, color: 'var(--text)' }}>{o.name}</td>
                      <td>
                        <span className={`badge ${o.type === '병원' ? 'badge-orange' : 'badge-brand'}`}>{o.type}</span>
                      </td>
                      <td><span className="mono">{o.fabricOrg}</span></td>
                      <td style={{ color: 'var(--muted)', fontSize: 13 }}>{o.date}</td>
                      <td>
                        <span className={`badge ${o.status === 'active' ? 'badge-success' : 'badge-warning'}`}>
                          {o.status === 'active' ? '활성' : '승인 대기'}
                        </span>
                      </td>
                      <td>
                        {o.status === 'pending'
                          ? <button className="btn btn-primary btn-sm" onClick={() => handleApprove(o.id)}>승인</button>
                          : <button className="btn btn-ghost btn-sm">관리</button>}
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
                <select className="fi">
                  <option>ins-001 · DB손해보험</option>
                  <option>ins-002 · 현대해상</option>
                </select>
                <label className="fl">발행 수량</label>
                <input
                  className="fi" type="number"
                  value={issueAmt}
                  onChange={e => setIssueAmt(Number(e.target.value))}
                />
                <label className="fl">메모</label>
                <input className="fi" placeholder="5월 정기 충전" />
                <button
                  className="btn btn-primary"
                  style={{ width: '100%', padding: 13, fontSize: 14, fontWeight: 700 }}
                  onClick={handleIssue}
                >
                  발행 실행
                </button>
              </div>

              <div className="card">
                <div className="card-title">보험사별 포인트 현황</div>
                <table className="tbl">
                  <thead><tr><th>보험사</th><th>잔여</th><th>소모</th></tr></thead>
                  <tbody>
                    <tr>
                      <td style={{ fontWeight: 600 }}>DB손해보험</td>
                      <td style={{ fontWeight: 800, color: 'var(--brand)' }}>{state.ptBalance}</td>
                      <td style={{ color: 'var(--danger)', fontWeight: 700 }}>{state.usedPt}</td>
                    </tr>
                    <tr>
                      <td style={{ fontWeight: 600 }}>현대해상</td>
                      <td style={{ color: 'var(--muted)' }}>0</td>
                      <td style={{ color: 'var(--muted)' }}>0</td>
                    </tr>
                  </tbody>
                </table>
                <div className="divider" />
                <div className="card-title">병원 크레딧 현황</div>
                <table className="tbl">
                  <thead><tr><th>병원</th><th>크레딧</th></tr></thead>
                  <tbody>
                    <tr>
                      <td style={{ fontWeight: 600 }}>행복동물병원</td>
                      <td style={{ fontWeight: 800, color: 'var(--success)' }}>{state.creditN}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── 표준 코드 ── */}
        {tab === 'code' && (
          <div className="fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 28 }}>
              <div>
                <div className="pane-h">표준 코드 관리</div>
                <div className="pane-sub" style={{ marginBottom: 0 }}>질병·진료 행위 코드를 등록·수정합니다</div>
              </div>
              <button className="btn btn-primary">+ 코드 추가</button>
            </div>
            <div className="g2">
              <div className="card">
                <div className="card-title">질병 코드 (disease_codes)</div>
                <table className="tbl">
                  <thead><tr><th>코드</th><th>한글명</th><th>카테고리</th><th></th></tr></thead>
                  <tbody>
                    {[['KC-001','피부염','피부'], ['KC-042','골절','근골격'], ['KC-055','관절염','근골격'], ['KC-108','슬개골 탈구','근골격']].map(([c,n,k]) => (
                      <tr key={c}>
                        <td><span className="mono">{c}</span></td>
                        <td style={{ fontWeight: 600, color: 'var(--text)' }}>{n}</td>
                        <td><span className="badge badge-muted">{k}</span></td>
                        <td><button className="btn btn-ghost btn-sm">수정</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="card">
                <div className="card-title">진료 행위 코드 (treatment_codes)</div>
                <table className="tbl">
                  <thead><tr><th>코드</th><th>한글명</th><th>카테고리</th><th></th></tr></thead>
                  <tbody>
                    {[['VA-011','X-ray 촬영','영상검사'], ['VA-025','수술','처치'], ['VA-032','약물 처방','처방']].map(([c,n,k]) => (
                      <tr key={c}>
                        <td><span className="mono">{c}</span></td>
                        <td style={{ fontWeight: 600, color: 'var(--text)' }}>{n}</td>
                        <td><span className="badge badge-muted">{k}</span></td>
                        <td><button className="btn btn-ghost btn-sm">수정</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── 모니터링 ── */}
        {tab === 'monitor' && (
          <div className="fade-in">
            <div className="pane-h" style={{ marginBottom: 28 }}>모니터링</div>
            <div className="g4" style={{ marginBottom: 24 }}>
              {[
                { n: activeOrgs,        l: '활성 Org',   c: 'var(--brand)',   bg: 'var(--brand-xl)' },
                { n: state.verifyCount, l: '총 검증 건', c: 'var(--success)', bg: 'var(--success-xl)' },
                { n: 0,                 l: '이상 호출',  c: 'var(--danger)',  bg: 'var(--danger-xl)' },
                { n: state.ptBalance,   l: '포인트 잔액', c: 'var(--orange)', bg: 'var(--orange-xl)' },
              ].map((s, i) => (
                <div key={i} className="stat-box" style={{ background: s.bg, border: `1px solid ${s.c}22` }}>
                  <div className="stat-n" style={{ color: s.c }}>{s.n}</div>
                  <div className="stat-l" style={{ color: s.c, opacity: .75 }}>{s.l}</div>
                </div>
              ))}
            </div>

            <div className="card">
              <div className="card-title">최근 트랜잭션 (audit_logs)</div>
              <table className="tbl">
                <thead><tr><th>시각</th><th>유형</th><th>Org</th><th>내용</th></tr></thead>
                <tbody>
                  {state.txLog.length === 0 ? (
                    <tr>
                      <td colSpan={4} style={{ textAlign: 'center', color: 'var(--muted)', padding: 36 }}>
                        트랜잭션 없음
                      </td>
                    </tr>
                  ) : (
                    state.txLog.slice(0, 10).map((t, i) => (
                      <tr key={i}>
                        <td style={{ color: 'var(--muted)', fontSize: 13 }}>{t.time}</td>
                        <td><span className="badge badge-brand">{t.type}</span></td>
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
    </div>
  )
}
