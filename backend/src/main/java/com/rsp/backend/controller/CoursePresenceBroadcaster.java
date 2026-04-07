package com.rsp.backend.controller;

import com.rsp.backend.model.Enrollment;
import com.rsp.backend.model.Role;
import com.rsp.backend.model.User;
import com.rsp.backend.repository.EnrollmentRepository;
import com.rsp.backend.repository.UserRepository;
import com.rsp.backend.presence.CoursePresenceRegistry;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class CoursePresenceBroadcaster {

    private final SimpMessagingTemplate messagingTemplate;
    private final EnrollmentRepository enrollmentRepository;
    private final UserRepository userRepository;
    private final CoursePresenceRegistry coursePresenceRegistry;

    @Transactional(readOnly = true)
    public void broadcastForUser(Long userId) {
        List<Enrollment> enrollments = enrollmentRepository.findByUserId(userId);
        enrollments.stream()
                .map(enrollment -> enrollment.getCourse().getId())
                .distinct()
                .forEach(this::broadcastCoursePresence);
    }

    @Transactional(readOnly = true)
    public void broadcastCoursePresence(Long courseId) {
        Set<Long> activeUserIds = coursePresenceRegistry.getOnlineUserIds(courseId);

        List<PresenceController.OnlineUserResponse> payload = userRepository.findAllById(activeUserIds).stream()
            .filter(user -> user.getRole() == Role.ADMIN
                        || enrollmentRepository.existsByUserIdAndCourseId(user.getId(), courseId))
                .map(user -> new PresenceController.OnlineUserResponse(user.getId(), user.getFullName(), user.getRole().name()))
                .toList();

        messagingTemplate.convertAndSend("/topic/courses/" + courseId + "/online-users", payload);
    }
}