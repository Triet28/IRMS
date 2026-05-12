package com.irms.billing.service;

import com.irms.billing.dto.BillDto;
import com.irms.billing.dto.PaymentRequest;

import java.util.List;

// DIP: controller depends on this interface
public interface BillingService {
    BillDto createBill(Long sessionId, PaymentRequest request);
    BillDto findBySession(Long sessionId);
    BillDto findById(Long billId);
    BillDto processPayment(Long billId, PaymentRequest request);
    List<BillDto> findAllPaid();
}
