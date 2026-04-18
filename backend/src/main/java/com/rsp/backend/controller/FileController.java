package com.rsp.backend.controller;

import com.rsp.backend.model.Course;
import com.rsp.backend.model.FileMetadata;
import com.rsp.backend.model.Role;
import com.rsp.backend.model.User;
import com.rsp.backend.repository.CourseRepository;
import com.rsp.backend.repository.EnrollmentRepository;
import com.rsp.backend.repository.FileMetadataRepository;
import com.rsp.backend.repository.RatingRepository;
import com.rsp.backend.service.FileMetadataService;
import com.rsp.backend.service.SupabaseStorageService;
import com.rsp.backend.cache.FileMetadataCacheService;
import lombok.RequiredArgsConstructor;
import com.rsp.backend.dto.FileMetadataResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/files")
@RequiredArgsConstructor
public class FileController {

    private final SupabaseStorageService supabaseStorageService;
    private final FileMetadataService fileMetadataService;
    private final CourseRepository courseRepository;
    private final FileMetadataRepository fileMetadataRepository;
    private final RatingRepository ratingRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final FileMetadataCacheService fileMetadataCacheService;

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
    public ResponseEntity<List<FileMetadataResponse>> listFiles(
            @RequestParam Long courseId,
            @RequestParam(required = false) String sortBy,
            @RequestParam(required = false) String direction) {
        var results = fileMetadataCacheService.getFilesByCourse(courseId);
        return ResponseEntity.ok(results);
    }

    @GetMapping("/search")
    public ResponseEntity<List<FileMetadataResponse>> searchFiles(
            @RequestParam String q,
            @RequestParam(required = false) Long courseId) {
        var results = fileMetadataService.searchFiles(q, courseId).stream()
                .map(FileMetadataResponse::from)
                .collect(Collectors.toList());
        return ResponseEntity.ok(results);
    }

    @DeleteMapping("/{id}")
    @Transactional
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

        ratingRepository.deleteByFileId(id);
        ratingRepository.flush();
        fileMetadataRepository.delete(metadata);
        fileMetadataRepository.flush();
        supabaseStorageService.delete(metadata.getObjectPath());
        try {
            fileMetadataCacheService.evictFilesByCourse(metadata.getCourse().getId());
        } catch (Exception ignored) {}
        return ResponseEntity.noContent().build();
    }

    
}
