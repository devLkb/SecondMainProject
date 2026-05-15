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
        return new ApiActor(
                blankToNull(request.getHeader("X-Actor-Id")),
                blankToNull(request.getHeader("X-Actor-Org-Id")),
                blankToNull(request.getHeader("X-Actor-Role")),
                parseActorType(request.getHeader("X-Actor-Type"))
        );
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
