import { useState, useRef, useEffect } from 'react'
import Overlay from '../../components/common/Overlay'
import { useApp, generatePetId } from '../../context/AppContext'
import apiFetch from '../../api/client'

/* ─── CSS ───────────────────────────────────────────────────────── */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Pretendard:wght@300;400;500;600&display=swap');

:root {
  --font: 'Pretendard', -apple-system, BlinkMacSystemFont, sans-serif;
  --mono: 'SF Mono', 'Fira Mono', monospace;
  --bg: #f2f2f0;
  --bg-2: #eaeae7;
  --surface: #ffffff;
  --border: #e2e2dd;
  --border-d: #c8c8c0;
  --text: #1a1a18;
  --text-2: #5a5a55;
  --muted: #98988f;
  --muted-l: #c8c8c0;
  --brand: #2563eb;
  --brand-l: #bfdbfe;
  --brand-xl: #eff6ff;
  --success: #16a34a;
  --success-xl: #f0fdf4;
  --warning: #d97706;
  --warning-xl: #fffbeb;
  --danger: #dc2626;
  --danger-xl: #fef2f2;
  --shadow-sm: 0 1px 3px rgba(0,0,0,0.05);
  --shadow-md: 0 2px 8px rgba(0,0,0,0.07);
  --shadow-lg: 0 8px 24px rgba(0,0,0,0.08);
}

/* ── 레이아웃 ── */
body { font-family: var(--font) !important; background: var(--bg) !important; color: var(--text) !important; }
.gd-shell { display: flex; height: 100vh; overflow: hidden; font-family: var(--font); }

/* ── 사이드바 ── */
.gd-sidebar {
  width: 200px; flex-shrink: 0;
  background: var(--surface);
  border-right: 1px solid var(--border);
  display: flex; flex-direction: column;
}
.gd-logo { padding: 22px 20px 18px; border-bottom: 1px solid var(--border); margin-bottom: 8px; }
.gd-logo-name { font-size: 15px; font-weight: 600; letter-spacing: -0.3px; color: var(--text); }
.gd-logo-sub { font-size: 12px; color: var(--muted); margin-top: 2px; }
.gd-nav { padding: 0 8px; flex: 1; display: flex; flex-direction: column; gap: 2px; overflow-y: auto; }
.gd-nav-item {
  display: flex; align-items: center; gap: 10px;
  padding: 9px 12px; border-radius: 8px;
  font-size: 14px; color: var(--text-2);
  cursor: pointer; border: none; background: transparent;
  width: 100%; text-align: left; font-family: var(--font);
  transition: background 0.1s, color 0.1s;
}
.gd-nav-item:hover { background: var(--bg); color: var(--text); }
.gd-nav-item.active { background: var(--bg); color: var(--text); font-weight: 500; }
.gd-nav-icon { font-size: 15px; width: 20px; text-align: center; flex-shrink: 0; }
.gd-bottom { padding: 16px 20px; border-top: 1px solid var(--border); }
.gd-user-name { font-size: 14px; font-weight: 600; color: var(--text); }
.gd-user-region { font-size: 12px; color: var(--muted); margin-top: 2px; }
.gd-logout { font-size: 12px; color: var(--muted); cursor: pointer; margin-top: 8px; border: none; background: none; font-family: var(--font); padding: 0; transition: color 0.1s; }
.gd-logout:hover { color: var(--danger); }

/* ── 메인 ── */
.gd-main { flex: 1; overflow-y: auto; padding: 36px 40px; background: var(--bg); }

/* ── 헤딩 ── */
.pane-h { font-size: 24px !important; font-weight: 600 !important; letter-spacing: -0.5px !important; color: var(--text) !important; margin-bottom: 6px !important; }
.pane-sub { font-size: 15px !important; color: var(--text-2) !important; font-weight: 400 !important; margin-bottom: 24px !important; }

/* ── 카드 ── */
.card {
  background: var(--surface) !important;
  border: 1px solid var(--border) !important;
  border-radius: 14px !important;
  box-shadow: none !important;
  padding: 22px !important;
}

/* ── stat-box ── */
.stat-box {
  background: var(--surface) !important;
  border: 1px solid var(--border) !important;
  border-radius: 14px !important;
  box-shadow: none !important;
}
.stat-n { font-size: 36px !important; font-weight: 500 !important; letter-spacing: -1.5px !important; }
.stat-l { font-size: 14px !important; margin-top: 4px !important; }

