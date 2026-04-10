package com.rsp.backend.repository;

import com.rsp.backend.model.Enrollment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface EnrollmentRepository extends JpaRepository<Enrollment, Long> {
    @EntityGraph(attributePaths = {"user", "course"})
    List<Enrollment> findByUserId(Long userId);

    @EntityGraph(attributePaths = {"user", "course"})
    List<Enrollment> findByCourseId(Long courseId);

    @EntityGraph(attributePaths = {"user", "course"})
    Optional<Enrollment> findByUserIdAndCourseId(Long userId, Long courseId);

    boolean existsByUserIdAndCourseId(Long userId, Long courseId);

    @Override
    @EntityGraph(attributePaths = {"user", "course"})
    Optional<Enrollment> findById(Long id);

    void deleteByCourseId(Long courseId);
}