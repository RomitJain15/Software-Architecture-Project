package com.rsp.backend.config;

import com.rsp.backend.model.Role;
import com.rsp.backend.model.User;
import com.rsp.backend.model.Course;
import com.rsp.backend.repository.CourseRepository;
import com.rsp.backend.repository.EnrollmentRepository;
import com.rsp.backend.repository.FileMetadataRepository;
import com.rsp.backend.repository.RatingRepository;
import com.rsp.backend.repository.UserRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
@RequiredArgsConstructor
public class AdminSeedConfig {

    private static final Logger logger = LoggerFactory.getLogger(AdminSeedConfig.class);

    private final UserRepository userRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final RatingRepository ratingRepository;
    private final CourseRepository courseRepository;
    private final FileMetadataRepository fileMetadataRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.admin.seed.enabled:false}")
    private boolean seedEnabled;

    @Value("${app.admin.seed.reset-users:false}")
    private boolean resetUsers;

    @Value("${app.admin.seed.reset-data:false}")
    private boolean resetData;

    @Value("${app.admin.seed.email:admin@example.com}")
    private String adminEmail;

    @Value("${app.admin.seed.password:admin123}")
    private String adminPassword;

    @Value("${app.admin.seed.name:Admin}")
    private String adminName;

    @Bean
    public CommandLineRunner seedAdminUser() {
        return args -> {
            if (!seedEnabled) {
                return;
            }
            if (resetUsers) {
                ratingRepository.deleteAll();
                enrollmentRepository.deleteAll();
                userRepository.deleteAll();
                logger.warn("All users deleted due to app.admin.seed.reset-users=true");
            }

            if (resetData) {
                fileMetadataRepository.deleteAll();
                courseRepository.deleteAll();
                logger.warn("All files and courses deleted due to app.admin.seed.reset-data=true");
            }

            userRepository.findByEmail(adminEmail).ifPresentOrElse(user -> {
                user.setRole(Role.ADMIN);
                userRepository.save(user);
                logger.info("Admin user already exists: {}", adminEmail);
            }, () -> {
                User admin = User.builder()
                        .fullName(adminName)
                        .email(adminEmail)
                        .password(passwordEncoder.encode(adminPassword))
                        .role(Role.ADMIN)
                        .build();
                userRepository.save(admin);
                logger.info("Admin user created: {}", adminEmail);
            });
        };
    }

    @Value("${app.courses.seed.enabled:true}")
    private boolean coursesSeedEnabled;

    @Bean
    public CommandLineRunner seedCourses() {
        return args -> {
            if (!coursesSeedEnabled && !resetData) return;

            if (resetData) {
                fileMetadataRepository.deleteAll();
                courseRepository.deleteAll();
                logger.warn("All files and courses deleted due to app.admin.seed.reset-data=true");
            }

            if (courseRepository.count() == 0) {
                List<Course> defaults = List.of(
                        Course.builder().name("Computer Networks").courseCode("CS301").description("Introduction to computer networks").build(),
                        Course.builder().name("Operating Systems").courseCode("CS302").description("Operating systems concepts").build(),
                        Course.builder().name("Data Structures").courseCode("CS201").description("Fundamentals of data structures").build(),
                        Course.builder().name("Databases").courseCode("CS303").description("Relational database systems").build(),
                        Course.builder().name("Algorithms").courseCode("CS202").description("Algorithm design and analysis").build()
                );
                courseRepository.saveAll(defaults);
                logger.info("Seeded {} default courses", defaults.size());
            } else {
                logger.info("Courses already present - skipping seeding");
            }
        };
    }
}
