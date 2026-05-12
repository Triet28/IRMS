package com.irms.billing.service;

import com.irms.billing.client.OrderClient;
import com.irms.billing.domain.Bill;
import com.irms.billing.domain.BillItem;
import com.irms.billing.domain.BillStatus;
import com.irms.billing.domain.PaymentMethod;
import com.irms.billing.dto.BillDto;
import com.irms.billing.dto.BillItemDto;
import com.irms.billing.dto.PaymentRequest;
import com.irms.billing.dto.ServedOrderDto;
import com.irms.billing.exception.BusinessRuleException;
import com.irms.billing.exception.ResourceNotFoundException;
import com.irms.billing.repository.BillRepository;
import com.irms.billing.strategy.DiscountStrategy;
import com.irms.billing.strategy.FixedDiscountStrategy;
import com.irms.billing.strategy.NoDiscountStrategy;
import com.irms.billing.strategy.PercentageDiscountStrategy;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class BillingServiceImpl implements BillingService {

    private final BillRepository billRepository;
    private final OrderClient orderClient;       // DIP: interface, not HTTP impl
    private final BillCalculator billCalculator; // SRP: arithmetic delegated out
    private final NoDiscountStrategy noDiscount; // default strategy

    @Value("${billing.vat-rate:0.10}")
    private BigDecimal vatRate;

    @Override
    @Transactional
    public BillDto createBill(Long sessionId, PaymentRequest request) {
        if (billRepository.existsBySessionId(sessionId)) {
            throw new BusinessRuleException("Bill already exists for session: " + sessionId);
        }

        // Fetch SERVED orders from Order Service (cross-service call, not cross-schema query)
        List<ServedOrderDto> servedOrders = orderClient.getServedOrders(sessionId);
        if (servedOrders.isEmpty()) {
            throw new BusinessRuleException("No served orders found for session: " + sessionId);
        }

        BigDecimal subtotal = servedOrders.stream()
                .map(ServedOrderDto::getSubtotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // OCP: select discount strategy without changing this method
        DiscountStrategy strategy = resolveDiscountStrategy(request);
        BillCalculator.BillResult result = billCalculator.calculate(subtotal, vatRate, strategy);

        Bill bill = Bill.builder()
                .sessionId(sessionId)
                .subtotal(result.subtotal())
                .taxRate(result.taxRate())
                .taxAmount(result.taxAmount())
                .discountAmount(result.discountAmount())
                .total(result.total())
                .status(BillStatus.PENDING_PAYMENT)
                .build();

        List<BillItem> items = servedOrders.stream().map(o -> BillItem.builder()
                .bill(bill)
                .orderId(o.getOrderId())
                .itemName(o.getItemName())
                .quantity(o.getQuantity())
                .unitPrice(o.getUnitPrice())
                .subtotal(o.getSubtotal())
                .build()).toList();
        bill.setItems(items);

        return toDto(billRepository.save(bill));
    }

    @Override
    @Transactional(readOnly = true)
    public BillDto findBySession(Long sessionId) {
        return toDto(billRepository.findBySessionId(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Bill not found for session: " + sessionId)));
    }

    @Override
    @Transactional(readOnly = true)
    public BillDto findById(Long billId) {
        return toDto(billRepository.findById(billId)
                .orElseThrow(() -> new ResourceNotFoundException("Bill not found: " + billId)));
    }

    @Override
    @Transactional(readOnly = true)
    public List<BillDto> findAllPaid() {
        return billRepository.findByStatusOrderByPaidAtDesc(BillStatus.PAID)
                .stream().map(this::toDto).toList();
    }

    @Override
    @Transactional
    public BillDto processPayment(Long billId, PaymentRequest request) {
        Bill bill = billRepository.findById(billId)
                .orElseThrow(() -> new ResourceNotFoundException("Bill not found: " + billId));

        if (bill.getStatus() == BillStatus.PAID) {
            throw new BusinessRuleException("Bill is already PAID — immutable");
        }

        bill.setStatus(BillStatus.PAID);
        bill.setPaymentMethod(PaymentMethod.valueOf(request.getPaymentMethod()));
        bill.setPaidAt(LocalDateTime.now());
        return toDto(billRepository.save(bill));
    }

    // OCP: new discount types only need a new DiscountStrategy class, not a change here
    private DiscountStrategy resolveDiscountStrategy(PaymentRequest request) {
        if (request == null || request.getDiscountType() == null) return noDiscount;
        return switch (request.getDiscountType().toUpperCase()) {
            case "PERCENTAGE" -> new PercentageDiscountStrategy(new BigDecimal(request.getDiscountValue()));
            case "FIXED"      -> new FixedDiscountStrategy(new BigDecimal(request.getDiscountValue()));
            default           -> noDiscount;
        };
    }

    private BillDto toDto(Bill bill) {
        BillDto dto = new BillDto();
        dto.setId(bill.getId());
        dto.setSessionId(bill.getSessionId());
        dto.setSubtotal(bill.getSubtotal());
        dto.setTaxRate(bill.getTaxRate());
        dto.setTaxAmount(bill.getTaxAmount());
        dto.setDiscountAmount(bill.getDiscountAmount());
        dto.setTotal(bill.getTotal());
        dto.setStatus(bill.getStatus().name());
        dto.setPaymentMethod(bill.getPaymentMethod() != null ? bill.getPaymentMethod().name() : null);
        dto.setCreatedAt(bill.getCreatedAt());
        dto.setPaidAt(bill.getPaidAt());
        dto.setItems(bill.getItems().stream().map(i -> {
            BillItemDto id = new BillItemDto();
            id.setOrderId(i.getOrderId());
            id.setItemName(i.getItemName());
            id.setQuantity(i.getQuantity());
            id.setUnitPrice(i.getUnitPrice());
            id.setSubtotal(i.getSubtotal());
            return id;
        }).toList());
        return dto;
    }
}
