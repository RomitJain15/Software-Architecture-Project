package com.rsp.backend.config;

import java.security.Principal;

public record WsPrincipal(Long userId, String fullName, String email) implements Principal {

    @Override
    public String getName() {
        return String.valueOf(userId);
    }
}
