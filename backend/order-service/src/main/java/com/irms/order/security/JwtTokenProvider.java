package com.irms.order.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

// SRP: JWT validation + table-token generation — order service needs both
@Slf4j
@Component
public class JwtTokenProvider {

    private final SecretKey secretKey;

    public JwtTokenProvider(@Value("${jwt.secret}") String secret) {
        this.secretKey = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
    }

    // Short-lived token issued to Customer App (12 hours, scoped to one table session)
    public String generateTableToken(Long sessionId, int tableNumber) {
        Date now = new Date();
        return Jwts.builder()
                .subject("table-" + tableNumber)
                .claim("sessionId", sessionId)
                .claim("tableNumber", tableNumber)
                .claim("type", "TABLE")
                .issuedAt(now)
                .expiration(new Date(now.getTime() + 12 * 60 * 60 * 1000L))
                .signWith(secretKey)
                .compact();
    }

    public Claims parseToken(String token) {
        return Jwts.parser()
                .verifyWith(secretKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    public boolean validateToken(String token) {
        try {
            parseToken(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            log.debug("Invalid JWT: {}", e.getMessage());
            return false;
        }
    }
}
