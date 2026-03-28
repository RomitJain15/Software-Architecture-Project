package com.rsp.backend.controller;

import com.rsp.backend.model.Role;
import com.rsp.backend.model.User;
import com.rsp.backend.repository.UserRepository;
import jakarta.validation.constraints.NotNull;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final UserRepository userRepository;

    @GetMapping("/users")
    public ResponseEntity<List<UserSummary>> listUsers() {
        List<UserSummary> users = userRepository.findAll().stream()
                .map(UserSummary::from)
                .toList();
        return ResponseEntity.ok(users);
    }

    @PatchMapping("/users/{id}/role")
    public ResponseEntity<UserSummary> updateUserRole(
            @PathVariable Long id,
            @RequestBody RoleRequest request) {

        User user = userRepository.findById(id)
                .orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(
                        org.springframework.http.HttpStatus.NOT_FOUND, "User not found"));

        user.setRole(request.role());
        userRepository.save(user);

        return ResponseEntity.ok(UserSummary.from(user));
    }

    public record RoleRequest(
            @NotNull Role role
    ) {}

    public record UserSummary(
            Long id,
            String fullName,
            String email,
            Role role
    ) {
        public static UserSummary from(User user) {
            return new UserSummary(user.getId(), user.getFullName(), user.getEmail(), user.getRole());
        }
    }
}
