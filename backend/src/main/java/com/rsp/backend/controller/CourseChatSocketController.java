package com.rsp.backend.controller;

import com.rsp.backend.chat.CourseChatService;
import com.rsp.backend.chat.CourseChatService.ChatMessageResponse;
import com.rsp.backend.chat.CourseChatService.ChatSendRequest;
import com.rsp.backend.model.Role;
import com.rsp.backend.model.User;
import com.rsp.backend.presence.CoursePresenceRegistry;
import com.rsp.backend.repository.EnrollmentRepository;
import com.rsp.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;
import org.springframework.web.server.ResponseStatusException;

import java.security.Principal;

import static org.springframework.http.HttpStatus.BAD_REQUEST;
import static org.springframework.http.HttpStatus.FORBIDDEN;
import static org.springframework.http.HttpStatus.NOT_FOUND;

@Controller
@RequiredArgsConstructor
public class CourseChatSocketController {

    private final SimpMessagingTemplate messagingTemplate;
    private final CourseChatService courseChatService;
    private final EnrollmentRepository enrollmentRepository;
    private final UserRepository userRepository;
    private final CoursePresenceRegistry coursePresenceRegistry;
    private final CoursePresenceBroadcaster coursePresenceBroadcaster;

    @MessageMapping("/courses/{courseId}/chat/send")
    public void sendMessage(@DestinationVariable Long courseId,
                            ChatSendRequest request,
                            Principal principal) {
        User sender = resolveCurrentUser(principal);
        if (request == null || request.recipientUserId() == null) {
            throw new ResponseStatusException(BAD_REQUEST, "Recipient is required");
        }

        User recipient = userRepository.findById(request.recipientUserId())
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Recipient not found"));

        validateCourseAccess(courseId, sender, recipient);
        if (recipient.getId().equals(sender.getId())) {
            throw new ResponseStatusException(BAD_REQUEST, "Cannot chat with yourself");
        }

        if (!coursePresenceRegistry.getOnlineUserIds(courseId).contains(recipient.getId())
                && sender.getRole() != Role.ADMIN) {
            throw new ResponseStatusException(BAD_REQUEST, "Recipient is not online");
        }

        ChatMessageResponse message = courseChatService.storeMessage(
                courseId,
                sender,
                recipient,
                request.content()
        );

        String roomKey = courseChatService.conversationKey(courseId, sender.getId(), recipient.getId());
        messagingTemplate.convertAndSend("/topic/courses/" + courseId + "/chat/" + roomKey, message);
        messagingTemplate.convertAndSend("/topic/courses/" + courseId + "/chat-notifications", message);
        coursePresenceBroadcaster.broadcastCoursePresence(courseId);
    }

    private void validateCourseAccess(Long courseId, User sender, User recipient) {
        boolean senderAllowed = sender.getRole() == Role.ADMIN
                || enrollmentRepository.existsByUserIdAndCourseId(sender.getId(), courseId);
        boolean recipientAllowed = recipient.getRole() == Role.ADMIN
                || enrollmentRepository.existsByUserIdAndCourseId(recipient.getId(), courseId);

        if (!senderAllowed) {
            throw new ResponseStatusException(FORBIDDEN, "Access denied");
        }
        if (!recipientAllowed) {
            throw new ResponseStatusException(FORBIDDEN, "Recipient is not part of this course");
        }
    }

    private User resolveCurrentUser(Principal principal) {
        if (principal == null || principal.getName() == null) {
            throw new ResponseStatusException(FORBIDDEN, "Unauthorized");
        }

        Long userId;
        try {
            userId = Long.valueOf(principal.getName());
        } catch (NumberFormatException ex) {
            throw new ResponseStatusException(FORBIDDEN, "Unauthorized");
        }

        return userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(FORBIDDEN, "Unauthorized"));
    }
}
