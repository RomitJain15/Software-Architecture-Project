package com.rsp.backend.service;

import com.rsp.backend.model.FileMetadata;
import com.rsp.backend.model.Rating;
import com.rsp.backend.model.Role;
import com.rsp.backend.model.User;
import com.rsp.backend.repository.EnrollmentRepository;
import com.rsp.backend.repository.FileMetadataRepository;
import com.rsp.backend.repository.RatingRepository;
import com.rsp.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
@RequiredArgsConstructor
public class RatingService {

    private final RatingRepository ratingRepository;
    private final FileMetadataRepository fileMetadataRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final UserRepository userRepository;

    public Rating upsertRating(User currentUser, Long fileId, Long requestedUserId, Integer value) {
        if (currentUser == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Unauthorized");
        }
        if (value == null || value < 1 || value > 5) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Rating value must be 1-5");
        }

        FileMetadata file = fileMetadataRepository.findById(fileId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "File not found"));

        Long targetUserId = resolveTargetUserId(currentUser, requestedUserId);

        if (!isAdmin(currentUser) &&
                !enrollmentRepository.existsByUserIdAndCourseId(targetUserId, file.getCourse().getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Enrollment required to rate");
        }

        User targetUser = userRepository.findById(targetUserId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        Rating rating = ratingRepository.findByUserIdAndFileId(targetUserId, fileId)
            .orElseGet(() -> Rating.builder()
                .user(targetUser)
                .file(file)
                .build());

        rating.setValue(value);
        return ratingRepository.save(rating);
    }

    public List<Rating> listRatings(Long fileId) {
        return ratingRepository.findByFileId(fileId);
    }

    public RatingAverage getAverage(Long fileId) {
        List<Rating> ratings = ratingRepository.findByFileId(fileId);
        if (ratings.isEmpty()) {
            return new RatingAverage(fileId, 0, 0.0);
        }
        double avg = ratings.stream().mapToInt(Rating::getValue).average().orElse(0.0);
        return new RatingAverage(fileId, ratings.size(), avg);
    }

    public void deleteRating(User currentUser, Long fileId, Long requestedUserId) {
        if (currentUser == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Unauthorized");
        }
        Long targetUserId = resolveTargetUserId(currentUser, requestedUserId);
        Rating rating = ratingRepository.findByUserIdAndFileId(targetUserId, fileId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Rating not found"));
        ratingRepository.delete(rating);
    }

    private boolean isAdmin(User currentUser) {
        return currentUser.getRole() == Role.ADMIN;
    }

    private Long resolveTargetUserId(User currentUser, Long requestedUserId) {
        if (isAdmin(currentUser)) {
            return requestedUserId != null ? requestedUserId : currentUser.getId();
        }
        if (requestedUserId != null && !requestedUserId.equals(currentUser.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied");
        }
        return currentUser.getId();
    }

    public record RatingAverage(Long fileId, int count, double average) {}
}
