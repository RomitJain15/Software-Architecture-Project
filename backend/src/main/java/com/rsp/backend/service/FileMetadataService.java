package com.rsp.backend.service;

import com.rsp.backend.model.Course;
import com.rsp.backend.model.FileMetadata;
import com.rsp.backend.model.User;
import com.rsp.backend.repository.FileMetadataRepository;
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

        return fileMetadataRepository.save(metadata);
    }

    public List<FileMetadata> listFilesByCourse(Long courseId, String sortBy, String direction) {
        return fileMetadataRepository.findByCourseId(courseId);
    }
}
