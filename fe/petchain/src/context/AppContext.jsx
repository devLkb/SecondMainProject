/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState } from 'react'

const initState = {
  page: 'landing',
  authMode: 'login',
  role: null,

  // 동의 상태 — Guardian이 토글하면 Hospital/Insurance 뷰에 즉시 반영
  consents: {
    'REC-2024-0041': {
      recordId: 'REC-2024-0041',
      consentId: 'CON-001',
      status: 'active',        // 'active' | 'revoked' | 'pending'
      pet: '초코',
      hospital: '행복동물병원',
      insurerName: 'DB손해보험',
      insurerId: 'ins-001',
      disease: 'KC-001 · 피부염',
      treatment: 'VA-032 · 약물 처방',
      cost: 48000,
      date: '2024.05.08',
    },
    'REC-2024-0040': {
      recordId: 'REC-2024-0040',
      consentId: 'CON-002',
      status: 'revoked',
      pet: '초코',
      hospital: '행복동물병원',
      insurerName: 'DB손해보험',
      insurerId: 'ins-001',
      disease: 'KC-055 · 관절염',
      treatment: 'VA-011 · X-ray 촬영',
      cost: 120000,
      date: '2024.04.15',
    },
    'REC-2024-0039': {
      recordId: 'REC-2024-0039',
      consentId: 'CON-003',
      status: 'pending',
      pet: '몽이',
      hospital: '행복동물병원',
      insurerName: 'DB손해보험',
      insurerId: 'ins-001',
      disease: 'KC-042 · 골절',
      treatment: 'VA-025 · 수술',
      cost: 320000,
      date: '2024.05.10',
    },
  },

  // 병원 상태
  creditN: 124,
  txLog: [],

  // 보험사 상태
  ptBalance: 850,
  usedPt: 0,
  verifyCount: 0,
  ptLog: [],
  verifiedRecords: [],
  flaggedRecords: [], 
  // 플랫폼 상태
  orgs: [
    { id: 'hosp-001', name: '행복동물병원', type: '병원',  fabricOrg: 'HospitalA',  date: '2024.01.10', status: 'active' },
    { id: 'ins-001',  name: 'DB손해보험',   type: '보험사', fabricOrg: 'InsuranceA', date: '2024.01.15', status: 'active' },
    { id: 'ins-002',  name: '현대해상',     type: '보험사', fabricOrg: 'InsuranceB', date: '2024.03.01', status: 'pending' },
  ],
}

export const AppContext = createContext(null)

export function AppProvider({ children }) {
  const [state, setState] = useState(initState)

  const update = (patch) => setState(s => ({ ...s, ...patch }))

  const toggleConsent = (recordId) => {
    setState(s => ({
      ...s,
      consents: {
        ...s.consents,
        [recordId]: {
          ...s.consents[recordId],
          status: s.consents[recordId].status === 'active' ? 'revoked' : 'active',
        },
      },
    }))
  }

  return (
    <AppContext.Provider value={{ state, setState, update, toggleConsent }}>
      {children}
    </AppContext.Provider>
  )
}

export const useApp = () => useContext(AppContext)

export const ROLE_META = {
  guardian: {
    name: '홍길동', icon: '🐾', label: '보호자',
    bg: '#e0e7ff', color: '#3730a3',
    tabs: [
      { id: 'home',    lbl: '내 반려동물' },
      { id: 'consent', lbl: '동의 관리' },
      { id: 'status',  lbl: '청구 상태' },
    ],
  },
  hospital: {
    name: '행복동물병원', icon: '🏥', label: '병원',
    bg: '#fff7ed', color: '#9a3412',
    tabs: [
      { id: 'reg',    lbl: '진료기록 등록' },
      { id: 'credit', lbl: '크레딧 현황' },
      { id: 'log',    lbl: '감사 로그' },
    ],
  },
  insurance: {
    name: 'DB손해보험', icon: '🛡️', label: '보험사',
    bg: '#f0f9ff', color: '#0369a1',
    tabs: [
      { id: 'list',   lbl: '검증 목록' },
      { id: 'result', lbl: '검증 결과' },
      { id: 'point',  lbl: '포인트 현황' },
    ],
  },
}
