/**
 * 데모용 인메모리 목 서버.
 *
 * window.fetch 를 감싸서 `/api/**` 요청만 가로채고, 나머지는 원래 fetch 로 넘긴다.
 * 화면 코드(apiFetch, AuthPage 의 raw fetch)는 수정 없이 그대로 동작한다.
 * 상태는 새로고침하면 초기화된다.
 */

import { ACCOUNTS, resolveAccount, seed } from './data'

let db = seed()

const LATENCY = 120

const json = (body, status = 200) =>
  new Response(JSON.stringify(body ?? null), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })

const fail = (status, message) => json({ message, errorCode: `DEMO_${status}`, traceId: 'demo' }, status)

const nowIso = () => new Date().toISOString()

function currentUser() {
  const type = (localStorage.getItem('memberType') || '').toUpperCase()
  const byType = { USER: 'guardian', HOSPITAL: 'hospital', INSURANCE: 'insurance', PLATFORM: 'platform' }
  return db.users[byType[type]] || null
}

function authPayload(account) {
  return {
    accessToken: `demo.${account.role}.token`,
    refreshToken: `demo.${account.role}.refresh`,
    memberType: account.memberType,
    userId: account.userId,
    memberNumber: account.memberNumber,
    name: account.name,
  }
}

/* ── 라우트 테이블 ─────────────────────────────────────────────
   [METHOD, 패턴, 핸들러]. 패턴의 :param 은 params 로 넘어온다. */

