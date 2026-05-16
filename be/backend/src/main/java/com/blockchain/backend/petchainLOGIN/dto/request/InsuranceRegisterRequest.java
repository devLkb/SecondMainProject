package com.blockchain.backend.petchainLOGIN.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

// 보험사 등록 요청 (관리자 승인 필요)
@Getter @Setter
public class InsuranceRegisterRequest {

    @NotBlank
    private String name;

    @NotBlank
    private String businessNumber;

    @NotBlank
    private String fabricOrgId;  // 보험사 Org ID (login_id로 사용)

    @NotBlank
    @Email
    private String adminEmail;

    @NotBlank
    @Size(min = 8)
    private String password;
}
