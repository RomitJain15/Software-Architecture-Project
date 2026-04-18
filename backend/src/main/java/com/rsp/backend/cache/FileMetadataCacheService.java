package com.rsp.backend.cache;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.rsp.backend.dto.FileMetadataResponse;
import com.rsp.backend.repository.FileMetadataRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FileMetadataCacheService {

    private final StringRedisTemplate redis;
    private final ObjectMapper objectMapper;
    private final FileMetadataRepository fileMetadataRepository;

    private static final Duration DEFAULT_TTL = Duration.ofMinutes(30);

    private String keyForCourse(Long courseId) {
        return "course:files:" + courseId;
    }

    public List<FileMetadataResponse> getFilesByCourse(Long courseId) {
        String key = keyForCourse(courseId);
        try {
            String cached = redis.opsForValue().get(key);
            if (cached != null) {
                return objectMapper.readValue(cached, new TypeReference<>() {});
            }
        } catch (Exception ignored) {}

        List<FileMetadataResponse> list = fileMetadataRepository.findByCourseId(courseId).stream()
                .map(FileMetadataResponse::from)
                .collect(Collectors.toList());

        try {
            redis.opsForValue().set(key, objectMapper.writeValueAsString(list), DEFAULT_TTL);
        } catch (Exception ignored) {}

        return list;
    }

    public void evictFilesByCourse(Long courseId) {
        redis.delete(keyForCourse(courseId));
    }
}
