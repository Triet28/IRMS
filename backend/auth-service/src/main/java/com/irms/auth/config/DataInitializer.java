package com.irms.auth.config;

import com.irms.auth.domain.Role;
import com.irms.auth.domain.User;
import com.irms.auth.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

// Seeds default admin account if no users exist yet
@Slf4j
@Component
@RequiredArgsConstructor
public class DataInitializer implements ApplicationRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(ApplicationArguments args) {
        if (userRepository.existsByUsername("admin")) return;

        User admin = User.builder()
                .username("admin")
                .email("admin@irms.com")
                .password(passwordEncoder.encode("admin123"))
                .role(Role.MANAGER)
                .active(true)
                .build();

        userRepository.save(admin);
        log.info("Default admin user created (admin / admin123) — change password before production!");
    }
}
