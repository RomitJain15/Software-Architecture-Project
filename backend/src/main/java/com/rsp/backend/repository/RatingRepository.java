package com.rsp.backend.repository;

import com.rsp.backend.model.Rating;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface RatingRepository extends JpaRepository<Rating, Long> {
    Optional<Rating> findByUserIdAndFileId(Long userId, Long fileId);
    List<Rating> findByFileId(Long fileId);
<<<<<<< HEAD
=======
    void deleteByFileId(Long fileId);
>>>>>>> 497b56946d37a33dcc327d902cb7f04f9d06aaea
}