package com.irms.billing.controller;

import com.irms.billing.dto.BillDto;
import com.irms.billing.dto.PaymentRequest;
import com.irms.billing.service.BillingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/bills")
@RequiredArgsConstructor
public class BillingController {

    private final BillingService billingService;

    @PostMapping("/session/{sessionId}")
    @PreAuthorize("hasAnyRole('WAITER', 'MANAGER')")
    public ResponseEntity<BillDto> createBill(@PathVariable Long sessionId,
                                              @RequestBody(required = false) PaymentRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(billingService.createBill(sessionId, request));
    }

    @GetMapping("/session/{sessionId}")
    @PreAuthorize("hasAnyRole('WAITER', 'MANAGER')")
    public ResponseEntity<BillDto> getBillBySession(@PathVariable Long sessionId) {
        return ResponseEntity.ok(billingService.findBySession(sessionId));
    }

    @GetMapping("/{billId}")
    @PreAuthorize("hasAnyRole('WAITER', 'MANAGER')")
    public ResponseEntity<BillDto> getBillById(@PathVariable Long billId) {
        return ResponseEntity.ok(billingService.findById(billId));
    }

    @PostMapping("/{billId}/pay")
    @PreAuthorize("hasAnyRole('WAITER', 'MANAGER')")
    public ResponseEntity<BillDto> pay(@PathVariable Long billId,
                                       @Valid @RequestBody PaymentRequest request) {
        return ResponseEntity.ok(billingService.processPayment(billId, request));
    }
}
