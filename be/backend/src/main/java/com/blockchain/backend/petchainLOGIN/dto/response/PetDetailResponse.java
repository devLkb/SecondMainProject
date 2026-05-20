package com.blockchain.backend.petchainLOGIN.dto.response;

import java.util.List;

// 병원의 환자 조회용 응답: 펫 기본 정보 + 진료기록 목록.
// 프론트는 검색·표시 모두 펫번호(A-xxxxxxxx)를 쓰므로 petId/id 자리에 펫번호 문자열을 내려준다.
public record PetDetailResponse(
        String id,
        String petId,
        String petNumber,
        String name,
        String species,
        String breed,
        Integer birthYear,
        String insurer,
        List<RecordItem> records
) {
    // 병원 대시보드의 이전 진료기록 표/상세 모달이 그대로 쓰는 형태.
    public record RecordItem(
            String id,
            String date,
            String petName,
            List<String> diseases,
            List<String> treatments,
            Integer cost,
            String memo,
            boolean onChain
    ) {
    }
}
