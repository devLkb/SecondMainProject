package com.blockchain.backend.petchainAPI.security;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.core.MethodParameter;
import org.springframework.stereotype.Component;
import org.springframework.web.bind.support.WebDataBinderFactory;
import org.springframework.web.context.request.NativeWebRequest;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.method.support.ModelAndViewContainer;

@Component
public class ApiActorArgumentResolver implements HandlerMethodArgumentResolver {
    @Override
    public boolean supportsParameter(MethodParameter parameter) {
        return ApiActor.class.isAssignableFrom(parameter.getParameterType());
    }

    @Override
    public Object resolveArgument(MethodParameter parameter,
                                  ModelAndViewContainer mavContainer,
                                  NativeWebRequest webRequest,
                                  WebDataBinderFactory binderFactory) {
        HttpServletRequest request = webRequest.getNativeRequest(HttpServletRequest.class);
        if (request == null) {
            return ApiActor.anonymous();
        }
        // JWT 필터가 세팅한 request attribute 우선, 없으면 헤더 fallback
        String actorId   = attrOrHeader(request, "actorId",   "X-Actor-Id");
        String actorOrgId = blankToNull(request.getHeader("X-Actor-Org-Id"));
        String actorRole = attrOrHeader(request, "actorRole",  "X-Actor-Role");
        String actorType = attrOrHeader(request, "actorType",  "X-Actor-Type");
        return new ApiActor(actorId, actorOrgId, actorRole, parseActorType(actorType));
    }

    private static String attrOrHeader(HttpServletRequest request, String attr, String header) {
        Object val = request.getAttribute(attr);
        if (val instanceof String s && !s.isBlank()) return s;
        return blankToNull(request.getHeader(header));
    }

    private static String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value;
    }

    private static ActorType parseActorType(String value) {
        if (value == null || value.isBlank()) {
            return ActorType.UNKNOWN;
        }
        try {
            return ActorType.valueOf(value.trim().toUpperCase());
        } catch (IllegalArgumentException ignored) {
            return ActorType.UNKNOWN;
        }
    }
}
