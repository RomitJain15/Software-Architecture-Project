package com.rsp.backend.controller;

import com.rsp.backend.model.Rating;
import com.rsp.backend.model.User;
import com.rsp.backend.service.RatingService;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;

import java.util.List;

@RestController
@RequestMapping("/api/files/{fileId}/ratings")
@RequiredArgsConstructor
public class RatingController {

    private final RatingService ratingService;

    @PostMapping
    public ResponseEntity<RatingResponse> upsertRating(
            @AuthenticationPrincipal User currentUser,
            @PathVariable Long fileId,
            @Valid @RequestBody RatingRequest request) {

        Rating rating = ratingService.upsertRating(currentUser, fileId, request.userId(), request.value());
        return ResponseEntity.ok(RatingResponse.from(rating));
    }

    @GetMapping
    public ResponseEntity<List<RatingResponse>> listRatings(@PathVariable Long fileId) {
        List<RatingResponse> results = ratingService.listRatings(fileId).stream()
                .map(RatingResponse::from)
                .toList();
        return ResponseEntity.ok(results);
    }

    @GetMapping("/average")
    public ResponseEntity<RatingAverageResponse> getAverage(@PathVariable Long fileId) {
        RatingService.RatingAverage avg = ratingService.getAverage(fileId);
        return ResponseEntity.ok(new RatingAverageResponse(avg.fileId(), avg.count(), avg.average()));
    }

    @DeleteMapping
    public ResponseEntity<Void> deleteRating(
            @AuthenticationPrincipal User currentUser,
            @PathVariable Long fileId,
            @RequestParam(required = false) Long userId) {

        ratingService.deleteRating(currentUser, fileId, userId);
        return ResponseEntity.noContent().build();
    }

    public record RatingRequest(
            Long userId,
            @NotNull @Min(1) @Max(5) Integer value
    ) {}

    public record RatingResponse(
            Long id,
            Long userId,
            Long fileId,
            Integer value,
            String ratedAt
    ) {
        public static RatingResponse from(Rating rating) {
            return new RatingResponse(
                    rating.getId(),
                    rating.getUser().getId(),
                    rating.getFile().getId(),
                    rating.getValue(),
                    rating.getRatedAt() != null ? rating.getRatedAt().toString() : null
            );
        }
    }

    public record RatingAverageResponse(
            Long fileId,
            Integer count,
            Double average
    ) {}
}
