package com.rsp.backend.auth;

import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.time.Instant;
import java.util.Date;
import java.util.UUID;

@Service
public class JwtService {

    @Value("${jwt.secret:k3b9ZsX2pQ8vL0mR6yT5uW4eN1aB7cD8fG9hJ0kL2mN4pQ6rS8tV0wX2yZ4aB6c}")
    private String secret;

    @Value("${jwt.expiration:3600000}")
    private long expiration;

    private SecretKey getKey() {
        return Keys.hmacShaKeyFor(secret.getBytes());
    }

    public long getExpiration() {
        return expiration;
    }

    public String generateToken(UserDetails user, UUID sessionId) {
        Instant issuedAt = Instant.now();
        Instant expiresAt = issuedAt.plusMillis(expiration);
        return generateToken(user, sessionId, issuedAt, expiresAt);
    }

    public String generateToken(UserDetails user, UUID sessionId, Instant issuedAt, Instant expiresAt) {
        return Jwts.builder()
                .subject(user.getUsername())
                .id(sessionId.toString())
                .issuedAt(Date.from(issuedAt))
                .expiration(Date.from(expiresAt))
                .signWith(getKey())
                .compact();
    }

    public String extractEmail(String token) {
        return Jwts.parser().verifyWith(getKey()).build()
                .parseSignedClaims(token).getPayload().getSubject();
    }

    public UUID extractSessionId(String token) {
        String jti = Jwts.parser().verifyWith(getKey()).build()
                .parseSignedClaims(token).getPayload().getId();
        return UUID.fromString(jti);
    }

    public Instant extractIssuedAt(String token) {
        Date issuedAt = Jwts.parser().verifyWith(getKey()).build()
                .parseSignedClaims(token).getPayload().getIssuedAt();
        return issuedAt.toInstant();
    }

    public Instant extractExpiration(String token) {
        Date expiresAt = Jwts.parser().verifyWith(getKey()).build()
                .parseSignedClaims(token).getPayload().getExpiration();
        return expiresAt.toInstant();
    }

    public boolean isValid(String token, UserDetails user) {
        try {
            return extractEmail(token).equals(user.getUsername())
                    && !isExpired(token);
        } catch (JwtException e) {
            return false;
        }
    }

    private boolean isExpired(String token) {
        return Jwts.parser().verifyWith(getKey()).build()
                .parseSignedClaims(token).getPayload()
                .getExpiration().before(new Date());
    }
}
