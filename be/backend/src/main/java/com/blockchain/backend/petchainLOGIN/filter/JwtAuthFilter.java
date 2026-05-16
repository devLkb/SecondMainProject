package com.blockchain.backend.petchainLOGIN.filter;

import com.blockchain.backend.common.DomainValues.MemberType;
import com.blockchain.backend.petchainAPI.security.ActorType;
import com.blockchain.backend.petchainLOGIN.util.JwtUtil;
import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

@Component
@RequiredArgsConstructor
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain chain) throws ServletException, IOException {
        String header = request.getHeader("Authorization");
        if (header != null && header.startsWith("Bearer ")) {
            try {
                Claims claims = jwtUtil.parseClaims(header.substring(7));
                String userId = claims.getSubject();
                String memberType = claims.get("memberType", String.class);

                request.setAttribute("actorId", userId);
                request.setAttribute("actorRole", memberType);
                request.setAttribute("actorType", toActorType(memberType).name());

                var auth = new UsernamePasswordAuthenticationToken(
                        userId, null,
                        List.of(new SimpleGrantedAuthority("ROLE_" + memberType.toUpperCase()))
                );
                SecurityContextHolder.getContext().setAuthentication(auth);
            } catch (Exception ignored) {
                SecurityContextHolder.clearContext();
            }
        }
        chain.doFilter(request, response);
    }

    private ActorType toActorType(String memberType) {
        if (memberType == null) return ActorType.UNKNOWN;
        return switch (memberType) {
            case MemberType.USER -> ActorType.GUARDIAN;
            case MemberType.HOSPITAL -> ActorType.HOSPITAL;
            case MemberType.INSURANCE -> ActorType.INSURER;
            case MemberType.PLATFORM -> ActorType.ADMIN;
            default -> ActorType.UNKNOWN;
        };
    }
}
