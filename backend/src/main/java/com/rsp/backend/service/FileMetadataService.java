package com.rsp.backend.service;

import com.rsp.backend.model.Course;
import com.rsp.backend.model.FileMetadata;
import com.rsp.backend.model.User;
import com.rsp.backend.repository.FileMetadataRepository;
import com.rsp.backend.cache.FileMetadataCacheService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class FileMetadataService {

    private final FileMetadataRepository fileMetadataRepository;
    private final FileMetadataCacheService fileMetadataCacheService;

    @Transactional
    public FileMetadata saveMetadata(MultipartFile file, Course course, User uploader, String publicUrl, String objectPath) {
        FileMetadata metadata = FileMetadata.builder()
                .fileName(file.getOriginalFilename())
                .fileUrl(publicUrl)
                .fileType(file.getContentType())
                .fileSize(file.getSize())
                .objectPath(objectPath)
                .course(course)
                .uploadedBy(uploader)
                .build();

        FileMetadata saved = fileMetadataRepository.save(metadata);
        try {
            fileMetadataCacheService.evictFilesByCourse(course.getId());
        } catch (Exception ignored) {}
        return saved;
    }

    public List<FileMetadata> listFilesByCourse(Long courseId, String sortBy, String direction) {
        return fileMetadataRepository.findByCourseId(courseId);
    }

    public List<FileMetadata> searchFiles(String query, Long courseId) {
        if (query == null || query.isBlank()) return List.of();
        String q = query.trim();
        if (courseId != null) {
            return fileMetadataRepository.findByFileNameContainingIgnoreCaseAndCourseId(q, courseId);
        }
        return fileMetadataRepository.findByFileNameContainingIgnoreCase(q);
    }
}
