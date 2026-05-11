package com.irms.order.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class OrderDto {
    private Long id;
    private Long sessionId;
    private Long menuItemId;
    private String menuItemName;
    private BigDecimal menuItemPrice;
    private int quantity;
    private String status;
    private String notes;
    private boolean combo;
    private LocalDateTime createdAt;
}
