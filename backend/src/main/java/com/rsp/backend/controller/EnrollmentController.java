package com.rsp.backend.controller;

import com.rsp.backend.model.Enrollment;
import com.rsp.backend.model.User;
import com.rsp.backend.service.EnrollmentService;
import jakarta.validation.constraints.NotNull;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/enrollments")
@RequiredArgsConstructor
public class EnrollmentController {

    private final EnrollmentService enrollmentService;

    @PostMapping
    public ResponseEntity<EnrollmentResponse> enroll(
            @AuthenticationPrincipal User currentUser,
            @RequestBody EnrollmentRequest request) {

        Enrollment enrollment = enrollmentService.enroll(currentUser, request.userId(), request.courseId());
        return ResponseEntity.ok(EnrollmentResponse.from(enrollment));
    }

    @GetMapping
    public ResponseEntity<List<EnrollmentResponse>> listEnrollments(
            @AuthenticationPrincipal User currentUser,
            @RequestParam(required = false) Long userId,
            @RequestParam(required = false) Long courseId) {

        List<EnrollmentResponse> results = enrollmentService.listEnrollments(currentUser, userId, courseId).stream()
                .map(EnrollmentResponse::from)
                .toList();

        return ResponseEntity.ok(results);
    }

    @GetMapping("/{id}")
    public ResponseEntity<EnrollmentResponse> getEnrollment(
            @AuthenticationPrincipal User currentUser,
            @PathVariable Long id) {

        return ResponseEntity.ok(EnrollmentResponse.from(enrollmentService.getEnrollment(currentUser, id)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteEnrollment(
            @AuthenticationPrincipal User currentUser,
            @PathVariable Long id) {
        enrollmentService.deleteEnrollment(currentUser, id);
        return ResponseEntity.noContent().build();
    }

    public record EnrollmentRequest(
            Long userId,
            @NotNull Long courseId
    ) {}

    public record EnrollmentResponse(
            Long id,
            Long userId,
            Long courseId
    ) {
        public static EnrollmentResponse from(Enrollment enrollment) {
            return new EnrollmentResponse(
                    enrollment.getId(),
                    enrollment.getUser().getId(),
                    enrollment.getCourse().getId()
            );
        }
    }
}
