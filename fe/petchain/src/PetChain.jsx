import { useState, useEffect, useRef } from "react";

/* ─────────────────────────────────────────────
   DESIGN TOKENS
───────────────────────────────────────────── */
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Plus Jakarta Sans', sans-serif; background: #f7f7f5; color: #18181b; }

  :root {
    --green:   #16a37f;
    --green-d: #0e8066;
    --green-l: #dcfce7;
    --blue:    #2563eb;
    --blue-l:  #dbeafe;
    --amber:   #d97706;
    --amber-l: #fef3c7;
    --red:     #dc2626;
    --red-l:   #fee2e2;
    --purple:  #7c3aed;
    --purple-l:#ede9fe;
    --border:  #e4e4e7;
    --muted:   #71717a;
    --surface: #ffffff;
    --bg:      #f7f7f5;
    --mono:    'JetBrains Mono', monospace;
  }

  /* scrollbar */
  ::-webkit-scrollbar { width: 5px; height: 5px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: #d4d4d8; border-radius: 4px; }

  /* base btn */
  .btn { display:inline-flex;align-items:center;gap:5px;padding:8px 16px;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;border:1.5px solid var(--border);background:var(--surface);color:#18181b;transition:all .15s;font-family:inherit; }
  .btn:hover { background:#f4f4f5; }
  .btn-sm { padding:5px 11px;font-size:12px; }
  .btn-pr { background:var(--green);color:#fff;border-color:var(--green); }
  .btn-pr:hover { background:var(--green-d); }
  .btn-bl { background:var(--blue);color:#fff;border-color:var(--blue); }
  .btn-re { background:var(--red-l);color:var(--red);border-color:#fca5a5; }
  .btn-pu { background:var(--purple);color:#fff;border-color:var(--purple); }
  .btn-dark { background:#18181b;color:#fff;border-color:#18181b; }
  .btn-ghost { background:transparent;color:#18181b;border-color:var(--border); }
  .btn-ghost:hover { background:#f4f4f5; }

  /* badge */
  .badge { display:inline-block;font-size:11px;padding:2px 9px;border-radius:20px;font-weight:600; }
  .badge-g { background:var(--green-l);color:#065f46; }
  .badge-a { background:var(--amber-l);color:#92400e; }
  .badge-b { background:var(--blue-l);color:#1e40af; }
  .badge-r { background:var(--red-l);color:var(--red); }
  .badge-p { background:var(--purple-l);color:#5b21b6; }
  .badge-gr { background:#f4f4f5;color:var(--muted); }

  /* card */
  .card { background:var(--surface);border:1px solid var(--border);border-radius:14px;padding:22px 24px; }
  .card-title { font-size:11px;font-weight:700;color:#a1a1aa;text-transform:uppercase;letter-spacing:.06em;margin-bottom:16px; }

  /* table */
  .tbl { width:100%;border-collapse:collapse; }
  .tbl th { font-size:12px;font-weight:600;color:#a1a1aa;padding:9px 13px;border-bottom:1px solid var(--border);text-align:left;white-space:nowrap; }
  .tbl td { font-size:14px;padding:12px 13px;border-bottom:1px solid #f4f4f5;vertical-align:middle; }
  .tbl tbody tr:hover td { background:#fafafa; }
  .tbl tr:last-child td { border-bottom:none; }
  .mono { font-family:var(--mono);font-size:12px;color:var(--muted); }

  /* form */
  .fl { display:block;font-size:13px;font-weight:500;color:#52525b;margin-bottom:5px; }
  .fi { width:100%;border:1.5px solid var(--border);border-radius:8px;padding:10px 13px;font-size:14px;outline:none;transition:border-color .15s;margin-bottom:13px;background:var(--surface);font-family:inherit; }
  .fi:focus { border-color:var(--green); }
  .fi-row { display:grid;grid-template-columns:1fr 1fr;gap:10px; }
  .fi-note { font-size:12px;color:#a1a1aa;padding:9px 12px;background:#f4f4f5;border-radius:7px;line-height:1.6;margin-bottom:13px; }
  .a-notice { background:var(--surface);border:1px solid var(--border);border-left:3px solid var(--green);border-radius:8px;padding:11px 14px;font-size:13px;color:var(--muted);line-height:1.7;margin-bottom:13px; }

  /* input checkbox */
  input[type=checkbox] { accent-color:var(--green); }

  /* layout */
  .g2 { display:grid;grid-template-columns:1fr 1fr;gap:16px; }
  .g3 { display:grid;grid-template-columns:repeat(3,1fr);gap:16px; }
  .g4 { display:grid;grid-template-columns:repeat(4,1fr);gap:16px; }
  .row-flex { display:flex;align-items:center;justify-content:space-between;padding:5px 0;font-size:14px; }
  .divider { height:1px;background:var(--border);margin:12px 0; }

  /* stat box */
  .stat-box { background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:20px 22px; }
  .stat-n { font-size:28px;font-weight:800;letter-spacing:-.02em; }
  .stat-l { font-size:13px;color:var(--muted);margin-top:5px; }
  .stat-c { font-size:12px;margin-top:3px; }

  /* timeline */
  .tl-row { display:flex;align-items:flex-start;gap:12px;padding:12px 0;border-bottom:1px solid #f4f4f5; }
  .tl-row:last-child { border-bottom:none; }
  .tl-dot { width:10px;height:10px;border-radius:50%;flex-shrink:0;margin-top:5px; }

  /* overlay */
  .overlay-bg { position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:900;display:flex;align-items:center;justify-content:center; }
  .overlay-box { background:var(--surface);border-radius:18px;padding:32px;width:100%;max-width:500px;position:relative;max-height:90vh;overflow-y:auto; }

  /* toast */
  .toast { position:fixed;bottom:24px;right:24px;background:#18181b;color:#fff;padding:13px 18px;border-radius:12px;font-size:13px;z-index:9999;max-width:300px;line-height:1.6;box-shadow:0 8px 32px rgba(0,0,0,.25);animation:slideUp .3s ease; }
  .toast-step { font-size:11px;color:var(--green);font-weight:700;margin-bottom:3px; }
  @keyframes slideUp { from{opacity:0;transform:translateY(10px);}to{opacity:1;transform:translateY(0);} }

  /* landing */
  .gnb { position:sticky;top:0;z-index:200;background:rgba(255,255,255,.95);backdrop-filter:blur(10px);border-bottom:1px solid var(--border);height:62px;display:flex;align-items:center;padding:0 60px;gap:32px; }
  .gnb-logo { font-size:18px;font-weight:800;letter-spacing:-.02em;cursor:pointer; }
  .gnb-logo span { color:var(--green); }
  .gnb-links { display:flex;gap:24px;flex:1; }
  .gnb-links a { font-size:14px;color:var(--muted);cursor:pointer;transition:color .15s; }
  .gnb-links a:hover { color:#18181b; }
  .hero { display:grid;grid-template-columns:1fr 440px;align-items:center;gap:60px;padding:80px 60px;min-height:600px;background:linear-gradient(145deg,#f0f8ff 0%,#e8f5f0 100%); }
  .hero-eyebrow { display:inline-flex;align-items:center;gap:6px;font-size:12px;font-weight:700;color:var(--blue);background:var(--blue-l);padding:4px 13px;border-radius:20px;margin-bottom:20px; }
  .hero-h1 { font-size:48px;font-weight:800;line-height:1.12;letter-spacing:-.03em;margin-bottom:16px; }
  .hero-h1 em { color:var(--green);font-style:normal; }
  .hero-lead { font-size:16px;color:#52525b;line-height:1.85;margin-bottom:32px;max-width:440px; }
  .hero-card { background:var(--surface);border-radius:18px;padding:26px;box-shadow:0 14px 50px rgba(0,0,0,.1); }
  .hc-hdr { display:flex;align-items:center;justify-content:space-between;margin-bottom:18px; }
  .hc-title { font-size:11px;font-weight:700;color:#a1a1aa;text-transform:uppercase;letter-spacing:.06em; }
  .hc-live { display:flex;align-items:center;gap:5px;font-size:12px;font-weight:600;color:var(--green); }
  .hc-row { display:flex;align-items:center;gap:11px;padding:12px 0;border-bottom:1px solid #f4f4f5; }
  .hc-row:last-child { border-bottom:none; }
  .hc-icon { width:38px;height:38px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:17px;flex-shrink:0; }
  .hc-lbl { font-size:13px;font-weight:600; }
  .hc-sub { font-size:11px;color:#a1a1aa;margin-top:1px; }
  .sec { padding:88px 60px; }
  .sec-inner { max-width:1060px;margin:0 auto; }
  .sec-gray { background:#f4f4f5; }
  .sec-dark { background:#18181b; }
  .sec-ey { font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--green);margin-bottom:10px; }
  .sec-h2 { font-size:34px;font-weight:800;letter-spacing:-.02em;line-height:1.2;margin-bottom:12px; }
  .sec-lead { font-size:15px;color:var(--muted);line-height:1.8;margin-bottom:44px;max-width:520px; }
  .who-card { background:var(--surface);border:1px solid var(--border);border-radius:18px;padding:32px 26px;transition:box-shadow .2s,transform .2s;cursor:default; }
  .who-card:hover { box-shadow:0 8px 32px rgba(0,0,0,.08);transform:translateY(-3px); }
  .flow-grid { display:grid;grid-template-columns:1fr 40px 1fr 40px 1fr;align-items:center;margin-top:44px; }
  .flow-box { background:var(--surface);border:1px solid var(--border);border-radius:16px;padding:30px 22px;text-align:center; }
  .flow-arr { text-align:center;font-size:24px;color:#d4d4d8; }
  .stat-dark { border:1px solid #27272a;padding:40px 36px; }
  .stat-dark .stat-n { color:var(--green); }
  .stat-dark .stat-l { color:#fff; }
  .stat-dark .stat-c { color:#52525b; }
  .flip-card { height:210px;perspective:1000px;cursor:pointer; }
  .flip-inner { width:100%;height:100%;position:relative;transform-style:preserve-3d;transition:transform .5s cubic-bezier(.4,0,.2,1); }
  .flip-card:hover .flip-inner { transform:rotateY(-180deg); }
  .flip-f,.flip-b { position:absolute;inset:0;border-radius:15px;backface-visibility:hidden;-webkit-backface-visibility:hidden;display:flex;flex-direction:column;justify-content:center;align-items:center;padding:24px; }
  .flip-f { border:1px solid var(--border); }
  .flip-b { transform:rotateY(180deg);background:#18181b; }
  .faq-item { border-bottom:1px solid var(--border); }
  .faq-q { display:flex;justify-content:space-between;align-items:center;padding:20px 0;cursor:pointer;font-size:15px;font-weight:500;transition:color .15s; }
  .faq-q:hover { color:var(--green); }
  .faq-a { font-size:14px;color:var(--muted);line-height:1.8;padding-bottom:18px; }
  .cta-sec { background:linear-gradient(135deg,#0d3d26,#1e3a8a);padding:96px 60px;text-align:center; }
  footer { background:#0a0a0a;padding:60px 60px 28px; }
  .ft-top { display:grid;grid-template-columns:260px 1fr;gap:72px;margin-bottom:44px; }
  .ft-cols { display:grid;grid-template-columns:repeat(3,1fr);gap:32px; }
  .ft-link { display:block;font-size:13px;color:#52525b;margin-bottom:9px;cursor:pointer;transition:color .15s; }
  .ft-link:hover { color:#fff; }

  /* auth */
  .auth-wrap { display:flex;min-height:100vh; }
  .auth-left { width:380px;flex-shrink:0;background:#0a0a0a;display:flex;flex-direction:column;padding:44px 38px; }
  .auth-right { flex:1;display:flex;align-items:center;justify-content:center;padding:60px 48px;position:relative;background:#f7f7f5; }
  .role-pill { display:flex;align-items:center;gap:12px;padding:13px 15px;border-radius:11px;border:1.5px solid #1c1c1e;cursor:pointer;transition:all .15s; }
  .role-pill:hover { border-color:#333;background:#111; }
  .role-pill.sel { border-color:var(--green);background:#071a10; }
  .auth-tab { padding:9px 20px;background:none;border:none;border-bottom:2px solid transparent;font-size:14px;font-weight:600;color:#a1a1aa;cursor:pointer;margin-bottom:-2px;transition:all .15s;font-family:inherit; }
  .auth-tab.on { color:#18181b;border-bottom-color:#18181b; }

  /* platform */
  .pnav { background:#0a0a0a;height:54px;display:flex;align-items:center;padding:0 28px; }
  .pni { height:54px;padding:0 15px;font-size:14px;color:#52525b;background:none;border:none;border-bottom:2px solid transparent;cursor:pointer;transition:color .15s;font-family:inherit; }
  .pni:hover { color:#fff; }
  .pni.on { color:#fff;border-bottom-color:var(--green); }

  /* dashboard */
  .dash-gnb { background:var(--surface);border-bottom:1px solid var(--border);height:58px;display:flex;align-items:center;padding:0 36px;position:sticky;top:0;z-index:100; }
  .dash-logo { font-size:17px;font-weight:800;letter-spacing:-.02em;margin-right:28px; }
  .dash-logo span { color:var(--green); }
  .dash-nav-item { padding:0 17px;height:58px;display:flex;align-items:center;font-size:14px;font-weight:500;color:var(--muted);cursor:pointer;border-bottom:2px solid transparent;transition:all .15s; }
  .dash-nav-item:hover { color:#18181b; }
  .dash-nav-item.on { color:#18181b;border-bottom-color:#18181b; }
  .dash-wrap { max-width:1200px;margin:0 auto;padding:32px 36px; }
  .pane-h { font-size:21px;font-weight:800;letter-spacing:-.02em; }
  .pane-sub { font-size:13px;color:var(--muted);margin-top:3px;margin-bottom:24px; }

  /* upload zone */
  .upload-zone { border:1.5px dashed var(--border);border-radius:10px;padding:32px;text-align:center;color:#a1a1aa;font-size:14px; }

  /* tag */
  .tag-green { font-size:11px;padding:3px 11px;border-radius:20px;font-weight:600;background:var(--green);color:#fff; }
`;

/* ─────────────────────────────────────────────
   GLOBAL STATE
───────────────────────────────────────────── */
const initState = {
  page: "landing",           // landing | auth | platform | main
  authMode: "login",         // login | signup
  authRole: "guardian",
  role: null,                // guardian | hospital | insurance | platform
  dashTab: null,
  // flow state
  recordDone: false,
  consentDone: false,
  ptBalance: 850,
  verifyCount: 0,
  usedPt: 0,
  creditN: 124,
  txLog: [],
  ptLog: [],
  petCards: [{ name: "초코", species: "말티즈", age: "3세", insurer: "DB손해보험" }],
};

/* ─────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────── */
const ROLE_META = {
  guardian: { name: "홍길동", icon: "🐾", label: "보호자", bg: "#dcfce7", color: "#065f46",
    tabs: [{ id: "home", lbl: "홈" }, { id: "consent", lbl: "동의 관리" }, { id: "status", lbl: "청구 상태" }] },
  hospital: { name: "행복동물병원", icon: "🏥", label: "병원", bg: "#ffe4d6", color: "#9a3412",
    tabs: [{ id: "reg", lbl: "진료기록 등록" }, { id: "credit", lbl: "크레딧 현황" }, { id: "log", lbl: "감사 로그" }] },
  insurance: { name: "DB손해보험", icon: "🛡️", label: "보험사", bg: "#dbeafe", color: "#1e40af",
    tabs: [{ id: "list", lbl: "검증 목록" }, { id: "result", lbl: "검증 결과" }, { id: "point", lbl: "포인트 현황" }] },
};

/* ─────────────────────────────────────────────
   TOAST
───────────────────────────────────────────── */
function Toast({ msg, step, onDone }) {
  useEffect(() => { const t = setTimeout(onDone, 3500); return () => clearTimeout(t); }, []);
  return (
    <div className="toast">
      <div className="toast-step">{step}</div>
      <div>{msg}</div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   OVERLAY
───────────────────────────────────────────── */
function Overlay({ title, sub, onClose, children }) {
  return (
    <div className="overlay-bg" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="overlay-box">
        <button onClick={onClose} style={{ position: "absolute", top: 16, right: 18, background: "none", border: "none", fontSize: 22, color: "#a1a1aa", cursor: "pointer" }}>✕</button>
        <div style={{ fontSize: 19, fontWeight: 800, marginBottom: 4 }}>{title}</div>
        <div style={{ fontSize: 13, color: "#a1a1aa", marginBottom: 20 }}>{sub}</div>
        {children}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   LANDING PAGE
───────────────────────────────────────────── */
function Landing({ onGoAuth }) {
  const [openFaq, setOpenFaq] = useState(null);
  const faqs = [
    ["보호자가 비용을 내야 하나요?", "아니요. 보호자는 완전 무료입니다. PetChain은 보험사와 병원에게만 이용료를 받는 B2B 인프라 서비스입니다."],
    ["진료기록이 외부에 노출되지 않나요?", "진료기록 원문은 AES-256 암호화 후 별도 서버에 보관됩니다. 블록체인에는 해시값만 올라가며, 동의한 보험사만 접근 가능합니다."],
    ["왜 하이퍼레저 패브릭을 사용하나요?", "허가된 참여자만 네트워크에 들어올 수 있고, 가스비가 없으며, 트랜잭션이 외부에 공개되지 않습니다. 민감한 의료 데이터를 다루는 B2B에 최적화된 구조입니다."],
    ["보험 가입도 PetChain에서 할 수 있나요?", "아니요. PetChain은 이미 가입된 보험의 청구 검증만 지원합니다. 보험 계약 전 단계에는 관여하지 않습니다."],
    ["지급 승인 여부도 PetChain이 결정하나요?", "아닙니다. PetChain은 위·변조 여부와 중복 청구만 자동 확인합니다. 최종 지급 판단은 보험사 내부 심사로 결정됩니다."],
  ];
  const hospitals = [
    { name: "행복동물병원", loc: "서울 마포구", dept: "피부과 · 내과", org: "hosp-001", date: "2024.01.10", bg: "linear-gradient(135deg,#dcfce7,#bbf7d0)" },
    { name: "서울동물병원", loc: "서울 강남구", dept: "외과 · 정형외과", org: "hosp-002", date: "2024.02.05", bg: "linear-gradient(135deg,#dbeafe,#bfdbfe)" },
    { name: "강남동물병원", loc: "서울 강남구", dept: "안과 · 치과", org: "hosp-003", date: "2024.03.12", bg: "linear-gradient(135deg,#ede9fe,#ddd6fe)" },
    { name: "부산동물병원", loc: "부산 해운대구", dept: "내과 · 응급", org: "hosp-004", date: "2024.04.01", bg: "linear-gradient(135deg,#fef9c3,#fde68a)" },
    { name: "대구펫클리닉", loc: "대구 중구", dept: "피부과 · 외과", org: "hosp-005", date: "2024.04.20", bg: "linear-gradient(135deg,#fce7f3,#fbcfe8)" },
    { name: "파트너 모집 중", loc: "문의하기", dept: "", org: "—", date: "—", bg: "#f4f4f5", dashed: true },
  ];
  const insurers = [
    { name: "DB손해보험", desc: "반려동물 전용 상품 운영", org: "ins-001", pt: 850, verify: 150, date: "2024.01.15", bg: "linear-gradient(135deg,#dbeafe,#bfdbfe)", border: "#2563eb" },
    { name: "현대해상", desc: "펫보험 업계 1위", org: "ins-002", pt: 620, verify: 284, date: "2024.02.01", bg: "linear-gradient(135deg,#dcfce7,#bbf7d0)", border: "#16a37f" },
    { name: "보험사 모집 중", desc: "파트너십 문의", org: "—", pt: null, verify: null, date: "—", bg: "#f4f4f5", dashed: true },
  ];

  return (
    <div style={{ background: "#fff" }}>
      {/* GNB */}
      <nav className="gnb">
        <div className="gnb-logo">🐾 Pet<span>Chain</span></div>
        <div className="gnb-links">
          <a>서비스 소개</a><a>병원 파트너</a><a>보험사 파트너</a><a>기술 문서</a>
        </div>
        <div style={{ display: "flex", gap: 8, marginLeft: "auto" }}>
          <button className="btn btn-ghost" onClick={() => onGoAuth("login")}>로그인</button>
          <button className="btn btn-dark" onClick={() => onGoAuth("signup")}>시작하기 →</button>
        </div>
      </nav>

      {/* 히어로 */}
      <div className="hero">
        <div>
          <div className="hero-eyebrow">블록체인 기반 진료기록 검증 인프라</div>
          <h1 className="hero-h1">반려동물 보험 청구,<br /><em>더 빠르고 안전하게</em></h1>
          <p className="hero-lead">병원이 기록을 올리면, 보호자가 동의하고, 보험사가 즉시 검증합니다. 위·변조와 중복 청구를 자동으로 차단합니다.</p>
          <div style={{ display: "flex", gap: 10 }}>
            <button className="btn btn-dark" style={{ padding: "13px 28px", fontSize: 15 }} onClick={() => onGoAuth("signup")}>무료로 시작하기</button>
            <button className="btn btn-ghost" style={{ padding: "13px 28px", fontSize: 15 }}>서비스 소개 보기</button>
          </div>
        </div>
        <div className="hero-card">
          <div className="hc-hdr">
            <div className="hc-title">실시간 청구 현황</div>
            <div className="hc-live"><span style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--green)", animation: "pulse 1.5s infinite", display: "inline-block" }} />LIVE</div>
          </div>
          {[
            { icon: "🏥", bg: "#dcfce7", lbl: "진료기록 등록", sub: "행복동물병원 · REC-2024-0041", tag: "완료", tc: "badge-g" },
            { icon: "🐾", bg: "#ede9fe", lbl: "보호자 제출 동의", sub: "초코 · DB손해보험", tag: "완료", tc: "badge-g" },
            { icon: "🛡️", bg: "#dbeafe", lbl: "보험사 검증 API", sub: "해시 일치 · 중복 없음", tag: "검증 중", tc: "badge-a" },
            { icon: "📋", bg: "#f4f4f5", lbl: "심사 결과", sub: "내부 판단 대기", tag: "대기", tc: "badge-gr" },
          ].map((r, i) => (
            <div key={i} className="hc-row">
              <div className="hc-icon" style={{ background: r.bg }}>{r.icon}</div>
              <div><div className="hc-lbl">{r.lbl}</div><div className="hc-sub">{r.sub}</div></div>
              <span className={`badge ${r.tc}`} style={{ marginLeft: "auto" }}>{r.tag}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 참여자 */}
      <div className="sec">
        <div className="sec-inner">
          <div className="sec-ey">Who it's for</div>
          <div className="sec-h2">모두를 위한 인프라</div>
          <div className="sec-lead">병원, 보험사, 보호자가 함께 이득을 얻는 구조입니다.</div>
          <div className="g3">
            {[
              { icon: "💚", title: "보호자", desc: "동의 버튼 하나로 진료기록을 보험사에 제출합니다. 병원 재방문 없이 청구 진행 상태를 실시간으로 확인할 수 있습니다." },
              { icon: "🏥", title: "동물병원", desc: "표준 코드로 한 번만 등록하면 끝. 보험사마다 양식을 따로 발급할 필요가 없어 반복 업무가 사라집니다." },
              { icon: "🛡️", title: "보험사", desc: "위·변조는 해시 비교로, 중복 청구는 체인코드로 자동 탐지됩니다. 검증 인력을 줄이고 사기 청구를 차단하세요." },
            ].map((c, i) => (
              <div key={i} className="who-card">
                <div style={{ fontSize: 34, marginBottom: 16 }}>{c.icon}</div>
                <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 10 }}>{c.title}</div>
                <div style={{ fontSize: 14, color: "var(--muted)", lineHeight: 1.8 }}>{c.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 서비스 흐름 */}
      <div className="sec sec-gray">
        <div className="sec-inner">
          <div className="sec-ey">How it works</div>
          <div className="sec-h2">세 단계로 끝나는 보험 청구</div>
          <div className="flow-grid">
            {[
              { num: "STEP 01", icon: "🏥", title: "병원이 기록을 올립니다", desc: "표준 코드로 진료기록을 등록하면 SHA-256 해시가 생성되고 블록체인 원장에 기록됩니다." },
              null,
              { num: "STEP 02", icon: "🐾", title: "보호자가 동의합니다", desc: "앱에서 동의 버튼 하나로 진료기록을 보험사에 제출합니다. 언제든 철회 가능합니다." },
              null,
              { num: "STEP 03", icon: "🛡️", title: "보험사가 즉시 검증합니다", desc: "API 호출 한 번으로 위·변조 탐지와 중복 청구 확인이 자동으로 완료됩니다." },
            ].map((s, i) =>
              s === null ? <div key={i} className="flow-arr">→</div> : (
                <div key={i} className="flow-box" style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "var(--green)", letterSpacing: ".1em", marginBottom: 14 }}>{s.num}</div>
                  <div style={{ fontSize: 36, marginBottom: 14 }}>{s.icon}</div>
                  <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>{s.title}</div>
                  <div style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.7 }}>{s.desc}</div>
                </div>
              )
            )}
          </div>
        </div>
      </div>

      {/* 숫자 */}
      <div className="sec sec-dark">
        <div className="sec-inner">
          <div className="sec-ey">Impact</div>
          <div className="sec-h2" style={{ color: "#fff" }}>숫자로 보는 PetChain 효과</div>
          <div className="g4" style={{ marginTop: 44 }}>
            {[
              { n: "99", u: "%", l: "위·변조 탐지율", d: "해시 비교 자동화" },
              { n: "3", u: "초", l: "평균 검증 시간", d: "기존 30분 → 즉시" },
              { n: "0", u: "회", l: "병원 반복 서류 발급", d: "한 번 등록으로 끝" },
              { n: "0", u: "원", l: "보호자 이용 비용", d: "보호자는 완전 무료" },
            ].map((s, i) => (
              <div key={i} className="stat-box stat-dark">
                <div><span className="stat-n">{s.n}</span><span style={{ fontSize: 22, fontWeight: 800, color: "var(--green)" }}>{s.u}</span></div>
                <div className="stat-l">{s.l}</div>
                <div className="stat-c">{s.d}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 파트너 — 카드 플립 */}
      <div className="sec">
        <div className="sec-inner">
          <div className="sec-ey">Partners</div>
          <div className="sec-h2">함께하는 기관</div>
          <div className="sec-lead">카드에 마우스를 올리면 상세 정보를 확인할 수 있습니다</div>

          <div style={{ fontSize: 12, fontWeight: 700, color: "#a1a1aa", letterSpacing: ".07em", textTransform: "uppercase", marginBottom: 16, display: "flex", alignItems: "center", gap: 10 }}>
            동물병원 파트너
            <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
          </div>
          <div className="g3" style={{ marginBottom: 40 }}>
            {hospitals.map((h, i) => (
              <div key={i} className="flip-card">
                <div className="flip-inner">
                  <div className="flip-f" style={{ background: h.bg, border: h.dashed ? "1.5px dashed var(--border)" : "1px solid var(--border)" }}>
                    <div style={{ fontSize: 32, marginBottom: 10 }}>🏥</div>
                    <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>{h.name}</div>
                    <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 10 }}>{h.loc}</div>
                    {h.dept && <span className="tag-green" style={{ fontSize: 11 }}>PetChain 연동</span>}
                    {h.dashed && <span style={{ fontSize: 11, padding: "3px 11px", borderRadius: 20, background: "#e4e4e7", color: "var(--muted)" }}>문의하기</span>}
                  </div>
                  <div className="flip-b">
                    <div style={{ fontSize: 15, fontWeight: 700, color: "#fff", marginBottom: 14 }}>{h.name}</div>
                    <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 7 }}>
                      {h.dept && <><div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}><span style={{ color: "#52525b" }}>위치</span><span style={{ color: "#fff" }}>{h.loc}</span></div>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}><span style={{ color: "#52525b" }}>진료과목</span><span style={{ color: "#fff" }}>{h.dept}</span></div>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}><span style={{ color: "#52525b" }}>Org ID</span><span style={{ color: "#fff", fontFamily: "var(--mono)" }}>{h.org}</span></div>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}><span style={{ color: "#52525b" }}>연동일</span><span style={{ color: "#fff" }}>{h.date}</span></div></>}
                      {h.dashed && <div style={{ color: "#a1a1aa", fontSize: 13, textAlign: "center" }}>hello@petchain.io</div>}
                    </div>
                    {h.dept && <span className="tag-green" style={{ marginTop: 12, fontSize: 11 }}>API 활성</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ fontSize: 12, fontWeight: 700, color: "#a1a1aa", letterSpacing: ".07em", textTransform: "uppercase", marginBottom: 16, display: "flex", alignItems: "center", gap: 10 }}>
            보험사 파트너
            <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
          </div>
          <div className="g3">
            {insurers.map((ins, i) => (
              <div key={i} className="flip-card">
                <div className="flip-inner">
                  <div className="flip-f" style={{ background: ins.bg, border: ins.dashed ? "1.5px dashed var(--border)" : `1px solid var(--border)`, borderTop: ins.border ? `3px solid ${ins.border}` : undefined }}>
                    <div style={{ fontSize: 32, marginBottom: 10 }}>🛡️</div>
                    <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>{ins.name}</div>
                    <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 10 }}>{ins.desc}</div>
                    {!ins.dashed && <span className="badge badge-b" style={{ fontSize: 11 }}>포인트 사용 중</span>}
                    {ins.dashed && <span style={{ fontSize: 11, padding: "3px 11px", borderRadius: 20, background: "#e4e4e7", color: "var(--muted)" }}>문의하기</span>}
                  </div>
                  <div className="flip-b" style={{ background: ins.dashed ? "#f4f4f5" : "#18181b" }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: ins.dashed ? "#18181b" : "#fff", marginBottom: 14 }}>{ins.name}</div>
                    <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 7 }}>
                      {ins.pt !== null ? <>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}><span style={{ color: "#52525b" }}>Org ID</span><span style={{ color: "#fff", fontFamily: "var(--mono)" }}>{ins.org}</span></div>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}><span style={{ color: "#52525b" }}>잔여 포인트</span><span style={{ color: "#fff" }}>{ins.pt} pt</span></div>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}><span style={{ color: "#52525b" }}>이번달 검증</span><span style={{ color: "#fff" }}>{ins.verify}건</span></div>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}><span style={{ color: "#52525b" }}>연동일</span><span style={{ color: "#fff" }}>{ins.date}</span></div>
                      </> : <div style={{ color: "#a1a1aa", fontSize: 13, textAlign: "center" }}>hello@petchain.io</div>}
                    </div>
                    {ins.pt !== null && <span className="tag-green" style={{ marginTop: 12, fontSize: 11 }}>API 활성</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* FAQ */}
      <div className="sec sec-gray">
        <div className="sec-inner">
          <div className="sec-ey">FAQ</div>
          <div className="sec-h2">자주 묻는 질문</div>
          <div style={{ maxWidth: 680 }}>
            {faqs.map(([q, a], i) => (
              <div key={i} className="faq-item">
                <div className="faq-q" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                  <span>{q}</span>
                  <span style={{ fontSize: 18, color: "#a1a1aa", transition: "transform .2s", transform: openFaq === i ? "rotate(180deg)" : "none" }}>﹀</span>
                </div>
                {openFaq === i && <div className="faq-a">{a}</div>}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="cta-sec">
        <div style={{ fontSize: 42, fontWeight: 800, color: "#fff", letterSpacing: "-.03em", marginBottom: 12 }}>지금 바로 시작하세요</div>
        <div style={{ fontSize: 16, color: "rgba(255,255,255,.7)", marginBottom: 36 }}>병원, 보험사, 보호자 모두를 위한 블록체인 인프라</div>
        <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
          <button className="btn" style={{ padding: "13px 34px", fontSize: 15, fontWeight: 700, background: "#fff", color: "#0d3d26", border: "none" }} onClick={() => onGoAuth("signup")}>무료로 시작하기</button>
          <button className="btn" style={{ padding: "13px 34px", fontSize: 15, background: "transparent", color: "#fff", border: "2px solid rgba(255,255,255,.4)" }} onClick={() => onGoAuth("login")}>로그인</button>
        </div>
      </div>

      <footer>
        <div className="ft-top">
          <div>
            <div style={{ fontSize: 17, fontWeight: 800, color: "#fff", marginBottom: 10 }}>🐾 Pet<span style={{ color: "var(--green)" }}>Chain</span></div>
            <div style={{ fontSize: 13, color: "#52525b", lineHeight: 1.9 }}>블록체인 기반 반려동물 진료기록 검증 인프라<br />서울특별시 마포구 와우산로 000<br />사업자등록번호 000-00-00000</div>
          </div>
          <div className="ft-cols">
            {[["서비스", ["보호자", "병원 파트너", "보험사 파트너"]], ["회사", ["서비스 소개", "기술 문서", "문의하기"]], ["법적 고지", ["이용약관", "개인정보처리방침", "블록체인 정책"]]].map(([title, links]) => (
              <div key={title}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#fff", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 14 }}>{title}</div>
                {links.map(l => <a key={l} className="ft-link">{l}</a>)}
              </div>
            ))}
          </div>
        </div>
        <div style={{ borderTop: "1px solid #1c1c1e", paddingTop: 22, display: "flex", justifyContent: "space-between", fontSize: 13, color: "#3f3f46" }}>
          <span>© 2024 PetChain Inc. All rights reserved.</span>
          <span>hello@petchain.io</span>
        </div>
      </footer>
    </div>
  );
}

/* ─────────────────────────────────────────────
   AUTH PAGE
───────────────────────────────────────────── */
function AuthPage({ mode, onLogin, onBack }) {
  const [role, setRole] = useState("guardian");
  const [tab, setTab] = useState(mode === "signup" ? "signup" : "login");
  useEffect(() => setTab(mode === "signup" ? "signup" : "login"), [mode]);

  const roles = [
    { id: "guardian", icon: "🐾", name: "보호자", desc: "반려동물 보험 청구" },
    { id: "hospital", icon: "🏥", name: "병원", desc: "진료기록 관리" },
    { id: "insurance", icon: "🛡️", name: "보험사", desc: "검증 API 호출" },
    { id: "platform", icon: "⚙️", name: "플랫폼", desc: "관리자 콘솔" },
  ];

  const btnColor = { guardian: "btn-pr", hospital: "btn-bl", insurance: "btn-pu", platform: "btn-dark" };

  return (
    <div className="auth-wrap">
      <div className="auth-left">
        <div style={{ fontSize: 18, fontWeight: 800, color: "#fff", cursor: "pointer", marginBottom: 48 }} onClick={onBack}>🐾 Pet<span style={{ color: "var(--green)" }}>Chain</span></div>
        <div style={{ fontSize: 26, fontWeight: 800, color: "#fff", marginBottom: 8 }}>{mode === "signup" ? "회원가입" : "로그인"}</div>
        <div style={{ fontSize: 14, color: "#52525b", marginBottom: 32 }}>역할을 선택하세요</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 9, flex: 1 }}>
          {roles.map(r => (
            <div key={r.id} className={`role-pill ${role === r.id ? "sel" : ""}`} onClick={() => setRole(r.id)}>
              <div style={{ fontSize: 20, width: 30, textAlign: "center" }}>{r.icon}</div>
              <div><div style={{ fontSize: 14, fontWeight: 600, color: "#fff" }}>{r.name}</div><div style={{ fontSize: 12, color: "#52525b", marginTop: 2 }}>{r.desc}</div></div>
            </div>
          ))}
        </div>
        <div style={{ fontSize: 12, color: "#27272a", marginTop: 32 }}>© 2024 PetChain Inc.</div>
      </div>

      <div className="auth-right">
        <button className="btn btn-ghost btn-sm" style={{ position: "absolute", top: 22, right: 26 }} onClick={onBack}>← 홈으로</button>
        <div style={{ width: "100%", maxWidth: 400 }}>
          {role === "platform" ? (
            <>
              <div style={{ fontSize: 26, fontWeight: 800, marginBottom: 4 }}>플랫폼 관리자</div>
              <div style={{ fontSize: 14, color: "var(--muted)", marginBottom: 28 }}>PetChain 운영자 전용 계정</div>
              <label className="fl">관리자 ID</label><input className="fi" placeholder="platform-admin" />
              <label className="fl">비밀번호</label><input className="fi" type="password" placeholder="••••••••" />
              <button className={`btn btn-dark`} style={{ width: "100%", justifyContent: "center", padding: "13px" }} onClick={() => onLogin("platform")}>로그인</button>
            </>
          ) : (
            <>
              <div style={{ fontSize: 26, fontWeight: 800, marginBottom: 4 }}>{roles.find(r => r.id === role)?.name}</div>
              <div style={{ fontSize: 14, color: "var(--muted)", marginBottom: 24 }}>
                {{ guardian: "반려동물 보험 청구를 위한 계정", hospital: "동물병원 진료기록 등록 계정", insurance: "검증 API 호출 및 심사 계정" }[role]}
              </div>
              <div style={{ display: "flex", borderBottom: "2px solid var(--border)", marginBottom: 24 }}>
                <button className={`auth-tab ${tab === "login" ? "on" : ""}`} onClick={() => setTab("login")}>로그인</button>
                <button className={`auth-tab ${tab === "signup" ? "on" : ""}`} onClick={() => setTab("signup")}>
                  {{ guardian: "회원가입", hospital: "병원 등록", insurance: "보험사 등록" }[role]}
                </button>
              </div>

              {tab === "login" && (
                <>
                  <label className="fl">{{ guardian: "이메일", hospital: "병원 Org ID", insurance: "보험사 Org ID" }[role]}</label>
                  <input className="fi" placeholder={{ guardian: "hong@email.com", hospital: "hospital-org-id", insurance: "insurance-org-id" }[role]} />
                  <label className="fl">비밀번호</label>
                  <input className="fi" type="password" placeholder="••••••••" />
                  <button className={`btn ${btnColor[role]}`} style={{ width: "100%", justifyContent: "center", padding: "13px" }} onClick={() => onLogin(role)}>로그인</button>
                  <div style={{ textAlign: "center", fontSize: 13, color: "#a1a1aa", margin: "14px 0", position: "relative" }}>
                    <div style={{ position: "absolute", top: "50%", left: 0, right: 0, height: 1, background: "var(--border)" }} />
                    <span style={{ background: "#f7f7f5", padding: "0 12px", position: "relative" }}>계정이 없으신가요?</span>
                  </div>
                  <button className="btn btn-ghost" style={{ width: "100%", justifyContent: "center" }} onClick={() => setTab("signup")}>회원가입하기</button>
                </>
              )}

              {tab === "signup" && role === "guardian" && (
                <>
                  <div className="fi-row"><div><label className="fl">이름</label><input className="fi" placeholder="홍길동" /></div><div><label className="fl">전화번호</label><input className="fi" placeholder="010-0000-0000" /></div></div>
                  <label className="fl">이메일</label><input className="fi" type="email" placeholder="hong@email.com" />
                  <div className="fi-row"><div><label className="fl">비밀번호</label><input className="fi" type="password" placeholder="8자 이상" /></div><div><label className="fl">비밀번호 확인</label><input className="fi" type="password" placeholder="재입력" /></div></div>
                  <label className="fl">주소</label><input className="fi" placeholder="서울시 강남구..." />
                  <div className="fi-note">📌 개인정보는 AES-256 암호화 저장됩니다.</div>
                  <button className="btn btn-pr" style={{ width: "100%", justifyContent: "center", padding: "13px" }} onClick={() => onLogin("guardian")}>보호자로 가입하기</button>
                </>
              )}
              {tab === "signup" && role === "hospital" && (
                <>
                  <div className="fi-row"><div><label className="fl">병원명</label><input className="fi" placeholder="행복동물병원" /></div><div><label className="fl">사업자등록번호</label><input className="fi" placeholder="000-00-00000" /></div></div>
                  <label className="fl">주소</label><input className="fi" placeholder="서울시 마포구..." />
                  <div className="fi-row"><div><label className="fl">대표 전화</label><input className="fi" placeholder="02-0000-0000" /></div><div><label className="fl">Fabric Org ID</label><input className="fi" placeholder="HospitalA" /></div></div>
                  <label className="fl">관리자 이메일</label><input className="fi" type="email" placeholder="admin@hospital.com" />
                  <div className="fi-row"><div><label className="fl">비밀번호</label><input className="fi" type="password" placeholder="8자 이상" /></div><div><label className="fl">비밀번호 확인</label><input className="fi" type="password" placeholder="재입력" /></div></div>
                  <div className="a-notice">📋 등록 신청 후 플랫폼 관리자 승인이 필요합니다.</div>
                  <button className="btn btn-bl" style={{ width: "100%", justifyContent: "center", padding: "13px" }} onClick={() => onLogin("hospital")}>병원 등록 신청</button>
                </>
              )}
              {tab === "signup" && role === "insurance" && (
                <>
                  <div className="fi-row"><div><label className="fl">보험사명</label><input className="fi" placeholder="DB손해보험" /></div><div><label className="fl">사업자등록번호</label><input className="fi" placeholder="000-00-00000" /></div></div>
                  <label className="fl">Fabric Org ID</label><input className="fi" placeholder="InsuranceA" />
                  <label className="fl">관리자 이메일</label><input className="fi" type="email" placeholder="admin@insurance.com" />
                  <div className="fi-row"><div><label className="fl">비밀번호</label><input className="fi" type="password" placeholder="8자 이상" /></div><div><label className="fl">비밀번호 확인</label><input className="fi" type="password" placeholder="재입력" /></div></div>
                  <div className="a-notice">📋 등록 신청 후 플랫폼 관리자 승인이 필요합니다.</div>
                  <button className="btn btn-pu" style={{ width: "100%", justifyContent: "center", padding: "13px" }} onClick={() => onLogin("insurance")}>보험사 등록 신청</button>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   PLATFORM ADMIN
───────────────────────────────────────────── */
function Platform({ onLogout, showToast, state, setState }) {
  const [tab, setTab] = useState("org");
  const tabs = [{ id: "org", lbl: "Org 관리" }, { id: "point", lbl: "포인트 발행" }, { id: "code", lbl: "표준 코드" }, { id: "monitor", lbl: "모니터링" }];

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <div className="pnav">
        <div style={{ fontSize: 15, fontWeight: 800, color: "#fff", paddingRight: 22, borderRight: "1px solid #1c1c1e", marginRight: 4 }}>🐾 Pet<span style={{ color: "var(--green)" }}>Chain</span> Admin</div>
        {tabs.map(t => <button key={t.id} className={`pni ${tab === t.id ? "on" : ""}`} onClick={() => setTab(t.id)}>{t.lbl}</button>)}
        <button className="btn btn-ghost btn-sm" style={{ marginLeft: "auto", color: "#52525b", borderColor: "#1c1c1e" }} onClick={onLogout}>로그아웃</button>
      </div>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 36px" }}>

        {tab === "org" && (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <div><div className="pane-h">Org 관리</div><div className="pane-sub">병원·보험사 참여 승인</div></div>
              <button className="btn btn-pr">+ Org 등록</button>
            </div>
            <div className="card">
              <table className="tbl"><thead><tr><th>Org ID</th><th>이름</th><th>유형</th><th>Fabric Org ID</th><th>가입일</th><th>상태</th><th></th></tr></thead>
                <tbody>
                  <tr><td className="mono">hosp-001</td><td>행복동물병원</td><td>병원</td><td className="mono">HospitalA</td><td>2024.01.10</td><td><span className="badge badge-g">활성</span></td><td><button className="btn btn-sm">관리</button></td></tr>
                  <tr><td className="mono">hosp-002</td><td>서울동물병원</td><td>병원</td><td className="mono">HospitalB</td><td>2024.02.05</td><td><span className="badge badge-g">활성</span></td><td><button className="btn btn-sm">관리</button></td></tr>
                  <tr><td className="mono">ins-001</td><td>DB손해보험</td><td>보험사</td><td className="mono">InsuranceA</td><td>2024.01.15</td><td><span className="badge badge-g">활성</span></td><td><button className="btn btn-sm">관리</button></td></tr>
                  <tr><td className="mono">ins-002</td><td>현대해상</td><td>보험사</td><td className="mono">InsuranceB</td><td>2024.03.01</td><td><span className="badge badge-a">승인 대기</span></td><td><button className="btn btn-bl btn-sm">승인</button></td></tr>
                </tbody>
              </table>
            </div>
          </>
        )}

        {tab === "point" && (
          <>
            <div className="pane-h" style={{ marginBottom: 24 }}>포인트 발행</div>
            <div className="g2">
              <div className="card">
                <div className="card-title">IssuePoint</div>
                <label className="fl">대상 보험사</label>
                <select className="fi"><option>ins-001 · DB손해보험</option><option>ins-002 · 현대해상</option></select>
                <label className="fl">발행 수량</label><input className="fi" type="number" defaultValue={500} />
                <label className="fl">메모</label><input className="fi" placeholder="5월 정기 충전" />
                <button className="btn btn-pr" style={{ width: "100%", justifyContent: "center" }} onClick={() => { setState(s => ({ ...s, ptBalance: s.ptBalance + 500 })); showToast("IssuePoint", "포인트 500 발행 완료"); }}>발행 실행</button>
              </div>
              <div className="card">
                <div className="card-title">보험사별 포인트 현황</div>
                <table className="tbl"><thead><tr><th>보험사</th><th>잔여</th><th>소모</th></tr></thead>
                  <tbody>
                    <tr><td>DB손해보험</td><td style={{ fontWeight: 700, color: "var(--purple)" }}>{state.ptBalance}</td><td style={{ color: "var(--red)" }}>{state.usedPt}</td></tr>
                    <tr><td>현대해상</td><td>0</td><td>0</td></tr>
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {tab === "code" && (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <div className="pane-h">표준 코드 관리</div>
              <button className="btn btn-pr">+ 코드 추가</button>
            </div>
            <div className="g2">
              <div className="card"><div className="card-title">질병 코드 (disease_codes)</div>
                <table className="tbl"><thead><tr><th>코드</th><th>한글명</th><th>카테고리</th><th></th></tr></thead>
                  <tbody>
                    {[["KC-001","피부염","피부"],["KC-042","골절","근골격"],["KC-055","관절염","근골격"],["KC-108","슬개골 탈구","근골격"]].map(([c,n,k]) => <tr key={c}><td className="mono">{c}</td><td>{n}</td><td>{k}</td><td><button className="btn btn-sm">수정</button></td></tr>)}
                  </tbody>
                </table>
              </div>
              <div className="card"><div className="card-title">진료 행위 코드 (treatment_codes)</div>
                <table className="tbl"><thead><tr><th>코드</th><th>한글명</th><th>카테고리</th><th></th></tr></thead>
                  <tbody>
                    {[["VA-011","X-ray 촬영","영상검사"],["VA-025","수술","처치"],["VA-032","약물 처방","처방"]].map(([c,n,k]) => <tr key={c}><td className="mono">{c}</td><td>{n}</td><td>{k}</td><td><button className="btn btn-sm">수정</button></td></tr>)}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {tab === "monitor" && (
          <>
            <div className="pane-h" style={{ marginBottom: 24 }}>모니터링</div>
            <div className="g4" style={{ marginBottom: 20 }}>
              {[{n:3,l:"참여 Org"},{n:state.verifyCount,l:"총 검증 건",c:"var(--green)"},{n:0,l:"중복 의심",c:"var(--red)"},{n:state.ptBalance,l:"발행 포인트",c:"var(--purple)"}].map((s,i) => (
                <div key={i} className="stat-box"><div className="stat-n" style={s.c?{color:s.c}:{}}>{s.n}</div><div className="stat-l">{s.l}</div></div>
              ))}
            </div>
            <div className="card"><div className="card-title">최근 트랜잭션</div>
              <table className="tbl"><thead><tr><th>시각</th><th>유형</th><th>Org</th><th>내용</th></tr></thead>
                <tbody>
                  {state.txLog.length === 0
                    ? <tr><td colSpan={4} style={{ textAlign: "center", color: "#a1a1aa", padding: 24 }}>트랜잭션 없음</td></tr>
                    : state.txLog.slice(0, 8).map((t, i) => (
                      <tr key={i}><td>{t.time}</td><td><span className="badge badge-b">{t.type}</span></td><td>{t.org}</td><td>{t.desc}</td></tr>
                    ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   GUARDIAN DASHBOARD
───────────────────────────────────────────── */
function GuardianDash({ state, setState, showToast, openModal }) {
  const [tab, setTab] = useState("home");
  return (
    <>
      <DashNav role="guardian" tab={tab} setTab={setTab} />
      <div className="dash-wrap">
        {tab === "home" && (
          <>
            <div className="pane-h">내 반려동물</div>
            <div className="pane-sub">등록된 반려동물과 보험 계약을 관리합니다</div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginBottom: 18 }}>
              <button className="btn" onClick={() => openModal("ins")}>+ 보험 계약 등록</button>
              <button className="btn btn-pr" onClick={() => openModal("pet")}>+ 반려동물 추가</button>
            </div>
            <div className="g3">
              {state.petCards.map((p, i) => (
                <div key={i} className="card">
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                    <div style={{ width: 48, height: 48, borderRadius: 13, background: "var(--green-l)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>🐶</div>
                    <div><div style={{ fontSize: 17, fontWeight: 700 }}>{p.name}</div><div style={{ fontSize: 13, color: "var(--muted)", marginTop: 2 }}>{p.species} · 3세</div></div>
                    <span className="badge badge-g" style={{ marginLeft: "auto" }}>SBT 발급됨</span>
                  </div>
                  <div className="divider" />
                  <div className="row-flex"><span style={{ color: "var(--muted)" }}>보험사</span><span style={{ fontWeight: 600 }}>{p.insurer}</span></div>
                  <div className="row-flex"><span style={{ color: "var(--muted)" }}>계약 상태</span><span className="badge badge-g">active</span></div>
                </div>
              ))}
            </div>
          </>
        )}

        {tab === "consent" && (
          <>
            <div className="pane-h">제출 동의 관리</div>
            <div className="pane-sub">진료기록 제출 동의를 관리합니다 (consent_history)</div>
            <div className="g2">
              <div className="card">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                  <div><div style={{ fontSize: 15, fontWeight: 700 }}>초코 · 피부염 진료 (2024.05.08)</div><div style={{ fontSize: 13, color: "var(--muted)", marginTop: 4 }}>행복동물병원 · REC-2024-0041 · 48,000원</div></div>
                  <span className="badge badge-b">동의 대기</span>
                </div>
                <div style={{ background: "#f7f7f5", borderRadius: 10, padding: 16, marginBottom: 16, fontSize: 13, display: "flex", flexDirection: "column", gap: 9 }}>
                  <div className="row-flex"><span style={{ color: "var(--muted)" }}>질병 코드</span><span className="mono">KC-001 · 피부염</span></div>
                  <div className="row-flex"><span style={{ color: "var(--muted)" }}>진료 행위</span><span className="mono">VA-032 · 약물 처방</span></div>
                  <div className="row-flex"><span style={{ color: "var(--muted)" }}>제출 대상</span><span style={{ fontWeight: 600 }}>DB손해보험</span></div>
                </div>
                <div style={{ fontSize: 13, color: "#92400e", padding: "10px 14px", background: "var(--amber-l)", borderRadius: 8, marginBottom: 16 }}>⚠️ 동의하면 위 진료기록이 DB손해보험에 제출됩니다. 언제든지 철회할 수 있습니다.</div>
                <div style={{ display: "flex", gap: 10 }}>
                  <button className="btn btn-pr" onClick={() => {
                    if (!state.recordDone) { showToast("⚠️ 오류", "병원이 아직 진료기록을 등록하지 않았습니다"); return; }
                    setState(s => ({ ...s, consentDone: true }));
                    showToast("동의 완료", "consent_status: active — 청구 패키지 생성");
                  }}>동의하고 제출</button>
                  <button className="btn btn-re">동의 거부</button>
                </div>
              </div>
              <div className="card"><div className="card-title">동의 이력</div><div style={{ fontSize: 13, color: "#a1a1aa", textAlign: "center", padding: 16 }}>이전 동의 내역 없음</div></div>
            </div>
          </>
        )}

        {tab === "status" && (
          <>
            <div className="pane-h">청구 상태</div>
            <div className="pane-sub">보험 청구 진행 현황 (claim_packages)</div>
            <div className="g2">
              <div className="card">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
                  <div><div style={{ fontSize: 16, fontWeight: 700 }}>CLM-2024-00001</div><div style={{ fontSize: 13, color: "var(--muted)", marginTop: 3 }}>초코 · 피부염 · 48,000원</div></div>
                  <span className="badge badge-a" id="claim-badge">{state.consentDone ? "검증 대기" : "준비 중"}</span>
                </div>
                {[
                  { lbl: "동의 완료", sub: "consent_status: active", done: true },
                  { lbl: "해시 검증 완료", sub: "detail_data_hash 일치", done: state.consentDone },
                  { lbl: "보험사 심사 중", sub: "claim_status: verified", now: state.consentDone, color: "var(--blue)" },
                  { lbl: "결과 통보", sub: "approved / rejected", wait: true, color: "var(--muted)" },
                ].map((r, i) => (
                  <div key={i} className="tl-row">
                    <div className={`tl-dot ${r.done ? "done" : r.now ? "now" : "wait"}`} style={{ background: r.done ? "var(--green)" : r.now ? "var(--blue)" : "#d4d4d8", boxShadow: r.now ? "0 0 0 3px var(--blue-l)" : "none" }} />
                    <div><div style={{ fontSize: 14, fontWeight: 600, color: r.color || "#18181b" }}>{r.lbl}</div><div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>{r.sub}</div></div>
                  </div>
                ))}
              </div>
              <div className="card"><div className="card-title">청구 상세</div>
                {[["claim_id","CLM-2024-00001"],["병원","행복동물병원"],["보험사","DB손해보험"],["진료비","48,000원"]].map(([k,v]) => (
                  <div key={k} className="row-flex"><span style={{ color: "var(--muted)" }}>{k}</span><span>{v}</span></div>
                ))}
                <button className="btn btn-re" style={{ width: "100%", justifyContent: "center", marginTop: 16 }}>동의 철회</button>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}

/* ─────────────────────────────────────────────
   HOSPITAL DASHBOARD
───────────────────────────────────────────── */
function HospitalDash({ state, setState, showToast }) {
  const [tab, setTab] = useState("reg");
  return (
    <>
      <DashNav role="hospital" tab={tab} setTab={setTab} />
      <div className="dash-wrap">
        {tab === "reg" && (
          <>
            <div className="pane-h">진료기록 등록</div>
            <div className="pane-sub">표준 코드로 등록 → 해시 생성 → 원장 기록 (medical_records)</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 22 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div className="card"><div className="card-title">환자 정보</div>
                  <div className="fi-row"><div><label className="fl">보호자명 / SBT ID</label><input className="fi" placeholder="홍길동 또는 SBT-001" /></div><div><label className="fl">진료일</label><input className="fi" type="date" defaultValue="2024-05-08" /></div></div>
                </div>
                <div className="card"><div className="card-title">진료 코드</div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: "#52525b", marginBottom: 8 }}>질병 코드 (복수 선택)</div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
                    {[["KC-001","피부염",true],["KC-042","골절",false],["KC-055","관절염",false],["KC-108","슬개골 탈구",false]].map(([c,n,d]) => (
                      <label key={c} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 13px", border: "1.5px solid var(--border)", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 500 }}>
                        <input type="checkbox" defaultChecked={d} /> {c} {n}
                      </label>
                    ))}
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: "#52525b", marginBottom: 8 }}>진료 행위 코드 (복수 선택)</div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
                    {[["VA-032","약물 처방",true],["VA-011","X-ray",false],["VA-025","수술",false]].map(([c,n,d]) => (
                      <label key={c} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 13px", border: "1.5px solid var(--border)", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 500 }}>
                        <input type="checkbox" defaultChecked={d} /> {c} {n}
                      </label>
                    ))}
                  </div>
                  <div className="fi-row"><div><label className="fl">총 진료비 (원)</label><input className="fi" type="number" defaultValue={48000} /></div><div><label className="fl">진료 소견</label><input className="fi" placeholder="간단한 소견" /></div></div>
                </div>
                <div className="card"><div className="card-title">첨부 파일 (S3 오프체인)</div>
                  <div className="upload-zone">📎 영수증 · X-RAY · 초음파 파일 업로드<br /><span style={{ fontSize: 12 }}>원문 암호화 저장 · 해시값만 온체인</span></div>
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div className="card"><div className="card-title">해시 미리보기</div>
                  <div style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--muted)", wordBreak: "break-all", background: "#f7f7f5", padding: 13, borderRadius: 8, lineHeight: 1.8 }}>detail_data_hash:<br />sha256:a3f2b9c1d4e5f678...</div>
                </div>
                <div className="card"><div className="card-title">on_chain_status</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, fontWeight: 500 }}><div style={{ width: 9, height: 9, borderRadius: "50%", background: state.recordDone ? "var(--green)" : "var(--amber)" }} />{state.recordDone ? "confirmed" : "pending"}</div>
                </div>
                <button className="btn btn-bl" style={{ padding: 13, fontSize: 15, justifyContent: "center" }}
                  onClick={() => {
                    setState(s => ({ ...s, recordDone: true, creditN: s.creditN + 1, txLog: [{ time: new Date().toLocaleTimeString(), type: "기록", org: "hosp-001", desc: "진료기록 등록 — SHA-256 원장 기록" }, ...s.txLog] }));
                    showToast("원장 기록", "on_chain_status: confirmed — 크레딧 +1");
                  }}>원장에 기록 (on-chain)</button>
              </div>
            </div>
          </>
        )}

        {tab === "credit" && (
          <>
            <div className="pane-h">크레딧 현황</div>
            <div className="pane-sub">진료기록 등록 시 적립되는 운영 크레딧</div>
            <div className="g4" style={{ marginBottom: 20 }}>
              {[{ n: state.creditN, l: "누적 크레딧", c: "var(--green)" }, { n: "50,000원", l: "이번달 SaaS 정가" }, { n: "38,000원", l: "크레딧 차감액", c: "var(--green)" }, { n: "12,000원", l: "실납부액" }].map((s, i) => (
                <div key={i} className="stat-box"><div className="stat-n" style={s.c ? { color: s.c } : {}}>{s.n}</div><div className="stat-l">{s.l}</div></div>
              ))}
            </div>
            <div className="card"><div className="card-title">적립 내역</div>
              <table className="tbl"><thead><tr><th>날짜</th><th>record_id</th><th>내용</th><th>적립</th></tr></thead>
                <tbody>
                  <tr><td>05.08</td><td className="mono">REC-2024-0041</td><td>진료기록 정상 등록</td><td style={{ color: "var(--green)", fontWeight: 600 }}>+1</td></tr>
                  <tr><td>05.07</td><td className="mono">REC-2024-0040</td><td>진료기록 정상 등록</td><td style={{ color: "var(--green)", fontWeight: 600 }}>+1</td></tr>
                  {state.recordDone && <tr><td>지금</td><td className="mono">REC-2024-0042</td><td>진료기록 정상 등록</td><td style={{ color: "var(--green)", fontWeight: 600 }}>+1</td></tr>}
                </tbody>
              </table>
            </div>
          </>
        )}

        {tab === "log" && (
          <>
            <div className="pane-h">감사 로그</div>
            <div className="pane-sub">원장 기록 트랜잭션 이력 (audit_logs)</div>
            <div className="card"><table className="tbl"><thead><tr><th>시각</th><th>record_id</th><th>내용</th><th>Fabric TX</th><th>상태</th></tr></thead>
              <tbody>
                <tr><td>05.08 14:23</td><td className="mono">REC-2024-0041</td><td>원장 기록 완료</td><td className="mono">a3f2b9c1...</td><td><span className="badge badge-g">confirmed</span></td></tr>
                <tr><td>05.07 11:05</td><td className="mono">REC-2024-0040</td><td>원장 기록 완료</td><td className="mono">b4c3d2e1...</td><td><span className="badge badge-g">confirmed</span></td></tr>
              </tbody>
            </table></div>
          </>
        )}
      </div>
    </>
  );
}

/* ─────────────────────────────────────────────
   INSURANCE DASHBOARD
───────────────────────────────────────────── */
function InsuranceDash({ state, setState, showToast }) {
  const [tab, setTab] = useState("list");

  return (
    <>
      <DashNav role="insurance" tab={tab} setTab={setTab} />
      <div className="dash-wrap">
        {tab === "list" && (
          <>
            <div className="pane-h">검증 대기 목록</div>
            <div className="pane-sub">보호자 동의 완료된 청구 건 (consent_status: active)</div>
            <div style={{ background: "var(--amber-l)", border: "1px solid #fde68a", borderRadius: 10, padding: "12px 18px", marginBottom: 16, display: "flex", alignItems: "center", gap: 10, fontSize: 14, fontWeight: 500, color: "#92400e" }}>
              ⚠️ 중복 청구 의심 1건 감지 — 체인코드 자동 탐지
            </div>
            <div className="card"><table className="tbl">
              <thead><tr><th>claim_id</th><th>반려동물</th><th>질병코드</th><th>진료비</th><th>병원</th><th>동의일</th><th>상태</th><th></th></tr></thead>
              <tbody>
                <tr><td className="mono">CLM-2024-00001</td><td>초코</td><td className="mono">KC-001</td><td>48,000원</td><td>행복동물병원</td><td>05.08</td><td><span className="badge badge-r">중복 의심</span></td><td><button className="btn btn-re btn-sm">확인</button></td></tr>
                <tr><td className="mono">CLM-2024-00002</td><td>몽이</td><td className="mono">KC-042</td><td>320,000원</td><td>행복동물병원</td><td>05.08</td><td><span className="badge badge-g">동의 완료</span></td>
                  <td><button className="btn btn-pr btn-sm" onClick={() => {
                    if (!state.consentDone) { showToast("⚠️ 오류", "보호자 동의가 완료되지 않았습니다"); return; }
                    if (state.ptBalance <= 0) { showToast("⚠️ 포인트 부족", "포인트를 충전하세요"); return; }
                    setState(s => ({ ...s, ptBalance: s.ptBalance - 1, verifyCount: s.verifyCount + 1, usedPt: s.usedPt + 1, txLog: [{ time: new Date().toLocaleTimeString(), type: "검증", org: "ins-001", desc: "CLM-2024-00002 검증 — 해시 일치" }, ...s.txLog], ptLog: [{ date: "지금", type: "spend", claim: "CLM-2024-00002", desc: "검증 API 호출", pt: -1 }, ...s.ptLog] }));
                    showToast("검증 완료", "result: verified — 포인트 차감 (-1)");
                    setTab("result");
                  }}>검증 →</button></td>
                </tr>
                <tr><td className="mono">CLM-2024-00003</td><td>코코</td><td className="mono">KC-001</td><td>75,000원</td><td>서울동물병원</td><td>05.07</td><td><span className="badge badge-g">동의 완료</span></td><td><button className="btn btn-pr btn-sm">검증 →</button></td></tr>
              </tbody>
            </table></div>
          </>
        )}

        {tab === "result" && (
          <>
            <div className="pane-h">검증 결과</div>
            <div className="pane-sub">CLM-2024-00002 · 몽이 · 골절 (verification_logs)</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 22 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                <div className="card" style={{ borderColor: "var(--green)", borderWidth: 1.5 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 13, marginBottom: 20 }}>
                    <div style={{ width: 46, height: 46, borderRadius: "50%", background: "var(--green-l)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>✅</div>
                    <div><div style={{ fontSize: 19, fontWeight: 800, color: "var(--green)" }}>검증 통과</div><div style={{ fontSize: 12, color: "var(--muted)" }}>result: verified</div></div>
                    <span className="badge badge-gr" style={{ marginLeft: "auto" }}>포인트 -1</span>
                  </div>
                  <div className="g2">
                    {[["해시 일치","✓ 정상"],["중복 청구","✓ 없음"],["동의 상태","✓ ACTIVE"],["on_chain","✓ confirmed"]].map(([k,v]) => (
                      <div key={k} style={{ background: "#f7f7f5", borderRadius: 9, padding: 14 }}>
                        <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 5 }}>{k}</div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: "var(--green)" }}>{v}</div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="card"><div className="card-title">진료 상세</div>
                  <div className="g2" style={{ fontSize: 14 }}>
                    {[["질병코드","KC-042 · 골절"],["진료 행위","VA-025 · 수술"],["총 진료비","320,000원"],["병원","행복동물병원"],["진료일","2024.05.08"],["record_id","REC-2024-0042"]].map(([k,v]) => (
                      <div key={k}><div style={{ color: "var(--muted)", fontSize: 12, marginBottom: 3 }}>{k}</div><div style={{ fontWeight: 500 }}>{v}</div></div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="card">
                <div className="card-title">심사 결과 기록</div>
                <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
                  <button className="btn btn-pr" style={{ flex: 1, justifyContent: "center" }} onClick={() => { setState(s => ({ ...s, txLog: [{ time: new Date().toLocaleTimeString(), type: "기록", org: "ins-001", desc: "APPROVED" }, ...s.txLog] })); showToast("심사 완료", "APPROVED — reviewed_at 원장 기록"); }}>승인 APPROVED</button>
                  <button className="btn btn-re" style={{ flex: 1, justifyContent: "center" }} onClick={() => { showToast("심사 완료", "REJECTED — reviewed_at 원장 기록"); }}>반려 REJECTED</button>
                </div>
                <label className="fl">심사 메모</label>
                <textarea className="fi" rows={5} placeholder="내부 심사 메모..." style={{ resize: "vertical" }} />
                <button className="btn btn-bl" style={{ width: "100%", justifyContent: "center" }}>원장에 기록</button>
              </div>
            </div>
          </>
        )}

        {tab === "point" && (
          <>
            <div className="pane-h">포인트 현황</div>
            <div className="pane-sub">검증 API 호출 시 차감 (point_balances + point_transactions)</div>
            <div className="g4" style={{ marginBottom: 20 }}>
              {[{ n: state.ptBalance, l: "잔여 포인트", c: "var(--purple)" }, { n: state.usedPt, l: "이번달 소모" }, { n: 1000, l: "충전 총량" }, { n: state.verifyCount, l: "총 검증 건", c: "var(--green)" }].map((s, i) => (
                <div key={i} className="stat-box"><div className="stat-n" style={s.c ? { color: s.c } : {}}>{s.n}</div><div className="stat-l">{s.l}</div></div>
              ))}
            </div>
            <div className="card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <div className="card-title" style={{ margin: 0 }}>포인트 거래 이력</div>
                <button className="btn btn-pr btn-sm">충전 요청</button>
              </div>
              <table className="tbl"><thead><tr><th>날짜</th><th>tx_type</th><th>claim_id</th><th>내용</th><th>포인트</th></tr></thead>
                <tbody>
                  {state.ptLog.map((p, i) => (
                    <tr key={i}><td>{p.date}</td><td><span className="badge badge-b">spend</span></td><td className="mono">{p.claim}</td><td>{p.desc}</td><td style={{ color: "var(--red)", fontWeight: 600 }}>{p.pt}</td></tr>
                  ))}
                  <tr><td>05.01</td><td><span className="badge badge-p">issue</span></td><td>-</td><td>플랫폼 발행</td><td style={{ color: "var(--purple)", fontWeight: 600 }}>+1,000</td></tr>
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </>
  );
}

/* ─────────────────────────────────────────────
   DASH NAV (공통)
───────────────────────────────────────────── */
function DashNav({ role, tab, setTab }) {
  const meta = ROLE_META[role];
  return (
    <div style={{ borderBottom: "1px solid var(--border)", background: "#fff", display: "flex", alignItems: "center", height: 52, padding: "0 36px" }}>
      {meta.tabs.map(t => (
        <div key={t.id} className={`dash-nav-item ${tab === t.id ? "on" : ""}`} style={{ height: 52 }} onClick={() => setTab(t.id)}>{t.lbl}</div>
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────────
   MODALS
───────────────────────────────────────────── */
function PetModal({ onClose, onSave, showToast }) {
  const [name, setName] = useState("");
  const [species, setSpecies] = useState("dog");
  return (
    <Overlay title="반려동물 등록" sub="정보 입력 후 SBT가 발급됩니다" onClose={onClose}>
      <div className="fi-row"><div><label className="fl">이름</label><input className="fi" placeholder="초코" value={name} onChange={e => setName(e.target.value)} /></div>
        <div><label className="fl">종류</label><select className="fi" value={species} onChange={e => setSpecies(e.target.value)}><option value="dog">강아지</option><option value="cat">고양이</option><option value="rabbit">토끼</option></select></div>
      </div>
      <div className="fi-row"><div><label className="fl">품종</label><input className="fi" placeholder="말티즈" /></div><div><label className="fl">출생연도</label><input className="fi" type="number" placeholder="2021" /></div></div>
      <div className="fi-row"><div><label className="fl">성별</label><select className="fi"><option>수컷</option><option>암컷</option><option>모름</option></select></div><div><label className="fl">중성화</label><select className="fi"><option>완료</option><option>미완료</option></select></div></div>
      <label className="fl">마이크로칩 번호</label><input className="fi" placeholder="15자리 숫자" />
      <div className="fi-note">📌 마이크로칩 번호는 SHA-256 해시 변환 후 온체인 기록</div>
      <button className="btn btn-pr" style={{ width: "100%", justifyContent: "center", padding: 12 }} onClick={() => { onSave({ name: name || "새 반려동물", species: species, insurer: "DB손해보험" }); showToast("SBT 발급", (name || "새 반려동물") + " — sbt_status: issued"); onClose(); }}>등록 및 SBT 발급</button>
    </Overlay>
  );
}

function InsModal({ onClose, showToast }) {
  return (
    <Overlay title="보험 계약 등록" sub="가입된 펫보험 정보를 입력하세요" onClose={onClose}>
      <label className="fl">반려동물 선택</label><select className="fi"><option>초코 (말티즈)</option></select>
      <label className="fl">보험사</label><select className="fi"><option>DB손해보험</option><option>현대해상</option></select>
      <label className="fl">상품명</label><input className="fi" placeholder="펫블리 반려동물보험" />
      <label className="fl">증권번호</label><input className="fi" placeholder="2024-XXXXXXXX" />
      <div className="fi-row"><div><label className="fl">계약 시작일</label><input className="fi" type="date" /></div><div><label className="fl">계약 종료일</label><input className="fi" type="date" /></div></div>
      <div className="fi-note">📌 증권번호는 AES-256 암호화 저장됩니다.</div>
      <button className="btn btn-pr" style={{ width: "100%", justifyContent: "center", padding: 12 }} onClick={() => { showToast("보험 등록", "DB손해보험 계약 등록 완료"); onClose(); }}>보험 계약 등록</button>
    </Overlay>
  );
}

/* ─────────────────────────────────────────────
   APP ROOT
───────────────────────────────────────────── */
export default function App() {
  const [S, setS] = useState(initState);
  const [toast, setToast] = useState(null);
  const [modal, setModal] = useState(null); // null | "pet" | "ins"

  const showToast = (step, msg) => { setToast({ step, msg, key: Date.now() }); };
  const openModal = (type) => setModal(type);

  const handleLogin = (role) => {
    setS(s => ({ ...s, page: role === "platform" ? "platform" : "main", role }));
  };
  const handleLogout = () => setS(s => ({ ...s, page: "landing", role: null }));
  const goAuth = (mode) => setS(s => ({ ...s, page: "auth", authMode: mode }));

  const meta = S.role ? ROLE_META[S.role] : null;

  return (
    <>
      <style>{css}</style>
      <style>{`@keyframes pulse{0%,100%{opacity:1;}50%{opacity:.35;}}`}</style>

      {S.page === "landing" && <Landing onGoAuth={goAuth} />}

      {S.page === "auth" && <AuthPage mode={S.authMode} onLogin={handleLogin} onBack={() => setS(s => ({ ...s, page: "landing" }))} />}

      {S.page === "platform" && <Platform onLogout={handleLogout} showToast={showToast} state={S} setState={setS} />}

      {S.page === "main" && meta && (
        <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
          {/* GNB */}
          <nav className="dash-gnb">
            <div className="dash-logo">🐾 Pet<span>Chain</span></div>
            <div style={{ flex: 1 }} />
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, fontWeight: 600 }}>
                <span>{meta.icon}</span>
                <span>{meta.name}</span>
                <span className="badge" style={{ background: meta.bg, color: meta.color, fontSize: 11 }}>{meta.label}</span>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={handleLogout}>로그아웃</button>
            </div>
          </nav>

          {S.role === "guardian" && <GuardianDash state={S} setState={setS} showToast={showToast} openModal={openModal} />}
          {S.role === "hospital" && <HospitalDash state={S} setState={setS} showToast={showToast} />}
          {S.role === "insurance" && <InsuranceDash state={S} setState={setS} showToast={showToast} />}
        </div>
      )}

      {/* 모달 */}
      {modal === "pet" && <PetModal onClose={() => setModal(null)} showToast={showToast}
        onSave={(pet) => setS(s => ({ ...s, petCards: [...s.petCards, pet] }))} />}
      {modal === "ins" && <InsModal onClose={() => setModal(null)} showToast={showToast} />}

      {/* 토스트 */}
      {toast && <Toast key={toast.key} step={toast.step} msg={toast.msg} onDone={() => setToast(null)} />}
    </>
  );
}
