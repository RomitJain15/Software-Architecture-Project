package com.rsp.backend.auth;

public record AuthResponse(
        String token,
        Long userId,
        String name,
        String email
) {}