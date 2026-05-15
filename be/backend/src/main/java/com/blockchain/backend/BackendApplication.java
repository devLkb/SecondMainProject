package com.blockchain.backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.security.servlet.UserDetailsServiceAutoConfiguration;

// UserDetailsServiceAutoConfiguration 제외: 사용하지 않는 인메모리 유저 자동생성 비활성화
@SpringBootApplication(exclude = {UserDetailsServiceAutoConfiguration.class})
public class BackendApplication {

	public static void main(String[] args) {
		SpringApplication.run(BackendApplication.class, args);
	}

}
