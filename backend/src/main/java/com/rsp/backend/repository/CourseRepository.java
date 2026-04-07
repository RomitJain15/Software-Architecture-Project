package com.rsp.backend.repository;

import com.rsp.backend.model.Course;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CourseRepository extends JpaRepository<Course, Long> {
	boolean existsByNameIgnoreCase(String name);
	boolean existsByCourseCodeIgnoreCase(String courseCode);
	boolean existsByNameIgnoreCaseAndIdNot(String name, Long id);
	boolean existsByCourseCodeIgnoreCaseAndIdNot(String courseCode, Long id);
}