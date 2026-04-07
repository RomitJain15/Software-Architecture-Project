package com.rsp.backend.service;

import com.rsp.backend.model.Course;
import com.rsp.backend.model.FileMetadata;
import com.rsp.backend.model.User;
import com.rsp.backend.repository.FileMetadataRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;
import java.util.List;

@Service
@RequiredArgsConstructor
public class FileMetadataService {

    private final FileMetadataRepository fileMetadataRepository;

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

        return fileMetadataRepository.save(metadata);
    }

    public List<FileMetadata> listFilesByCourse(Long courseId, String sortBy, String direction) {
        if (sortBy == null || sortBy.isBlank()) {
            return fileMetadataRepository.findByCourseId(courseId);
        }

        if (!sortBy.equalsIgnoreCase("RATING")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid sortBy value. Allowed: RATING");
        }

        String normalizedDirection = direction == null ? "DESC" : direction.toUpperCase();
        if (!normalizedDirection.equals("ASC") && !normalizedDirection.equals("DESC")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid direction value. Allowed: ASC, DESC");
        }

        if (normalizedDirection.equals("DESC")) {
            return fileMetadataRepository.findByCourseIdOrderByRatingDesc(courseId);
        } else {
            return fileMetadataRepository.findByCourseIdOrderByRatingAsc(courseId);
        }
    }
}
