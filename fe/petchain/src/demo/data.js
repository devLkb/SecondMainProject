/**
 * 데모 모드 시드 데이터.
 *
 * 실제 백엔드 응답 스키마(BE DTO)를 그대로 흉내 낸다. 화면 코드가 목 데이터를
 * 위해 분기하지 않도록, 필드 이름·상태값 표기(ACTIVE/PASSED 등)를 실제와 맞췄다.
 */

export const ACCOUNTS = {
  guardian: {
    role: 'guardian',
    memberType: 'USER',
    userId: 1,
    memberNumber: 'USR-2026-0001',
    loginId: 'hong@petchain.demo',
    name: '홍길동',
    email: 'hong@petchain.demo',
    phone: '010-1234-5678',
    region: '경기도',
  },
  hospital: {
    role: 'hospital',
    memberType: 'HOSPITAL',
    userId: 2,
    memberNumber: 'hosp-001',
    loginId: 'hosp-001',
    name: '행복동물병원',
    orgName: '행복동물병원',
    email: 'admin@happyvet.demo',
    phone: '031-555-0100',
    region: '경기도',
  },
  insurance: {
    role: 'insurance',
    memberType: 'INSURANCE',
    userId: 3,
    memberNumber: 'ins-002',
    loginId: 'ins-002',
    name: 'DB손해보험',
    orgName: 'DB손해보험',
    email: 'claim@db-ins.demo',
    phone: '02-777-0200',
    region: '서울특별시',
  },
  platform: {
    role: 'platform',
    memberType: 'PLATFORM',
    userId: 4,
    memberNumber: 'platform-001',
    loginId: 'platform-admin',
    name: '플랫폼 관리자',
    email: 'admin@petchain.demo',
    phone: '02-000-0000',
    region: '서울특별시',
  },
}

/** loginId 로 데모 계정 추론 — 비밀번호는 검사하지 않는다(데모). */
export function resolveAccount(loginId = '') {
  const id = String(loginId).toLowerCase()
  if (id.includes('platform') || id.includes('admin')) return ACCOUNTS.platform
  if (id.includes('ins')) return ACCOUNTS.insurance
  if (id.includes('hosp') || id.includes('vet')) return ACCOUNTS.hospital
  return ACCOUNTS.guardian
}

const hash = (seed) => `sha256:${seed.repeat(64).slice(0, 64)}`

