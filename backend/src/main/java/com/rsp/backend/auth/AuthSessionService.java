package com.rsp.backend.auth;

import com.rsp.backend.model.User;
import com.rsp.backend.repository.AuthSessionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AuthSessionService {

    private final AuthSessionRepository authSessionRepository;
    private final ConcurrentHashMap<UUID, CacheEntry> activeSessionCache = new ConcurrentHashMap<>();

    @Value("${app.auth.session-cache-ttl-seconds:15}")
    private long sessionCacheTtlSeconds;

    @Transactional
    public AuthSession createSession(User user, Instant issuedAt, Instant expiresAt) {
        AuthSession session = AuthSession.builder()
                .sessionId(UUID.randomUUID())
                .user(user)
                .issuedAt(issuedAt)
                .expiresAt(expiresAt)
                .build();
        AuthSession saved = authSessionRepository.save(session);
        cacheActiveSession(saved.getSessionId(), issuedAt);
        return saved;
    }

    public boolean isSessionActive(UUID sessionId, Instant now) {
        if (sessionCacheTtlSeconds > 0) {
            CacheEntry cached = activeSessionCache.get(sessionId);
            if (cached != null && now.isBefore(cached.validUntil())) {
                return true;
            }
        }

        boolean isActive = authSessionRepository.existsBySessionIdAndRevokedAtIsNullAndExpiresAtAfter(sessionId, now);
        if (isActive) {
            cacheActiveSession(sessionId, now);
        } else {
            activeSessionCache.remove(sessionId);
        }
        return isActive;
    }

    @Transactional
    public void revokeSession(UUID sessionId, Instant revokedAt, String reason) {
        authSessionRepository.findBySessionId(sessionId).ifPresent(session -> {
            if (session.getRevokedAt() == null) {
                session.setRevokedAt(revokedAt);
                session.setRevokeReason(reason);
                authSessionRepository.save(session);
            }
        });
        activeSessionCache.remove(sessionId);
    }

    public Optional<User> findUserBySessionId(UUID sessionId) {
        return authSessionRepository.findBySessionId(sessionId).map(AuthSession::getUser);
    }

    public List<Long> findActiveUserIds(Instant now) {
        return authSessionRepository.findDistinctActiveUserIds(now);
    }

    private void cacheActiveSession(UUID sessionId, Instant now) {
        if (sessionCacheTtlSeconds <= 0) {
            return;
        }
        activeSessionCache.put(sessionId, new CacheEntry(now.plusSeconds(sessionCacheTtlSeconds)));
    }

    private record CacheEntry(Instant validUntil) {}
}