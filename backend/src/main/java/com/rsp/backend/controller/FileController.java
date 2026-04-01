package com.rsp.backend.controller;

import com.rsp.backend.model.Course;
import com.rsp.backend.model.FileMetadata;
import com.rsp.backend.model.User;
import com.rsp.backend.repository.CourseRepository;
import com.rsp.backend.service.FileMetadataService;
import com.rsp.backend.service.SupabaseStorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;

@RestController
@RequestMapping("/api/files")
@RequiredArgsConstructor
public class FileController {

    private final SupabaseStorageService supabaseStorageService;
    private final FileMetadataService fileMetadataService;
    private final CourseRepository courseRepository;

    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<FileMetadataResponse> uploadFile(
            @AuthenticationPrincipal User currentUser,
            @RequestParam Long courseId,
            @RequestPart("file") MultipartFile file) {

        if (currentUser == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Unauthorized");
        }

        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Course not found"));

        String folderPath = "courses/" + courseId + "/users/" + currentUser.getId();
        SupabaseStorageService.SupabaseUploadResult result = supabaseStorageService.upload(file, folderPath);

        FileMetadata metadata = fileMetadataService.saveMetadata(file, course, currentUser, result.publicUrl());
        return ResponseEntity.ok(FileMetadataResponse.from(metadata));
    }

    public record FileMetadataResponse(
            Long id,
            String fileName,
            String fileUrl,
            String fileType,
            Long fileSize,
            Long courseId,
            Long uploadedBy,
            String uploadedAt
    ) {
        public static FileMetadataResponse from(FileMetadata metadata) {
            return new FileMetadataResponse(
                    metadata.getId(),
                    metadata.getFileName(),
                    metadata.getFileUrl(),
                    metadata.getFileType(),
                    metadata.getFileSize(),
                    metadata.getCourse().getId(),
                    metadata.getUploadedBy().getId(),
                    metadata.getUploadedAt() != null ? metadata.getUploadedAt().toString() : null
            );
        }
    }
}
