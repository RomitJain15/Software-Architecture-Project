package com.rsp.backend.cache;

import com.rsp.backend.auth.AuthSession;
import com.rsp.backend.repository.AuthSessionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthSessionCacheService {

    private final StringRedisTemplate redis;
    private final AuthSessionRepository authSessionRepository;

    private String key(UUID sessionId) {
        return "session:active:" + sessionId.toString();
    }

    public boolean isSessionActive(UUID sessionId, Instant now) {
        if (sessionId == null) return false;
        String k = key(sessionId);
        Long ttl = redis.getExpire(k);
        if (ttl != null && ttl > 0) {
            return true;
        }

        boolean isActive = authSessionRepository.existsBySessionIdAndRevokedAtIsNullAndExpiresAtAfter(sessionId, now);
        if (isActive) {
            Optional<AuthSession> maybe = authSessionRepository.findBySessionId(sessionId);
            maybe.ifPresent(session -> {
                long seconds = session.getExpiresAt().getEpochSecond() - now.getEpochSecond();
                if (seconds <= 0) seconds = 60;
                try {
                    redis.opsForValue().set(k, session.getUser().getId().toString(), Duration.ofSeconds(seconds));
                } catch (Exception ignored) {}
            });
        } else {
            redis.delete(k);
        }

        return isActive;
    }

    public void cacheSession(AuthSession session, Instant now) {
        if (session == null || session.getSessionId() == null) return;
        String k = key(session.getSessionId());
        long seconds = session.getExpiresAt().getEpochSecond() - now.getEpochSecond();
        if (seconds <= 0) seconds = 60;
        try {
            redis.opsForValue().set(k, session.getUser().getId().toString(), Duration.ofSeconds(seconds));
        } catch (Exception ignored) {}
    }

    public void evictSession(UUID sessionId) {
        if (sessionId == null) return;
        redis.delete(key(sessionId));
    }
}
