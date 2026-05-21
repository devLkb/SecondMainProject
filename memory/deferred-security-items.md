---
name: deferred-security-items
description: Security review items intentionally deferred during 2026-05-18 OAuth/login hardening
metadata:
  type: project
---

2026-05-18 보안 리뷰에서 백엔드 16개 항목 중 대부분을 수정했으나, 사용자 결정으로 아래 항목은 **보류**됨:

- **CRITICAL 1** — OAuth 콜백이 access/refresh token을 URL query로 전달(OAuthController.buildSuccessUrl). 1회성 code 교환 또는 HttpOnly 쿠키 방식으로 바꿔야 하며 **프론트엔드 코드 동시 수정 필요**.
- **HIGH 5** — Guardian/MedicalRecord의 PII·진료정보 암호화 미구현(주석만 존재). AttributeConverter 적용 시 **기존 평문 데이터 마이그레이션 결정 필요**.
- **MEDIUM 1** — OAuthStateStore가 인메모리. 다중 인스턴스/재시작 대응하려면 Redis 필요(현재 단일 인스턴스라 미적용).
- **LOW 2** — 문자열 상태값이 DB 전반에 산재. Java enum + @Enumerated 중앙화 미적용.

**Why:** 프론트 연동 파손·데이터 마이그레이션·인프라 추가 결정이 필요해 별도 작업으로 분리.
**How to apply:** 재개 시 프론트엔드 코드부터 확인하고 사용자에게 마이그레이션 방침을 물을 것.
