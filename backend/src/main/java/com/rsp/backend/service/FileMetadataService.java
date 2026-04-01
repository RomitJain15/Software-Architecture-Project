package com.rsp.backend.service;

import com.rsp.backend.model.Course;
import com.rsp.backend.model.FileMetadata;
import com.rsp.backend.model.User;
import com.rsp.backend.repository.FileMetadataRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

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
}
