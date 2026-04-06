package com.rsp.backend.controller;

import com.rsp.backend.model.Role;
import com.rsp.backend.repository.EnrollmentRepository;
import com.rsp.backend.repository.UserRepository;
import com.rsp.backend.presence.CoursePresenceRegistry;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.stereotype.Controller;

@Controller
@RequiredArgsConstructor
public class CoursePresenceSocketController {

    private final EnrollmentRepository enrollmentRepository;
    private final UserRepository userRepository;
    private final CoursePresenceRegistry coursePresenceRegistry;
    private final CoursePresenceBroadcaster coursePresenceBroadcaster;

    @MessageMapping("/courses/{courseId}/presence/join")
    public void joinCourse(
            @DestinationVariable Long courseId,
            PresenceEvent event) {
        Long userId = event != null ? event.userId() : null;
        if (userId == null) {
            return;
        }

        if (!isUserAllowed(courseId, userId)) {
            return;
        }

        coursePresenceRegistry.markOnline(courseId, userId);
        coursePresenceBroadcaster.broadcastCoursePresence(courseId);
    }

    @MessageMapping("/courses/{courseId}/presence/leave")
    public void leaveCourse(
            @DestinationVariable Long courseId,
            PresenceEvent event) {
        Long userId = event != null ? event.userId() : null;
        if (userId == null) {
            return;
        }

        coursePresenceRegistry.markOffline(courseId, userId);
        coursePresenceBroadcaster.broadcastCoursePresence(courseId);
    }

    private boolean isUserAllowed(Long courseId, Long userId) {
        return userRepository.findById(userId)
                .map(user -> user.getRole() == Role.ADMIN
                        || enrollmentRepository.existsByUserIdAndCourseId(userId, courseId))
                .orElse(false);
    }

    public record PresenceEvent(Long userId) {
    }
}
