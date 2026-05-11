package com.irms.auth.repository;

import com.irms.auth.domain.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

// ISP: repository stays focused — only queries needed by the domain
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByUsername(String username);
    boolean existsByUsername(String username);
    boolean existsByEmail(String email);
}
