package com.irms.billing.repository;

import com.irms.billing.domain.Bill;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface BillRepository extends JpaRepository<Bill, Long> {
    Optional<Bill> findBySessionId(Long sessionId);
    boolean existsBySessionId(Long sessionId);
}