const ROUTES = [
  /* 인증 */
  ['POST', '/auth/login', (_p, body) => {
    const account = resolveAccount(body?.loginId)
    return json(authPayload(account))
  }],
  ['POST', '/auth/register/user', (_p, body) => {
    const g = db.users.guardian
    if (body?.name) g.name = body.name
    if (body?.email) { g.email = body.email; g.loginId = body.email }
    if (body?.phone) g.phone = body.phone
    if (body?.address) g.region = body.address
    return json(authPayload(g))
  }],
  ['POST', '/auth/register/hospital', () => json({ status: 'PENDING_APPROVAL' })],
  ['POST', '/auth/register/insurance', (_p, body) => {
    db.orgs = [...db.orgs, {
      id: `ins-${String(db.orgs.filter(o => o.type === '보험사').length + 1).padStart(3, '0')}`,
      type: '보험사',
      name: body?.name || '신규 보험사',
      fabricOrg: body?.fabricOrgId || 'InsuranceOrgMSP',
      date: nowIso().slice(0, 10),
      status: 'pending',
    }]
    return json({ status: 'PENDING_APPROVAL' })
  }],
  ['GET', '/auth/oauth/:provider', () => json(authPayload(db.users.guardian))],

  /* 회원 */
  ['GET', '/users/me', () => {
    const me = currentUser() || db.users.guardian
    return json(me)
  }],
  ['PATCH', '/users/me', (_p, body) => {
    const me = currentUser() || db.users.guardian
    Object.assign(me, body || {})
    return json(me)
  }],

  /* 반려동물 */
  ['GET', '/pets', () => json(db.pets)],
  ['POST', '/pets', (_p, body) => {
    const pet = {
      id: db.seq.pet++,
      petNumber: body?.petNumber || `Z-${Date.now()}`,
      name: body?.name || '',
      species: body?.species || 'dog',
      breed: body?.breed || '',
      birthYear: body?.birthYear || null,
      gender: body?.gender || '',
      isNeutered: !!body?.isNeutered,
      insurer: '',
    }
    db.pets = [...db.pets, pet]
    return json(pet, 201)
  }],
  ['GET', '/pets/:petId', (p) => {
    const key = String(p.petId).toUpperCase()
    const pet = db.pets.find(x => x.petNumber.toUpperCase() === key || String(x.id) === String(p.petId))
    if (!pet) return fail(404, '등록된 반려동물을 찾을 수 없습니다')
    const records = db.records
      .filter(r => r.petId === pet.petNumber)
      .map(r => ({
        id: r.recordId,
        date: r.treatmentDate,
        diseases: r.diagnosisCodes,
        treatments: r.treatmentCodes,
        cost: r.treatmentCost,
        memo: r.memo,
        onChain: true,
      }))
    return json({ ...pet, petId: pet.petNumber, records })
  }],

  /* 진료기록 */
  ['GET', '/records', () => json({ records: db.records })],
  ['POST', '/records', (_p, body) => {
    const meta = body?.metadata || {}
    const record = {
      recordId: `REC-2026-${String(db.seq.record++).padStart(4, '0')}`,
      petId: meta.petId || '',
      petName: db.pets.find(x => x.petNumber === meta.petId)?.name || '',
      hospitalId: 'hosp-001',
      hospitalName: '행복동물병원',
      treatmentDate: meta.date || nowIso().slice(0, 10),
      diagnosisCodes: meta.diseases || [],
      treatmentCodes: meta.treatments || [],
      treatmentCost: Number(meta.cost) || 0,
      memo: meta.memo || '',
      recordHash: `sha256:${'f'.repeat(64)}`,
    }
    db.records = [...db.records, record]
    db.creditBalance += 1
    db.creditTransactions = [{
      transactionId: `CR-2026-${String(1000 + db.creditTransactions.length).slice(1)}`,
      transactionType: 'accrual',
      amount: 1,
      relatedRecordId: record.recordId,
      reason: '진료기록 원장 등록',
      createdAt: nowIso(),
    }, ...db.creditTransactions]
    return json(record, 201)
  }],

  /* 동의 */
  ['GET', '/consents', () => json({ consents: db.consents })],
  ['POST', '/consents', (_p, body) => {
    const recordId = String(body?.recordId || '')
    const existing = db.consents.find(c => c.recordId === recordId)
    if (existing) {
      existing.status = 'ACTIVE'
      if (body?.insurerId) {
        existing.insurerId = body.insurerId
        existing.insurerName = insurerNameOf(body.insurerId) || existing.insurerName
      }
      return json(existing)
    }
    const record = db.records.find(r => r.recordId === recordId)
    const consent = {
      consentId: `CON-2026-${String(db.seq.consent++).padStart(4, '0')}`,
      recordId,
      petId: record?.petId || '',
      petName: record?.petName || '',
      guardianId: String(db.users.guardian.userId),
      hospitalId: record?.hospitalId || 'hosp-001',
      hospitalName: record?.hospitalName || '행복동물병원',
      insurerId: body?.insurerId || 'ins-002',
      insurerName: insurerNameOf(body?.insurerId) || 'DB손해보험',
      status: 'ACTIVE',
      disease: record?.diagnosisCodes?.[0] || '',
      treatment: record?.treatmentCodes?.[0] || '',
      cost: record?.treatmentCost || 0,
      date: record?.treatmentDate || nowIso().slice(0, 10),
      recordHash: record?.recordHash || '',
    }
    db.consents = [...db.consents, consent]
    return json(consent, 201)
  }],
  ['POST', '/consents/:consentId/revoke', (p) => {
    const c = db.consents.find(x => x.consentId === p.consentId)
    if (!c) return fail(404, '동의를 찾을 수 없습니다')
    c.status = 'REVOKED'
    return json(c)
  }],

  /* 제출 · 검증 */
  ['POST', '/submissions', (_p, body) => {
    const submissionId = `CLM-2026-${String(db.seq.submission++).padStart(4, '0')}`
    return json({ submissionId, recordId: body?.recordId, status: 'PENDING', createdAt: nowIso() }, 201)
  }],
  ['POST', '/submissions/:submissionId/verification', (p, body) => {
    const consent = db.consents.find(c => c.recordId === body?.recordId)
    if (!consent) return fail(404, '동의 정보를 찾을 수 없습니다')
    if (consent.status !== 'ACTIVE') {
      return json({
        verificationId: null,
        submissionId: p.submissionId,
        status: consent.status === 'REVOKED' ? 'BLOCKED' : 'FAILED',
        failureReasons: [consent.status === 'REVOKED' ? 'consent_revoked' : 'consent_not_active'],
        pointsCharged: 0,
      })
    }
    const already = db.pointTransactions.some(t => t.relatedRecordId === consent.recordId && t.transactionType === 'deduct')
    const pointsCharged = already ? 0 : 1
    const verificationId = `VER-${Date.now()}`
    if (pointsCharged) {
      db.pointBalance -= 1
      db.creditBalance += 1
      db.verifyCount += 1
      db.pointTransactions = [{
        transactionId: `PT-2026-${String(1000 + db.pointTransactions.length).slice(1)}`,
        transactionType: 'deduct',
        amount: 1,
        relatedRecordId: consent.recordId,
        reason: '검증 성공 — 포인트 차감',
        createdAt: nowIso(),
        balanceAfter: db.pointBalance,
      }, ...db.pointTransactions]
      db.creditTransactions = [{
        transactionId: `CR-2026-${String(1000 + db.creditTransactions.length).slice(1)}`,
        transactionType: 'accrual',
        amount: 1,
        relatedRecordId: consent.recordId,
        reason: '검증 API 성공',
        createdAt: nowIso(),
      }, ...db.creditTransactions]
    }
    return json({
      verificationId,
      submissionId: p.submissionId,
      status: 'PASSED',
      failureReasons: [],
      pointsCharged,
      verifiedAt: nowIso(),
    })
  }],
  ['POST', '/submissions/:submissionId/claim-status', (_p, body) => json({ status: body?.status || 'APPROVED_BY_INSURER' })],

  /* 포인트 · 크레딧 */
  ['GET', '/insurers/me/points/balance', () => json({ balance: db.pointBalance })],
  ['GET', '/insurers/me/points/transactions', () => json({ transactions: db.pointTransactions })],
  ['POST', '/insurers/me/points/charge', (_p, body) => {
    const amount = Number(body?.amount) || 0
    db.pointBalance += amount
    db.pointTransactions = [{
      transactionId: `PT-2026-${String(1000 + db.pointTransactions.length).slice(1)}`,
      transactionType: 'issue',
      amount,
      relatedRecordId: null,
      reason: '포인트 충전 (데모 결제)',
      createdAt: nowIso(),
      balanceAfter: db.pointBalance,
    }, ...db.pointTransactions]
    return json({ balance: db.pointBalance, charged: amount })
  }],
  ['GET', '/credits/transactions', () => json({ transactions: db.creditTransactions, balance: db.creditBalance })],

  /* 이상 신고 */
  ['GET', '/flags', () => json(db.flags)],
  ['POST', '/flags', (_p, body) => {
    const consent = db.consents.find(c => c.recordId === body?.recordId)
    const flag = {
      flagId: `FLG-2026-${String(db.seq.flag++).padStart(4, '0')}`,
      recordId: body?.recordId || '',
      verificationId: body?.verificationId || null,
      pet: consent?.petName || '',
      hospital: consent?.hospitalName || '',
      reasonCode: body?.reasonCode || '',
      reasonLabel: FLAG_LABELS[body?.reasonCode] || body?.reasonCode || '기타',
      note: body?.note || '',
      status: 'PENDING',
      flaggedAt: nowIso(),
      resolveCode: null,
      resolveNote: null,
      resolvedAt: null,
    }
    db.flags = [flag, ...db.flags]
    return json(flag, 201)
  }],
  ['POST', '/flags/:flagId/resolve', (p, body) => {
    const f = db.flags.find(x => x.flagId === p.flagId)
    if (!f) return fail(404, '신고를 찾을 수 없습니다')
    Object.assign(f, {
      status: 'RESOLVED',
      resolveCode: body?.resolveCode || '',
      resolveNote: body?.resolveNote || '',
      resolvedAt: nowIso(),
    })
    return json(f)
  }],

  /* 관리자 */
  ['GET', '/admin/orgs', () => json(db.orgs)],
  ['POST', '/admin/orgs/:id/approve', (p) => {
    const o = db.orgs.find(x => x.id === p.id)
    if (!o) return fail(404, 'Org 를 찾을 수 없습니다')
    o.status = 'active'
    return json(o)
  }],
  ['POST', '/admin/orgs/:id/deactivate', (p) => {
    const o = db.orgs.find(x => x.id === p.id)
    if (!o) return fail(404, 'Org 를 찾을 수 없습니다')
    o.status = 'pending'
    return json(o)
  }],
  ['GET', '/admin/monitor', () => json({
    verifyCount: db.verifyCount,
    insurerPointBalance: db.pointBalance,
    activeOrgs: db.orgs.filter(o => o.status === 'active').length,
  })],

  /* 커뮤니티 — 목록/작성 */
  ['GET', '/posts/popular/by-region', () => {
    const byRegion = {}
    db.posts.forEach(p => {
      if (!p.authorRegion) return
      if (!byRegion[p.authorRegion] || byRegion[p.authorRegion].likeCount < p.likeCount) byRegion[p.authorRegion] = p
    })
    return json(Object.entries(byRegion).map(([region, topPost]) => ({ region, topPost })))
  }],
  ['GET', '/posts/popular', (_p, _b, query) => {
    const region = query.get('region')
    return json(db.posts.filter(p => !region || p.authorRegion === region).sort((a, b) => b.likeCount - a.likeCount).slice(0, 10))
  }],
  ['GET', '/posts', () => json({ content: db.posts, totalElements: db.posts.length })],
  ['POST', '/posts', (_p, body) => {
    const me = db.users.guardian
    const post = {
      id: db.seq.post++,
      authorId: me.userId,
      authorName: me.name,
      authorRegion: body?.authorRegion || me.region,
      petName: body?.petName || '',
      petBreed: body?.petBreed || '',
      content: body?.content || '',
      likeCount: 0,
      liked: false,
      commentCount: 0,
      createdAt: nowIso(),
      imageKeys: body?.imageData ? [body.imageData] : [],
    }
    db.posts = [post, ...db.posts]
    db.comments[post.id] = []
    return json(post, 201)
  }],

  /* 커뮤니티 — 댓글 (구체 경로를 게시물 단건보다 앞에 둔다) */
  ['POST', '/posts/:postId/comments/:commentId/likes', (p) => toggleCommentLike(p.postId, p.commentId)],
  ['PUT', '/posts/:postId/comments/:commentId', (p, body) => {
    const target = findComment(p.postId, p.commentId)
    if (!target) return fail(404, '댓글을 찾을 수 없습니다')
    target.content = body?.content || target.content
    return json(target)
  }],
  ['DELETE', '/posts/:postId/comments/:commentId', (p) => {
    const list = db.comments[p.postId] || []
    const id = Number(p.commentId)
    const before = list.length
    db.comments[p.postId] = list.filter(c => c.id !== id)
    db.comments[p.postId].forEach(c => { c.replies = c.replies.filter(r => r.id !== id) })
    const post = db.posts.find(x => x.id === Number(p.postId))
    if (post && before !== db.comments[p.postId].length) post.commentCount = Math.max(0, post.commentCount - 1)
    return json({ deleted: true })
  }],
  ['POST', '/posts/:postId/comments', (p, body) => {
    const postId = Number(p.postId)
    const post = db.posts.find(x => x.id === postId)
    if (!post) return fail(404, '게시물을 찾을 수 없습니다')
    const me = db.users.guardian
    const created = {
      id: db.seq.comment++,
      postId,
      authorId: me.userId,
      authorName: me.name,
      content: body?.content || '',
      likeCount: 0,
      liked: false,
      replies: [],
    }
    db.comments[postId] = db.comments[postId] || []
    if (body?.parentCommentId) {
      const parent = db.comments[postId].find(c => c.id === Number(body.parentCommentId))
      if (!parent) return fail(404, '원 댓글을 찾을 수 없습니다')
      parent.replies.push(created)
    } else {
      db.comments[postId].push(created)
    }
    post.commentCount += 1
    return json(created, 201)
  }],
  ['POST', '/posts/:postId/likes', (p) => {
    const post = db.posts.find(x => x.id === Number(p.postId))
    if (!post) return fail(404, '게시물을 찾을 수 없습니다')
    post.liked = !post.liked
    post.likeCount += post.liked ? 1 : -1
    return json({ liked: post.liked, likeCount: post.likeCount })
  }],
  ['GET', '/posts/:postId', (p) => {
    const post = db.posts.find(x => x.id === Number(p.postId))
    if (!post) return fail(404, '게시물을 찾을 수 없습니다')
    return json({ ...post, comments: db.comments[post.id] || [] })
  }],
  ['PUT', '/posts/:postId', (p, body) => {
    const post = db.posts.find(x => x.id === Number(p.postId))
    if (!post) return fail(404, '게시물을 찾을 수 없습니다')
    post.content = body?.content || post.content
    return json(post)
  }],
  ['DELETE', '/posts/:postId', (p) => {
    db.posts = db.posts.filter(x => x.id !== Number(p.postId))
    delete db.comments[Number(p.postId)]
    return json({ deleted: true })
  }],
]

