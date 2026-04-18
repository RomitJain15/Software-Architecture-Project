package com.rsp.backend.dto;

import com.rsp.backend.model.FileMetadata;

public record FileMetadataResponse(
        Long id,
        String fileName,
        String fileUrl,
        String fileType,
        Long fileSize,
        String objectPath,
        Long courseId,
        Long uploadedBy,
        String uploadedByName,
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
                metadata.getCourse() != null ? metadata.getCourse().getId() : null,
                metadata.getUploadedBy() != null ? metadata.getUploadedBy().getId() : null,
                metadata.getUploadedBy() != null ? metadata.getUploadedBy().getFullName() : null,
                metadata.getUploadedAt() != null ? metadata.getUploadedAt().toString() : null
        );
    }
}
