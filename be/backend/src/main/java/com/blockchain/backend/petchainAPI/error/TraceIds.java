package com.blockchain.backend.petchainAPI.error;

import jakarta.servlet.http.HttpServletRequest;
import java.util.UUID;

final class TraceIds {
    private TraceIds() {
    }

    static String from(HttpServletRequest request) {
        String traceId = request.getHeader("X-Trace-Id");
        return traceId == null || traceId.isBlank() ? UUID.randomUUID().toString() : traceId;
    }
}
