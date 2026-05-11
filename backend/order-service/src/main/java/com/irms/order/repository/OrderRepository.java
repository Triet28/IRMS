package com.irms.order.repository;

import com.irms.order.domain.Order;
import com.irms.order.domain.OrderStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface OrderRepository extends JpaRepository<Order, Long> {
    List<Order> findBySessionId(Long sessionId);
    List<Order> findBySessionIdAndStatus(Long sessionId, OrderStatus status);
    List<Order> findByStatus(OrderStatus status);
}
