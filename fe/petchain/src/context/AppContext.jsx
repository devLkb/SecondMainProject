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

  pets: [],
  medicalRecords: [],
  consents: {},

  creditN: 0,
  txLog: [],

  ptBalance: 0,
  usedPt: 0,
  verifyCount: 0,
  ptLog: [],
  verifiedRecords: [],
  flaggedRecords: [],

  orgs: [],

  userRegion: null,
  userInsurers: [],

  posts: [],
  votedPosts: [],
  todayVoted: null,
  likedPosts: [],
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
          status: s.consents[recordId]?.status === 'active' ? 'revoked' : 'active',
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
      const newId = `REC-${new Date().getFullYear()}-${String(idx).padStart(4, '0')}`
      const newRecord = { ...record, id: newId, onChain: true }
      const newConsentId = `CON-${String(Object.keys(s.consents).length + 1).padStart(3, '0')}`
      const hospitalName = localStorage.getItem('hospitalName') || '동물병원'
      const newConsent = {
        recordId: newId,
        consentId: newConsentId,
        petId: record.petId,
        status: 'pending',
        pet: record.petName,
        hospital: hospitalName,
        insurerName: record.insurer || '',
        insurerId: record.insurerId || '',
        disease: record.diseases?.[0] || '',
        treatment: record.treatments?.[0] || '',
        cost: record.cost,
        date: record.date,
      }
      return {
        ...s,
        medicalRecords: [...s.medicalRecords, newRecord],
        consents: { ...s.consents, [newId]: newConsent },
        creditN: s.creditN + 1,
        txLog: [
          { time: new Date().toLocaleTimeString(), type: '기록', desc: `${newId} — SHA-256 원장 기록` },
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
    name: '보호자', icon: '🐾', label: '보호자',
    bg: '#e0e7ff', color: '#3730a3',
    tabs: [
      { id: 'home',      lbl: '내 반려동물' },
      { id: 'consent',   lbl: '동의 관리' },
      { id: 'status',    lbl: '청구 상태' },
      { id: 'records',   lbl: '진료기록 확인' },
      { id: 'community', lbl: '커뮤니티' },
      { id: 'ranking',   lbl: '지역 랭킹' },
      { id: 'myinfo',    lbl: '내 정보' },
    ],
  },
  hospital: {
    name: '동물병원', icon: '🏥', label: '병원',
    bg: '#fff7ed', color: '#9a3412',
    tabs: [
      { id: 'reg',    lbl: '진료기록 등록' },
      { id: 'credit', lbl: '크레딧 현황' },
      { id: 'log',    lbl: '감사 로그' },
      { id: 'org',    lbl: '조직 정보' },
    ],
  },
  insurance: {
    name: '보험사', icon: '🛡️', label: '보험사',
    bg: '#f0f9ff', color: '#0369a1',
    tabs: [
      { id: 'list',    lbl: '검증 목록' },
      { id: 'result',  lbl: '검증 결과' },
      { id: 'point',   lbl: '포인트 현황' },
      { id: 'channel', lbl: '채널 현황' },
    ],
  },
}
