package com.rsp.backend.controller;

import com.rsp.backend.chat.CourseChatService;
import com.rsp.backend.model.Role;
import com.rsp.backend.model.User;
import com.rsp.backend.repository.EnrollmentRepository;
import com.rsp.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

import static org.springframework.http.HttpStatus.FORBIDDEN;

@RestController
@RequestMapping("/api/courses")
@RequiredArgsConstructor
public class CourseChatController {

    private final CourseChatService courseChatService;
    private final EnrollmentRepository enrollmentRepository;
    private final UserRepository userRepository;

    @GetMapping("/{courseId}/chats")
    public ResponseEntity<List<CourseChatService.ConversationSummary>> listActiveConversations(
            @AuthenticationPrincipal User currentUser,
            @PathVariable Long courseId) {

        if (currentUser == null) {
            throw new ResponseStatusException(FORBIDDEN, "Unauthorized");
        }

        boolean allowed = currentUser.getRole() == Role.ADMIN
                || enrollmentRepository.existsByUserIdAndCourseId(currentUser.getId(), courseId);
        if (!allowed) {
            throw new ResponseStatusException(FORBIDDEN, "Access denied");
        }

        return ResponseEntity.ok(courseChatService.listActiveConversations(courseId, currentUser.getId()));
    }

    @GetMapping("/{courseId}/chat")
    public ResponseEntity<List<CourseChatService.ChatMessageResponse>> getHistory(
            @AuthenticationPrincipal User currentUser,
            @PathVariable Long courseId,
            @RequestParam Long peerUserId) {

        if (currentUser == null) {
            throw new ResponseStatusException(FORBIDDEN, "Unauthorized");
        }

        User peer = userRepository.findById(peerUserId)
                .orElseThrow(() -> new ResponseStatusException(FORBIDDEN, "Peer not found"));

        validateCourseAccess(courseId, currentUser, peer);
        return ResponseEntity.ok(courseChatService.getHistory(courseId, currentUser.getId(), peerUserId));
    }

    private void validateCourseAccess(Long courseId, User currentUser, User peer) {
        boolean currentAllowed = currentUser.getRole() == Role.ADMIN
                || enrollmentRepository.existsByUserIdAndCourseId(currentUser.getId(), courseId);
        boolean peerAllowed = peer.getRole() == Role.ADMIN
                || enrollmentRepository.existsByUserIdAndCourseId(peer.getId(), courseId);

        if (!currentAllowed || !peerAllowed) {
            throw new ResponseStatusException(FORBIDDEN, "Access denied");
        }
    }
}
