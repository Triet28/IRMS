package com.irms.order.controller;

import com.irms.order.dto.OrderDto;
import com.irms.order.dto.ServedOrderDto;
import com.irms.order.dto.SessionDto;
import com.irms.order.service.OrderService;
import com.irms.order.service.SessionService;
import io.jsonwebtoken.Claims;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/sessions")
@RequiredArgsConstructor
public class SessionController {

    private final SessionService sessionService;
    private final OrderService orderService;

    @PostMapping
    @PreAuthorize("hasAnyRole('WAITER', 'MANAGER')")
    public ResponseEntity<SessionDto> openSession(@RequestParam int tableNumber,
                                                  HttpServletRequest request) {
        Long waiterId = extractUserId(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(sessionService.openSession(tableNumber, waiterId));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('WAITER', 'CHEF', 'MANAGER')")
    public ResponseEntity<List<SessionDto>> getActiveSessions() {
        return ResponseEntity.ok(sessionService.findActiveSessions());
    }

    // Returns ACTIVE + BILL_REQUESTED — used by Manager and Waiter
    @GetMapping("/open")
    @PreAuthorize("hasAnyRole('WAITER', 'MANAGER')")
    public ResponseEntity<List<SessionDto>> getOpenSessions() {
        return ResponseEntity.ok(sessionService.findOpenSessions());
    }

    // Called by Customer App on QR scan — public, no token required yet
    @GetMapping("/table/{tableNumber}")
    public ResponseEntity<SessionDto> getSessionByTable(@PathVariable int tableNumber) {
        return ResponseEntity.ok(sessionService.findOpenByTableNumber(tableNumber));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('WAITER', 'CHEF', 'MANAGER', 'TABLE')")
    public ResponseEntity<SessionDto> getSession(@PathVariable Long id) {
        return ResponseEntity.ok(sessionService.findById(id));
    }

    @GetMapping("/{id}/orders")
    @PreAuthorize("hasAnyRole('WAITER', 'CHEF', 'MANAGER', 'TABLE')")
    public ResponseEntity<List<OrderDto>> getSessionOrders(@PathVariable Long id) {
        return ResponseEntity.ok(orderService.getOrdersBySession(id));
    }

    // Called by Customer App (table token) to request bill
    @PostMapping("/{id}/request-bill")
    @PreAuthorize("hasAnyRole('WAITER', 'MANAGER', 'TABLE')")
    public ResponseEntity<SessionDto> requestBill(@PathVariable Long id) {
        return ResponseEntity.ok(sessionService.requestBill(id));
    }

    // Called by Billing Service (internal) — no token, protected by permitAll in SecurityConfig
    @GetMapping("/{id}/served-orders")
    public ResponseEntity<List<ServedOrderDto>> getServedOrders(@PathVariable Long id) {
        return ResponseEntity.ok(sessionService.getServedOrders(id));
    }

    @PostMapping("/{id}/close")
    @PreAuthorize("hasAnyRole('WAITER', 'MANAGER')")
    public ResponseEntity<SessionDto> closeSession(@PathVariable Long id) {
        return ResponseEntity.ok(sessionService.closeSession(id));
    }

    private Long extractUserId(HttpServletRequest request) {
        Object attr = request.getAttribute("userId");
        if (attr instanceof Long id) return id;
        return 0L; // fallback — real userId is set by JwtAuthenticationFilter attribute
    }
}
