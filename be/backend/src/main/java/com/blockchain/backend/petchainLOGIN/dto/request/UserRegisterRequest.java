package com.blockchain.backend.petchainLOGIN.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

// 보호자(user) 회원가입 요청
@Getter @Setter
public class UserRegisterRequest {

    @NotBlank
    private String name;

    @NotBlank
    private String phone;

    @NotBlank
    @Email
    private String email;  // login_id로 사용

    @NotBlank
    @Size(min = 8)
    private String password;

    private String address;
}
