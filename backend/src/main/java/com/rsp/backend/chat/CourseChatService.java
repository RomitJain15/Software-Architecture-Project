package com.rsp.backend.chat;

import com.rsp.backend.model.User;
import com.rsp.backend.presence.CoursePresenceRegistry;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Deque;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentLinkedDeque;
import java.util.concurrent.ConcurrentMap;

import static org.springframework.http.HttpStatus.BAD_REQUEST;

@Service
public class CourseChatService {

    private static final int MAX_MESSAGES_PER_ROOM = 100;

    private final ConcurrentMap<String, Deque<ChatMessageResponse>> rooms = new ConcurrentHashMap<>();
    private final CoursePresenceRegistry coursePresenceRegistry;

    public CourseChatService(CoursePresenceRegistry coursePresenceRegistry) {
        this.coursePresenceRegistry = coursePresenceRegistry;
    }

    public String conversationKey(Long courseId, Long firstUserId, Long secondUserId) {
        Long lowerId = Math.min(firstUserId, secondUserId);
        Long higherId = Math.max(firstUserId, secondUserId);
        return courseId + ":" + lowerId + ":" + higherId;
    }

    public List<ChatMessageResponse> getHistory(Long courseId, Long firstUserId, Long secondUserId) {
        String roomKey = conversationKey(courseId, firstUserId, secondUserId);
        Deque<ChatMessageResponse> room = rooms.get(roomKey);
        if (room == null) {
            return List.of();
        }
        return new ArrayList<>(room);
    }

    public List<ConversationSummary> listActiveConversations(Long courseId, Long currentUserId) {
        return rooms.entrySet().stream()
                .map(entry -> toConversationSummary(courseId, entry.getKey(), entry.getValue(), currentUserId))
                .filter(summary -> summary != null)
                .sorted((left, right) -> {
                    Instant leftTime = left.lastMessageAt();
                    Instant rightTime = right.lastMessageAt();
                    if (leftTime == null && rightTime == null) {
                        return 0;
                    }
                    if (leftTime == null) {
                        return 1;
                    }
                    if (rightTime == null) {
                        return -1;
                    }
                    return rightTime.compareTo(leftTime);
                })
                .toList();
    }

    public void removeInactiveRooms(Long courseId) {
        Set<Long> onlineUserIds = coursePresenceRegistry.getOnlineUserIds(courseId);
        rooms.entrySet().removeIf(entry -> {
            ConversationRoute route = parseRoute(entry.getKey());
            if (route == null || !route.courseId().equals(courseId)) {
                return false;
            }

            boolean firstOnline = onlineUserIds.contains(route.firstUserId());
            boolean secondOnline = onlineUserIds.contains(route.secondUserId());
            return !firstOnline && !secondOnline;
        });
    }

    public ChatMessageResponse storeMessage(Long courseId,
                                           User sender,
                                           User recipient,
                                           String content) {
        if (content == null || content.isBlank()) {
            throw new ResponseStatusException(BAD_REQUEST, "Message cannot be empty");
        }

        String roomKey = conversationKey(courseId, sender.getId(), recipient.getId());
        ChatMessageResponse message = new ChatMessageResponse(
                UUID.randomUUID().toString(),
                courseId,
                sender.getId(),
                sender.getFullName(),
                recipient.getId(),
                recipient.getFullName(),
                content.trim(),
                Instant.now()
        );

        Deque<ChatMessageResponse> room = rooms.computeIfAbsent(roomKey, key -> new ConcurrentLinkedDeque<>());
        room.addLast(message);
        while (room.size() > MAX_MESSAGES_PER_ROOM) {
            room.pollFirst();
        }

        return message;
    }

    private ConversationSummary toConversationSummary(Long courseId,
                                                      String roomKey,
                                                      Deque<ChatMessageResponse> messages,
                                                      Long currentUserId) {
        ConversationRoute route = parseRoute(roomKey);
        if (route == null || !route.courseId().equals(courseId) || !route.includes(currentUserId)) {
            return null;
        }

        ChatMessageResponse lastMessage = messages.peekLast();
        if (lastMessage == null) {
            return null;
        }

        Long peerUserId = route.firstUserId().equals(currentUserId) ? route.secondUserId() : route.firstUserId();
        boolean peerOnline = coursePresenceRegistry.getOnlineUserIds(courseId).contains(peerUserId);
        String peerName = lastMessage.senderUserId().equals(currentUserId)
                ? lastMessage.recipientName()
                : lastMessage.senderName();

        return new ConversationSummary(
                route.courseId(),
                peerUserId,
                peerName,
                peerOnline,
                lastMessage.content(),
                lastMessage.sentAt(),
                messages.size()
        );
    }

    private ConversationRoute parseRoute(String roomKey) {
        String[] parts = roomKey.split(":");
        if (parts.length != 3) {
            return null;
        }

        try {
            return new ConversationRoute(
                    Long.valueOf(parts[0]),
                    Long.valueOf(parts[1]),
                    Long.valueOf(parts[2])
            );
        } catch (NumberFormatException ex) {
            return null;
        }
    }

    public record ChatSendRequest(Long recipientUserId, String content) {
    }

    public record ChatMessageResponse(
            String id,
            Long courseId,
            Long senderUserId,
            String senderName,
            Long recipientUserId,
            String recipientName,
            String content,
            Instant sentAt
    ) {
    }

    public record ConversationSummary(
            Long courseId,
            Long peerUserId,
            String peerName,
            boolean peerOnline,
            String lastMessage,
            Instant lastMessageAt,
            int messageCount
    ) {
    }

    private record ConversationRoute(Long courseId, Long firstUserId, Long secondUserId) {
        boolean includes(Long userId) {
            return firstUserId.equals(userId) || secondUserId.equals(userId);
        }
    }
}
