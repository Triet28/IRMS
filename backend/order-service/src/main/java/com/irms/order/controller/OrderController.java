package com.irms.order.controller;

import com.irms.order.dto.CreateOrderRequest;
import com.irms.order.dto.OrderDto;
import com.irms.order.dto.UpdateOrderStatusRequest;
import com.irms.order.service.OrderService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;

    @PostMapping("/session/{sessionId}")
    @PreAuthorize("hasAnyRole('WAITER', 'MANAGER', 'TABLE')")
    public ResponseEntity<OrderDto> createOrder(@PathVariable Long sessionId,
                                                @Valid @RequestBody CreateOrderRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(orderService.createOrder(sessionId, request));
    }

    // Chef view: get all PENDING orders across all sessions
    @GetMapping("/pending")
    @PreAuthorize("hasAnyRole('CHEF', 'MANAGER')")
    public ResponseEntity<List<OrderDto>> getPendingOrders() {
        return ResponseEntity.ok(orderService.getPendingOrders());
    }

    @PatchMapping("/{orderId}/status")
    @PreAuthorize("hasAnyRole('WAITER', 'CHEF', 'MANAGER')")
    public ResponseEntity<OrderDto> updateStatus(@PathVariable Long orderId,
                                                 @Valid @RequestBody UpdateOrderStatusRequest request,
                                                 Authentication auth) {
        // Extract role from Spring Security context
        String role = auth.getAuthorities().stream()
                .findFirst()
                .map(a -> a.getAuthority().replace("ROLE_", ""))
                .orElse("");
        return ResponseEntity.ok(orderService.updateStatus(orderId, request.getStatus(), role));
    }
}
