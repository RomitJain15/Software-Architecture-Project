package com.rsp.backend.repository;

import com.rsp.backend.model.Rating;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface RatingRepository extends JpaRepository<Rating, Long> {
    @EntityGraph(attributePaths = {"user", "file"})
    Optional<Rating> findByUserIdAndFileId(Long userId, Long fileId);

    @EntityGraph(attributePaths = {"user", "file"})
    List<Rating> findByFileId(Long fileId);

    void deleteByFileId(Long fileId);
}