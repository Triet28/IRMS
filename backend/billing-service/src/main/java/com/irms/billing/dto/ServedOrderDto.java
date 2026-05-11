package com.irms.billing.dto;

import lombok.Data;

import java.math.BigDecimal;

// Mirror of the DTO that Order Service returns
@Data
public class ServedOrderDto {
    private Long orderId;
    private String itemName;
    private BigDecimal unitPrice;
    private int quantity;
    private BigDecimal subtotal;
}
