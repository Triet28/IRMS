package com.irms.order.dto;

import lombok.Data;

import java.math.BigDecimal;

// Used by Billing Service when it calls GET /api/sessions/{id}/served-orders
@Data
public class ServedOrderDto {
    private Long orderId;
    private String itemName;
    private BigDecimal unitPrice;
    private int quantity;
    private BigDecimal subtotal;
}
