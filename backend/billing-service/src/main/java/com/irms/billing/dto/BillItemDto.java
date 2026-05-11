package com.irms.billing.dto;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class BillItemDto {
    private Long orderId;
    private String itemName;
    private int quantity;
    private BigDecimal unitPrice;
    private BigDecimal subtotal;
}
