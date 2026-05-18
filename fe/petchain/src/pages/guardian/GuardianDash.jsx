import { useState, useRef, useEffect } from 'react'
import DashNav from '../../components/common/DashNav'
import Overlay from '../../components/common/Overlay'
import { useApp, generatePetId } from '../../context/AppContext'
import apiFetch from '../../api/client'

const REGIONS = [
  '서울특별시', '부산광역시', '대구광역시', '인천광역시', '광주광역시',
  '대전광역시', '울산광역시', '세종특별자치시',
  '경기도', '강원도', '충청북도', '충청남도',
  '전라북도', '전라남도', '경상북도', '경상남도', '제주특별자치도',
]

const INSURERS = [
  { id: 'ins-001', name: 'DB손해보험', logo: '🛡️' },
  { id: 'ins-002', name: '현대해상',   logo: '🛡️' },
  { id: 'ins-003', name: 'KB손해보험', logo: '🛡️' },
  { id: 'ins-004', name: '메리츠화재', logo: '🛡️' },
]

/* ── ConsentCard ── */
function ConsentCard({ c, onToggle }) {
  const isActive  = c.status === 'active'
  const isPending = c.status === 'pending'
  return (
    <div className="card" style={{
      borderLeft: `4px solid ${isActive ? 'var(--success)' : isPending ? 'var(--warning)' : 'var(--border-d)'}`,
      opacity: isPending ? .75 : 1,
      background: isActive ? 'var(--success-xl)' : c.status === 'revoked' ? '#fafaf9' : 'var(--surface)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <span style={{ fontSize: 16, fontWeight: 800 }}>{c.pet}</span>
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginLeft: 20, flexShrink: 0 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: isActive ? 'var(--success)' : isPending ? 'var(--warning)' : 'var(--muted)' }}>
            {isActive ? '동의 중' : isPending ? '대기 중' : '동의 안 함'}
          </span>
          <label className="toggle">
            <input type="checkbox" checked={isActive} disabled={isPending} onChange={() => onToggle(c.recordId)} />
            <span className="toggle-slider" />
          </label>
        </div>
      </div>
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

function speciesIcon(species) {
  if (species === '강아지') return '🐶'
  if (species === '고양이') return '🐱'
  if (species === '토끼')   return '🐰'
  return '🐾'
}

const PAGE_SIZE = 7
const MONTHS = ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월']

/* ── MonthPicker ── */
function MonthPicker({ selectedYear, selectedMonth, onChange, onClear }) {
  const [open, setOpen]         = useState(false)
  const [viewYear, setViewYear] = useState(selectedYear || new Date().getFullYear())
  const label = selectedYear ? `${selectedYear}년 ${selectedMonth}월` : '전체 기간'
  return (
    <div style={{ position: 'relative' }}>
      <button className="btn btn-ghost btn-sm" onClick={() => setOpen(o => !o)} style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 130 }}>
        📅 {label} <span style={{ fontSize: 10, color: 'var(--muted)' }}>▼</span>
      </button>
      {open && (
        <div style={{ position: 'absolute', top: 'calc(100% + 6px)', right: 0, zIndex: 200, background: 'var(--surface)', border: '1.5px solid var(--border)', borderRadius: 14, boxShadow: 'var(--shadow-lg)', padding: 18, width: 260 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <button className="btn btn-ghost btn-sm" onClick={() => setViewYear(y => y - 1)}>←</button>
            <span style={{ fontWeight: 800, fontSize: 15 }}>{viewYear}년</span>
            <button className="btn btn-ghost btn-sm" onClick={() => setViewYear(y => y + 1)}>→</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 6 }}>
            {MONTHS.map((m, i) => {
              const mon = i + 1
              const isSelected = selectedYear === viewYear && selectedMonth === mon
              return (
                <button key={mon} onClick={() => { if (isSelected) { onClear(); setOpen(false) } else { onChange(viewYear, mon); setOpen(false) } }}
                  style={{ padding: '8px 4px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: isSelected ? 700 : 400, background: isSelected ? 'var(--brand)' : 'transparent', color: isSelected ? '#fff' : 'var(--text)', transition: 'background .12s' }}
                  onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = 'var(--brand-xl)' }}
                  onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent' }}
                >{m}</button>
              )
            })}
          </div>
          <button className="btn btn-ghost btn-sm" style={{ width: '100%', justifyContent: 'center', marginTop: 12 }} onClick={() => { onClear(); setOpen(false) }}>전체 기간 보기</button>
        </div>
      )}
    </div>
  )
}

