package com.blockchain.backend.chain;

public interface PetChainLedger {

    boolean isEnabled();

    /** 진료기록 해시 등록 */
    String registerRecord(String recordId, String hospitalId, String recordHash,
                          String attachmentHashesJson, String createdAtIso);

    /** 보호자 동의 등록 */
    String registerConsent(String consentId, String recordId, String insurerId,
                           String guardianHashedId, String validUntilIso, String createdAtIso);

    /** 동의 철회 */
    String revokeConsent(String consentId, String revokedAtIso, String reason);

    /** 제출 생성 (동의·해시·병원 검증 포함) */
    String createSubmissionWithConsent(String submissionId, String recordId, String consentId,
                                       String hospitalId, String insurerId,
                                       String recordHashAtSubmit, String createdAtIso);

    /** 검증 실패/차단 기록 */
    String recordVerification(String verificationId, String submissionId, String status,
                              String failureReasonsJson, String recordHashAtVerify,
                              String consentSnapshotHash, String verifiedAtIso, String auditLogId);

    /** 검증 성공 + 포인트 차감 + 크레딧 적립 (원자 처리) */
    String processSuccessfulVerification(String verificationId, String submissionId,
                                         String recordHashAtVerify, String consentSnapshotHash,
                                         String verifiedAtIso, String auditLogId, String idempotencyKey);

    /** 관리자 포인트 발행 (IssuePoints) */
    String issuePoints(String insurerId, String amount, String issuedBy, String issuedAtIso);

    /** 결제 완료 후 보험사 포인트 충전 */
    String confirmPointPurchase(String purchaseId, String insurerId, String amount,
                                String paymentId, String orderId, String paidAtIso,
                                String purchasedBy, String idempotencyKey);

    /** 보험사 포인트 잔액 조회 (체인 집계) */
    long getPointBalance(String insurerId);
}
