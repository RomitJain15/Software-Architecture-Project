package com.rsp.backend.controller;

import com.rsp.backend.auth.AuthSessionService;
import com.rsp.backend.model.Enrollment;
import com.rsp.backend.model.Role;
import com.rsp.backend.model.User;
import com.rsp.backend.repository.EnrollmentRepository;
import com.rsp.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/courses")
@RequiredArgsConstructor
public class PresenceController {

    private final EnrollmentRepository enrollmentRepository;
    private final AuthSessionService authSessionService;
    private final UserRepository userRepository;

    @GetMapping("/{courseId}/online-users")
    public ResponseEntity<List<OnlineUserResponse>> listOnlineUsers(
            @AuthenticationPrincipal User currentUser,
            @PathVariable Long courseId) {

        if (currentUser == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Unauthorized");
        }

        boolean isAdmin = currentUser.getRole() == Role.ADMIN;
        if (!isAdmin && !enrollmentRepository.existsByUserIdAndCourseId(currentUser.getId(), courseId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied");
        }

        Set<Long> enrolledUserIds = enrollmentRepository.findByCourseId(courseId).stream()
                .map(Enrollment::getUser)
                .map(User::getId)
                .collect(Collectors.toSet());

        Set<Long> activeUserIds = authSessionService.findActiveUserIds(Instant.now()).stream()
                .collect(Collectors.toSet());

        List<OnlineUserResponse> results = userRepository.findAllById(enrolledUserIds).stream()
                .filter(user -> activeUserIds.contains(user.getId()))
                .map(user -> new OnlineUserResponse(user.getId(), user.getFullName(), user.getRole().name()))
                .toList();

        return ResponseEntity.ok(results);
    }

    public record OnlineUserResponse(Long id, String fullName, String role) {
    }
}