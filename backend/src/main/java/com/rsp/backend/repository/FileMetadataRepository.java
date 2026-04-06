package com.rsp.backend.repository;

import com.rsp.backend.model.FileMetadata;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface FileMetadataRepository extends JpaRepository<FileMetadata, Long> {
    List<FileMetadata> findByCourseId(Long courseId);
<<<<<<< HEAD
=======
    void deleteByCourseId(Long courseId);
>>>>>>> 497b56946d37a33dcc327d902cb7f04f9d06aaea
}