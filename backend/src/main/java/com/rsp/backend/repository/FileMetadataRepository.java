package com.rsp.backend.repository;

import com.rsp.backend.model.FileMetadata;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface FileMetadataRepository extends JpaRepository<FileMetadata, Long> {
    List<FileMetadata> findByCourseId(Long courseId);
    void deleteByCourseId(Long courseId);

    @Query("SELECT DISTINCT f FROM FileMetadata f "
            + "LEFT JOIN Rating r ON r.file.id = f.id "
            + "WHERE f.course.id = :courseId "
            + "GROUP BY f.id "
            + "ORDER BY COALESCE(AVG(CAST(r.value AS double)), 0) DESC, f.uploadedAt DESC, f.id DESC")
    List<FileMetadata> findByCourseIdOrderByRatingDesc(@Param("courseId") Long courseId);

    @Query("SELECT DISTINCT f FROM FileMetadata f "
            + "LEFT JOIN Rating r ON r.file.id = f.id "
            + "WHERE f.course.id = :courseId "
            + "GROUP BY f.id "
            + "ORDER BY COALESCE(AVG(CAST(r.value AS double)), 0) ASC, f.uploadedAt DESC, f.id DESC")
    List<FileMetadata> findByCourseIdOrderByRatingAsc(@Param("courseId") Long courseId);
}