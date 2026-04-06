package com.rsp.backend.auth;

public record AuthResponse(
<<<<<<< HEAD
        String token,
        Long userId,
        String name,
        String email
=======
    String token,
    UserSummary user
>>>>>>> 497b56946d37a33dcc327d902cb7f04f9d06aaea
) {}