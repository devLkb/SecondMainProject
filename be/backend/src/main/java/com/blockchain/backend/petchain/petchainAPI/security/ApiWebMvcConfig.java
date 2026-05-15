package com.blockchain.backend.petchain.petchainAPI.security;

import java.util.List;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class ApiWebMvcConfig implements WebMvcConfigurer {
    private final ApiActorArgumentResolver apiActorArgumentResolver;

    public ApiWebMvcConfig(ApiActorArgumentResolver apiActorArgumentResolver) {
        this.apiActorArgumentResolver = apiActorArgumentResolver;
    }

    @Override
    public void addArgumentResolvers(List<HandlerMethodArgumentResolver> resolvers) {
        resolvers.add(apiActorArgumentResolver);
    }
}
