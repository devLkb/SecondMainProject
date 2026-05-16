package com.blockchain.backend.petchainAPI.security;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.web.context.request.ServletWebRequest;

class ApiActorArgumentResolverTest {

    private final ApiActorArgumentResolver resolver = new ApiActorArgumentResolver();

    @Test
    void resolvesActorFromJwtAttributesBeforeHeaders() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setAttribute("actorId", "jwt-user-1");
        request.setAttribute("actorRole", "hospital");
        request.setAttribute("actorType", "HOSPITAL");
        request.addHeader("X-Actor-Id", "header-user-1");
        request.addHeader("X-Actor-Org-Id", "org-1");
        request.addHeader("X-Actor-Role", "HEADER_ROLE");
        request.addHeader("X-Actor-Type", "INSURER");

        ApiActor actor = resolve(request);

        assertThat(actor.actorId()).isEqualTo("jwt-user-1");
        assertThat(actor.actorOrgId()).isEqualTo("org-1");
        assertThat(actor.actorRole()).isEqualTo("hospital");
        assertThat(actor.actorType()).isEqualTo(ActorType.HOSPITAL);
    }

    @Test
    void fallsBackToHeadersAndUnknownActorType() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("X-Actor-Id", "header-user-1");
        request.addHeader("X-Actor-Type", "not-a-type");

        ApiActor actor = resolve(request);

        assertThat(actor.actorId()).isEqualTo("header-user-1");
        assertThat(actor.actorOrgId()).isNull();
        assertThat(actor.actorRole()).isNull();
        assertThat(actor.actorType()).isEqualTo(ActorType.UNKNOWN);
    }

    private ApiActor resolve(MockHttpServletRequest request) {
        return (ApiActor) resolver.resolveArgument(null, null, new ServletWebRequest(request), null);
    }
}
