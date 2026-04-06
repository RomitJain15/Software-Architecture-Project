package com.rsp.backend.controller;

import com.rsp.backend.model.Course;
import com.rsp.backend.model.FileMetadata;
import com.rsp.backend.model.Role;
import com.rsp.backend.model.User;
import com.rsp.backend.repository.CourseRepository;
import com.rsp.backend.repository.EnrollmentRepository;
import com.rsp.backend.repository.FileMetadataRepository;
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
import java.util.List;

@RestController
@RequestMapping("/api/files")
@RequiredArgsConstructor
public class FileController {

    private final SupabaseStorageService supabaseStorageService;
    private final FileMetadataService fileMetadataService;
    private final CourseRepository courseRepository;
    private final FileMetadataRepository fileMetadataRepository;
    private final EnrollmentRepository enrollmentRepository;

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

        boolean isAdmin = currentUser.getRole() == Role.ADMIN;
        if (!isAdmin && !enrollmentRepository.existsByUserIdAndCourseId(currentUser.getId(), courseId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Enrollment required to upload");
        }

        String folderPath = "courses/" + courseId + "/users/" + currentUser.getId();
        SupabaseStorageService.SupabaseUploadResult result = supabaseStorageService.upload(file, folderPath);

        FileMetadata metadata = fileMetadataService.saveMetadata(
                file, course, currentUser, result.publicUrl(), result.objectPath());
        return ResponseEntity.ok(FileMetadataResponse.from(metadata));
    }

    @GetMapping
    public ResponseEntity<List<FileMetadataResponse>> listFiles(@RequestParam Long courseId) {
        List<FileMetadataResponse> results = fileMetadataRepository.findByCourseId(courseId).stream()
                .map(FileMetadataResponse::from)
                .toList();
        return ResponseEntity.ok(results);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteFile(
            @AuthenticationPrincipal User currentUser,
            @PathVariable Long id) {

        if (currentUser == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Unauthorized");
        }

        FileMetadata metadata = fileMetadataRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "File not found"));

        boolean isAdmin = currentUser.getRole() == Role.ADMIN;
        if (!isAdmin && !metadata.getUploadedBy().getId().equals(currentUser.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied");
        }

        supabaseStorageService.delete(metadata.getObjectPath());
        fileMetadataRepository.delete(metadata);
        return ResponseEntity.noContent().build();
    }

    public record FileMetadataResponse(
            Long id,
            String fileName,
            String fileUrl,
            String fileType,
            Long fileSize,
            String objectPath,
            Long courseId,
            Long uploadedBy,
<<<<<<< HEAD
=======
            String uploadedByName,
>>>>>>> 497b56946d37a33dcc327d902cb7f04f9d06aaea
            String uploadedAt
    ) {
        public static FileMetadataResponse from(FileMetadata metadata) {
            return new FileMetadataResponse(
                    metadata.getId(),
                    metadata.getFileName(),
                    metadata.getFileUrl(),
                    metadata.getFileType(),
                    metadata.getFileSize(),
                    metadata.getObjectPath(),
                    metadata.getCourse().getId(),
                    metadata.getUploadedBy().getId(),
<<<<<<< HEAD
=======
                    metadata.getUploadedBy().getFullName(),
>>>>>>> 497b56946d37a33dcc327d902cb7f04f9d06aaea
                    metadata.getUploadedAt() != null ? metadata.getUploadedAt().toString() : null
            );
        }
    }
}