const FLAG_LABELS = {
  COST_ANOMALY: '진료비 이상',
  DUPLICATE_CLAIM: '중복 청구 의심',
  HASH_MISMATCH: '기록 무결성 불일치',
  DOC_FORGERY: '서류 위조 의심',
  OTHER: '기타',
}

function insurerNameOf(id) {
  return { 'ins-001': '삼성화재해상보험', 'ins-002': 'DB손해보험', 'insurance-samsung': '삼성화재해상보험', 'insurance-db': 'DB손해보험' }[id] || ''
}

function findComment(postId, commentId) {
  const list = db.comments[postId] || []
  const id = Number(commentId)
  for (const c of list) {
    if (c.id === id) return c
    const r = c.replies.find(x => x.id === id)
    if (r) return r
  }
  return null
}

function toggleCommentLike(postId, commentId) {
  const target = findComment(postId, commentId)
  if (!target) return fail(404, '댓글을 찾을 수 없습니다')
  target.liked = !target.liked
  target.likeCount = Math.max(0, target.likeCount + (target.liked ? 1 : -1))
  return json({ liked: target.liked, likeCount: target.likeCount })
}

/** '/posts/:postId/likes' 패턴을 실제 경로에 맞춰본다. */
function match(pattern, path) {
  const pp = pattern.split('/').filter(Boolean)
  const ap = path.split('/').filter(Boolean)
  if (pp.length !== ap.length) return null
  const params = {}
  for (let i = 0; i < pp.length; i++) {
    if (pp[i].startsWith(':')) params[pp[i].slice(1)] = decodeURIComponent(ap[i])
    else if (pp[i] !== ap[i]) return null
  }
  return params
}

