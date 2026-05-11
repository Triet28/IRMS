package com.irms.order.repository;

import com.irms.order.domain.SessionStatus;
import com.irms.order.domain.TableSession;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SessionRepository extends JpaRepository<TableSession, Long> {
    List<TableSession> findByStatus(SessionStatus status);
    List<TableSession> findByStatusIn(List<SessionStatus> statuses);
    List<TableSession> findByTableNumberAndStatus(int tableNumber, SessionStatus status);
    List<TableSession> findByTableNumberAndStatusIn(int tableNumber, List<SessionStatus> statuses);
}
