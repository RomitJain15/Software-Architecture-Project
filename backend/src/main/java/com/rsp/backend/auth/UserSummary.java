package com.rsp.backend.auth;

import com.rsp.backend.model.Role;
import java.time.LocalDateTime;
import java.time.LocalDateTime;

public record UserSummary(
    Long id,
    String name,
    String email,
    Role role,
    LocalDateTime createdAt
) {}
