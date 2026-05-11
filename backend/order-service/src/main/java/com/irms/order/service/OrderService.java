package com.irms.order.service;

import com.irms.order.dto.CreateOrderRequest;
import com.irms.order.dto.OrderDto;

import java.util.List;

// ISP: order operations are separated from session operations
public interface OrderService {
    OrderDto createOrder(Long sessionId, CreateOrderRequest request);
    List<OrderDto> getOrdersBySession(Long sessionId);
    List<OrderDto> getPendingOrders();
    OrderDto updateStatus(Long orderId, String newStatus, String role);
}
