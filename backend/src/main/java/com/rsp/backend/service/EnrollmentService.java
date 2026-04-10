package com.rsp.backend.service;

import com.rsp.backend.model.Course;
import com.rsp.backend.model.Enrollment;
import com.rsp.backend.model.Role;
import com.rsp.backend.model.User;
import com.rsp.backend.controller.CoursePresenceBroadcaster;
import com.rsp.backend.presence.CoursePresenceRegistry;
import com.rsp.backend.repository.CourseRepository;
import com.rsp.backend.repository.EnrollmentRepository;
import com.rsp.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class EnrollmentService {

    private final EnrollmentRepository enrollmentRepository;
    private final UserRepository userRepository;
    private final CourseRepository courseRepository;
    private final CoursePresenceBroadcaster coursePresenceBroadcaster;
    private final CoursePresenceRegistry coursePresenceRegistry;

    @Transactional
    public Enrollment enroll(User currentUser, Long requestedUserId, Long courseId) {
        if (currentUser == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Unauthorized");
        }

        Long targetUserId = resolveTargetUserId(currentUser, requestedUserId);

        if (enrollmentRepository.existsByUserIdAndCourseId(targetUserId, courseId)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Enrollment already exists");
        }

        User user = userRepository.findById(targetUserId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Course not found"));

        Enrollment enrollment = Enrollment.builder()
                .user(user)
                .course(course)
                .build();

        Enrollment savedEnrollment = enrollmentRepository.save(enrollment);
        coursePresenceBroadcaster.broadcastCoursePresence(courseId);
        return savedEnrollment;
    }

    public Enrollment getEnrollment(User currentUser, Long id) {
        Enrollment enrollment = enrollmentRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Enrollment not found"));

        if (!isAdmin(currentUser) && !enrollment.getUser().getId().equals(currentUser.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied");
        }

        return enrollment;
    }

    public List<Enrollment> listEnrollments(User currentUser, Long userId, Long courseId) {
        if (currentUser == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Unauthorized");
        }

        boolean admin = isAdmin(currentUser);
        if (!admin) {
            if (courseId != null) {
                return enrollmentRepository.findByUserIdAndCourseId(currentUser.getId(), courseId)
                        .map(List::of)
                        .orElseGet(List::of);
            }
            return enrollmentRepository.findByUserId(currentUser.getId());
        }

        if (userId != null) {
            return enrollmentRepository.findByUserId(userId);
        }
        if (courseId != null) {
            return enrollmentRepository.findByCourseId(courseId);
        }
        return enrollmentRepository.findAll();
    }

    @Transactional
    public void deleteEnrollment(User currentUser, Long id) {
        if (currentUser == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Unauthorized");
        }

        Enrollment enrollment = enrollmentRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Enrollment not found"));

        if (!isAdmin(currentUser) && !enrollment.getUser().getId().equals(currentUser.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied");
        }

        Long courseId = enrollment.getCourse().getId();
        Long userId = enrollment.getUser().getId();
        enrollmentRepository.delete(enrollment);
        coursePresenceRegistry.markOffline(courseId, userId);
        coursePresenceBroadcaster.broadcastCoursePresence(courseId);
    }

    private boolean isAdmin(User currentUser) {
        return currentUser != null && currentUser.getRole() == Role.ADMIN;
    }

    private Long resolveTargetUserId(User currentUser, Long requestedUserId) {
        if (isAdmin(currentUser)) {
            return requestedUserId != null ? requestedUserId : currentUser.getId();
        }
        return currentUser.getId();
    }
}