/* ── RecordsTab ── */
function RecordsTab({ records, onDetail }) {
  const [page, setPage]               = useState(0)
  const [filterYear, setFilterYear]   = useState(null)
  const [filterMonth, setFilterMonth] = useState(null)
  const filtered    = records.filter(r => { if (!filterYear) return true; const p = r.date.split('.'); return Number(p[0]) === filterYear && Number(p[1]) === filterMonth })
  const totalPages  = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage    = Math.min(page, totalPages - 1)
  const paged       = filtered.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE)
  const handleMonthChange = (y, m) => { setFilterYear(y); setFilterMonth(m); setPage(0) }
  const handleClear       = () => { setFilterYear(null); setFilterMonth(null); setPage(0) }
  return (
    <div className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24 }}>
        <div>
          <div className="pane-h">진료기록 확인</div>
          <div className="pane-sub" style={{ marginBottom: 0 }}>행을 클릭하면 소견을 볼 수 있습니다</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {filterYear && <span className="badge badge-brand" style={{ fontSize: 12 }}>{filterYear}년 {filterMonth}월 · {filtered.length}건</span>}
          <MonthPicker selectedYear={filterYear} selectedMonth={filterMonth} onChange={handleMonthChange} onClear={handleClear} />
        </div>
      </div>
      <div className="card">
        <table className="tbl">
          <thead><tr><th>기록 ID</th><th>반려동물</th><th>진료일</th><th>질병 코드</th><th>진료비</th><th>블록체인</th><th></th></tr></thead>
          <tbody>
            {paged.length === 0 ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--muted)', padding: 56 }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>📋</div>
                <div style={{ fontWeight: 700 }}>{filterYear ? `${filterYear}년 ${filterMonth}월 진료기록이 없습니다` : '등록된 진료기록이 없습니다'}</div>
              </td></tr>
            ) : paged.map(r => (
              <tr key={r.id} style={{ cursor: 'pointer' }} onClick={() => onDetail(r)}>
                <td><span className="mono">{r.id}</span></td>
                <td style={{ fontWeight: 600 }}>{r.petName}</td>
                <td>{r.date}</td>
                <td style={{ fontSize: 13 }}>{r.diseases.join(', ')}</td>
                <td style={{ fontWeight: 600 }}>{r.cost.toLocaleString()}원</td>
                <td><span className={`badge ${r.onChain ? 'badge-success' : 'badge-warning'}`}>{r.onChain ? '원장 기록' : '미기록'}</span></td>
                <td><button className="btn btn-ghost btn-sm" onClick={e => { e.stopPropagation(); onDetail(r) }}>상세 보기</button></td>
              </tr>
            ))}
          </tbody>
        </table>
        {totalPages > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, paddingTop: 16, borderTop: '1px solid var(--border)', marginTop: 4 }}>
            <button className="btn btn-ghost btn-sm" disabled={safePage === 0} onClick={() => setPage(safePage - 1)}>← 이전</button>
            {Array.from({ length: totalPages }, (_, i) => (
              <button key={i} className="btn btn-sm" onClick={() => setPage(i)} style={{ minWidth: 34, background: i === safePage ? 'var(--brand)' : 'transparent', color: i === safePage ? '#fff' : 'var(--text)', border: i === safePage ? 'none' : '1.5px solid var(--border)', fontWeight: i === safePage ? 700 : 400 }}>{i + 1}</button>
            ))}
            <button className="btn btn-ghost btn-sm" disabled={safePage === totalPages - 1} onClick={() => setPage(safePage + 1)}>다음 →</button>
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

  const handleSave = () => {
    update({ userRegion: region })
    showToast('저장 완료', '내 정보가 업데이트되었습니다')
  }

  const toggleInsurer = (id) => {
    const next = state.userInsurers.includes(id)
      ? state.userInsurers.filter(i => i !== id)
      : [...state.userInsurers, id]
    update({ userInsurers: next })
  }

  return (
    <div className="fade-in">
      <div className="pane-h">내 정보</div>
      <div className="pane-sub">기본 정보와 연결 보험사를 관리합니다</div>
      <div className="g2" style={{ alignItems: 'start' }}>
        {/* 기본 정보 */}
        <div className="card">
          <div className="card-title">기본 정보</div>
          <div className="fi-row">
            <div><label className="fl">이름</label><input className="fi" value={name} onChange={e => setName(e.target.value)} /></div>
            <div><label className="fl">전화번호</label><input className="fi" value={phone} onChange={e => setPhone(e.target.value)} /></div>
          </div>
          <label className="fl">이메일</label>
          <input className="fi" type="email" value={email} onChange={e => setEmail(e.target.value)} />
          <label className="fl">거주 지역</label>
          <select className="fi" value={region} onChange={e => setRegion(e.target.value)}>
            {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: 12 }} onClick={handleSave}>저장</button>
        </div>

        {/* 보험사 연결 */}
        <div className="card">
          <div className="card-title">보험사 연결</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {INSURERS.map(ins => {
              const isOn = state.userInsurers.includes(ins.id)
              return (
                <div key={ins.id} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '14px 18px', borderRadius: 12,
                  border: `1.5px solid ${isOn ? 'var(--success)' : 'var(--border)'}`,
                  background: isOn ? 'var(--success-xl)' : 'var(--surface)',
                  transition: 'all .2s',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: 20 }}>{ins.logo}</span>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14 }}>{ins.name}</div>
                      <div style={{ fontSize: 12, color: isOn ? 'var(--success)' : 'var(--muted)', marginTop: 2 }}>{isOn ? '연결됨' : '미연결'}</div>
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
    setSaving(true)
    await onSave(selected)
    setSaving(false)
    setEditing(false)
  }

  if (!editing && userRegion) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', gap: 14, padding: '14px 20px',
        borderRadius: 14, marginBottom: 20,
        background: 'linear-gradient(135deg, var(--brand-xl) 0%, #f0f4ff 100%)',
        border: '1.5px solid var(--brand-l)',
      }}>
        <span style={{ fontSize: 20 }}>📍</span>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-2)' }}>내 거주지역</span>
          <span className="badge badge-brand" style={{ fontSize: 12 }}>{userRegion}</span>
          <span style={{ fontSize: 12, color: 'var(--muted)' }}>· 내 지역 게시물에만 투표(추천)할 수 있어요</span>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={() => setEditing(true)}>변경</button>
      </div>
    )
  }

  return (
    <div style={{
      padding: '26px 28px', borderRadius: 18, marginBottom: 24,
      background: 'linear-gradient(135deg, #4338ca 0%, #6366f1 60%, #818cf8 100%)',
      boxShadow: '0 6px 24px rgba(67,56,202,.30)',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
        <div style={{
          width: 52, height: 52, borderRadius: 14, flexShrink: 0,
          background: 'rgba(255,255,255,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26,
        }}>📍</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: '#fff', marginBottom: 4 }}>
            내 거주지역을 설정해주세요
          </div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,.75)', lineHeight: 1.7, marginBottom: 18 }}>
            커뮤니티 투표(추천)는 <strong style={{ color: '#c7d2fe' }}>같은 지역 주민</strong>만 참여할 수 있어요.<br />
            지역을 설정하면 우리 동네 반려동물 친구들을 응원할 수 있습니다! 🐾
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <select
              className="fi"
              style={{ margin: 0, flex: 1, maxWidth: 260, background: 'rgba(255,255,255,.96)', fontWeight: 600 }}
              value={selected}
              onChange={e => setSelected(e.target.value)}
            >
              {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
            <button
              className="btn"
              style={{ background: '#fff', color: 'var(--brand)', fontWeight: 800, border: 'none', padding: '11px 24px', flexShrink: 0, boxShadow: '0 2px 8px rgba(0,0,0,.15)' }}
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? '저장 중…' : '설정 완료'}
            </button>
            {userRegion && (
              <button className="btn btn-ghost btn-sm" style={{ color: 'rgba(255,255,255,.7)', border: '1px solid rgba(255,255,255,.25)' }} onClick={() => setEditing(false)}>취소</button>
            )}
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 24, marginTop: 18, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,.15)', flexWrap: 'wrap' }}>
        {[['🗳️', '내 지역 게시물에만 투표 가능'], ['🐾', '우리 동네 반려동물 이야기'], ['🏆', '지역별 랭킹에 반영']].map(([icon, text]) => (
          <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'rgba(255,255,255,.65)' }}>
            <span>{icon}</span><span>{text}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── CommunityTab ── */
function CommunityTab({ state, update, showToast, onRegionSave }) {
  const [filter,           setFilter]           = useState('all')
  const [expandedComments, setExpandedComments] = useState({})
  const [commentInputs,    setCommentInputs]    = useState({})
  const [replyOpen,        setReplyOpen]        = useState({})
  const [replyInputs,      setReplyInputs]      = useState({})
  const [showCompose,      setShowCompose]      = useState(false)
  const [newPost,          setNewPost]          = useState({ content: '', petId: '', imagePreview: null })
  const fileRef = useRef()

  const userRegion    = state.userRegion
  const likedPosts    = state.likedPosts || []
  const filteredPosts = filter === 'all' ? state.posts : state.posts.filter(p => p.authorRegion === userRegion)

  const isLiked = (postId) => likedPosts.includes(postId)

  const handleLike = (postId) => {
    if (!userRegion) {
      showToast('지역 미설정', '투표하려면 먼저 거주지역을 설정해야 합니다')
      return
    }
    const post = state.posts.find(p => p.id === postId)
    if (post && post.authorRegion !== userRegion) {
      showToast('투표 불가', `내 지역(${userRegion}) 게시물에만 투표할 수 있어요`)
      return
    }
    const liked = isLiked(postId)
    update({
      likedPosts: liked ? likedPosts.filter(id => id !== postId) : [...likedPosts, postId],
      posts: state.posts.map(p =>
        p.id === postId
          ? { ...p, likes: liked ? p.likes.slice(0, -1) : [...p.likes, userRegion] }
          : p
      ),
    })
  }

  const handleAddComment = (postId) => {
    const content = (commentInputs[postId] || '').trim()
    if (!content) return
    update({ posts: state.posts.map(p => p.id === postId ? { ...p, comments: [...p.comments, { id: `cmt-${Date.now()}`, authorName: '홍길동', authorRegion: userRegion, content, likes: 0, replies: [] }] } : p) })
    setCommentInputs(prev => ({ ...prev, [postId]: '' }))
  }

  const handleAddReply = (postId, cmtId) => {
    const content = (replyInputs[cmtId] || '').trim()
    if (!content) return
    update({ posts: state.posts.map(p => p.id === postId ? { ...p, comments: p.comments.map(c => c.id === cmtId ? { ...c, replies: [...c.replies, { id: `rep-${Date.now()}`, authorName: '홍길동', content, likes: 0 }] } : c) } : p) })
    setReplyInputs(prev => ({ ...prev, [cmtId]: '' }))
    setReplyOpen(prev => ({ ...prev, [cmtId]: false }))
  }

  const handleSubmitPost = () => {
    if (!newPost.content.trim()) return
    const pet = state.pets.find(p => p.petId === newPost.petId) || state.pets[0]
    update({
      posts: [{
        id: `post-${Date.now()}`,
        authorName: '홍길동', authorRegion: userRegion,
        petName: pet?.name || '', petBreed: pet?.breed || '',
        content: newPost.content, imageUrl: newPost.imagePreview,
        likes: [], comments: [],
        createdAt: new Date().toLocaleDateString('ko-KR').slice(0, 10).replace(/-/g, '.'),
        votes: {}, myVoted: false,
      }, ...state.posts]
    })
    setNewPost({ content: '', petId: '', imagePreview: null })
    setShowCompose(false)
    showToast('게시 완료', '게시물이 등록되었습니다')
  }

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <div className="pane-h">커뮤니티</div>
          <div className="pane-sub" style={{ marginBottom: 0 }}>우리 동네 반려동물 이야기</div>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCompose(true)}>+ 게시물 작성</button>
      </div>

      <RegionBanner key={userRegion || 'unset'} userRegion={userRegion} onSave={onRegionSave} />

      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {[['all', '전체'], ['myregion', userRegion ? `내 지역 (${userRegion})` : '내 지역 (미설정)']].map(([f, lbl]) => (
          <button key={f} className={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setFilter(f)}>{lbl}</button>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {filteredPosts.length === 0 && (
          <div className="card" style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--muted)' }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>🐾</div>
            <div style={{ fontWeight: 700 }}>게시물이 없습니다</div>
          </div>
        )}
        {filteredPosts.map(post => {
          const liked       = isLiked(post.id)
          const cmtExpanded = expandedComments[post.id]
          return (
            <div key={post.id} className="card" style={{ padding: '20px 24px' }}>
              {/* 헤더 */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg, var(--brand-xl), var(--brand-l))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🐾</div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontWeight: 700, fontSize: 14 }}>{post.authorName}</span>
                    <span className="badge badge-brand" style={{ fontSize: 10 }}>{post.authorRegion}</span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 1 }}>{post.createdAt}</div>
                </div>
              </div>

              {post.petName && (
                <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
                  <span className="badge badge-orange" style={{ fontSize: 11 }}>🐶 {post.petName}</span>
                  <span className="badge badge-muted"  style={{ fontSize: 11 }}>{post.petBreed}</span>
                </div>
              )}

              <div style={{ fontSize: 14, color: 'var(--text-2)', lineHeight: 1.75, marginBottom: 12 }}>{post.content}</div>

              {post.imageUrl && (
                <div style={{ marginBottom: 12, borderRadius: 10, overflow: 'hidden', aspectRatio: '16/9' }}>
                  <img src={post.imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              )}

              {/* 액션바 */}
              <div style={{ display: 'flex', gap: 6, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => handleLike(post.id)}
                  style={{ color: liked ? '#e11d48' : 'var(--muted)', fontWeight: liked ? 700 : 400, transition: 'color .15s' }}
                >
                  {liked ? '❤️' : '🤍'} {post.likes.length}
                </button>
                <button className="btn btn-ghost btn-sm" onClick={() => setExpandedComments(prev => ({ ...prev, [post.id]: !cmtExpanded }))}>
                  💬 {post.comments.length}
                </button>
              </div>

              {/* 댓글 */}
              {cmtExpanded && (
                <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
                  {post.comments.map(cmt => (
                    <div key={cmt.id} style={{ marginBottom: 14 }}>
                      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                        <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'var(--bg-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>🐾</div>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                            <span style={{ fontSize: 13, fontWeight: 700 }}>{cmt.authorName}</span>
                            <span className="badge badge-muted" style={{ fontSize: 10 }}>{cmt.authorRegion}</span>
                          </div>
                          <div style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.6 }}>{cmt.content}</div>
                          <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                            <button className="btn btn-ghost btn-sm" style={{ fontSize: 11, padding: '3px 8px' }}>❤️ {cmt.likes}</button>
                            <button className="btn btn-ghost btn-sm" style={{ fontSize: 11, padding: '3px 8px' }} onClick={() => setReplyOpen(prev => ({ ...prev, [cmt.id]: !prev[cmt.id] }))}>↩ 대댓글</button>
                          </div>
                          {cmt.replies.map(rep => (
                            <div key={rep.id} style={{ display: 'flex', gap: 8, marginTop: 8, paddingLeft: 12, borderLeft: '2px solid var(--border)' }}>
                              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--brand)' }}>{rep.authorName}</span>
                              <span style={{ fontSize: 13, color: 'var(--text-2)' }}>{rep.content}</span>
                            </div>
                          ))}
                          {replyOpen[cmt.id] && (
                            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                              <input className="fi" style={{ margin: 0, fontSize: 13 }} placeholder="대댓글 입력..." value={replyInputs[cmt.id] || ''} onChange={e => setReplyInputs(prev => ({ ...prev, [cmt.id]: e.target.value }))} onKeyDown={e => e.key === 'Enter' && handleAddReply(post.id, cmt.id)} />
                              <button className="btn btn-primary btn-sm" onClick={() => handleAddReply(post.id, cmt.id)}>등록</button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                    <input className="fi" style={{ margin: 0, fontSize: 13 }} placeholder="댓글을 입력하세요..." value={commentInputs[post.id] || ''} onChange={e => setCommentInputs(prev => ({ ...prev, [post.id]: e.target.value }))} onKeyDown={e => e.key === 'Enter' && handleAddComment(post.id)} />
                    <button className="btn btn-primary btn-sm" onClick={() => handleAddComment(post.id)}>등록</button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* 게시물 작성 모달 */}
      {showCompose && (
        <Overlay title="게시물 작성" sub="반려동물 이야기를 공유해보세요" onClose={() => setShowCompose(false)}>
          <label className="fl">반려동물 선택</label>
          <select className="fi" value={newPost.petId} onChange={e => setNewPost(p => ({ ...p, petId: e.target.value }))}>
            <option value="">-- 선택하세요 --</option>
            {state.pets.map(p => <option key={p.petId} value={p.petId}>{p.name} ({p.breed})</option>)}
          </select>
          <label className="fl">내용</label>
          <textarea className="fi" rows={5} placeholder="오늘 있었던 이야기를 적어보세요..." value={newPost.content} onChange={e => setNewPost(p => ({ ...p, content: e.target.value }))} style={{ resize: 'vertical', fontFamily: 'inherit' }} />
          <label className="fl">이미지 첨부</label>
          <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { const f = e.target.files[0]; if (!f) return; const r = new FileReader(); r.onload = ev => setNewPost(p => ({ ...p, imagePreview: ev.target.result })); r.readAsDataURL(f) }} />
          {newPost.imagePreview
            ? <img src={newPost.imagePreview} alt="" style={{ width: '100%', borderRadius: 10, marginBottom: 14, aspectRatio: '16/9', objectFit: 'cover' }} />
            : <div className="upload-zone" style={{ marginBottom: 14 }} onClick={() => fileRef.current.click()}>📎 이미지 첨부 (선택)</div>
          }
          <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: 13 }} onClick={handleSubmitPost}>게시하기</button>
        </Overlay>
      )}
    </div>
  )
}

/* ── RankingTab + KoreaMap ── */
const REGION_PINS = [
  { name: '서울특별시',     x: 128, y: 150, label: '서울' },
  { name: '인천광역시',     x: 88,  y: 163, label: '인천' },
  { name: '경기도',         x: 132, y: 202, label: '경기' },
  { name: '강원도',         x: 220, y: 148, label: '강원' },
  { name: '세종특별자치시', x: 152, y: 267, label: '세종' },
  { name: '대전광역시',     x: 140, y: 284, label: '대전' },
  { name: '충청북도',       x: 192, y: 262, label: '충북' },
  { name: '충청남도',       x: 105, y: 274, label: '충남' },
  { name: '전라북도',       x: 118, y: 350, label: '전북' },
  { name: '광주광역시',     x: 115, y: 406, label: '광주' },
  { name: '전라남도',       x: 133, y: 444, label: '전남' },
  { name: '대구광역시',     x: 236, y: 347, label: '대구' },
  { name: '경상북도',       x: 228, y: 280, label: '경북' },
  { name: '경상남도',       x: 218, y: 417, label: '경남' },
  { name: '울산광역시',     x: 261, y: 377, label: '울산' },
  { name: '부산광역시',     x: 249, y: 434, label: '부산' },
  { name: '제주특별자치도', x: 148, y: 502, label: '제주' },
]

function RankingTab({ state }) {
  const [selectedRegion, setSelectedRegion] = useState(null)

  const regionRanking = (region) =>
    state.posts
      .filter(p => p.authorRegion === region)
      .sort((a, b) => (b.votes[region] || 0) - (a.votes[region] || 0))
      .slice(0, 10)
      .map((p, i) => ({ rank: i + 1, petName: p.petName, petBreed: p.petBreed, votes: p.votes[region] || 0 }))

  const getVoteSum = (region) =>
    state.posts.filter(p => p.authorRegion === region).reduce((acc, p) => acc + (p.votes[region] || 0), 0)

  const maxVotes = Math.max(1, ...REGION_PINS.map(r => getVoteSum(r.name)))

  const rankStyle = (rank) => {
    if (rank === 1) return { background: '#fef08a', color: '#713f12', border: '1.5px solid #fbbf24' }
    if (rank === 2) return { background: '#e2e8f0', color: '#334155', border: '1.5px solid #94a3b8' }
    if (rank === 3) return { background: '#fed7aa', color: '#7c2d12', border: '1.5px solid #fb923c' }
    return { background: 'var(--bg-2)', color: 'var(--muted)', border: '1px solid var(--border)' }
  }

  return (
    <div className="fade-in">
      <div className="pane-h">지역 랭킹</div>
      <div className="pane-sub">지역 핀을 클릭해서 TOP 10 랭킹을 확인하세요</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24, alignItems: 'start' }}>
        {/* 지도 */}
        <div className="card" style={{ padding: 20 }}>
          <svg viewBox="0 0 320 540" width="100%" style={{ display: 'block', maxHeight: 480 }}>
            <path
              d="M 140 25 L 170 28 L 210 42 L 258 72 L 278 120 L 285 185 L 282 260 L 272 330 L 258 395 L 248 445 L 228 472 L 200 480 L 170 478 L 140 468 L 108 450 L 78 420 L 60 375 L 52 310 L 56 245 L 64 185 L 76 140 L 90 100 L 112 68 L 132 45 Z"
              fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="1.5"
            />
            <ellipse cx="148" cy="502" rx="38" ry="20" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="1.5" />
            {REGION_PINS.map(pin => {
              const votes     = getVoteSum(pin.name)
              const r         = votes > 0 ? 7 + (votes / maxVotes) * 10 : 6
              const isSelected = selectedRegion === pin.name
              const hasData   = votes > 0
              return (
                <g key={pin.name} onClick={() => setSelectedRegion(isSelected ? null : pin.name)} style={{ cursor: 'pointer' }}>
                  {isSelected && <circle cx={pin.x} cy={pin.y} r={r + 5} fill="rgba(67,56,202,0.18)" />}
                  <circle cx={pin.x} cy={pin.y} r={r}
                    fill={isSelected ? 'var(--brand)' : hasData ? '#6366f1' : '#94a3b8'}
                    opacity={hasData ? 1 : 0.55}
                  />
                  {votes > 0 && (
                    <text x={pin.x} y={pin.y + 0.5} textAnchor="middle" dominantBaseline="middle" fill="#fff" fontSize="7" fontWeight="700">{votes}</text>
                  )}
                  <text x={pin.x} y={pin.y + r + 9} textAnchor="middle"
                    fill={isSelected ? 'var(--brand)' : 'var(--text-3)'}
                    fontSize="8.5" fontWeight={isSelected ? '700' : '500'}
                  >{pin.label}</text>
                </g>
              )
            })}
          </svg>
        </div>

        {/* 랭킹 패널 */}
        {selectedRegion ? (
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
              <span style={{ fontSize: 20 }}>📍</span>
              <div>
                <div style={{ fontWeight: 800, fontSize: 16 }}>{selectedRegion}</div>
                <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>지역 TOP 10</div>
              </div>
            </div>
            {regionRanking(selectedRegion).length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--muted)' }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>🐾</div>
                <div style={{ fontWeight: 600 }}>등록된 게시물이 없습니다</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {regionRanking(selectedRegion).map(item => (
                  <div key={item.rank} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 10, background: 'var(--bg-2)' }}>
                    <div style={{ width: 26, height: 26, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, flexShrink: 0, ...rankStyle(item.rank) }}>{item.rank}</div>
                    <span style={{ fontSize: 18 }}>🐶</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 13 }}>{item.petName}</div>
                      <div style={{ fontSize: 11, color: 'var(--muted)' }}>{item.petBreed}</div>
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--brand)' }}>{item.votes}표</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="card" style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--muted)' }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>🗺️</div>
            <div style={{ fontWeight: 700, marginBottom: 6 }}>지역을 선택하세요</div>
            <div style={{ fontSize: 13 }}>지도의 핀을 클릭하면<br />해당 지역 TOP 10을 확인할 수 있습니다</div>
          </div>
        )}
      </div>
    </div>
  )
}

