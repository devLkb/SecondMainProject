package com.blockchain.backend.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

// 병원 등록 요청 (관리자 승인 필요)
@Getter @Setter
public class HospitalRegisterRequest {

    @NotBlank
    private String name;

    @NotBlank
    private String businessNumber;

    private String address;

    private String phone;

    @NotBlank
    private String fabricOrgId;  // 병원 Org ID (login_id로 사용)

    @NotBlank
    @Email
    private String adminEmail;

    @NotBlank
    @Size(min = 8)
    private String password;
}