/* ── 버튼 ── */
.btn {
  font-family: var(--font) !important;
  font-size: 14px !important;
  font-weight: 500 !important;
  border-radius: 8px !important;
  letter-spacing: -0.1px !important;
}
.btn-primary {
  background: var(--text) !important;
  color: #fff !important;
  border-color: var(--text) !important;
}
.btn-primary:hover { background: #2e2e2e !important; }
.btn-ghost {
  background: transparent !important;
  border: 1px solid var(--border) !important;
  color: var(--text-2) !important;
}
.btn-ghost:hover { background: var(--bg) !important; color: var(--text) !important; border-color: var(--border-d) !important; }
.btn-sm { font-size: 13px !important; padding: 6px 12px !important; }

/* ── 배지 ── */
.badge { font-size: 12px !important; font-weight: 500 !important; border-radius: 20px !important; padding: 3px 9px !important; }
.badge-brand   { background: var(--brand-xl)   !important; color: var(--brand)   !important; }
.badge-success { background: var(--success-xl) !important; color: var(--success) !important; }
.badge-warning { background: var(--warning-xl) !important; color: var(--warning) !important; }
.badge-danger  { background: var(--danger-xl)  !important; color: var(--danger)  !important; }
.badge-muted   { background: var(--bg-2) !important; color: var(--muted) !important; border: 1px solid var(--border) !important; }
.badge-orange  { background: #fff7ed !important; color: #c2410c !important; }

/* ── 테이블 ── */
.tbl th { font-size: 13px !important; color: var(--muted) !important; font-weight: 500 !important; background: var(--bg) !important; }
.tbl td { font-size: 15px !important; }
.tbl tr:hover td { background: var(--bg) !important; }

/* ── 폼 ── */
.fi {
  font-family: var(--font) !important;
  font-size: 15px !important;
  border: 1px solid var(--border) !important;
  background: var(--bg) !important;
  border-radius: 8px !important;
  color: var(--text) !important;
  padding: 10px 12px !important;
}
.fi:focus { border-color: var(--border-d) !important; background: var(--surface) !important; outline: none !important; }
.fl { font-size: 13px !important; color: var(--text-2) !important; font-weight: 500 !important; margin-bottom: 6px !important; }

/* ── 토글 ── */
.toggle-slider { background: #d1d5db !important; }
.toggle input:checked + .toggle-slider { background: var(--success) !important; }

/* ── alert ── */
.alert-info    { background: var(--brand-xl) !important; color: #1e40af !important; border: 1px solid var(--brand-l) !important; border-radius: 10px !important; font-size: 14px !important; }
.alert-warning { background: var(--warning-xl) !important; border: 1px solid #fde68a !important; border-radius: 10px !important; font-size: 14px !important; }

/* ── consent banners ── */
.consent-active-banner  { background: var(--success-xl) !important; color: var(--success) !important; border-radius: 8px !important; font-size: 14px !important; padding: 10px 14px !important; }
.consent-revoked-banner { background: var(--danger-xl)  !important; color: var(--danger)  !important; border-radius: 8px !important; font-size: 14px !important; padding: 10px 14px !important; }

/* ── mono ── */
.mono { font-family: var(--mono) !important; font-size: 12px !important; color: var(--text-2) !important; }

/* ── divider ── */
.divider { border: none !important; border-top: 1px solid var(--border) !important; margin: 14px 0 !important; }
.row-flex { display: flex !important; justify-content: space-between !important; align-items: center !important; padding: 5px 0 !important; font-size: 15px !important; }

/* ── upload-zone ── */
.upload-zone { border: 1.5px dashed var(--border-d) !important; border-radius: 10px !important; font-size: 14px !important; color: var(--text-2) !important; }

/* ── Overlay ── */
.overlay-panel, [class*="overlay"] > div {
  border-radius: 16px !important;
  border: 1px solid var(--border) !important;
  box-shadow: var(--shadow-lg) !important;
  font-family: var(--font) !important;
}

/* ── fi-note ── */
.fi-note { font-size: 13px !important; color: var(--muted) !important; }

/* ── tl-row ── */
.tl-row { display: flex; align-items: flex-start; gap: 14px; padding: 14px 0; border-bottom: 1px solid var(--border); }
.tl-row:last-child { border-bottom: none; }
.tl-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; margin-top: 5px; }

/* ── fade ── */
@keyframes fadeUp { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: none; } }
.fade-in { animation: fadeUp 0.18s ease; }
`

/* ─── 상수 ──────────────────────────────────────────────────────── */
const REGIONS = [
  '서울특별시','부산광역시','대구광역시','인천광역시','광주광역시',
  '대전광역시','울산광역시','세종특별자치시',
  '경기도','강원도','충청북도','충청남도',
  '전라북도','전라남도','경상북도','경상남도','제주특별자치도',
]
const INSURERS = [
  { id:'ins-001', name:'DB손해보험', logo:'🛡️' },
  { id:'ins-002', name:'현대해상',   logo:'🛡️' },
  { id:'ins-003', name:'KB손해보험', logo:'🛡️' },
  { id:'ins-004', name:'메리츠화재', logo:'🛡️' },
]
const PAGE_SIZE = 7
const MONTHS = ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월']
const NAV = [
  { key:'home',      label:'내 반려동물', icon:'🐾' },
  { key:'records',   label:'진료기록',    icon:'📋' },
  { key:'consent',   label:'동의 관리',   icon:'🛡️' },
  { key:'status',    label:'청구 상태',   icon:'📄' },
  { key:'community', label:'커뮤니티',    icon:'💬' },
  { key:'ranking',   label:'지역 랭킹',   icon:'🏆' },
  { key:'myinfo',    label:'내 정보',     icon:'👤' },
]
const REGION_PINS = [
  { name:'서울특별시',x:128,y:150,label:'서울' },
  { name:'인천광역시',x:88,y:163,label:'인천' },
  { name:'경기도',x:132,y:202,label:'경기' },
  { name:'강원도',x:220,y:148,label:'강원' },
  { name:'세종특별자치시',x:152,y:267,label:'세종' },
  { name:'대전광역시',x:140,y:284,label:'대전' },
  { name:'충청북도',x:192,y:262,label:'충북' },
  { name:'충청남도',x:105,y:274,label:'충남' },
  { name:'전라북도',x:118,y:350,label:'전북' },
  { name:'광주광역시',x:115,y:406,label:'광주' },
  { name:'전라남도',x:133,y:444,label:'전남' },
  { name:'대구광역시',x:236,y:347,label:'대구' },
  { name:'경상북도',x:228,y:280,label:'경북' },
  { name:'경상남도',x:218,y:417,label:'경남' },
  { name:'울산광역시',x:261,y:377,label:'울산' },
  { name:'부산광역시',x:249,y:434,label:'부산' },
  { name:'제주특별자치도',x:148,y:502,label:'제주' },
]

const speciesIcon = s => s==='강아지'?'🐶':s==='고양이'?'🐱':s==='토끼'?'🐰':'🐾'

/* ── ConsentCard ── */
function ConsentCard({ c, onToggle }) {
  const isActive  = c.status === 'active'
  const isPending = c.status === 'pending'
  return (
    <div className="card" style={{
      borderLeft: `3px solid ${isActive ? 'var(--success)' : isPending ? 'var(--warning)' : 'var(--border-d)'}`,
      opacity: isPending ? .75 : 1,
      background: isActive ? 'var(--success-xl)' : c.status === 'revoked' ? '#fafaf9' : 'var(--surface)',
    }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <div style={{ flex:1 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:6 }}>
            <span style={{ fontSize:16, fontWeight:600 }}>{c.pet}</span>
            <span style={{ color:'var(--muted)' }}>·</span>
            <span style={{ fontSize:15, color:'var(--text-2)' }}>{c.disease}</span>
          </div>
          <div style={{ fontSize:13, color:'var(--muted)', display:'flex', gap:12, flexWrap:'wrap' }}>
            <span>🏥 {c.hospital}</span>
            <span className="mono">{c.recordId}</span>
            <span>💰 {c.cost.toLocaleString()}원</span>
            <span>🛡️ {c.insurerName}</span>
          </div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:12, marginLeft:20, flexShrink:0 }}>
          <span style={{ fontSize:13, fontWeight:500, color:isActive?'var(--success)':isPending?'var(--warning)':'var(--muted)' }}>
            {isActive?'동의 중':isPending?'대기 중':'동의 안 함'}
          </span>
          <label className="toggle">
            <input type="checkbox" checked={isActive} disabled={isPending} onChange={() => onToggle(c.recordId)} />
            <span className="toggle-slider" />
          </label>
        </div>
      </div>
      {isActive  && <div className="consent-active-banner"  style={{ marginTop:10 }}>✅ <strong>{c.insurerName}</strong>에 서류 자동 전달 중 · 보험사 검증 가능 상태</div>}
      {c.status==='revoked' && <div className="consent-revoked-banner" style={{ marginTop:10 }}>⛔ 동의 철회됨 — <strong>{c.insurerName}</strong> 신규 접근 차단 · 토글 ON으로 재동의 가능</div>}
      {isPending && <div className="alert alert-warning" style={{ marginTop:10 }}>⏳ 병원이 진료기록을 아직 등록하지 않았습니다. 등록 후 동의 가능합니다.</div>}
    </div>
  )
}

/* ── MonthPicker ── */
function MonthPicker({ selectedYear, selectedMonth, onChange, onClear }) {
  const [open, setOpen]         = useState(false)
  const [viewYear, setViewYear] = useState(selectedYear || new Date().getFullYear())
  const label = selectedYear ? `${selectedYear}년 ${selectedMonth}월` : '전체 기간'
  return (
    <div style={{ position:'relative' }}>
      <button className="btn btn-ghost btn-sm" onClick={() => setOpen(o => !o)} style={{ display:'flex', alignItems:'center', gap:6, minWidth:130 }}>
        📅 {label} <span style={{ fontSize:10, color:'var(--muted)' }}>▼</span>
      </button>
      {open && (
        <div style={{ position:'absolute', top:'calc(100% + 6px)', right:0, zIndex:200, background:'var(--surface)', border:'1px solid var(--border)', borderRadius:14, boxShadow:'var(--shadow-lg)', padding:18, width:260 }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
            <button className="btn btn-ghost btn-sm" onClick={() => setViewYear(y => y-1)}>←</button>
            <span style={{ fontWeight:600, fontSize:16 }}>{viewYear}년</span>
            <button className="btn btn-ghost btn-sm" onClick={() => setViewYear(y => y+1)}>→</button>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:6 }}>
            {MONTHS.map((m, i) => {
              const mon = i+1
              const isSel = selectedYear===viewYear && selectedMonth===mon
              return (
                <button key={mon} onClick={() => { isSel?onClear():onChange(viewYear,mon); setOpen(false) }}
                  style={{ padding:'8px 4px', borderRadius:8, border:'none', cursor:'pointer', fontSize:14, fontWeight:isSel?600:400, background:isSel?'var(--brand)':'transparent', color:isSel?'#fff':'var(--text)', transition:'background .12s', fontFamily:'var(--font)' }}
                  onMouseEnter={e => { if (!isSel) e.currentTarget.style.background='var(--brand-xl)' }}
                  onMouseLeave={e => { if (!isSel) e.currentTarget.style.background='transparent' }}
                >{m}</button>
              )
            })}
          </div>
          <button className="btn btn-ghost btn-sm" style={{ width:'100%', justifyContent:'center', marginTop:12 }} onClick={() => { onClear(); setOpen(false) }}>전체 기간 보기</button>
        </div>
      )}
    </div>
  )
}

/* ── RecordsTab ── */
function RecordsTab({ records, onDetail }) {
  const [page, setPage]             = useState(0)
  const [filterYear, setFilterYear] = useState(null)
  const [filterMonth,setFilterMonth]= useState(null)
  const filtered   = records.filter(r => { if (!filterYear) return true; const p=r.date.split('.'); return Number(p[0])===filterYear && Number(p[1])===filterMonth })
  const totalPages = Math.max(1, Math.ceil(filtered.length/PAGE_SIZE))
  const safePage   = Math.min(page, totalPages-1)
  const paged      = filtered.slice(safePage*PAGE_SIZE, (safePage+1)*PAGE_SIZE)
  const handleMonthChange = (y,m) => { setFilterYear(y); setFilterMonth(m); setPage(0) }
  const handleClear = () => { setFilterYear(null); setFilterMonth(null); setPage(0) }
  return (
    <div className="fade-in">
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom:24 }}>
        <div>
          <div className="pane-h">진료기록 확인</div>
          <div className="pane-sub" style={{ marginBottom:0 }}>행을 클릭하면 소견을 볼 수 있습니다</div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          {filterYear && <span className="badge badge-brand">{filterYear}년 {filterMonth}월 · {filtered.length}건</span>}
          <MonthPicker selectedYear={filterYear} selectedMonth={filterMonth} onChange={handleMonthChange} onClear={handleClear} />
        </div>
      </div>
      <div className="card" style={{ padding:0, overflow:'hidden' }}>
        <table className="tbl">
          <thead><tr><th>기록 ID</th><th>반려동물</th><th>진료일</th><th>질병 코드</th><th>진료비</th><th>블록체인</th><th></th></tr></thead>
          <tbody>
            {paged.length===0 ? (
              <tr><td colSpan={7} style={{ textAlign:'center', color:'var(--muted)', padding:56 }}>
                <div style={{ fontSize:30, marginBottom:10 }}>📋</div>
                <div style={{ fontWeight:500, fontSize:15 }}>{filterYear?`${filterYear}년 ${filterMonth}월 진료기록이 없습니다`:'등록된 진료기록이 없습니다'}</div>
              </td></tr>
            ) : paged.map(r => (
              <tr key={r.id} style={{ cursor:'pointer' }} onClick={() => onDetail(r)}>
                <td><span className="mono">{r.id}</span></td>
                <td style={{ fontWeight:500 }}>{r.petName}</td>
                <td style={{ color:'var(--text-2)' }}>{r.date}</td>
                <td>{r.diseases.join(', ')}</td>
                <td style={{ fontWeight:500 }}>{r.cost.toLocaleString()}원</td>
                <td><span className={`badge ${r.onChain?'badge-success':'badge-warning'}`}>{r.onChain?'원장 기록':'미기록'}</span></td>
                <td><button className="btn btn-ghost btn-sm" onClick={e => { e.stopPropagation(); onDetail(r) }}>상세</button></td>
              </tr>
            ))}
          </tbody>
        </table>
        {totalPages>1 && (
          <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:6, padding:'14px 16px', borderTop:'1px solid var(--border)' }}>
            <button className="btn btn-ghost btn-sm" disabled={safePage===0} onClick={() => setPage(safePage-1)}>← 이전</button>
            {Array.from({length:totalPages},(_,i) => (
              <button key={i} className="btn btn-sm" onClick={() => setPage(i)}
                style={{ minWidth:34, background:i===safePage?'var(--brand)':'transparent', color:i===safePage?'#fff':'var(--text)', border:i===safePage?'none':'1px solid var(--border)', fontWeight:i===safePage?600:400 }}>{i+1}</button>
            ))}
            <button className="btn btn-ghost btn-sm" disabled={safePage===totalPages-1} onClick={() => setPage(safePage+1)}>다음 →</button>
          </div>
        )}
      </div>
    </div>
  )
}

/* ── MyInfoTab ── */
function MyInfoTab({ state, update, showToast }) {
  const [name,   setName]   = useState('홍길동')
  const [email,  setEmail]  = useState('hong@email.com')
  const [phone,  setPhone]  = useState('010-1234-5678')
  const [region, setRegion] = useState(state.userRegion)
  const handleSave = () => { update({ userRegion:region }); showToast('저장 완료','내 정보가 업데이트되었습니다') }
  const toggleInsurer = id => {
    const next = state.userInsurers.includes(id) ? state.userInsurers.filter(i=>i!==id) : [...state.userInsurers, id]
    update({ userInsurers:next })
  }
  return (
    <div className="fade-in">
      <div className="pane-h">내 정보</div>
      <div className="pane-sub">기본 정보와 연결 보험사를 관리합니다</div>
      <div className="g2" style={{ alignItems:'start' }}>
        <div className="card">
          <div style={{ fontSize:13, fontWeight:500, color:'var(--muted)', marginBottom:18, textTransform:'uppercase', letterSpacing:'0.4px' }}>기본 정보</div>
          <div className="fi-row">
            <div><label className="fl">이름</label><input className="fi" value={name} onChange={e=>setName(e.target.value)} /></div>
            <div><label className="fl">전화번호</label><input className="fi" value={phone} onChange={e=>setPhone(e.target.value)} /></div>
          </div>
          <label className="fl">이메일</label>
          <input className="fi" type="email" value={email} onChange={e=>setEmail(e.target.value)} />
          <label className="fl">거주 지역</label>
          <select className="fi" value={region} onChange={e=>setRegion(e.target.value)}>
            {REGIONS.map(r=><option key={r} value={r}>{r}</option>)}
          </select>
          <button className="btn btn-primary" style={{ width:'100%', justifyContent:'center', padding:12, marginTop:4 }} onClick={handleSave}>저장</button>
        </div>
        <div className="card">
          <div style={{ fontSize:13, fontWeight:500, color:'var(--muted)', marginBottom:18, textTransform:'uppercase', letterSpacing:'0.4px' }}>보험사 연결</div>
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {INSURERS.map(ins => {
              const isOn = state.userInsurers.includes(ins.id)
              return (
                <div key={ins.id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'13px 16px', borderRadius:10, border:`1px solid ${isOn?'var(--success)':'var(--border)'}`, background:isOn?'var(--success-xl)':'var(--surface)', transition:'all .15s' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                    <span style={{ fontSize:18 }}>{ins.logo}</span>
                    <div>
                      <div style={{ fontWeight:500, fontSize:15 }}>{ins.name}</div>
                      <div style={{ fontSize:13, color:isOn?'var(--success)':'var(--muted)', marginTop:1 }}>{isOn?'연결됨':'미연결'}</div>
                    </div>
                  </div>
                  <label className="toggle">
                    <input type="checkbox" checked={isOn} onChange={() => toggleInsurer(ins.id)} />
                    <span className="toggle-slider" />
                  </label>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── RegionBanner ── */
function RegionBanner({ userRegion, onSave }) {
  const [editing,  setEditing]  = useState(!userRegion)
  const [selected, setSelected] = useState(userRegion || REGIONS[0])
  const [saving,   setSaving]   = useState(false)
  const handleSave = async () => {
    if (!selected) return
    setSaving(true); await onSave(selected); setSaving(false); setEditing(false)
  }
  if (!editing && userRegion) return (
    <div style={{ display:'flex', alignItems:'center', gap:14, padding:'13px 18px', borderRadius:12, marginBottom:20, background:'var(--brand-xl)', border:'1px solid var(--brand-l)' }}>
      <span style={{ fontSize:18 }}>📍</span>
      <div style={{ flex:1, display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' }}>
        <span style={{ fontSize:14, fontWeight:500, color:'var(--text-2)' }}>내 거주지역</span>
        <span className="badge badge-brand">{userRegion}</span>
        <span style={{ fontSize:14, color:'var(--muted)' }}>· 내 지역 게시물에만 투표(추천)할 수 있어요</span>
      </div>
      <button className="btn btn-ghost btn-sm" onClick={() => setEditing(true)}>변경</button>
    </div>
  )
  return (
    <div style={{ padding:'24px 26px', borderRadius:16, marginBottom:24, background:'linear-gradient(135deg, #1d4ed8 0%, #2563eb 60%, #3b82f6 100%)', boxShadow:'0 4px 20px rgba(37,99,235,.2)' }}>
      <div style={{ display:'flex', alignItems:'flex-start', gap:16 }}>
        <div style={{ width:48, height:48, borderRadius:12, flexShrink:0, background:'rgba(255,255,255,.15)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:24 }}>📍</div>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:17, fontWeight:600, color:'#fff', marginBottom:4 }}>내 거주지역을 설정해주세요</div>
          <div style={{ fontSize:14, color:'rgba(255,255,255,.75)', lineHeight:1.7, marginBottom:18 }}>
            커뮤니티 투표(추천)는 <strong style={{ color:'#bfdbfe' }}>같은 지역 주민</strong>만 참여할 수 있어요.<br/>
            지역을 설정하면 우리 동네 반려동물 친구들을 응원할 수 있습니다! 🐾
          </div>
          <div style={{ display:'flex', gap:10, alignItems:'center', flexWrap:'wrap' }}>
            <select className="fi" style={{ margin:0, flex:1, maxWidth:260, background:'rgba(255,255,255,.96)', fontWeight:500 }} value={selected} onChange={e=>setSelected(e.target.value)}>
              {REGIONS.map(r=><option key={r} value={r}>{r}</option>)}
            </select>
            <button className="btn" style={{ background:'#fff', color:'var(--brand)', fontWeight:600, border:'none', padding:'10px 22px', flexShrink:0 }} onClick={handleSave} disabled={saving}>
              {saving?'저장 중…':'설정 완료'}
            </button>
            {userRegion && <button className="btn" style={{ color:'rgba(255,255,255,.7)', border:'1px solid rgba(255,255,255,.25)', background:'transparent' }} onClick={() => setEditing(false)}>취소</button>}
          </div>
        </div>
      </div>
      <div style={{ display:'flex', gap:20, marginTop:16, paddingTop:14, borderTop:'1px solid rgba(255,255,255,.15)', flexWrap:'wrap' }}>
        {[['🗳️','내 지역 게시물에만 투표 가능'],['🐾','우리 동네 반려동물 이야기'],['🏆','지역별 랭킹에 반영']].map(([icon,text]) => (
          <div key={text} style={{ display:'flex', alignItems:'center', gap:6, fontSize:13, color:'rgba(255,255,255,.65)' }}><span>{icon}</span><span>{text}</span></div>
        ))}
      </div>
    </div>
  )
}

/* ── CommunityTab API 매퍼 ── */
// 업로드 전 이미지 리사이즈/압축 — base64 저장 부담을 줄인다 (최대 1024px, JPEG 품질 0.7)
function compressImage(file, maxSize = 1024, quality = 0.7) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = e => {
      const img = new Image()
      img.onload = () => {
        let { width, height } = img
        if (width > maxSize || height > maxSize) {
          const r = Math.min(maxSize / width, maxSize / height)
          width = Math.round(width * r); height = Math.round(height * r)
        }
        const canvas = document.createElement('canvas')
        canvas.width = width; canvas.height = height
        canvas.getContext('2d').drawImage(img, 0, 0, width, height)
        resolve(canvas.toDataURL('image/jpeg', quality))
      }
      img.onerror = reject
      img.src = e.target.result
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}
// 서버 응답(PostSummary/PostResponse) → 프론트 게시물 모델
function mapServerPost(p) {
  return {
    id: p.id,
    authorName: p.authorName || '익명',
    authorRegion: p.authorRegion || '',
    petName: p.petName || '',
    petBreed: p.petBreed || '',
    content: p.content || '',
    imageUrl: (Array.isArray(p.imageKeys) && p.imageKeys[0]) || null,
    likes: [],                       // 목업 호환용(서버 게시물은 likeCount 사용)
    likeCount: p.likeCount || 0,
    liked: !!p.liked,
    comments: [],
    commentCount: p.commentCount || 0,
    commentsLoaded: false,           // 댓글 펼칠 때 상세 조회로 채움
    createdAt: (p.createdAt || '').slice(0, 10).replaceAll('-', '.'),
    votes: {}, myVoted: false,
  }
}
// 서버 CommentResponse → 프론트 댓글 모델
function mapServerComment(c) {
  return {
    id: c.id,
    authorName: c.authorName || '익명',
    authorRegion: '',
    content: c.content || '',
    likes: 0,
    replies: Array.isArray(c.replies)
      ? c.replies.map(r => ({ id: r.id, authorName: r.authorName || '익명', content: r.content || '', likes: 0 }))
      : [],
  }
}
// 숫자 id = 서버 게시물/댓글, 'post-xxx' 등 문자열 = 목업
const isServerId = id => typeof id === 'number' || /^\d+$/.test(String(id))

/* ── CommunityTab ── */
function CommunityTab({ state, update, showToast, onRegionSave }) {
  const [filter,           setFilter]           = useState('all')
  const [expandedComments, setExpandedComments] = useState({})
  const [commentInputs,    setCommentInputs]    = useState({})
  const [replyOpen,        setReplyOpen]        = useState({})
  const [replyInputs,      setReplyInputs]      = useState({})
  const [showCompose,      setShowCompose]      = useState(false)
  const [newPost,          setNewPost]          = useState({ content:'', petId:'', imagePreview:null })
  const [submitting,       setSubmitting]       = useState(false)
  const fileRef = useRef()
  const userRegion    = state.userRegion
  const likedPosts    = state.likedPosts || []
  const filteredPosts = filter==='all' ? state.posts : state.posts.filter(p=>p.authorRegion===userRegion)
  const isLiked = id => likedPosts.includes(id)

  // 커뮤니티 탭 진입 시 서버 게시물 로드 (실패/빈 목록이면 목업 유지)
  useEffect(() => {
    let alive = true
    apiFetch('/posts?page=0&size=20')
      .then(res => {
        const list = Array.isArray(res?.content) ? res.content : (Array.isArray(res) ? res : [])
        if (alive && list.length > 0) update({ posts: list.map(mapServerPost) })
      })
      .catch(() => {})
    return () => { alive = false }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleLike = async postId => {
    if (!userRegion) { showToast('지역 미설정','투표하려면 먼저 거주지역을 설정해야 합니다'); return }
    const post = state.posts.find(p=>p.id===postId)
    if (post && post.authorRegion!==userRegion) { showToast('투표 불가',`내 지역(${userRegion}) 게시물에만 투표할 수 있어요`); return }
    if (isServerId(postId)) {
      try {
        const res = await apiFetch(`/posts/${postId}/likes`,{method:'POST'})
        update({
          likedPosts: res.liked ? [...likedPosts.filter(id=>id!==postId),postId] : likedPosts.filter(id=>id!==postId),
          posts: state.posts.map(p=>p.id===postId?{...p,liked:res.liked,likeCount:res.likeCount}:p),
        })
      } catch (e) { showToast('추천 실패', e?.message||'추천 처리에 실패했습니다') }
      return
    }
    const liked = isLiked(postId)
    update({ likedPosts:liked?likedPosts.filter(id=>id!==postId):[...likedPosts,postId], posts:state.posts.map(p=>p.id===postId?{...p,likes:liked?p.likes.slice(0,-1):[...p.likes,userRegion]}:p) })
  }
  // 댓글 영역 토글 — 펼칠 때 서버 게시물이면 상세 조회로 댓글 트리 로드
  const toggleCommentsView = async postId => {
    const willExpand = !expandedComments[postId]
    setExpandedComments(prev=>({...prev,[postId]:willExpand}))
    if (!willExpand) return
    const post = state.posts.find(p=>p.id===postId)
    if (!post || post.commentsLoaded || !isServerId(postId)) return
    try {
      const detail = await apiFetch(`/posts/${postId}`)
      const comments = Array.isArray(detail?.comments) ? detail.comments.map(mapServerComment) : []
      update({ posts:state.posts.map(p=>p.id===postId?{...p,comments,commentsLoaded:true,commentCount:comments.length}:p) })
    } catch { /* 조회 실패 시 기존 상태 유지 */ }
  }
  const handleAddComment = async postId => {
    const content=(commentInputs[postId]||'').trim(); if(!content) return
    if (isServerId(postId)) {
      try {
        const c = await apiFetch(`/posts/${postId}/comments`,{method:'POST',body:{content}})
        update({ posts:state.posts.map(p=>p.id===postId?{...p,comments:[...p.comments,mapServerComment(c)],commentCount:(p.commentCount??p.comments.length)+1}:p) })
        setCommentInputs(prev=>({...prev,[postId]:''}))
      } catch (e) { showToast('댓글 실패', e?.message||'댓글 등록에 실패했습니다') }
      return
    }
    update({ posts:state.posts.map(p=>p.id===postId?{...p,comments:[...p.comments,{id:`cmt-${Date.now()}`,authorName:'홍길동',authorRegion:userRegion,content,likes:0,replies:[]}]}:p) })
    setCommentInputs(prev=>({...prev,[postId]:''}))
  }
  const handleAddReply = async (postId,cmtId) => {
    const content=(replyInputs[cmtId]||'').trim(); if(!content) return
    if (isServerId(postId) && isServerId(cmtId)) {
      try {
        const r = await apiFetch(`/posts/${postId}/comments`,{method:'POST',body:{content,parentCommentId:cmtId}})
        update({ posts:state.posts.map(p=>p.id===postId?{...p,comments:p.comments.map(c=>c.id===cmtId?{...c,replies:[...c.replies,{id:r.id,authorName:r.authorName||'익명',content:r.content||content,likes:0}]}:c)}:p) })
        setReplyInputs(prev=>({...prev,[cmtId]:''})); setReplyOpen(prev=>({...prev,[cmtId]:false}))
      } catch (e) { showToast('대댓글 실패', e?.message||'대댓글 등록에 실패했습니다') }
      return
    }
    update({ posts:state.posts.map(p=>p.id===postId?{...p,comments:p.comments.map(c=>c.id===cmtId?{...c,replies:[...c.replies,{id:`rep-${Date.now()}`,authorName:'홍길동',content,likes:0}]}:c)}:p) })
    setReplyInputs(prev=>({...prev,[cmtId]:''})); setReplyOpen(prev=>({...prev,[cmtId]:false}))
  }
  const handleSubmitPost = async () => {
    if (!newPost.content.trim() || submitting) return
    const pet=state.pets.find(p=>p.petId===newPost.petId)||state.pets[0]
    setSubmitting(true)
    try {
      const created = await apiFetch('/posts',{method:'POST',body:{
        content:newPost.content.trim(),
        petName:pet?.name||undefined,
        petBreed:pet?.breed||undefined,
        authorRegion:userRegion||undefined,
        imageData:newPost.imagePreview||undefined,
      }})
      update({ posts:[mapServerPost(created),...state.posts] })
      setNewPost({content:'',petId:'',imagePreview:null}); setShowCompose(false)
      showToast('게시 완료','게시물이 등록되었습니다')
    } catch (e) {
      showToast('게시 실패', e?.message||'게시물 등록에 실패했습니다 (로그인이 필요할 수 있어요)')
    } finally {
      setSubmitting(false)
    }
  }
  return (
    <div className="fade-in">
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
        <div><div className="pane-h">커뮤니티</div><div className="pane-sub" style={{ marginBottom:0 }}>우리 동네 반려동물 이야기</div></div>
        <button className="btn btn-primary" onClick={() => setShowCompose(true)}>+ 게시물 작성</button>
      </div>
      <RegionBanner key={userRegion||'unset'} userRegion={userRegion} onSave={onRegionSave} />
      <div style={{ display:'flex', gap:8, marginBottom:20 }}>
        {[['all','전체'],['myregion',userRegion?`내 지역 (${userRegion})`:'내 지역 (미설정)']].map(([f,lbl]) => (
          <button key={f} className={`btn btn-sm ${filter===f?'btn-primary':'btn-ghost'}`} onClick={() => setFilter(f)}>{lbl}</button>
        ))}
      </div>
      <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
        {filteredPosts.length===0 && <div className="card" style={{ textAlign:'center', padding:'48px 24px', color:'var(--muted)' }}><div style={{ fontSize:32, marginBottom:10 }}>🐾</div><div style={{ fontWeight:500, fontSize:16 }}>게시물이 없습니다</div></div>}
        {filteredPosts.map(post => {
          const liked=post.liked ?? isLiked(post.id); const cmtExpanded=expandedComments[post.id]
          return (
            <div key={post.id} className="card" style={{ padding:'20px 22px' }}>
              <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:12 }}>
                <div style={{ width:38, height:38, borderRadius:'50%', background:'var(--bg-2)', border:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:17 }}>🐾</div>
                <div style={{ flex:1 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <span style={{ fontWeight:500, fontSize:15 }}>{post.authorName}</span>
                    <span className="badge badge-brand" style={{ fontSize:11 }}>{post.authorRegion}</span>
                  </div>
                  <div style={{ fontSize:13, color:'var(--muted)', marginTop:1 }}>{post.createdAt}</div>
                </div>
              </div>
              {post.petName && <div style={{ display:'flex', gap:6, marginBottom:10 }}><span className="badge badge-orange">🐶 {post.petName}</span><span className="badge badge-muted">{post.petBreed}</span></div>}
              <div style={{ fontSize:15, color:'var(--text-2)', lineHeight:1.75, marginBottom:12 }}>{post.content}</div>
              {post.imageUrl && <div style={{ marginBottom:12, borderRadius:10, overflow:'hidden', aspectRatio:'16/9' }}><img src={post.imageUrl} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} /></div>}
              <div style={{ display:'flex', gap:4, paddingTop:10, borderTop:'1px solid var(--border)' }}>
                <button className="btn btn-ghost btn-sm" onClick={() => handleLike(post.id)} style={{ color:liked?'#e11d48':'var(--muted)', fontWeight:liked?600:400 }}>{liked?'❤️':'🤍'} {post.likeCount ?? post.likes.length}</button>
                <button className="btn btn-ghost btn-sm" onClick={() => toggleCommentsView(post.id)}>💬 {post.commentCount ?? post.comments.length}</button>
              </div>
              {cmtExpanded && (
                <div style={{ marginTop:14, paddingTop:14, borderTop:'1px solid var(--border)' }}>
                  {post.comments.map(cmt => (
                    <div key={cmt.id} style={{ marginBottom:14 }}>
                      <div style={{ display:'flex', gap:10, alignItems:'flex-start' }}>
                        <div style={{ width:28, height:28, borderRadius:'50%', background:'var(--bg-2)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, flexShrink:0 }}>🐾</div>
                        <div style={{ flex:1 }}>
                          <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:4 }}>
                            <span style={{ fontSize:14, fontWeight:500 }}>{cmt.authorName}</span>
                            <span className="badge badge-muted" style={{ fontSize:11 }}>{cmt.authorRegion}</span>
                          </div>
                          <div style={{ fontSize:14, color:'var(--text-2)', lineHeight:1.6 }}>{cmt.content}</div>
                          <div style={{ display:'flex', gap:6, marginTop:5 }}>
                            <button className="btn btn-ghost btn-sm" style={{ fontSize:12, padding:'3px 8px' }}>❤️ {cmt.likes}</button>
                            <button className="btn btn-ghost btn-sm" style={{ fontSize:12, padding:'3px 8px' }} onClick={() => setReplyOpen(prev=>({...prev,[cmt.id]:!prev[cmt.id]}))}>↩ 대댓글</button>
                          </div>
                          {cmt.replies.map(rep => (
                            <div key={rep.id} style={{ display:'flex', gap:8, marginTop:8, paddingLeft:12, borderLeft:'2px solid var(--border)' }}>
                              <span style={{ fontSize:14, fontWeight:500, color:'var(--brand)' }}>{rep.authorName}</span>
                              <span style={{ fontSize:14, color:'var(--text-2)' }}>{rep.content}</span>
                            </div>
                          ))}
                          {replyOpen[cmt.id] && (
                            <div style={{ display:'flex', gap:8, marginTop:8 }}>
                              <input className="fi" style={{ margin:0, fontSize:14 }} placeholder="대댓글 입력..." value={replyInputs[cmt.id]||''} onChange={e=>setReplyInputs(prev=>({...prev,[cmt.id]:e.target.value}))} onKeyDown={e=>e.key==='Enter'&&handleAddReply(post.id,cmt.id)} />
                              <button className="btn btn-primary btn-sm" onClick={() => handleAddReply(post.id,cmt.id)}>등록</button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  <div style={{ display:'flex', gap:8, marginTop:4 }}>
                    <input className="fi" style={{ margin:0, fontSize:14 }} placeholder="댓글을 입력하세요..." value={commentInputs[post.id]||''} onChange={e=>setCommentInputs(prev=>({...prev,[post.id]:e.target.value}))} onKeyDown={e=>e.key==='Enter'&&handleAddComment(post.id)} />
                    <button className="btn btn-primary btn-sm" onClick={() => handleAddComment(post.id)}>등록</button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
      {showCompose && (
        <Overlay title="게시물 작성" sub="반려동물 이야기를 공유해보세요" onClose={() => setShowCompose(false)}>
          <label className="fl">반려동물 선택</label>
          <select className="fi" value={newPost.petId} onChange={e=>setNewPost(p=>({...p,petId:e.target.value}))}>
            <option value="">-- 선택하세요 --</option>
            {state.pets.map(p=><option key={p.petId} value={p.petId}>{p.name} ({p.breed})</option>)}
          </select>
          <label className="fl">내용</label>
          <textarea className="fi" rows={5} placeholder="오늘 있었던 이야기를 적어보세요..." value={newPost.content} onChange={e=>setNewPost(p=>({...p,content:e.target.value}))} style={{ resize:'vertical', fontFamily:'inherit' }} />
          <label className="fl">이미지 첨부</label>
          <input ref={fileRef} type="file" accept="image/*" style={{ display:'none' }} onChange={async e=>{ const f=e.target.files[0]; if(!f) return; try { const data=await compressImage(f); setNewPost(p=>({...p,imagePreview:data})) } catch { showToast('이미지 오류','이미지를 불러오지 못했습니다') } }} />
          {newPost.imagePreview ? <img src={newPost.imagePreview} alt="" style={{ width:'100%', borderRadius:10, marginBottom:14, aspectRatio:'16/9', objectFit:'cover' }} /> : <div className="upload-zone" style={{ marginBottom:14 }} onClick={() => fileRef.current.click()}>📎 이미지 첨부 (선택)</div>}
          <button className="btn btn-primary" style={{ width:'100%', justifyContent:'center', padding:13 }} onClick={handleSubmitPost} disabled={submitting}>{submitting?'게시 중...':'게시하기'}</button>
        </Overlay>
      )}
    </div>
  )
}

/* ── RankingTab ── */
function RankingTab({ state }) {
  const [selectedRegion, setSelectedRegion] = useState(null)
  const getVoteSum = region => state.posts.filter(p=>p.authorRegion===region).reduce((acc,p)=>acc+(p.votes[region]||0),0)
  const regionRanking = region => state.posts.filter(p=>p.authorRegion===region).sort((a,b)=>(b.votes[region]||0)-(a.votes[region]||0)).slice(0,10).map((p,i)=>({rank:i+1,petName:p.petName,petBreed:p.petBreed,votes:p.votes[region]||0}))
  const maxVotes = Math.max(1,...REGION_PINS.map(r=>getVoteSum(r.name)))
  const rankStyle = rank => {
    if(rank===1) return {background:'#fef08a',color:'#713f12',border:'1.5px solid #fbbf24'}
    if(rank===2) return {background:'#e2e8f0',color:'#334155',border:'1.5px solid #94a3b8'}
    if(rank===3) return {background:'#fed7aa',color:'#7c2d12',border:'1.5px solid #fb923c'}
    return {background:'var(--bg-2)',color:'var(--muted)',border:'1px solid var(--border)'}
  }
  return (
    <div className="fade-in">
      <div className="pane-h">지역 랭킹</div>
      <div className="pane-sub">지역 핀을 클릭해서 TOP 10 랭킹을 확인하세요</div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 340px', gap:24, alignItems:'start' }}>
        <div className="card" style={{ padding:20 }}>
          <svg viewBox="0 0 320 540" width="100%" style={{ display:'block', maxHeight:480 }}>
            <path d="M 140 25 L 170 28 L 210 42 L 258 72 L 278 120 L 285 185 L 282 260 L 272 330 L 258 395 L 248 445 L 228 472 L 200 480 L 170 478 L 140 468 L 108 450 L 78 420 L 60 375 L 52 310 L 56 245 L 64 185 L 76 140 L 90 100 L 112 68 L 132 45 Z" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="1.5"/>
            <ellipse cx="148" cy="502" rx="38" ry="20" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="1.5"/>
            {REGION_PINS.map(pin => {
              const votes=getVoteSum(pin.name); const r=votes>0?7+(votes/maxVotes)*10:6; const isSel=selectedRegion===pin.name; const hasData=votes>0
              return (
                <g key={pin.name} onClick={() => setSelectedRegion(isSel?null:pin.name)} style={{ cursor:'pointer' }}>
                  {isSel && <circle cx={pin.x} cy={pin.y} r={r+5} fill="rgba(37,99,235,0.15)"/>}
                  <circle cx={pin.x} cy={pin.y} r={r} fill={isSel?'var(--brand)':hasData?'#6366f1':'#94a3b8'} opacity={hasData?1:.55}/>
                  {votes>0 && <text x={pin.x} y={pin.y+0.5} textAnchor="middle" dominantBaseline="middle" fill="#fff" fontSize="7" fontWeight="700">{votes}</text>}
                  <text x={pin.x} y={pin.y+r+9} textAnchor="middle" fill={isSel?'var(--brand)':'#888'} fontSize="8.5" fontWeight={isSel?'700':'500'}>{pin.label}</text>
                </g>
              )
            })}
          </svg>
        </div>
        {selectedRegion ? (
          <div className="card">
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:18 }}>
              <span style={{ fontSize:18 }}>📍</span>
              <div><div style={{ fontWeight:600, fontSize:16 }}>{selectedRegion}</div><div style={{ fontSize:13, color:'var(--muted)', marginTop:2 }}>지역 TOP 10</div></div>
            </div>
            {regionRanking(selectedRegion).length===0 ? (
              <div style={{ textAlign:'center', padding:'32px 0', color:'var(--muted)' }}><div style={{ fontSize:28, marginBottom:8 }}>🐾</div><div style={{ fontWeight:500 }}>등록된 게시물이 없습니다</div></div>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {regionRanking(selectedRegion).map(item => (
                  <div key={item.rank} style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 12px', borderRadius:10, background:'var(--bg-2)' }}>
                    <div style={{ width:26, height:26, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, flexShrink:0, ...rankStyle(item.rank) }}>{item.rank}</div>
                    <span style={{ fontSize:17 }}>🐶</span>
                    <div style={{ flex:1 }}><div style={{ fontWeight:500, fontSize:14 }}>{item.petName}</div><div style={{ fontSize:12, color:'var(--muted)' }}>{item.petBreed}</div></div>
                    <div style={{ fontSize:14, fontWeight:600, color:'var(--brand)' }}>{item.votes}표</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="card" style={{ textAlign:'center', padding:'48px 24px', color:'var(--muted)' }}>
            <div style={{ fontSize:32, marginBottom:12 }}>🗺️</div>
            <div style={{ fontWeight:500, fontSize:16, marginBottom:6 }}>지역을 선택하세요</div>
            <div style={{ fontSize:14 }}>지도의 핀을 클릭하면<br/>해당 지역 TOP 10을 확인할 수 있습니다</div>
          </div>
        )}
      </div>
    </div>
  )
}

/* ── Main ── */
export default function GuardianDash({ showToast, onLogout }) {
  const { state, update, toggleConsent, addPet } = useApp()
  const [tab,          setTab]          = useState('home')
  const [modal,        setModal]        = useState(null)
  const [detailRecord, setDetailRecord] = useState(null)
  const [newPet,       setNewPet]       = useState({ name:'', species:'dog', breed:'', birthYear:'', chipNo:'', petId:'' })

  useEffect(() => {
    async function loadData() {
      try {
        const [petsRes,recordsRes,consentsRes,meRes] = await Promise.allSettled([apiFetch('/pets'),apiFetch('/records?page=0&size=20'),apiFetch('/consents?page=0&size=20'),apiFetch('/users/me')])
        if (meRes.status==='fulfilled' && meRes.value?.region) update({ userRegion:meRes.value.region })
        if (petsRes.status==='fulfilled') { const a=Array.isArray(petsRes.value)?petsRes.value:[]; if(a.length>0) update({ pets:a.map(p=>({ petId:String(p.id),name:p.name,species:p.species,breed:p.breed,birthYear:p.birthYear,insurer:'DB손해보험' })) }) }
        if (recordsRes.status==='fulfilled') { const a=Array.isArray(recordsRes.value?.records)?recordsRes.value.records:(Array.isArray(recordsRes.value?.content)?recordsRes.value.content:[]); if(a.length>0) update({ medicalRecords:a.map(r=>({ id:String(r.recordId||r.id),petId:String(r.petId||''),petName:r.petName||'',date:(r.treatmentDate||r.date||'').replaceAll('-','.'),diseases:Array.isArray(r.diagnosisCodes)?r.diagnosisCodes:(Array.isArray(r.diseases)?r.diseases:[]),treatments:Array.isArray(r.treatmentCodes)?r.treatmentCodes:(Array.isArray(r.treatments)?r.treatments:[]),cost:r.treatmentCost||r.cost||0,memo:r.memo||'',onChain:!!(r.recordHash||r.onChain) })) }) }
        if (consentsRes.status==='fulfilled') { const a=Array.isArray(consentsRes.value?.consents)?consentsRes.value.consents:(Array.isArray(consentsRes.value?.content)?consentsRes.value.content:[]); if(a.length>0){const sm={ACTIVE:'active',REVOKED:'revoked',PENDING:'pending'};const m={};a.forEach(c=>{const k=String(c.recordId);m[k]={consentId:String(c.consentId||c.id),recordId:k,guardianId:c.guardianId,insurerId:c.insurerId,status:sm[c.status]||(c.status||'').toLowerCase(),insurerName:c.insurerName||c.insurerId||'',pet:c.petName||'',disease:c.disease||'',hospital:c.hospitalName||'',cost:c.cost||0}});update({consents:m})} }
      } catch { /* fallback */ }
    }
    loadData()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const consents     = Object.values(state.consents)
  const activeCount  = consents.filter(c=>c.status==='active').length
  const revokedCount = consents.filter(c=>c.status==='revoked').length

  const handleToggle = async recordId => {
    const c=state.consents[recordId]; const next=c.status==='active'?'revoked':'active'
    toggleConsent(recordId)
    showToast(next==='active'?'동의 완료':'동의 철회', next==='active'?`${recordId} — 보험사에 서류 자동 전달 시작`:`${recordId} — 보험사 접근 차단됨`)
    try { if(c.status==='active') await apiFetch(`/consents/${c.consentId}/revoke`,{method:'POST'}); else await apiFetch('/consents',{method:'POST',body:{recordId:c.recordId,insurerId:c.insurerId||localStorage.getItem('userId')||'1',guardianId:c.guardianId||localStorage.getItem('userId')||'1'}}) } catch {}
  }
  const handleRegionSave = async region => {
    update({ userRegion:region }); showToast('지역 설정 완료',`거주지역이 ${region}(으)로 설정되었습니다`)
    try { await apiFetch('/users/me',{method:'PATCH',body:{region}}) } catch {}
  }
  const openPetModal = () => {
    const petId = generatePetId(state.pets.map(p=>p.petId))
    setNewPet({name:'',species:'dog',breed:'',birthYear:'',chipNo:'',petId}); setModal('pet')
  }
  const handleAddPet = async () => {
    const sm={dog:'강아지',cat:'고양이',rabbit:'토끼'}
    addPet({petId:newPet.petId,name:newPet.name,species:sm[newPet.species]||newPet.species,breed:newPet.breed,birthYear:newPet.birthYear?Number(newPet.birthYear):'',chipNo:newPet.chipNo,insurer:'DB손해보험'})
    setModal(null); showToast('반려동물 등록',(newPet.name||'새 반려동물')+' 등록 완료')
    try {
      const created=await apiFetch('/pets',{method:'POST',body:{name:newPet.name,species:sm[newPet.species]||newPet.species,breed:newPet.breed,birthYear:newPet.birthYear?Number(newPet.birthYear):undefined,gender:'',isNeutered:false}})
      if(created?.id){const refreshed=await apiFetch('/pets');const a=Array.isArray(refreshed)?refreshed:[];if(a.length>0)update({pets:a.map(p=>({petId:String(p.id),name:p.name,species:p.species,breed:p.breed,birthYear:p.birthYear,insurer:'DB손해보험'}))})}
    } catch {}
  }

  return (
    <>
      <style>{CSS}</style>
      <div className="gd-shell">

        {/* ── 사이드바 ── */}
        <nav className="gd-sidebar">
          <div className="gd-logo">
            <div className="gd-logo-name">PetChain</div>
            <div className="gd-logo-sub">반려동물 의료 플랫폼</div>
          </div>
          <div className="gd-nav">
            {NAV.map(n => (
              <button key={n.key} className={`gd-nav-item${tab===n.key?' active':''}`} onClick={() => setTab(n.key)}>
                <span className="gd-nav-icon">{n.icon}</span>{n.label}
              </button>
            ))}
          </div>
          <div className="gd-bottom">
            <div className="gd-user-name">홍길동</div>
            <div className="gd-user-region">{state.userRegion || '지역 미설정'}</div>
            <button className="gd-logout" onClick={onLogout}>로그아웃 →</button>
          </div>
        </nav>

        {/* ── 메인 ── */}
        <main className="gd-main">

          {/* 홈 */}
          {tab==='home' && (
            <div className="fade-in">
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom:28 }}>
                <div>
                  <div className="pane-h">내 반려동물</div>
                  <div className="pane-sub" style={{ marginBottom:0 }}>등록된 반려동물과 보험 계약을 관리합니다</div>
                </div>
                <div style={{ display:'flex', gap:8 }}>
                  <button className="btn btn-ghost" onClick={() => setModal('ins')}>+ 보험 계약 등록</button>
                  <button className="btn btn-primary" onClick={openPetModal}>+ 반려동물 추가</button>
                </div>
              </div>
              <div className="g3" style={{ marginBottom:28 }}>
                {[
                  { n:state.medicalRecords.length, l:'총 진료기록 · 클릭하여 확인', bg:'var(--brand-xl)', border:'var(--brand)', color:'var(--brand)', target:'records' },
                  { n:activeCount,  l:'동의 활성 · 클릭하여 관리',  bg:'var(--success-xl)', border:'var(--success)', color:'var(--success)', target:'consent' },
                  { n:revokedCount, l:'동의 철회 · 클릭하여 관리',  bg:'var(--danger-xl)',  border:'var(--danger)',  color:'var(--danger)',  target:'consent' },
                ].map((s,i) => (
                  <div key={i} className="stat-box" onClick={() => setTab(s.target)}
                    style={{ background:s.bg, border:`1px solid ${s.border}33`, cursor:'pointer', padding:'22px 24px' }}
                    onMouseEnter={e => e.currentTarget.style.boxShadow='var(--shadow-md)'}
                    onMouseLeave={e => e.currentTarget.style.boxShadow='none'}>
                    <div className="stat-n" style={{ color:s.color }}>{s.n}</div>
                    <div className="stat-l" style={{ color:s.color, opacity:.75 }}>{s.l}</div>
                  </div>
                ))}
              </div>
              <div className="g3">
                {state.pets.map((p,i) => (
                  <div key={i} className="card" style={{ borderTop:'2px solid var(--brand)' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:18 }}>
                      <div style={{ width:50, height:50, borderRadius:12, background:'var(--brand-xl)', border:'1px solid var(--brand-l)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:24 }}>{speciesIcon(p.species)}</div>
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:18, fontWeight:600 }}>{p.name}</div>
                        <span className="mono">{p.petId}</span>
                        <div style={{ fontSize:14, color:'var(--muted)', marginTop:2 }}>{p.species} · {p.breed}</div>
                      </div>
                      <span className="badge badge-success">보험 활성</span>
                    </div>
                    <div className="divider" />
                    <div className="row-flex"><span style={{ color:'var(--muted)' }}>보험사</span><span style={{ fontWeight:500 }}>{p.insurer}</span></div>
                    <div className="row-flex"><span style={{ color:'var(--muted)' }}>동의 활성</span><span style={{ fontWeight:500, color:'var(--success)' }}>{activeCount}건</span></div>
                    <div className="row-flex"><span style={{ color:'var(--muted)' }}>출생연도</span><span style={{ fontWeight:500 }}>{p.birthYear}년</span></div>
                    <button className="btn btn-primary btn-sm" style={{ width:'100%', marginTop:16, justifyContent:'center' }} onClick={() => setTab('records')}>📋 진료기록 확인</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab==='records' && <RecordsTab records={state.medicalRecords} onDetail={setDetailRecord} />}

          {/* 동의 관리 */}
          {tab==='consent' && (
            <div className="fade-in">
              <div className="pane-h">동의 관리</div>
              <div className="pane-sub">토글을 ON하면 보험사에 서류가 자동으로 전달됩니다</div>
              <div className="alert alert-info" style={{ marginBottom:28 }}>
                ℹ️ 동의 유효기간은 1년이며, 언제든지 철회 가능합니다. 철회 즉시 보험사의 신규 접근이 차단됩니다.
              </div>
              {consents.filter(c=>c.status==='active').length>0 && (
                <div style={{ marginBottom:28 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12 }}>
                    <div style={{ width:8, height:8, borderRadius:'50%', background:'var(--success)' }} />
                    <span style={{ fontSize:13, fontWeight:600, color:'var(--success)', textTransform:'uppercase', letterSpacing:'.06em' }}>동의 완료 — {consents.filter(c=>c.status==='active').length}건 전송 중</span>
                  </div>
                  <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                    {consents.filter(c=>c.status==='active').map(c=><ConsentCard key={c.recordId} c={c} onToggle={handleToggle}/>)}
                  </div>
                </div>
              )}
              {consents.filter(c=>c.status!=='active').length>0 && (
                <div>
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12 }}>
                    <div style={{ width:8, height:8, borderRadius:'50%', background:'var(--muted-l)' }} />
                    <span style={{ fontSize:13, fontWeight:600, color:'var(--muted)', textTransform:'uppercase', letterSpacing:'.06em' }}>미동의 / 철회 — {consents.filter(c=>c.status!=='active').length}건</span>
                  </div>
                  <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                    {consents.filter(c=>c.status!=='active').map(c=><ConsentCard key={c.recordId} c={c} onToggle={handleToggle}/>)}
                  </div>
                </div>
              )}
              {consents.length===0 && <div className="card" style={{ textAlign:'center', padding:56, color:'var(--muted)' }}><div style={{ fontSize:32, marginBottom:10 }}>📋</div><div style={{ fontWeight:500, fontSize:16 }}>등록된 진료기록이 없습니다</div></div>}
            </div>
          )}

          {/* 청구 상태 */}
          {tab==='status' && (
            <div className="fade-in">
              <div className="pane-h">청구 상태</div>
              <div className="pane-sub">보험 청구 진행 현황 (보험사 심사 진행 수준만 표시)</div>
              {consents.filter(c=>c.status==='active').length===0 ? (
                <div className="card" style={{ textAlign:'center', padding:64, color:'var(--muted)' }}>
                  <div style={{ fontSize:36, marginBottom:14 }}>🔒</div>
                  <div style={{ fontWeight:600, fontSize:17, marginBottom:8, color:'var(--text-2)' }}>활성 동의가 없습니다</div>
                  <div style={{ fontSize:15 }}>동의 관리 탭에서 토글을 ON 해주세요</div>
                  <button className="btn btn-primary" style={{ marginTop:20 }} onClick={() => setTab('consent')}>동의 관리로 이동 →</button>
                </div>
              ) : (
                <div className="g2">
                  {consents.filter(c=>c.status==='active').map(c => (
                    <div key={c.recordId} className="card">
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:20 }}>
                        <div>
                          <div style={{ fontSize:17, fontWeight:600, marginBottom:4 }}>{c.pet} · {c.disease}</div>
                          <div style={{ fontSize:14, color:'var(--muted)', display:'flex', gap:10 }}>
                            <span className="mono">{c.recordId}</span><span>· {c.cost.toLocaleString()}원</span>
                          </div>
                        </div>
                        <span className="badge badge-brand">보험사 접수됨</span>
                      </div>
                      {[
                        {lbl:'동의 완료',     sub:'consent_status: ACTIVE', done:true},
                        {lbl:'해시 검증 완료', sub:'detail_data_hash 일치',  done:true},
                        {lbl:'보험사 검토 중', sub:'UNDER_REVIEW',           now:true},
                        {lbl:'심사 결과',     sub:'APPROVED / CLOSED',      wait:true},
                      ].map((r,i) => (
                        <div key={i} className="tl-row">
                          <div className="tl-dot" style={{ background:r.done?'var(--success)':r.now?'var(--brand)':'var(--border-d)', boxShadow:r.now?'0 0 0 4px var(--brand-xl)':'none' }} />
                          <div style={{ flex:1 }}>
                            <div style={{ fontSize:15, fontWeight:500, color:r.done?'var(--success)':r.now?'var(--brand)':'var(--muted)' }}>{r.lbl}</div>
                            <div style={{ fontSize:13, color:'var(--muted)', marginTop:2, fontFamily:'var(--mono)' }}>{r.sub}</div>
                          </div>
                          {r.done && <span className="badge badge-success" style={{ marginLeft:'auto' }}>완료</span>}
                          {r.now  && <span className="badge badge-brand"   style={{ marginLeft:'auto' }}>진행 중</span>}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab==='community' && <CommunityTab state={state} update={update} showToast={showToast} onRegionSave={handleRegionSave} />}
          {tab==='ranking'   && <RankingTab state={state} />}
          {tab==='myinfo'    && <MyInfoTab state={state} update={update} showToast={showToast} />}
        </main>
      </div>

      {/* 반려동물 등록 모달 */}
      {modal==='pet' && (
        <Overlay title="반려동물 등록" sub="정보 입력 후 반려동물이 등록됩니다" onClose={() => setModal(null)}>
          <label className="fl">PetChain ID (자동 발급)</label>
          <div style={{ fontFamily:'var(--mono)', fontSize:14, fontWeight:600, color:'var(--brand)', background:'var(--brand-xl)', border:'1px solid var(--brand-l)', borderRadius:8, padding:'10px 14px', marginBottom:14 }}>{newPet.petId}</div>
          <div className="fi-row">
            <div><label className="fl">이름</label><input className="fi" placeholder="초코" value={newPet.name} onChange={e=>setNewPet(p=>({...p,name:e.target.value}))}/></div>
            <div><label className="fl">종류</label><select className="fi" value={newPet.species} onChange={e=>setNewPet(p=>({...p,species:e.target.value}))}><option value="dog">강아지</option><option value="cat">고양이</option><option value="rabbit">토끼</option></select></div>
          </div>
          <div className="fi-row">
            <div><label className="fl">품종</label><input className="fi" placeholder="말티즈" value={newPet.breed} onChange={e=>setNewPet(p=>({...p,breed:e.target.value}))}/></div>
            <div><label className="fl">출생연도</label><input className="fi" type="number" placeholder="2021" value={newPet.birthYear} onChange={e=>setNewPet(p=>({...p,birthYear:e.target.value}))}/></div>
          </div>
          <label className="fl">마이크로칩 번호</label>
          <input className="fi" placeholder="15자리 숫자 — 없으면 공란" value={newPet.chipNo} onChange={e=>setNewPet(p=>({...p,chipNo:e.target.value}))}/>
          <div className="fi-note" style={{ marginBottom:16 }}>📌 마이크로칩 번호는 SHA-256 해시 변환 후 온체인 기록됩니다.</div>
          <button className="btn btn-primary" style={{ width:'100%', padding:13, fontSize:15, justifyContent:'center' }} onClick={handleAddPet}>등록 완료</button>
        </Overlay>
      )}

      {/* 보험 계약 모달 */}
      {modal==='ins' && (
        <Overlay title="보험 계약 등록" sub="가입된 펫보험 정보를 입력하세요" onClose={() => setModal(null)}>
          <label className="fl">보험사</label>
          <select className="fi"><option>DB손해보험</option><option>현대해상</option><option>KB손해보험</option><option>메리츠화재</option></select>
          <label className="fl">상품명</label><input className="fi" placeholder="펫블리 반려동물보험"/>
          <label className="fl">증권번호</label><input className="fi" placeholder="2024-XXXXXXXX"/>
          <div className="fi-row">
            <div><label className="fl">계약 시작일</label><input className="fi" type="date"/></div>
            <div><label className="fl">계약 종료일</label><input className="fi" type="date"/></div>
          </div>
          <div className="fi-note" style={{ marginBottom:16 }}>📌 증권번호는 AES-256 암호화 저장됩니다.</div>
          <button className="btn btn-primary" style={{ width:'100%', padding:13, fontSize:15, justifyContent:'center' }} onClick={() => { setModal(null); showToast('보험 등록','보험 계약 등록 완료') }}>등록 완료</button>
        </Overlay>
      )}

      {/* 진료기록 상세 모달 */}
      {detailRecord && (
        <Overlay title="진료기록 상세" sub={detailRecord.id} onClose={() => setDetailRecord(null)}>
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
              {[['반려동물',detailRecord.petName],['진료일',detailRecord.date],['병원',detailRecord.hospital||'행복동물병원'],['진료비',`${detailRecord.cost.toLocaleString()}원`]].map(([k,v]) => (
                <div key={k} style={{ background:'var(--bg-2)', borderRadius:8, padding:'10px 14px' }}>
                  <div style={{ fontSize:12, fontWeight:500, color:'var(--muted)', marginBottom:4 }}>{k}</div>
                  <div style={{ fontWeight:500, fontSize:15 }}>{v}</div>
                </div>
              ))}
            </div>
            <div>
              <div style={{ fontSize:12, fontWeight:500, color:'var(--muted)', marginBottom:8 }}>질병 코드</div>
              <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>{detailRecord.diseases.map(d=><span key={d} className="badge badge-brand">{d}</span>)}</div>
            </div>
            {detailRecord.treatments?.length>0 && (
              <div>
                <div style={{ fontSize:12, fontWeight:500, color:'var(--muted)', marginBottom:8 }}>진료 행위</div>
                <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>{detailRecord.treatments.map(t=><span key={t} className="badge badge-orange">{t}</span>)}</div>
              </div>
            )}
            {detailRecord.memo && (
              <div>
                <div style={{ fontSize:12, fontWeight:500, color:'var(--muted)', marginBottom:8 }}>진료 소견</div>
                <div style={{ background:'var(--bg-2)', borderRadius:8, padding:'12px 14px', fontSize:15, color:'var(--text-2)', lineHeight:1.7 }}>{detailRecord.memo}</div>
              </div>
            )}
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <span style={{ fontSize:13, color:'var(--muted)' }}>블록체인 기록</span>
              <span className={`badge ${detailRecord.onChain?'badge-success':'badge-warning'}`}>{detailRecord.onChain?'원장 기록 완료':'미기록'}</span>
            </div>
          </div>
        </Overlay>
      )}
    </>
  )
}