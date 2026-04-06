package com.rsp.backend.auth;

public record AuthResponse(
    String token,
    UserSummary user
) {}