async function parseBody(init) {
  const body = init?.body
  if (!body) return null
  if (typeof body === 'string') { try { return JSON.parse(body) } catch { return null } }
  if (typeof FormData !== 'undefined' && body instanceof FormData) {
    // 병원 진료기록 등록은 metadata(Blob) + attachments(File) 로 온다.
    const out = { attachments: [] }
    for (const [key, value] of body.entries()) {
      if (key === 'metadata' && value instanceof Blob) {
        try { out.metadata = JSON.parse(await value.text()) } catch { out.metadata = {} }
      } else if (key === 'attachments') {
        out.attachments.push(value?.name || 'file')
      } else {
        out[key] = value
      }
    }
    return out
  }
  return null
}

async function handle(method, url, init) {
  const path = url.pathname.replace(/^\/api/, '') || '/'
  const body = await parseBody(init)
  for (const [m, pattern, fn] of ROUTES) {
    if (m !== method) continue
    const params = match(pattern, path)
    if (params) return fn(params, body, url.searchParams)
  }
  return fail(404, `데모 서버에 정의되지 않은 경로입니다: ${method} ${path}`)
}

let installed = false

/** window.fetch 를 감싸 /api 요청만 목 서버로 처리한다. */
export function installDemoServer() {
  if (installed) return
  installed = true

  const original = window.fetch.bind(window)

  window.fetch = async (input, init = {}) => {
    const raw = typeof input === 'string' ? input : input?.url
    const method = (init.method || (typeof input !== 'string' && input?.method) || 'GET').toUpperCase()
    let url
    try { url = new URL(raw, window.location.origin) } catch { return original(input, init) }
    if (!url.pathname.startsWith('/api/') && url.pathname !== '/api') return original(input, init)

    await new Promise(r => setTimeout(r, LATENCY))
    try {
      return await handle(method, url, init)
    } catch (e) {
      return fail(500, e?.message || '데모 서버 내부 오류')
    }
  }
}

/** 데모 데이터를 초기 상태로 되돌린다. */
export function resetDemoData() {
  db = seed()
}

export { ACCOUNTS }