/* ── Main Component ── */
export default function GuardianDash({ showToast, onLogout }) {
  const { state, update, toggleConsent, addPet } = useApp()
  const [tab, setTab]               = useState('home')
  const [modal, setModal]           = useState(null)
  const [detailRecord, setDetailRecord] = useState(null)
  const [newPet, setNewPet] = useState({ name: '', species: 'dog', breed: '', birthYear: '', chipNo: '', petId: '' })

  // Load data from API on mount, fall back to mock data on failure
  useEffect(() => {
    async function loadData() {
      try {
        const [petsRes, recordsRes, consentsRes, meRes] = await Promise.allSettled([
          apiFetch('/pets'),
          apiFetch('/records?page=0&size=20'),
          apiFetch('/consents?page=0&size=20'),
          apiFetch('/users/me'),
        ])

        if (meRes.status === 'fulfilled' && meRes.value?.region) {
          update({ userRegion: meRes.value.region })
        }

        if (petsRes.status === 'fulfilled') {
          const apiPets = Array.isArray(petsRes.value) ? petsRes.value : []
          if (apiPets.length > 0) {
            const mapped = apiPets.map(p => ({
              petId: String(p.id),
              name: p.name,
              species: p.species,
              breed: p.breed,
              birthYear: p.birthYear,
              insurer: 'DB손해보험',
            }))
            update({ pets: mapped })
          }
        }

        if (recordsRes.status === 'fulfilled') {
          const apiRecords = Array.isArray(recordsRes.value?.records)
            ? recordsRes.value.records
            : (Array.isArray(recordsRes.value?.content) ? recordsRes.value.content : [])
          if (apiRecords.length > 0) {
            const mapped = apiRecords.map(r => ({
              id: String(r.recordId || r.id),
              petId: String(r.petId || ''),
              petName: r.petName || '',
              date: (r.treatmentDate || r.date || '').replaceAll('-', '.'),
              diseases: Array.isArray(r.diagnosisCodes) ? r.diagnosisCodes : (Array.isArray(r.diseases) ? r.diseases : []),
              treatments: Array.isArray(r.treatmentCodes) ? r.treatmentCodes : (Array.isArray(r.treatments) ? r.treatments : []),
              cost: r.treatmentCost || r.cost || 0,
              memo: r.memo || '',
              onChain: !!(r.recordHash || r.onChain),
            }))
            update({ medicalRecords: mapped })
          }
        }

        if (consentsRes.status === 'fulfilled') {
          const apiConsents = Array.isArray(consentsRes.value?.consents)
            ? consentsRes.value.consents
            : (Array.isArray(consentsRes.value?.content) ? consentsRes.value.content : [])
          if (apiConsents.length > 0) {
            const statusMap = { ACTIVE: 'active', REVOKED: 'revoked', PENDING: 'pending' }
            const mapped = {}
            apiConsents.forEach(c => {
              const key = String(c.recordId)
              mapped[key] = {
                consentId: String(c.consentId || c.id),
                recordId: key,
                guardianId: c.guardianId,
                insurerId: c.insurerId,
                status: statusMap[c.status] || (c.status || '').toLowerCase(),
                insurerName: c.insurerName || c.insurerId || '',
                pet: c.petName || '',
                disease: c.disease || '',
                hospital: c.hospitalName || '',
                cost: c.cost || 0,
              }
            })
            update({ consents: mapped })
          }
        }
      } catch {
        // Silently fall back to existing mock data
      }
    }
    loadData()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const consents     = Object.values(state.consents)
  const activeCount  = consents.filter(c => c.status === 'active').length
  const revokedCount = consents.filter(c => c.status === 'revoked').length

  const handleToggle = async (recordId) => {
    const c    = state.consents[recordId]
    const next = c.status === 'active' ? 'revoked' : 'active'
    // Optimistically update local state
    toggleConsent(recordId)
    showToast(next === 'active' ? '동의 완료' : '동의 철회', next === 'active' ? `${recordId} — 보험사에 서류 자동 전달 시작` : `${recordId} — 보험사 접근 차단됨`)
    // Sync with API (graceful degradation on failure)
    try {
      if (c.status === 'active') {
        // active → revoke
        await apiFetch(`/consents/${c.consentId}/revoke`, { method: 'POST' })
      } else {
        // revoked/pending → re-consent
        await apiFetch('/consents', { method: 'POST', body: { recordId: c.recordId, insurerId: c.insurerId || localStorage.getItem('userId') || '1', guardianId: c.guardianId || localStorage.getItem('userId') || '1' } })
      }
    } catch {
      // API failure: local state already updated, no rollback needed for demo
    }
  }

  const handleRegionSave = async (region) => {
    update({ userRegion: region })
    showToast('지역 설정 완료', `거주지역이 ${region}(으)로 설정되었습니다`)
    try {
      await apiFetch('/users/me', { method: 'PATCH', body: { region } })
    } catch {
      // API 실패 시 로컬 상태는 이미 업데이트됨
    }
  }

  const openPetModal = () => {
    const petId = generatePetId(state.pets.map(p => p.petId))
    setNewPet({ name: '', species: 'dog', breed: '', birthYear: '', chipNo: '', petId })
    setModal('pet')
  }

  const handleAddPet = async () => {
    const speciesMap = { dog: '강아지', cat: '고양이', rabbit: '토끼' }
    const petData = { petId: newPet.petId, name: newPet.name, species: speciesMap[newPet.species] || newPet.species, breed: newPet.breed, birthYear: newPet.birthYear ? Number(newPet.birthYear) : '', chipNo: newPet.chipNo, insurer: 'DB손해보험' }
    addPet(petData)
    setModal(null)
    showToast('반려동물 등록', (newPet.name || '새 반려동물') + ' 등록 완료')
    // Sync with API
    try {
      const created = await apiFetch('/pets', {
        method: 'POST',
        body: { name: newPet.name, species: speciesMap[newPet.species] || newPet.species, breed: newPet.breed, birthYear: newPet.birthYear ? Number(newPet.birthYear) : undefined, gender: '', isNeutered: false },
      })
      // Refresh pets list from API response
      if (created && created.id) {
        const refreshed = await apiFetch('/pets')
        const apiPets = Array.isArray(refreshed) ? refreshed : []
        if (apiPets.length > 0) {
          update({ pets: apiPets.map(p => ({ petId: String(p.id), name: p.name, species: p.species, breed: p.breed, birthYear: p.birthYear, insurer: 'DB손해보험' })) })
        }
      }
    } catch {
      // API failure: local state already updated via addPet()
    }
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
                <button className="btn btn-primary" onClick={openPetModal}>+ 반려동물 추가</button>
              </div>
            </div>
            <div className="g3" style={{ marginBottom: 28 }}>
              {[
                { n: state.medicalRecords.length, l: '총 진료기록 · 클릭하여 확인', bg: 'var(--brand-xl)', border: 'var(--brand)', color: 'var(--brand)', target: 'records' },
                { n: activeCount,  l: '동의 활성 · 클릭하여 관리',   bg: 'var(--success-xl)', border: 'var(--success)', color: 'var(--success)', target: 'consent' },
                { n: revokedCount, l: '동의 철회 · 클릭하여 관리',   bg: 'var(--danger-xl)',  border: 'var(--danger)',  color: 'var(--danger)',  target: 'consent' },
              ].map((s, i) => (
                <div key={i} className="stat-box" onClick={() => setTab(s.target)} style={{ background: s.bg, border: `1px solid ${s.border}22`, cursor: 'pointer', transition: 'box-shadow .15s' }}
                  onMouseEnter={e => e.currentTarget.style.boxShadow = 'var(--shadow-md)'}
                  onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}>
                  <div className="stat-n" style={{ color: s.color }}>{s.n}</div>
                  <div className="stat-l" style={{ color: s.color, opacity: .75 }}>{s.l}</div>
                </div>
              ))}
            </div>
            <div className="g3">
              {state.pets.map((p, i) => (
                <div key={i} className="card" style={{ borderTop: '3px solid var(--brand)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
                    <div style={{ width: 52, height: 52, borderRadius: 14, background: 'linear-gradient(135deg, var(--brand-xl), var(--brand-l))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26 }}>{speciesIcon(p.species)}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 18, fontWeight: 800 }}>{p.name}</div>
                      <span className="mono" style={{ fontSize: 12, color: 'var(--brand)', fontWeight: 700 }}>{p.petId}</span>
                      <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 2 }}>{p.species} · {p.breed}</div>
                    </div>
                    <span className="badge badge-success">보험 활성</span>
                  </div>
                  <div className="divider" />
                  <div className="row-flex"><span style={{ fontSize: 13, color: 'var(--muted)', fontWeight: 600 }}>보험사</span><span style={{ fontWeight: 700, color: 'var(--text-2)' }}>{p.insurer}</span></div>
                  <div className="row-flex"><span style={{ fontSize: 13, color: 'var(--muted)', fontWeight: 600 }}>동의 활성</span><span style={{ fontWeight: 700, color: 'var(--success)' }}>{activeCount}건</span></div>
                  <button className="btn btn-primary btn-sm" style={{ width: '100%', marginTop: 16, justifyContent: 'center', fontWeight: 700 }} onClick={() => setTab('records')}>📋 진료기록 확인</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'records' && <RecordsTab records={state.medicalRecords} onDetail={setDetailRecord} />}

        {/* ── 동의 관리 ── */}
        {tab === 'consent' && (
          <div className="fade-in">
            <div className="pane-h">동의 관리</div>
            <div className="pane-sub">토글을 ON하면 보험사에 서류가 자동으로 전달됩니다</div>
            <div className="alert alert-info" style={{ marginBottom: 28 }}>
              ℹ️ 동의 유효기간은 1년이며, 언제든지 철회 가능합니다. 철회 즉시 보험사의 신규 접근이 차단됩니다.
            </div>
            {consents.filter(c => c.status === 'active').length > 0 && (
              <div style={{ marginBottom: 28 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--success)' }} />
                  <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--success)', textTransform: 'uppercase', letterSpacing: '.06em' }}>동의 완료 — {consents.filter(c => c.status === 'active').length}건 전송 중</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {consents.filter(c => c.status === 'active').map(c => <ConsentCard key={c.recordId} c={c} onToggle={handleToggle} />)}
                </div>
              </div>
            )}
            {consents.filter(c => c.status !== 'active').length > 0 && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--muted-l)' }} />
                  <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.06em' }}>미동의 / 철회 — {consents.filter(c => c.status !== 'active').length}건</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {consents.filter(c => c.status !== 'active').map(c => <ConsentCard key={c.recordId} c={c} onToggle={handleToggle} />)}
                </div>
              </div>
            )}
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
                <button className="btn btn-primary" style={{ marginTop: 20 }} onClick={() => setTab('consent')}>동의 관리로 이동 →</button>
              </div>
            ) : (
              <div className="g2">
                {consents.filter(c => c.status === 'active').map(c => (
                  <div key={c.recordId} className="card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 22 }}>
                      <div>
                        <div style={{ fontSize: 17, fontWeight: 800, marginBottom: 4 }}>{c.pet} · {c.disease}</div>
                        <div style={{ fontSize: 13, color: 'var(--muted)', display: 'flex', gap: 10 }}>
                          <span className="mono">{c.recordId}</span><span>· {c.cost.toLocaleString()}원</span>
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
                        <div className="tl-dot" style={{ background: r.done ? 'var(--success)' : r.now ? 'var(--brand)' : 'var(--border-d)', boxShadow: r.now ? '0 0 0 4px var(--brand-xl)' : 'none' }} />
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 700, color: r.done ? 'var(--success)' : r.now ? 'var(--brand)' : 'var(--muted)' }}>{r.lbl}</div>
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

        {/* ── 커뮤니티 ── */}
        {tab === 'community' && <CommunityTab state={state} update={update} showToast={showToast} onRegionSave={handleRegionSave} />}

        {/* ── 지역 랭킹 ── */}
        {tab === 'ranking' && <RankingTab state={state} />}

        {/* ── 내 정보 ── */}
        {tab === 'myinfo' && <MyInfoTab state={state} update={update} showToast={showToast} />}

      </div>

      {/* 반려동물 등록 모달 */}
      {modal === 'pet' && (
        <Overlay title="반려동물 등록" sub="정보 입력 후 반려동물이 등록됩니다" onClose={() => setModal(null)}>
          <label className="fl">PetChain ID (자동 발급)</label>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 15, fontWeight: 800, color: 'var(--brand)', background: 'var(--brand-xl)', border: '1.5px solid var(--brand-l)', borderRadius: 8, padding: '10px 14px', marginBottom: 14, letterSpacing: '.05em' }}>{newPet.petId}</div>
          <div className="fi-row">
            <div><label className="fl">이름</label><input className="fi" placeholder="초코" value={newPet.name} onChange={e => setNewPet(p => ({ ...p, name: e.target.value }))} /></div>
            <div><label className="fl">종류</label><select className="fi" value={newPet.species} onChange={e => setNewPet(p => ({ ...p, species: e.target.value }))}><option value="dog">강아지</option><option value="cat">고양이</option><option value="rabbit">토끼</option></select></div>
          </div>
          <div className="fi-row">
            <div><label className="fl">품종</label><input className="fi" placeholder="말티즈" value={newPet.breed} onChange={e => setNewPet(p => ({ ...p, breed: e.target.value }))} /></div>
            <div><label className="fl">출생연도</label><input className="fi" type="number" placeholder="2021" value={newPet.birthYear} onChange={e => setNewPet(p => ({ ...p, birthYear: e.target.value }))} /></div>
          </div>
          <label className="fl">마이크로칩 번호</label>
          <input className="fi" placeholder="15자리 숫자 — 없으면 공란" value={newPet.chipNo} onChange={e => setNewPet(p => ({ ...p, chipNo: e.target.value }))} />
          <div className="fi-note">📌 마이크로칩 번호는 SHA-256 해시 변환 후 온체인 기록됩니다.</div>
          <button className="btn btn-primary" style={{ width: '100%', padding: 13, fontSize: 14 }} onClick={handleAddPet}>등록 완료</button>
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
          <button className="btn btn-primary" style={{ width: '100%', padding: 13, fontSize: 14 }} onClick={() => { setModal(null); showToast('보험 등록', '보험 계약 등록 완료') }}>등록 완료</button>
        </Overlay>
      )}

      {/* 진료기록 상세 모달 */}
      {detailRecord && (
        <Overlay title="진료기록 상세" sub={detailRecord.id} onClose={() => setDetailRecord(null)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {[['반려동물', detailRecord.petName], ['진료일', detailRecord.date], ['병원', detailRecord.hospital || '행복동물병원'], ['진료비', `${detailRecord.cost.toLocaleString()}원`]].map(([k, v]) => (
                <div key={k} style={{ background: 'var(--bg-2)', borderRadius: 8, padding: '10px 14px' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', marginBottom: 4 }}>{k}</div>
                  <div style={{ fontWeight: 600 }}>{v}</div>
                </div>
              ))}
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', marginBottom: 8 }}>질병 코드</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>{detailRecord.diseases.map(d => <span key={d} className="badge badge-brand" style={{ fontSize: 12 }}>{d}</span>)}</div>
            </div>
            {detailRecord.treatments?.length > 0 && (
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', marginBottom: 8 }}>진료 행위</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>{detailRecord.treatments.map(t => <span key={t} className="badge badge-orange" style={{ fontSize: 12 }}>{t}</span>)}</div>
              </div>
            )}
            {detailRecord.memo && (
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', marginBottom: 8 }}>진료 소견</div>
                <div style={{ background: 'var(--bg-2)', borderRadius: 8, padding: '12px 14px', fontSize: 14, color: 'var(--text-2)', lineHeight: 1.7 }}>{detailRecord.memo}</div>
              </div>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)' }}>블록체인 기록</span>
              <span className={`badge ${detailRecord.onChain ? 'badge-success' : 'badge-warning'}`}>{detailRecord.onChain ? '원장 기록 완료' : '미기록'}</span>
            </div>
          </div>
        </Overlay>
      )}
    </>
  )
}
