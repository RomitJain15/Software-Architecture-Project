package com.rsp.rating;

import com.rsp.file.CourseFile;
import com.rsp.user.User;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "ratings",
       uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "file_id"}))
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Rating {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "file_id", nullable = false)
    private CourseFile file;

    @Column(nullable = false)
    private Integer value;

    @Column(name = "rated_at")
    private LocalDateTime ratedAt;

    @PrePersist
    public void prePersist() {
        this.ratedAt = LocalDateTime.now();
    }
}