export function seed() {
  const pets = [
    { id: 1, petNumber: 'A-10482913', name: '초코', species: 'dog', breed: '토이푸들', birthYear: 2020, gender: 'M', isNeutered: true, insurer: 'DB손해보험' },
    { id: 2, petNumber: 'B-77120054', name: '나비', species: 'cat', breed: '코리안숏헤어', birthYear: 2019, gender: 'F', isNeutered: true, insurer: '삼성화재해상보험' },
    { id: 3, petNumber: 'C-30915577', name: '보리', species: 'dog', breed: '웰시코기', birthYear: 2022, gender: 'M', isNeutered: false, insurer: '' },
  ]

  const records = [
    { recordId: 'REC-2026-0001', petId: 'A-10482913', petName: '초코', hospitalId: 'hosp-001', hospitalName: '행복동물병원', treatmentDate: '2026-03-14', diagnosisCodes: ['슬개골 탈구 2기'], treatmentCodes: ['정형외과 수술', '입원 3일'], treatmentCost: 1_850_000, memo: '우측 후지 슬개골 정복술. 경과 양호.', recordHash: hash('a') },
    { recordId: 'REC-2026-0002', petId: 'A-10482913', petName: '초코', hospitalId: 'hosp-001', hospitalName: '행복동물병원', treatmentDate: '2026-05-02', diagnosisCodes: ['외이염'], treatmentCodes: ['약물 처치'], treatmentCost: 86_000, memo: '외이도 세척 및 점이제 처방.', recordHash: hash('b') },
    { recordId: 'REC-2026-0003', petId: 'B-77120054', petName: '나비', hospitalId: 'hosp-001', hospitalName: '행복동물병원', treatmentDate: '2026-06-21', diagnosisCodes: ['만성 신부전 초기'], treatmentCodes: ['혈액검사', '수액 처치'], treatmentCost: 320_000, memo: 'BUN/CREA 상승. 처방식 전환 권고.', recordHash: hash('c') },
    { recordId: 'REC-2026-0004', petId: 'B-77120054', petName: '나비', hospitalId: 'hosp-001', hospitalName: '행복동물병원', treatmentDate: '2026-07-09', diagnosisCodes: ['치주질환 3기'], treatmentCodes: ['스케일링', '발치 2본'], treatmentCost: 540_000, memo: '전신마취 하 스케일링. 이상 없음.', recordHash: hash('d') },
    { recordId: 'REC-2026-0005', petId: 'C-30915577', petName: '보리', hospitalId: 'hosp-001', hospitalName: '행복동물병원', treatmentDate: '2026-07-28', diagnosisCodes: ['급성 위장염'], treatmentCodes: ['수액 처치', '입원 1일'], treatmentCost: 275_000, memo: '이물 섭취 의심. 방사선상 특이소견 없음.', recordHash: hash('e') },
  ]

  const consents = [
    { consentId: 'CON-2026-0001', recordId: 'REC-2026-0001', petId: 'A-10482913', petName: '초코', guardianId: '1', hospitalId: 'hosp-001', hospitalName: '행복동물병원', insurerId: 'ins-002', insurerName: 'DB손해보험', status: 'ACTIVE', disease: '슬개골 탈구 2기', treatment: '정형외과 수술', cost: 1_850_000, date: '2026-03-14', recordHash: hash('a') },
    { consentId: 'CON-2026-0002', recordId: 'REC-2026-0002', petId: 'A-10482913', petName: '초코', guardianId: '1', hospitalId: 'hosp-001', hospitalName: '행복동물병원', insurerId: 'ins-002', insurerName: 'DB손해보험', status: 'ACTIVE', disease: '외이염', treatment: '약물 처치', cost: 86_000, date: '2026-05-02', recordHash: hash('b') },
    { consentId: 'CON-2026-0003', recordId: 'REC-2026-0003', petId: 'B-77120054', petName: '나비', guardianId: '1', hospitalId: 'hosp-001', hospitalName: '행복동물병원', insurerId: 'ins-001', insurerName: '삼성화재해상보험', status: 'REVOKED', disease: '만성 신부전 초기', treatment: '혈액검사', cost: 320_000, date: '2026-06-21', recordHash: hash('c') },
    { consentId: 'CON-2026-0004', recordId: 'REC-2026-0004', petId: 'B-77120054', petName: '나비', guardianId: '1', hospitalId: 'hosp-001', hospitalName: '행복동물병원', insurerId: 'ins-002', insurerName: 'DB손해보험', status: 'PENDING', disease: '치주질환 3기', treatment: '스케일링', cost: 540_000, date: '2026-07-09', recordHash: hash('d') },
    { consentId: 'CON-2026-0005', recordId: 'REC-2026-0005', petId: 'C-30915577', petName: '보리', guardianId: '1', hospitalId: 'hosp-001', hospitalName: '행복동물병원', insurerId: 'ins-002', insurerName: 'DB손해보험', status: 'ACTIVE', disease: '급성 위장염', treatment: '수액 처치', cost: 275_000, date: '2026-07-28', recordHash: hash('e') },
  ]

  const posts = [
    { id: 101, authorId: 1, authorName: '홍길동', authorRegion: '경기도', petName: '초코', petBreed: '토이푸들', content: '슬개골 수술하고 재활 8주차예요. 이제 계단도 혼자 올라갑니다 🐕 같은 수술 앞두신 분들 너무 걱정 마세요!', likeCount: 128, liked: false, commentCount: 2, createdAt: '2026-07-30T10:12:00', imageKeys: [] },
    { id: 102, authorId: 7, authorName: '김보호', authorRegion: '경기도', petName: '두부', petBreed: '비숑프리제', content: '동네 병원에서 진료비 영수증이 바로 블록체인에 올라가니까 보험 청구가 진짜 편해졌어요. 서류 떼러 안 가도 됨.', likeCount: 94, liked: false, commentCount: 1, createdAt: '2026-07-28T19:40:00', imageKeys: [] },
    { id: 103, authorId: 8, authorName: '이집사', authorRegion: '서울특별시', petName: '나비', petBreed: '코리안숏헤어', content: '고양이 신부전 초기 판정 받았습니다. 처방식 추천 좀 부탁드려요 🥲', likeCount: 156, liked: false, commentCount: 3, createdAt: '2026-07-25T08:05:00', imageKeys: [] },
    { id: 104, authorId: 9, authorName: '박댕댕', authorRegion: '부산광역시', petName: '해피', petBreed: '진돗개', content: '해운대 산책 코스 공유합니다. 아침 7시가 제일 한산해요!', likeCount: 77, liked: false, commentCount: 0, createdAt: '2026-07-22T07:30:00', imageKeys: [] },
    { id: 105, authorId: 10, authorName: '최멍멍', authorRegion: '경기도', petName: '몽이', petBreed: '포메라니안', content: '스케일링 견적 비교해봤는데 병원마다 편차가 크네요. 다들 얼마쯤 내셨나요?', likeCount: 61, liked: false, commentCount: 1, createdAt: '2026-07-19T13:22:00', imageKeys: [] },
    { id: 106, authorId: 11, authorName: '정냥이', authorRegion: '대구광역시', petName: '루비', petBreed: '먼치킨', content: '보험 청구 3건 모두 자동 승인됐어요. 동의만 눌러두면 끝이라 편합니다.', likeCount: 88, liked: false, commentCount: 0, createdAt: '2026-07-15T21:10:00', imageKeys: [] },
  ]

  const comments = {
    101: [
      { id: 1001, postId: 101, authorId: 8, authorName: '이집사', content: '와 축하드려요! 재활 어디서 하셨어요?', likeCount: 12, liked: false, replies: [{ id: 1002, authorId: 1, authorName: '홍길동', content: '행복동물병원 재활실에서 했어요 :)', likeCount: 3, liked: false }] },
      { id: 1003, postId: 101, authorId: 10, authorName: '최멍멍', content: '수술비는 보험으로 얼마나 커버되셨나요?', likeCount: 5, liked: false, replies: [] },
    ],
    102: [{ id: 1004, postId: 102, authorId: 1, authorName: '홍길동', content: '진짜 이거 하나로 청구 스트레스가 없어졌어요', likeCount: 8, liked: false, replies: [] }],
    103: [
      { id: 1005, postId: 103, authorId: 1, authorName: '홍길동', content: '저희도 초기예요. 처방식 + 수분 섭취가 제일 중요하대요', likeCount: 21, liked: false, replies: [] },
      { id: 1006, postId: 103, authorId: 9, authorName: '박댕댕', content: '힘내세요!', likeCount: 4, liked: false, replies: [] },
      { id: 1007, postId: 103, authorId: 11, authorName: '정냥이', content: '정기 혈액검사 꼭 챙기세요', likeCount: 9, liked: false, replies: [] },
    ],
    105: [{ id: 1008, postId: 105, authorId: 7, authorName: '김보호', content: '저희는 55만원 정도 나왔어요', likeCount: 2, liked: false, replies: [] }],
  }

  const pointTransactions = [
    { transactionId: 'PT-2026-0007', transactionType: 'issue', amount: 500, relatedRecordId: null, reason: '포인트 구매 확정 (ord_20260701)', createdAt: '2026-07-01T09:00:00', balanceAfter: 620 },
    { transactionId: 'PT-2026-0008', transactionType: 'deduct', amount: 1, relatedRecordId: 'REC-2026-0001', reason: '검증 성공 — 포인트 차감', createdAt: '2026-07-03T11:24:00', balanceAfter: 619 },
    { transactionId: 'PT-2026-0009', transactionType: 'deduct', amount: 1, relatedRecordId: 'REC-2026-0002', reason: '검증 성공 — 포인트 차감', createdAt: '2026-07-11T15:02:00', balanceAfter: 618 },
  ]

  const creditTransactions = [
    { transactionId: 'CR-2026-0011', transactionType: 'accrual', amount: 1, relatedRecordId: 'REC-2026-0001', reason: '검증 API 성공', createdAt: '2026-07-03T11:24:00' },
    { transactionId: 'CR-2026-0012', transactionType: 'accrual', amount: 1, relatedRecordId: 'REC-2026-0002', reason: '검증 API 성공', createdAt: '2026-07-11T15:02:00' },
  ]

  const flags = [
    { flagId: 'FLG-2026-0003', recordId: 'REC-2026-0004', verificationId: 'VER-20260709001', pet: '나비', hospital: '행복동물병원', reasonCode: 'COST_ANOMALY', reasonLabel: '진료비 이상', note: '동일 시술 평균 대비 2.4배', status: 'PENDING', flaggedAt: '2026-07-12T14:05:00', resolveCode: null, resolveNote: null, resolvedAt: null },
    { flagId: 'FLG-2026-0002', recordId: 'REC-2026-0002', verificationId: 'VER-20260502001', pet: '초코', hospital: '행복동물병원', reasonCode: 'DUPLICATE_CLAIM', reasonLabel: '중복 청구 의심', note: '', status: 'RESOLVED', flaggedAt: '2026-06-30T09:15:00', resolveCode: 'FALSE_ALARM', resolveNote: '재확인 결과 별건 진료', resolvedAt: '2026-07-02T16:20:00' },
  ]

  const orgs = [
    { id: 'hosp-001', type: '병원', name: '행복동물병원', fabricOrg: 'HospitalOrgMSP', date: '2026-01-12', status: 'active' },
    { id: 'hosp-002', type: '병원', name: '연세동물의료센터', fabricOrg: 'HospitalOrgMSP', date: '2026-02-03', status: 'active' },
    { id: 'hosp-003', type: '병원', name: '푸른숲동물병원', fabricOrg: 'HospitalOrgMSP', date: '2026-08-01', status: 'pending' },
    { id: 'ins-001', type: '보험사', name: '삼성화재해상보험', fabricOrg: 'InsuranceAOrgMSP', date: '2026-01-05', status: 'active' },
    { id: 'ins-002', type: '보험사', name: 'DB손해보험', fabricOrg: 'InsuranceBOrgMSP', date: '2026-01-05', status: 'active' },
  ]

  return {
    pets,
    records,
    consents,
    posts,
    comments,
    pointTransactions,
    creditTransactions,
    flags,
    orgs,
    pointBalance: 618,
    creditBalance: 2,
    verifyCount: 2,
    users: JSON.parse(JSON.stringify(ACCOUNTS)),
    seq: { pet: 4, record: 6, consent: 6, post: 200, comment: 2000, submission: 1, verification: 1, flag: 4 },
  }
}
