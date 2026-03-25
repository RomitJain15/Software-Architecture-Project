package com.rsp.auth;

public record AuthResponse(
        String token,
        String userId,
        String name,
        String email
) {}