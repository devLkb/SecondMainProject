package com.blockchain.backend.petchainAPI.dto.admin;

// 플랫폼 관리자 대시보드(Org 관리·모니터링)용 응답 DTO.
public final class PlatformDtos {
    private PlatformDtos() {
    }

    // 프론트 Org 테이블이 그대로 렌더링하는 형태: id/name/type/fabricOrg/date/status
    // balance/usedPoints 는 보험사 행에만 채워진다(병원은 null).
    public record OrgResponse(
            String id,          // 회원번호(H-xxxxxxxx | P-xxxxxxxx) — 승인 시 식별자로 사용
            String name,
            String type,        // 병원 | 보험사
            String fabricOrg,
            String date,        // 등록일 (yyyy-MM-dd)
            String status,      // active | pending
            Integer balance,    // 보험사 잔여 포인트 (병원은 null)
            Integer usedPoints  // 보험사 소모 포인트 (병원은 null)
    ) {
    }

    public record MonitorResponse(
            int totalOrgs,
            int activeOrgs,
            int pendingOrgs,
            long verifyCount,
            long totalFlags,
            long pendingFlags,
            int insurerPointBalance
    ) {
    }
}
