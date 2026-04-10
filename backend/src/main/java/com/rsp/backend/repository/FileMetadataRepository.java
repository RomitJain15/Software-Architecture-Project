package com.rsp.backend.repository;

import com.rsp.backend.model.FileMetadata;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface FileMetadataRepository extends JpaRepository<FileMetadata, Long> {
        @EntityGraph(attributePaths = {"course", "uploadedBy"})
    List<FileMetadata> findByCourseId(Long courseId);

    void deleteByCourseId(Long courseId);

        @Override
        @EntityGraph(attributePaths = {"course", "uploadedBy"})
        Optional<FileMetadata> findById(Long id);

    @Query("SELECT f FROM FileMetadata f "
            + "LEFT JOIN Rating r ON r.file.id = f.id "
            + "WHERE f.course.id = :courseId "
            + "GROUP BY f.id "
            + "ORDER BY COALESCE(AVG(CAST(r.value AS double)), 0) DESC, f.uploadedAt DESC, f.id DESC")
    @EntityGraph(attributePaths = {"course", "uploadedBy"})
    List<FileMetadata> findByCourseIdOrderByRatingDesc(@Param("courseId") Long courseId);

    @Query("SELECT f FROM FileMetadata f "
            + "LEFT JOIN Rating r ON r.file.id = f.id "
            + "WHERE f.course.id = :courseId "
            + "GROUP BY f.id "
            + "ORDER BY COALESCE(AVG(CAST(r.value AS double)), 0) ASC, f.uploadedAt DESC, f.id DESC")
        @EntityGraph(attributePaths = {"course", "uploadedBy"})
    List<FileMetadata> findByCourseIdOrderByRatingAsc(@Param("courseId") Long courseId);
}