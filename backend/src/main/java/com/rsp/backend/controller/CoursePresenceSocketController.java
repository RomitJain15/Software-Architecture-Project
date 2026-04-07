package com.rsp.backend.controller;

import com.rsp.backend.model.Role;
import com.rsp.backend.repository.EnrollmentRepository;
import com.rsp.backend.repository.UserRepository;
import com.rsp.backend.presence.CoursePresenceRegistry;
import com.rsp.backend.chat.CourseChatService;
import lombok.RequiredArgsConstructor;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;
import org.springframework.stereotype.Controller;

import java.security.Principal;

@Controller
@RequiredArgsConstructor
public class CoursePresenceSocketController {

    private final EnrollmentRepository enrollmentRepository;
    private final UserRepository userRepository;
    private final CoursePresenceRegistry coursePresenceRegistry;
    private final CoursePresenceBroadcaster coursePresenceBroadcaster;
    private final CourseChatService courseChatService;

    @MessageMapping("/courses/{courseId}/presence/join")
    public void joinCourse(
            @DestinationVariable Long courseId,
            Principal principal) {
        Long userId = resolveUserId(principal);
        if (!isUserAllowed(courseId, userId)) {
            return;
        }

        coursePresenceRegistry.markOnline(courseId, userId);
        coursePresenceBroadcaster.broadcastCoursePresence(courseId);
    }

    @MessageMapping("/courses/{courseId}/presence/leave")
    public void leaveCourse(
            @DestinationVariable Long courseId,
            Principal principal) {
        Long userId = resolveUserId(principal);
        coursePresenceRegistry.markOffline(courseId, userId);
        coursePresenceBroadcaster.broadcastCoursePresence(courseId);
        courseChatService.removeInactiveRooms(courseId);
    }

    @EventListener
    public void handleSessionDisconnect(SessionDisconnectEvent event) {
        Principal principal = event.getUser();
        Long userId = resolveUserId(principal);
        if (userId == null) {
            return;
        }

        coursePresenceRegistry.removeUserFromAllCourses(userId)
                .forEach(courseId -> {
                    coursePresenceBroadcaster.broadcastCoursePresence(courseId);
                    courseChatService.removeInactiveRooms(courseId);
                });
    }

    private boolean isUserAllowed(Long courseId, Long userId) {
        return userRepository.findById(userId)
                .map(user -> user.getRole() == Role.ADMIN
                        || enrollmentRepository.existsByUserIdAndCourseId(userId, courseId))
                .orElse(false);
    }

    private Long resolveUserId(Principal principal) {
        if (principal == null || principal.getName() == null) {
            return null;
        }

        try {
            return Long.valueOf(principal.getName());
        } catch (NumberFormatException ex) {
            return null;
        }
    }
}
