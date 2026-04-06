package com.rsp.backend.service;

import com.rsp.backend.model.Course;
import com.rsp.backend.repository.CourseRepository;
import com.rsp.backend.repository.EnrollmentRepository;
import com.rsp.backend.repository.FileMetadataRepository;
import com.rsp.backend.repository.RatingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CourseService {

    private final CourseRepository courseRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final FileMetadataRepository fileMetadataRepository;
    private final RatingRepository ratingRepository;

    public Course createCourse(Course course) {
        if (courseRepository.existsByNameIgnoreCase(course.getName())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Course name already exists");
        }
        if (course.getCourseCode() != null &&
                courseRepository.existsByCourseCodeIgnoreCase(course.getCourseCode())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Course code already exists");
        }
        return courseRepository.save(course);
    }

    public List<Course> getAllCourses() {
        return courseRepository.findAll();
    }

    public Course getCourse(Long id) {
        return courseRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Course not found"));
    }

    @Transactional
    public Course updateCourse(Long id, Course updated) {
        var course = getCourse(id);

        if (updated.getName() != null &&
                courseRepository.existsByNameIgnoreCaseAndIdNot(updated.getName(), id)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Course name already exists");
        }
        if (updated.getCourseCode() != null &&
                courseRepository.existsByCourseCodeIgnoreCaseAndIdNot(updated.getCourseCode(), id)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Course code already exists");
        }

        course.setName(updated.getName());
        course.setDescription(updated.getDescription());
        course.setCourseCode(updated.getCourseCode());
        return courseRepository.save(course);
    }

    @Transactional
    public void deleteCourse(Long id) {
        if (!courseRepository.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Course not found");
        }
        var files = fileMetadataRepository.findByCourseId(id);
        for (var file : files) {
            ratingRepository.deleteByFileId(file.getId());
        }
        fileMetadataRepository.deleteByCourseId(id);
        enrollmentRepository.deleteByCourseId(id);
        courseRepository.deleteById(id);
    }
}
