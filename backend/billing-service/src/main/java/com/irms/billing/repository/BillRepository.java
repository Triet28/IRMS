package com.irms.billing.repository;

import com.irms.billing.domain.Bill;
import com.irms.billing.domain.BillStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface BillRepository extends JpaRepository<Bill, Long> {
    Optional<Bill> findBySessionId(Long sessionId);
    boolean existsBySessionId(Long sessionId);
    List<Bill> findByStatusOrderByPaidAtDesc(BillStatus status);
}
