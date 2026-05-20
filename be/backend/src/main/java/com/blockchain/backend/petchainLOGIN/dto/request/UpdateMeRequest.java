package com.blockchain.backend.petchainLOGIN.dto.request;

import lombok.Getter;
import lombok.Setter;

// 회원 본인 프로필 수정 요청. 전달된 필드만 갱신한다(전부 선택값).
@Getter
@Setter
public class UpdateMeRequest {
    private String name;
    private String phone;
    private String email;
    private String region;  // 보호자 거주지역(주소)
}
