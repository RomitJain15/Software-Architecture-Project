package com.rsp.backend.auth;

import com.rsp.backend.exception.EmailAlreadyRegisteredException;
import com.rsp.backend.model.Role;
import com.rsp.backend.model.User;
import com.rsp.backend.controller.CoursePresenceBroadcaster;
import com.rsp.backend.presence.CoursePresenceRegistry;
import com.rsp.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;

import static org.springframework.http.HttpStatus.BAD_REQUEST;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthSessionService authSessionService;
    private final CoursePresenceBroadcaster coursePresenceBroadcaster;
    private final CoursePresenceRegistry coursePresenceRegistry;
    private final AuthenticationManager authenticationManager;

    public AuthResponse register(RegisterRequest request) {
        String normalizedEmail = normalizeEmail(request.email());

        if (userRepository.findByEmail(normalizedEmail).isPresent()) {
            throw new EmailAlreadyRegisteredException("Email already registered");
        }
        var user = User.builder()
                .fullName(request.name())
                .email(normalizedEmail)
                .password(passwordEncoder.encode(request.password()))
            .role(Role.STUDENT)
                .build();
        userRepository.save(user);
            Instant issuedAt = Instant.now();
            AuthSession session = authSessionService.createSession(
                user,
                issuedAt,
                issuedAt.plusMillis(jwtService.getExpiration())
            );
        return new AuthResponse(
            jwtService.generateToken(user, session.getSessionId()),
                new UserSummary(user.getId(), user.getFullName(), user.getEmail(), user.getRole(), user.getCreatedAt())
        );
    }

    public AuthResponse login(LoginRequest request) {
        String normalizedEmail = normalizeEmail(request.email());

        authenticationManager.authenticate(
            new UsernamePasswordAuthenticationToken(normalizedEmail, request.password()));
        var user = userRepository.findByEmail(normalizedEmail).orElseThrow();
            Instant issuedAt = Instant.now();
            AuthSession session = authSessionService.createSession(
                user,
                issuedAt,
                issuedAt.plusMillis(jwtService.getExpiration())
            );
        return new AuthResponse(
                jwtService.generateToken(user, session.getSessionId()),
                new UserSummary(user.getId(), user.getFullName(), user.getEmail(), user.getRole(), user.getCreatedAt())
        );
    }

    public void logout(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            throw new ResponseStatusException(BAD_REQUEST, "Authorization header is required");
        }

        String token = authHeader.substring(7);
        try {
            var sessionId = jwtService.extractSessionId(token);
            authSessionService.revokeSession(sessionId, Instant.now(), "LOGOUT");
            authSessionService.findUserBySessionId(sessionId)
                    .ifPresent(user -> {
                        var affectedCourses = coursePresenceRegistry.removeUserFromAllCourses(user.getId());
                        affectedCourses.forEach(coursePresenceBroadcaster::broadcastCoursePresence);
                    });
        } catch (Exception ex) {
            throw new ResponseStatusException(BAD_REQUEST, "Invalid authorization token");
        }
    }

    private String normalizeEmail(String email) {
        return email == null ? "" : email.trim().toLowerCase();
    }
}