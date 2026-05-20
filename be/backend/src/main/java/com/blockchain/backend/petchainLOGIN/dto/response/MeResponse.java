package com.blockchain.backend.petchainLOGIN.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;
import lombok.Getter;

// 로그인한 회원 본인의 프로필 정보. 역할별로 채워지는 필드가 다르다.
@Getter
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class MeResponse {
    private Long userId;
    private String memberType;   // user | hospital | insurance | platform
    private String memberNumber;
    private String name;
    private String email;
    private String phone;
    private String region;       // 보호자 거주지역(주소)
    private String orgName;      // 병원명 / 보험사명
    private String fabricOrgId;  // 병원·보험사의 Fabric Org ID
}
