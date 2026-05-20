package com.blockchain.backend.common;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.text.Normalizer;
import java.util.HexFormat;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;

/**
 * Hash Contract v1 구현. suggest.md 2장 "해시 계약 v1"의 공통 canonical 규칙을 코드로 고정한다.
 *
 * <ul>
 *   <li>알고리즘: SHA-256, 표기 {@code sha256:<lowercase 64 hex>}</li>
 *   <li>인코딩: UTF-8, 모든 문자열은 NFC 정규화</li>
 *   <li>객체 키: 유니코드 코드포인트 오름차순 정렬(중첩 객체에도 재귀 적용)</li>
 *   <li>불필요한 공백 제거, {@code null} 필드 생략(빈 배열 {@code []}은 유지)</li>
 *   <li>숫자: 정수만 허용(지수·소수 표기 금지)</li>
 *   <li>문자열: 필수 이스케이프만 사용, 비ASCII는 리터럴 UTF-8로 출력</li>
 * </ul>
 *
 * canonical payload 입력은 {@link Map}/{@link List}/{@link String}/정수/{@link Boolean} 트리만 허용한다.
 * 날짜·시각은 호출 측에서 ISO 8601 UTC 문자열로 정규화한 뒤 전달한다.
 */
public final class HashContract {

    /** 해시 계약 버전. 모든 canonical payload의 {@code hashContractVersion} 필드 값. */
    public static final String VERSION = "hash-contract-v1";

    /** 해시 표기 접두사. */
    public static final String HASH_PREFIX = "sha256:";

    private HashContract() {
    }

    /** payload 트리를 canonical JSON 문자열로 직렬화한다. */
    public static String canonicalJson(Object value) {
        StringBuilder sb = new StringBuilder();
        write(sb, value);
        return sb.toString();
    }

    /** canonical payload의 {@code sha256:<hex>} 해시. recordHash·consentSnapshotHash·auditLogHash에 사용. */
    public static String hashCanonical(Object value) {
        return hashBytes(canonicalJson(value).getBytes(StandardCharsets.UTF_8));
    }

    /** raw bytes의 {@code sha256:<hex>} 해시. 첨부 파일 원본 bytes에 사용. */
    public static String hashBytes(byte[] bytes) {
        try {
            String hex = HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(bytes));
            return HASH_PREFIX + hex;
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 algorithm unavailable", e);
        }
    }

    private static void write(StringBuilder sb, Object value) {
        if (value == null) {
            // 객체 필드의 null은 writeObject에서 이미 생략된다. 최상위/배열 원소 null만 여기 도달.
            sb.append("null");
        } else if (value instanceof Map<?, ?> map) {
            writeObject(sb, map);
        } else if (value instanceof List<?> list) {
            writeArray(sb, list);
        } else if (value instanceof String s) {
            writeString(sb, s);
        } else if (value instanceof Boolean b) {
            sb.append(b.booleanValue() ? "true" : "false");
        } else if (value instanceof Integer || value instanceof Long
                || value instanceof Short || value instanceof Byte) {
            sb.append(value);
        } else {
            throw new IllegalArgumentException(
                    "canonical hash 입력에 허용되지 않는 타입: " + value.getClass().getName()
                            + " (정수/문자열/불리언/객체/배열만 허용. 소수·BigDecimal 금지)");
        }
    }

    private static void writeObject(StringBuilder sb, Map<?, ?> map) {
        // TreeMap 자연 정렬로 키를 코드포인트 오름차순 정렬한다(필드 키는 ASCII).
        TreeMap<String, Object> sorted = new TreeMap<>();
        for (Map.Entry<?, ?> entry : map.entrySet()) {
            if (entry.getValue() == null) {
                continue; // null 필드 생략
            }
            sorted.put(String.valueOf(entry.getKey()), entry.getValue());
        }
        sb.append('{');
        boolean first = true;
        for (Map.Entry<String, Object> entry : sorted.entrySet()) {
            if (!first) {
                sb.append(',');
            }
            first = false;
            writeString(sb, entry.getKey());
            sb.append(':');
            write(sb, entry.getValue());
        }
        sb.append('}');
    }

    private static void writeArray(StringBuilder sb, List<?> list) {
        sb.append('[');
        boolean first = true;
        for (Object item : list) {
            if (!first) {
                sb.append(',');
            }
            first = false;
            write(sb, item);
        }
        sb.append(']');
    }

    private static void writeString(StringBuilder sb, String raw) {
        String s = Normalizer.normalize(raw, Normalizer.Form.NFC);
        sb.append('"');
        for (int i = 0; i < s.length(); i++) {
            char c = s.charAt(i);
            switch (c) {
                case '"' -> sb.append("\\\"");
                case '\\' -> sb.append("\\\\");
                case '\b' -> sb.append("\\b");
                case '\f' -> sb.append("\\f");
                case '\n' -> sb.append("\\n");
                case '\r' -> sb.append("\\r");
                case '\t' -> sb.append("\\t");
                default -> {
                    if (c < 0x20) {
                        sb.append(String.format("\\u%04x", (int) c));
                    } else {
                        // 비ASCII 포함 리터럴 출력. 직렬화 후 UTF-8 인코딩 시 통일된 바이트가 된다.
                        sb.append(c);
                    }
                }
            }
        }
        sb.append('"');
    }
}
