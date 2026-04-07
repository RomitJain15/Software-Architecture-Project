package com.rsp.backend.auth;

import com.rsp.backend.model.User;
import com.rsp.backend.repository.AuthSessionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthSessionService {

    private final AuthSessionRepository authSessionRepository;

    public AuthSession createSession(User user, Instant issuedAt, Instant expiresAt) {
        AuthSession session = AuthSession.builder()
                .sessionId(UUID.randomUUID())
                .user(user)
                .issuedAt(issuedAt)
                .expiresAt(expiresAt)
                .build();
        return authSessionRepository.save(session);
    }

    public boolean isSessionActive(UUID sessionId, Instant now) {
        return authSessionRepository.existsBySessionIdAndRevokedAtIsNullAndExpiresAtAfter(sessionId, now);
    }

    public void revokeSession(UUID sessionId, Instant revokedAt, String reason) {
        authSessionRepository.findBySessionId(sessionId).ifPresent(session -> {
            if (session.getRevokedAt() == null) {
                session.setRevokedAt(revokedAt);
                session.setRevokeReason(reason);
                authSessionRepository.save(session);
            }
        });
    }

    public Optional<User> findUserBySessionId(UUID sessionId) {
        return authSessionRepository.findBySessionId(sessionId).map(AuthSession::getUser);
    }

    public List<Long> findActiveUserIds(Instant now) {
        return authSessionRepository.findDistinctActiveUserIds(now);
    }
}