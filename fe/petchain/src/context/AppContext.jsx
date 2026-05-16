/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState } from 'react'

export function generatePetId(existingIds = []) {
  const existing = new Set(existingIds)
  let id
  do {
    const letter = String.fromCharCode(65 + Math.floor(Math.random() * 26))
    const digits = String(Math.floor(Math.random() * 100000000)).padStart(8, '0')
    id = `${letter}-${digits}`
  } while (existing.has(id))
  return id
}

const initState = {
  page: 'landing',
  authMode: 'login',
  role: null,

  // 반려동물 목록
  pets: [
    { petId: 'B-20240101', name: '초코', species: '강아지', breed: '말티즈', birthYear: 2021, chipNo: '', insurer: 'DB손해보험' },
    { petId: 'C-30481029', name: '몽이', species: '강아지', breed: '포메라니안', birthYear: 2020, chipNo: '', insurer: 'DB손해보험' },
  ],

  // 의료기록
  medicalRecords: [
    { id: 'REC-2024-0041', petId: 'B-20240101', petName: '초코', date: '2024.05.08', diseases: ['KC-001 · 피부염'], treatments: ['VA-032 · 약물 처방'], cost: 48000, memo: '경미한 피부 발적', onChain: true },
    { id: 'REC-2024-0040', petId: 'B-20240101', petName: '초코', date: '2024.04.15', diseases: ['KC-055 · 관절염'], treatments: ['VA-011 · X-ray 촬영'], cost: 120000, memo: '관절 X-ray, 이상 없음', onChain: true },
    { id: 'REC-2024-0039', petId: 'C-30481029', petName: '몽이', date: '2024.05.10', diseases: ['KC-042 · 골절'], treatments: ['VA-025 · 수술'], cost: 320000, memo: '우측 전완 골절 수술', onChain: true },
  ],

  // 동의 상태 — Guardian이 토글하면 Hospital/Insurance 뷰에 즉시 반영
  consents: {
    'REC-2024-0041': {
      recordId: 'REC-2024-0041',
      consentId: 'CON-001',
      petId: 'B-20240101',
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
      petId: 'B-20240101',
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
      petId: 'C-30481029',
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

  const addPet = (pet) => {
    setState(s => ({ ...s, pets: [...s.pets, pet] }))
  }

  const addMedicalRecord = (record) => {
    setState(s => {
      const idx = s.medicalRecords.length + 1
      const newId = `REC-2024-${String(idx).padStart(4, '0')}`
      const newRecord = { ...record, id: newId, onChain: true }
      const newConsentId = `CON-${String(Object.keys(s.consents).length + 1).padStart(3, '0')}`
      const newConsent = {
        recordId: newId,
        consentId: newConsentId,
        petId: record.petId,
        status: 'pending',
        pet: record.petName,
        hospital: '행복동물병원',
        insurerName: record.insurer || 'DB손해보험',
        insurerId: 'ins-001',
        disease: record.diseases[0] || '',
        treatment: record.treatments[0] || '',
        cost: record.cost,
        date: record.date,
      }
      return {
        ...s,
        medicalRecords: [...s.medicalRecords, newRecord],
        consents: { ...s.consents, [newId]: newConsent },
        creditN: s.creditN + 1,
        txLog: [
          { time: new Date().toLocaleTimeString(), type: '기록', org: 'hosp-001', desc: `${newId} — SHA-256 원장 기록` },
          ...s.txLog,
        ],
      }
    })
  }

  return (
    <AppContext.Provider value={{ state, setState, update, toggleConsent, addPet, addMedicalRecord }}>
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
      { id: 'records', lbl: '진료기록 확인' },
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
