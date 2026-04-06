package com.rsp.backend.config;

import com.rsp.backend.model.Role;
import com.rsp.backend.model.User;
import com.rsp.backend.repository.EnrollmentRepository;
import com.rsp.backend.repository.RatingRepository;
import com.rsp.backend.repository.UserRepository;
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
    private final PasswordEncoder passwordEncoder;

    @Value("${app.admin.seed.enabled:false}")
    private boolean seedEnabled;

    @Value("${app.admin.seed.reset-users:false}")
    private boolean resetUsers;

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
}
