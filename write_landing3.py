#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Generate Landing.jsx with GolfCC luxury-club design concept for PetChain."""

import os

OUT = r"C:\Users\ST-USER\Desktop\개발자 양성 교육\블록체인프로젝트(하이퍼)\pointpro\fe\petchain\src\pages\Landing.jsx"

content = r'''import { useState } from 'react'

/* ─ Palette · GolfCC luxe ───────────────────────────────────────────
   bg:        #f5f2ec   cream
   bg-2:      #ede9e1   deeper cream
   dark:      #1e2a18   forest dark
   brand:     #3d5a3a   forest green
   gold:      #b8885a   camel/gold
   text:      #1c1a17 / #3a3530 / #6b6358
   border:    #ddd5c8
   ─────────────────────────────────────────────────────────────────── */

const STYLE = `
.lp-root { background: #f5f2ec; color: #1c1a17; font-family: var(--font-sans); }

/* ── Header ─────────────────────────────────────────────── */
.lp-hdr {
  position: fixed; top: 0; left: 0; right: 0; z-index: 200; height: 72px;
  background: rgba(245,242,236,.92); backdrop-filter: blur(14px);
  border-bottom: 1px solid rgba(221,213,200,.6);
  display: flex; align-items: center; padding: 0 56px;
}
.lp-logo { font-size: 19px; font-weight: 800; letter-spacing: -.04em; color: #1e2a18; cursor: pointer; }
.lp-logo .dot { color: #b8885a; }
.lp-nav { display: flex; gap: 34px; margin-left: 56px; flex: 1; }
.lp-nav a {
  font-size: 13.5px; font-weight: 500; color: #3a3530;
  cursor: pointer; transition: color .2s;
  text-decoration: none; letter-spacing: .01em;
}
.lp-nav a:hover { color: #3d5a3a; }
.lp-hdr-cta { display: flex; gap: 10px; align-items: center; }
.lp-btn-ghost {
  font-size: 13px; font-weight: 500; color: #3a3530;
  background: transparent; border: none; padding: 8px 14px; cursor: pointer;
  letter-spacing: .01em; transition: color .15s;
}
.lp-btn-ghost:hover { color: #1e2a18; }
.lp-btn-solid {
  font-size: 13px; font-weight: 600; color: #f5f2ec;
  background: #1e2a18; border: none; padding: 10px 20px; cursor: pointer;
  border-radius: 999px; letter-spacing: .01em; transition: all .18s;
}
.lp-btn-solid:hover { background: #3d5a3a; transform: translateY(-1px); }

/* ── Hero · split screen ────────────────────────────────── */
.lp-hero { display: grid; grid-template-columns: 1fr 1fr; min-height: 100vh; padding-top: 72px; position: relative; }
.lp-hero-panel {
  position: relative; padding: 96px 72px; display: flex; flex-direction: column;
  justify-content: flex-end; overflow: hidden;
}
.lp-hero-left  { background: #12203a; }
.lp-hero-right { background: #1a2e1a; }
.lp-hero-panel::before {
  content: ''; position: absolute; inset: 0;
  background:
    radial-gradient(circle at 30% 30%, rgba(255,255,255,.06) 0%, transparent 50%),
    linear-gradient(180deg, transparent 0%, rgba(0,0,0,.35) 100%);
  pointer-events: none;
}
.lp-hero-eyebrow {
  position: relative; z-index: 2;
  font-size: 11px; font-weight: 700; letter-spacing: .22em;
  color: rgba(255,255,255,.55); text-transform: uppercase; margin-bottom: 20px;
}
.lp-hero-title {
  position: relative; z-index: 2;
  font-size: 54px; font-weight: 800; line-height: 1.1; letter-spacing: -.035em;
  color: #fff; max-width: 540px; margin-bottom: 24px;
}
.lp-hero-desc {
  position: relative; z-index: 2;
  font-size: 15.5px; line-height: 1.85; color: rgba(255,255,255,.7);
  max-width: 440px; margin-bottom: 36px; letter-spacing: .005em;
}
.lp-hero-cta {
  position: relative; z-index: 2;
  display: inline-flex; align-items: center; gap: 10px;
  font-size: 13px; font-weight: 600; color: #fff;
  background: transparent; border: 1.5px solid rgba(255,255,255,.32);
  padding: 14px 28px; border-radius: 999px; cursor: pointer;
  letter-spacing: .04em; transition: all .22s;
  align-self: flex-start;
}
.lp-hero-cta:hover { background: rgba(255,255,255,.08); border-color: rgba(255,255,255,.6); }
.lp-hero-cta-gold { border-color: rgba(184,136,90,.55); color: #e8d4b8; }
.lp-hero-cta-gold:hover { background: rgba(184,136,90,.14); border-color: rgba(184,136,90,.85); color: #fff; }

/* Center badge */
.lp-hero-badge {
  position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
  z-index: 5;
  width: 168px; height: 168px; border-radius: 50%;
  background: #f5f2ec; border: 1px solid #ddd5c8;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  box-shadow: 0 24px 80px rgba(0,0,0,.28), 0 0 0 8px rgba(245,242,236,.4);
}
.lp-hero-badge-text {
  font-size: 15px; font-weight: 800; letter-spacing: -.01em; color: #1e2a18;
}
.lp-hero-badge-text .dot { color: #b8885a; }
.lp-hero-badge-sub {
  font-size: 9.5px; font-weight: 600; color: #6b6358;
  letter-spacing: .28em; margin-top: 6px; text-transform: uppercase;
}
.lp-hero-badge-line {
  width: 28px; height: 1px; background: #b8885a; margin: 10px 0 8px;
}
.lp-hero-badge-est { font-size: 10px; color: #b8885a; letter-spacing: .14em; font-weight: 600; }

/* Subtle silhouette overlays */
.lp-silhouette {
  position: absolute; bottom: 0; right: -40px; width: 380px; height: 380px;
  background: radial-gradient(circle, rgba(184,136,90,.12) 0%, transparent 60%);
  pointer-events: none;
}
.lp-silhouette-l {
  position: absolute; bottom: 0; left: -60px; width: 360px; height: 360px;
  background: radial-gradient(circle, rgba(168,196,160,.10) 0%, transparent 60%);
  pointer-events: none;
}

/* ── Generic section ────────────────────────────────────── */
.lp-sec { padding: 120px 72px; }
.lp-sec-cream  { background: #f5f2ec; }
.lp-sec-cream2 { background: #ede9e1; }
.lp-sec-dark   { background: #1e2a18; color: #f5f2ec; }
.lp-sec-inner  { max-width: 1280px; margin: 0 auto; }

.lp-eyebrow {
  font-size: 11px; font-weight: 700; letter-spacing: .26em;
  color: #b8885a; text-transform: uppercase; margin-bottom: 24px;
  display: inline-flex; align-items: center; gap: 12px;
}
.lp-eyebrow::before {
  content: ''; width: 24px; height: 1px; background: #b8885a;
}
.lp-h2 {
  font-size: 44px; font-weight: 800; letter-spacing: -.035em; line-height: 1.18;
  color: #1c1a17; margin-bottom: 22px; max-width: 720px;
}
.lp-sec-dark .lp-h2 { color: #f5f2ec; }
.lp-lead {
  font-size: 16px; line-height: 1.9; color: #554f47; max-width: 580px;
  letter-spacing: .005em;
}
.lp-sec-dark .lp-lead { color: rgba(245,242,236,.65); }

/* ── About grid ─────────────────────────────────────────── */
.lp-about-grid { display: grid; grid-template-columns: 1.05fr .95fr; gap: 80px; align-items: start; }
.lp-stat-row { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; margin-top: 56px; }
.lp-stat { padding-top: 26px; border-top: 1px solid #ddd5c8; }
.lp-stat-n { font-size: 44px; font-weight: 800; letter-spacing: -.04em; color: #1e2a18; line-height: 1; }
.lp-stat-n .acc { color: #b8885a; }
.lp-stat-l { font-size: 12.5px; font-weight: 600; color: #6b6358; margin-top: 10px; letter-spacing: .04em; }

.lp-role-card {
  background: linear-gradient(160deg, #3d5a3a 0%, #2d4429 100%);
  border-radius: 4px; padding: 56px 48px; color: #f5f2ec;
  min-height: 480px; display: flex; flex-direction: column; justify-content: space-between;
  position: relative; overflow: hidden;
}
.lp-role-card::after {
  content: ''; position: absolute; bottom: -80px; right: -60px;
  width: 280px; height: 280px; border-radius: 50%;
  background: radial-gradient(circle, rgba(184,136,90,.16) 0%, transparent 70%);
}
.lp-role-card-eyebrow {
  font-size: 10.5px; font-weight: 700; letter-spacing: .26em;
  color: #e8d4b8; text-transform: uppercase; margin-bottom: 18px;
}
.lp-role-card-h { font-size: 30px; font-weight: 800; line-height: 1.25; letter-spacing: -.02em; margin-bottom: 18px; }
.lp-role-card-p { font-size: 14.5px; line-height: 1.85; color: rgba(245,242,236,.78); margin-bottom: 32px; }
.lp-role-card-list { display: flex; flex-direction: column; gap: 14px; position: relative; z-index: 2; }
.lp-role-card-li {
  display: flex; align-items: center; gap: 14px;
  font-size: 13.5px; color: rgba(245,242,236,.92);
  padding: 12px 0; border-top: 1px solid rgba(245,242,236,.12);
}
.lp-role-card-li-n { font-size: 11px; color: #e8d4b8; letter-spacing: .12em; font-weight: 600; min-width: 28px; }

/* ── Three-column role solutions ────────────────────────── */
.lp-roles-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0; border-top: 1px solid #ddd5c8; }
.lp-role-col {
  padding: 56px 48px 56px 0;
  border-right: 1px solid #ddd5c8;
}
.lp-role-col:last-child { border-right: none; padding-right: 0; }
.lp-role-col:not(:first-child) { padding-left: 48px; }
.lp-role-col-num {
  font-size: 11px; font-weight: 700; letter-spacing: .24em;
  color: #b8885a; margin-bottom: 28px; text-transform: uppercase;
}
.lp-role-col-h { font-size: 26px; font-weight: 800; letter-spacing: -.02em; color: #1c1a17; margin-bottom: 16px; line-height: 1.3; }
.lp-role-col-p { font-size: 14px; line-height: 1.85; color: #554f47; margin-bottom: 28px; }
.lp-role-col-features { display: flex; flex-direction: column; gap: 12px; }
.lp-role-col-feature {
  font-size: 13px; color: #3a3530; padding: 10px 0;
  border-top: 1px solid rgba(221,213,200,.7);
  display: flex; align-items: center; gap: 12px;
}
.lp-role-col-feature::before {
  content: '—'; color: #b8885a; font-weight: 700;
}

/* ── Dark network section ───────────────────────────────── */
.lp-channels { display: grid; grid-template-columns: 1.05fr .95fr; gap: 80px; align-items: center; margin-top: 80px; }
.lp-channel-viz {
  position: relative; aspect-ratio: 1; max-width: 480px; margin: 0 auto;
}
.lp-ring {
  position: absolute; inset: 0; border-radius: 50%;
  border: 1px solid rgba(245,242,236,.15);
}
.lp-ring-2 { inset: 12%; border-color: rgba(184,136,90,.22); }
.lp-ring-3 { inset: 26%; border-color: rgba(168,196,160,.18); }
.lp-ring-c {
  position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
  width: 84px; height: 84px; border-radius: 50%;
  background: linear-gradient(160deg, #b8885a 0%, #9a6d45 100%);
  display: flex; align-items: center; justify-content: center;
  font-size: 11px; font-weight: 800; color: #1e2a18; letter-spacing: .16em;
  box-shadow: 0 16px 48px rgba(184,136,90,.32);
}
.lp-node {
  position: absolute; padding: 12px 18px;
  background: rgba(245,242,236,.06); border: 1px solid rgba(245,242,236,.18);
  border-radius: 4px; font-size: 12px; color: #f5f2ec; font-weight: 500;
  backdrop-filter: blur(6px);
  white-space: nowrap;
}
.lp-node b { color: #e8d4b8; font-weight: 700; letter-spacing: .08em; font-size: 10.5px; display: block; margin-bottom: 2px; }

.lp-ch-list { display: flex; flex-direction: column; gap: 0; }
.lp-ch-item {
  padding: 26px 0; border-top: 1px solid rgba(245,242,236,.12);
  display: flex; gap: 24px; align-items: flex-start;
}
.lp-ch-item:last-child { border-bottom: 1px solid rgba(245,242,236,.12); }
.lp-ch-n {
  font-size: 11px; font-weight: 700; letter-spacing: .14em; color: #e8d4b8;
  min-width: 40px; padding-top: 6px;
}
.lp-ch-content { flex: 1; }
.lp-ch-h { font-size: 18px; font-weight: 700; color: #f5f2ec; margin-bottom: 8px; letter-spacing: -.01em; }
.lp-ch-p { font-size: 13.5px; color: rgba(245,242,236,.62); line-height: 1.8; }

/* ── How it works · large fade numbers ──────────────────── */
.lp-how-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0; margin-top: 80px; }
.lp-how-step {
  padding: 56px 36px 56px 0; border-right: 1px solid #ddd5c8; position: relative;
}
.lp-how-step:last-child { border-right: none; }
.lp-how-step:not(:first-child) { padding-left: 56px; }
.lp-how-n {
  font-size: 96px; font-weight: 800; letter-spacing: -.05em;
  color: rgba(184,136,90,.22); line-height: 1; margin-bottom: 24px;
  font-variant-numeric: tabular-nums;
}
.lp-how-h { font-size: 22px; font-weight: 700; color: #1c1a17; letter-spacing: -.02em; margin-bottom: 14px; }
.lp-how-p { font-size: 14px; color: #554f47; line-height: 1.85; }

/* ── FAQ ────────────────────────────────────────────────── */
.lp-faq-wrap { max-width: 880px; margin: 64px auto 0; }
.lp-faq-item { border-top: 1px solid #ddd5c8; }
.lp-faq-item:last-child { border-bottom: 1px solid #ddd5c8; }
.lp-faq-q {
  display: flex; justify-content: space-between; align-items: center;
  padding: 28px 0; cursor: pointer;
  font-size: 17px; font-weight: 600; color: #1c1a17; letter-spacing: -.005em;
  transition: color .18s;
}
.lp-faq-q:hover { color: #3d5a3a; }
.lp-faq-q-mark {
  font-size: 12px; color: #b8885a; font-weight: 700; letter-spacing: .14em;
  margin-right: 18px; min-width: 32px;
}
.lp-faq-toggle { font-size: 20px; color: #b8885a; font-weight: 300; transition: transform .25s; }
.lp-faq-item.open .lp-faq-toggle { transform: rotate(45deg); }
.lp-faq-a {
  font-size: 14.5px; line-height: 1.9; color: #554f47;
  padding: 0 50px 28px 50px; max-width: 700px;
}

/* ── CTA section ────────────────────────────────────────── */
.lp-cta-h {
  font-size: 52px; font-weight: 800; letter-spacing: -.035em; line-height: 1.15;
  color: #f5f2ec; margin-bottom: 28px; max-width: 760px;
}
.lp-cta-p {
  font-size: 16px; line-height: 1.85; color: rgba(245,242,236,.65);
  margin-bottom: 48px; max-width: 540px;
}
.lp-cta-btns { display: flex; gap: 14px; flex-wrap: wrap; }
.lp-cta-btn {
  display: inline-flex; align-items: center; gap: 10px;
  font-size: 13.5px; font-weight: 600; padding: 16px 32px;
  border-radius: 999px; cursor: pointer; letter-spacing: .02em;
  border: 1.5px solid; transition: all .22s;
}
.lp-cta-btn-gold {
  background: #b8885a; border-color: #b8885a; color: #1e2a18;
}
.lp-cta-btn-gold:hover { background: #c69970; border-color: #c69970; transform: translateY(-2px); }
.lp-cta-btn-line {
  background: transparent; border-color: rgba(245,242,236,.3); color: #f5f2ec;
}
.lp-cta-btn-line:hover { border-color: #f5f2ec; background: rgba(245,242,236,.06); }

/* ── Footer ─────────────────────────────────────────────── */
.lp-footer {
  background: #f5f2ec; padding: 80px 72px 32px; position: relative; overflow: hidden;
}
.lp-footer-mark {
  font-size: 22vw; font-weight: 800; letter-spacing: -.06em;
  color: rgba(28,26,23,.06); line-height: .9;
  position: absolute; bottom: -3vw; left: -1vw; right: -1vw;
  pointer-events: none; user-select: none;
}
.lp-footer-top {
  position: relative; z-index: 2;
  display: grid; grid-template-columns: 1.4fr repeat(3, 1fr); gap: 56px;
  padding-bottom: 56px; border-bottom: 1px solid #ddd5c8;
}
.lp-footer-logo { font-size: 22px; font-weight: 800; letter-spacing: -.04em; color: #1e2a18; margin-bottom: 16px; }
.lp-footer-logo .dot { color: #b8885a; }
.lp-footer-desc { font-size: 13.5px; color: #6b6358; line-height: 1.8; max-width: 320px; }
.lp-footer-col-h {
  font-size: 11px; font-weight: 700; letter-spacing: .2em;
  color: #6b6358; text-transform: uppercase; margin-bottom: 20px;
}
.lp-footer-col a {
  display: block; font-size: 13.5px; color: #3a3530;
  text-decoration: none; padding: 6px 0; cursor: pointer; transition: color .15s;
}
.lp-footer-col a:hover { color: #3d5a3a; }
.lp-footer-bot {
  position: relative; z-index: 2;
  display: flex; justify-content: space-between; align-items: center;
  padding-top: 28px; font-size: 12px; color: #6b6358; letter-spacing: .02em;
}
.lp-footer-bot a { color: #6b6358; text-decoration: none; margin-left: 22px; }
.lp-footer-bot a:hover { color: #1e2a18; }

/* ── Responsive (basic) ─────────────────────────────────── */
@media (max-width: 1024px) {
  .lp-hero { grid-template-columns: 1fr; }
  .lp-hero-panel { padding: 80px 40px; min-height: 70vh; }
  .lp-hero-badge { position: relative; top: auto; left: auto; transform: none; margin: -84px auto; }
  .lp-sec { padding: 80px 32px; }
  .lp-about-grid { grid-template-columns: 1fr; gap: 56px; }
  .lp-roles-grid { grid-template-columns: 1fr; }
  .lp-role-col { padding: 40px 0 !important; border-right: none; border-top: 1px solid #ddd5c8; }
  .lp-how-grid { grid-template-columns: 1fr; }
  .lp-how-step { padding: 36px 0 !important; border-right: none; border-top: 1px solid #ddd5c8; }
  .lp-channels { grid-template-columns: 1fr; gap: 48px; }
  .lp-footer-top { grid-template-columns: 1fr 1fr; gap: 32px; }
  .lp-h2, .lp-cta-h { font-size: 32px; }
  .lp-hero-title { font-size: 38px; }
  .lp-hdr { padding: 0 24px; }
  .lp-nav { display: none; }
}
`

const FAQ_DATA = [
  {
    q: '진료기록은 어떻게 안전하게 보관되나요?',
    a: '진료기록의 원문은 AES-256으로 암호화되어 오프체인에 저장되며, 해시값만 하이퍼레저 패브릭 원장에 기록됩니다. 보호자가 동의한 보험사만 검증 API로 접근할 수 있고, 동의가 철회되면 즉시 새 접근이 차단됩니다.',
  },
  {
    q: '보호자 동의는 어떻게 관리하나요?',
    a: '보호자 대시보드에서 진료기록별 토글 한 번으로 동의·철회가 가능합니다. 모든 동의 변경 이력은 원장에 영구 기록되어 분쟁 시 증빙으로 활용됩니다. 동의 유효기간은 12개월이며 언제든 즉시 철회됩니다.',
  },
  {
    q: '보험사는 어떻게 청구를 검증하나요?',
    a: '동의가 활성화된 청구 건에 대해 검증 API를 호출하면 해시 일치, 중복 청구 여부, 동의 상태가 자동으로 점검됩니다. 검증 1건당 1포인트가 차감되며, 결과는 verification_logs에 영구 기록됩니다.',
  },
  {
    q: '이상 신고는 어떤 절차로 처리되나요?',
    a: '보험사는 검증 후 이상이 의심되면 플랫폼에 신고할 수 있습니다. 플랫폼 관리자는 병원·보험사와 함께 해당 건을 재검토하고, 처리 결과(승인/오탐/이관)가 원장에 기록됩니다.',
  },
  {
    q: '대형 동물병원은 독립 채널을 만들 수 있나요?',
    a: '네. 대형 동물병원은 별도 비용으로 독립 패브릭 조직을 신청할 수 있으며, 전용 채널에서 자체 정책과 보험사 협약을 운영할 수 있습니다. 중소 병원은 한국수의사회 공동 채널에서 무상으로 참여합니다.',
  },
]

const NAV_LINKS = [
  { id: 'about', label: 'ABOUT' },
  { id: 'roles', label: 'SERVICES' },
  { id: 'network', label: 'NETWORK' },
  { id: 'how', label: 'HOW IT WORKS' },
  { id: 'faq', label: 'FAQ' },
]

export default function Landing({ onGoAuth }) {
  const [openFaq, setOpenFaq] = useState(null)

  const scrollTo = (id) => {
    const el = document.getElementById(id)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="lp-root">
      <style>{STYLE}</style>

      {/* ─ Header ──────────────────────────────────────────── */}
      <header className="lp-hdr">
        <div className="lp-logo" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          PETCHAIN<span className="dot">.</span>
        </div>
        <nav className="lp-nav">
          {NAV_LINKS.map(n => (
            <a key={n.id} onClick={() => scrollTo(n.id)}>{n.label}</a>
          ))}
        </nav>
        <div className="lp-hdr-cta">
          <button className="lp-btn-ghost" onClick={() => onGoAuth('login')}>로그인</button>
          <button className="lp-btn-solid" onClick={() => onGoAuth('signup')}>가입 신청</button>
        </div>
      </header>

      {/* ─ Split Hero ──────────────────────────────────────── */}
      <section className="lp-hero">
        <div className="lp-hero-panel lp-hero-left">
          <div className="lp-silhouette-l" />
          <div className="lp-hero-eyebrow">— Community · Region</div>
          <h1 className="lp-hero-title">대한민국 귀여운<br/>지도를 완성하세요</h1>
          <p className="lp-hero-desc">
            우리 동네 반려동물 이야기를 모아 지역 랭킹을 만듭니다.
            지역 주민만 추천할 수 있는 진짜 동네 커뮤니티.
          </p>
          <button className="lp-hero-cta" onClick={() => onGoAuth('signup')}>
            보호자로 시작하기 <span style={{fontSize:'14px'}}>→</span>
          </button>
        </div>

        <div className="lp-hero-panel lp-hero-right">
          <div className="lp-silhouette" />
          <div className="lp-hero-eyebrow">— Insurance · Blockchain</div>
          <h1 className="lp-hero-title">반려동물 보험 청구,<br/>더 빠르고 안전하게</h1>
          <p className="lp-hero-desc">
            진료기록은 해시로 원장에 기록되고, 보호자 동의가 있는 건만 보험사가 검증합니다.
            서류 위·변조와 중복 청구를 구조적으로 차단합니다.
          </p>
          <button className="lp-hero-cta lp-hero-cta-gold" onClick={() => scrollTo('how')}>
            작동 원리 보기 <span style={{fontSize:'14px'}}>→</span>
          </button>
        </div>

        <div className="lp-hero-badge">
          <div className="lp-hero-badge-text">PETCHAIN<span className="dot">.</span></div>
          <div className="lp-hero-badge-line" />
          <div className="lp-hero-badge-sub">Trust Network</div>
          <div className="lp-hero-badge-est" style={{marginTop:6}}>EST · 2024</div>
        </div>
      </section>

      {/* ─ About ──────────────────────────────────────────── */}
      <section id="about" className="lp-sec lp-sec-cream">
        <div className="lp-sec-inner">
          <div className="lp-about-grid">
            <div>
              <div className="lp-eyebrow">What's PETCHAIN?</div>
              <h2 className="lp-h2">반려동물 의료 신뢰망,<br/>한 번에 연결됩니다.</h2>
              <p className="lp-lead">
                병원이 등록한 진료기록은 SHA-256 해시로 변환되어 하이퍼레저 패브릭 원장에 기록됩니다.
                보호자는 단 한 번의 토글로 보험사에 동의를 부여하고, 보험사는 검증 API를 통해 위·변조 없는
                서류를 안전하게 받아봅니다. 플랫폼은 이상 신고와 채널 운영을 책임집니다.
              </p>
              <div className="lp-stat-row">
                <div className="lp-stat">
                  <div className="lp-stat-n">3<span className="acc">+</span></div>
                  <div className="lp-stat-l">참여 역할 — 보호자·병원·보험사</div>
                </div>
                <div className="lp-stat">
                  <div className="lp-stat-n">100<span className="acc">%</span></div>
                  <div className="lp-stat-l">동의 기반 데이터 흐름</div>
                </div>
                <div className="lp-stat">
                  <div className="lp-stat-n">AES<span className="acc">256</span></div>
                  <div className="lp-stat-l">진료기록 원문 암호화</div>
                </div>
                <div className="lp-stat">
                  <div className="lp-stat-n">2<span className="acc">CH</span></div>
                  <div className="lp-stat-l">공동 채널 · 독립 채널</div>
                </div>
              </div>
            </div>

            <div className="lp-role-card">
              <div>
                <div className="lp-role-card-eyebrow">— Membership Pillars</div>
                <h3 className="lp-role-card-h">하나의 원장,<br/>세 개의 역할.</h3>
                <p className="lp-role-card-p">
                  보호자 · 동물병원 · 보험사가 각자의 책임 안에서 같은 진실을 본다.
                  PetChain은 그 사이의 신뢰를 코드로 보장합니다.
                </p>
              </div>
              <div className="lp-role-card-list">
                <div className="lp-role-card-li">
                  <span className="lp-role-card-li-n">01</span>
                  <span>보호자 — 동의 토글로 모든 흐름을 통제합니다</span>
                </div>
                <div className="lp-role-card-li">
                  <span className="lp-role-card-li-n">02</span>
                  <span>동물병원 — 표준 코드로 등록 · 해시는 원장으로</span>
                </div>
                <div className="lp-role-card-li">
                  <span className="lp-role-card-li-n">03</span>
                  <span>보험사 — 동의된 청구만 검증 API로 접근</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─ Role solutions ─────────────────────────────────── */}
      <section id="roles" className="lp-sec lp-sec-cream2">
        <div className="lp-sec-inner">
          <div className="lp-eyebrow">Roles & Solutions</div>
          <h2 className="lp-h2">역할별로 설계된 정밀한 도구</h2>
          <p className="lp-lead">각 참여자가 자신의 책임 영역에 집중할 수 있도록, 별도 대시보드와 권한을 제공합니다.</p>

          <div className="lp-roles-grid" style={{marginTop:64}}>
            <div className="lp-role-col">
              <div className="lp-role-col-num">— 01 · Guardian</div>
              <div className="lp-role-col-h">보호자 대시보드</div>
              <p className="lp-role-col-p">
                반려동물 등록, 진료기록 열람, 동의 관리, 청구 상태 확인, 우리 동네 커뮤니티까지.
                모든 흐름을 보호자가 한 곳에서 통제합니다.
              </p>
              <div className="lp-role-col-features">
                <div className="lp-role-col-feature">진료기록 열람 및 월별 필터</div>
                <div className="lp-role-col-feature">동의 토글 ON/OFF — 즉시 차단</div>
                <div className="lp-role-col-feature">지역 커뮤니티 · TOP 10 랭킹</div>
                <div className="lp-role-col-feature">청구 상태 실시간 타임라인</div>
              </div>
            </div>

            <div className="lp-role-col">
              <div className="lp-role-col-num">— 02 · Hospital</div>
              <div className="lp-role-col-h">동물병원 워크플로</div>
              <p className="lp-role-col-p">
                PetChain ID 조회 한 번으로 환자 식별. 표준 진단/행위 코드로 등록하면
                SHA-256 해시가 자동 생성되어 원장에 기록됩니다.
              </p>
              <div className="lp-role-col-features">
                <div className="lp-role-col-feature">표준 코드 기반 진료기록 등록</div>
                <div className="lp-role-col-feature">recordHash 자동 생성 · 온체인</div>
                <div className="lp-role-col-feature">첨부파일 AES-256 오프체인 저장</div>
                <div className="lp-role-col-feature">크레딧 적립 — 검증 성공 1건당 +1</div>
              </div>
            </div>

            <div className="lp-role-col">
              <div className="lp-role-col-num">— 03 · Insurer</div>
              <div className="lp-role-col-h">보험사 검증 콘솔</div>
              <p className="lp-role-col-p">
                보호자 동의가 활성화된 건만 검증 API에 노출됩니다. 해시 일치·중복 청구·동의 상태가
                자동 점검되며 이상 건은 플랫폼에 신고합니다.
              </p>
              <div className="lp-role-col-features">
                <div className="lp-role-col-feature">검증 API — 1건당 1포인트 차감</div>
                <div className="lp-role-col-feature">자동 해시 · 중복 · 동의 점검</div>
                <div className="lp-role-col-feature">심사 결과 기록 · 원장 영구 보관</div>
                <div className="lp-role-col-feature">이상 신고 → 플랫폼 재검토</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─ Network / Channels ─────────────────────────────── */}
      <section id="network" className="lp-sec lp-sec-dark">
        <div className="lp-sec-inner">
          <div className="lp-eyebrow" style={{color:'#e8d4b8'}}>Network · Channels</div>
          <h2 className="lp-h2">두 개의 채널,<br/>하나의 신뢰망.</h2>
          <p className="lp-lead">
            한국수의사회 공동 채널에는 중소 동물병원과 보험사가 무상으로 참여하고,
            대형 병원은 독립 패브릭 조직으로 별도 채널을 운영합니다.
          </p>

          <div className="lp-channels">
            <div className="lp-channel-viz">
              <div className="lp-ring" />
              <div className="lp-ring lp-ring-2" />
              <div className="lp-ring lp-ring-3" />
              <div className="lp-ring-c">PETCHAIN</div>

              <div className="lp-node" style={{top:'4%', left:'50%', transform:'translateX(-50%)'}}>
                <b>ORDERER</b>한국수의사회
              </div>
              <div className="lp-node" style={{top:'40%', left:'-4%'}}>
                <b>HOSPITAL</b>중소동물병원 A
              </div>
              <div className="lp-node" style={{top:'40%', right:'-4%'}}>
                <b>INSURER</b>DB손해보험
              </div>
              <div className="lp-node" style={{bottom:'12%', left:'10%'}}>
                <b>HOSPITAL</b>중소동물병원 B·C
              </div>
              <div className="lp-node" style={{bottom:'12%', right:'10%'}}>
                <b>INSURER</b>현대해상
              </div>
              <div className="lp-node" style={{bottom:'-4%', left:'50%', transform:'translateX(-50%)'}}>
                <b>INDEPENDENT</b>대형동물병원
              </div>
            </div>

            <div className="lp-ch-list">
              <div className="lp-ch-item">
                <div className="lp-ch-n">CH · 01</div>
                <div className="lp-ch-content">
                  <div className="lp-ch-h">수의사회 공동 채널</div>
                  <p className="lp-ch-p">
                    한국수의사회가 오더러를 맡고, 소속 중소 동물병원과 보험사가 함께 참여합니다.
                    가입 비용 없이 표준화된 정책을 공유합니다.
                  </p>
                </div>
              </div>
              <div className="lp-ch-item">
                <div className="lp-ch-n">CH · 02</div>
                <div className="lp-ch-content">
                  <div className="lp-ch-h">대형병원 독립 채널</div>
                  <p className="lp-ch-p">
                    별도 비용으로 독립 패브릭 조직을 운영하는 대형 병원 전용 채널.
                    자체 정책과 보험사 협약을 직접 운영합니다.
                  </p>
                </div>
              </div>
              <div className="lp-ch-item">
                <div className="lp-ch-n">PT · 00</div>
                <div className="lp-ch-content">
                  <div className="lp-ch-h">플랫폼 거버넌스</div>
                  <p className="lp-ch-p">
                    플랫폼은 Org 승인, 포인트 발행, 이상 신고 처리, 채널 운영을 책임집니다.
                    모든 처리는 audit_logs에 기록됩니다.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─ How it works ───────────────────────────────────── */}
      <section id="how" className="lp-sec lp-sec-cream">
        <div className="lp-sec-inner">
          <div className="lp-eyebrow">How It Works</div>
          <h2 className="lp-h2">세 단계로 끝나는<br/>안전한 청구 흐름</h2>
          <p className="lp-lead">기록은 병원에서, 동의는 보호자에서, 검증은 보험사에서. 각 단계는 분리되고 원장에 기록됩니다.</p>

          <div className="lp-how-grid">
            <div className="lp-how-step">
              <div className="lp-how-n">01</div>
              <div className="lp-how-h">병원이 기록합니다</div>
              <p className="lp-how-p">
                동물병원이 진료 후 표준 진단·행위 코드로 기록을 등록하면, 원문은 AES-256 암호화 저장되고
                SHA-256 해시만 하이퍼레저 패브릭 원장에 올라갑니다.
              </p>
            </div>
            <div className="lp-how-step">
              <div className="lp-how-n">02</div>
              <div className="lp-how-h">보호자가 동의합니다</div>
              <p className="lp-how-p">
                보호자 대시보드에서 청구할 진료기록에 동의 토글을 ON 하면, 보험사에게 검증 API 접근권이 부여됩니다.
                동의 변경은 즉시 원장에 기록됩니다.
              </p>
            </div>
            <div className="lp-how-step">
              <div className="lp-how-n">03</div>
              <div className="lp-how-h">보험사가 검증합니다</div>
              <p className="lp-how-p">
                보험사는 검증 API로 해시 일치, 중복 청구, 동의 상태를 자동 점검하고
                내부 심사 결과(승인/반려/이상 신고)를 원장에 기록합니다.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─ FAQ ────────────────────────────────────────────── */}
      <section id="faq" className="lp-sec lp-sec-cream2">
        <div className="lp-sec-inner" style={{maxWidth:1100}}>
          <div style={{textAlign:'center'}}>
            <div className="lp-eyebrow" style={{justifyContent:'center'}}>Frequently Asked</div>
            <h2 className="lp-h2" style={{margin:'0 auto 22px'}}>자주 묻는 질문</h2>
            <p className="lp-lead" style={{margin:'0 auto'}}>
              PetChain의 동작 원리, 보안, 거버넌스에 대해 자주 물어보시는 내용을 정리했습니다.
            </p>
          </div>

          <div className="lp-faq-wrap">
            {FAQ_DATA.map((f, i) => (
              <div key={i} className={`lp-faq-item${openFaq === i ? ' open' : ''}`}>
                <div className="lp-faq-q" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                  <span style={{display:'flex', alignItems:'center'}}>
                    <span className="lp-faq-q-mark">{String(i+1).padStart(2,'0')}</span>
                    {f.q}
                  </span>
                  <span className="lp-faq-toggle">+</span>
                </div>
                {openFaq === i && <div className="lp-faq-a">{f.a}</div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─ CTA ────────────────────────────────────────────── */}
      <section className="lp-sec lp-sec-dark">
        <div className="lp-sec-inner">
          <div className="lp-eyebrow" style={{color:'#e8d4b8'}}>Join PetChain</div>
          <h2 className="lp-cta-h">신뢰는 약속이 아닌<br/>합의된 기록입니다.</h2>
          <p className="lp-cta-p">
            보호자, 동물병원, 보험사 — 당신의 역할에 맞는 입구로 들어오세요.
            가입 후 1분이면 첫 진료기록부터 동의 흐름까지 체험할 수 있습니다.
          </p>
          <div className="lp-cta-btns">
            <button className="lp-cta-btn lp-cta-btn-gold" onClick={() => onGoAuth('signup')}>
              보호자로 시작 <span>→</span>
            </button>
            <button className="lp-cta-btn lp-cta-btn-line" onClick={() => onGoAuth('signup')}>
              병원 등록 신청
            </button>
            <button className="lp-cta-btn lp-cta-btn-line" onClick={() => onGoAuth('login')}>
              로그인
            </button>
          </div>
        </div>
      </section>

      {/* ─ Footer ─────────────────────────────────────────── */}
      <footer className="lp-footer">
        <div className="lp-footer-top">
          <div>
            <div className="lp-footer-logo">PETCHAIN<span className="dot">.</span></div>
            <p className="lp-footer-desc">
              하이퍼레저 패브릭 기반 반려동물 의료 신뢰망.
              보호자·병원·보험사가 동의 위에서 합의한 기록을 공유합니다.
            </p>
          </div>
          <div className="lp-footer-col">
            <div className="lp-footer-col-h">Service</div>
            <a onClick={() => onGoAuth('signup')}>보호자 가입</a>
            <a onClick={() => onGoAuth('signup')}>병원 등록</a>
            <a href="/admin">관리자 로그인</a>
          </div>
          <div className="lp-footer-col">
            <div className="lp-footer-col-h">Network</div>
            <a onClick={() => document.getElementById('network')?.scrollIntoView({behavior:'smooth'})}>수의사회 채널</a>
            <a onClick={() => document.getElementById('network')?.scrollIntoView({behavior:'smooth'})}>독립 채널</a>
            <a onClick={() => document.getElementById('how')?.scrollIntoView({behavior:'smooth'})}>작동 원리</a>
          </div>
          <div className="lp-footer-col">
            <div className="lp-footer-col-h">Contact</div>
            <a>partners@petchain.io</a>
            <a>02-0000-0000</a>
            <a>서울특별시</a>
          </div>
        </div>
        <div className="lp-footer-bot">
          <div>© 2024 PetChain Inc. All rights reserved.</div>
          <div>
            <a>Privacy</a>
            <a>Terms</a>
            <a>Security</a>
          </div>
        </div>
        <div className="lp-footer-mark">PETCHAIN.</div>
      </footer>
    </div>
  )
}
'''

os.makedirs(os.path.dirname(OUT), exist_ok=True)
with open(OUT, 'w', encoding='utf-8') as f:
    f.write(content)

print(f"Wrote {OUT} ({len(content)} bytes)")
