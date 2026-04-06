package com.rsp.backend.repository;

import com.rsp.backend.auth.AuthSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface AuthSessionRepository extends JpaRepository<AuthSession, UUID> {

    Optional<AuthSession> findBySessionId(UUID sessionId);

    boolean existsBySessionIdAndRevokedAtIsNullAndExpiresAtAfter(UUID sessionId, Instant now);

    @Query("select distinct s.user.id from AuthSession s where s.revokedAt is null and s.expiresAt > :now")
    List<Long> findDistinctActiveUserIds(@Param("now") Instant now);
}