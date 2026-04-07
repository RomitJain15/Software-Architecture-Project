package com.rsp.backend.presence;

import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.HashSet;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;

@Component
public class CoursePresenceRegistry {

    private final ConcurrentMap<Long, Set<Long>> courseToUsers = new ConcurrentHashMap<>();

    public void markOnline(Long courseId, Long userId) {
        courseToUsers
                .computeIfAbsent(courseId, key -> ConcurrentHashMap.newKeySet())
                .add(userId);
    }

    public void markOffline(Long courseId, Long userId) {
        Set<Long> users = courseToUsers.get(courseId);
        if (users == null) {
            return;
        }

        users.remove(userId);
        if (users.isEmpty()) {
            courseToUsers.remove(courseId);
        }
    }

    public Set<Long> getOnlineUserIds(Long courseId) {
        Set<Long> users = courseToUsers.get(courseId);
        if (users == null) {
            return Collections.emptySet();
        }
        return new HashSet<>(users);
    }

    public Set<Long> removeUserFromAllCourses(Long userId) {
        Set<Long> affectedCourses = new HashSet<>();
        for (var entry : courseToUsers.entrySet()) {
            Set<Long> users = entry.getValue();
            if (users.remove(userId)) {
                affectedCourses.add(entry.getKey());
                if (users.isEmpty()) {
                    courseToUsers.remove(entry.getKey());
                }
            }
        }
        return affectedCourses;
    }
}
