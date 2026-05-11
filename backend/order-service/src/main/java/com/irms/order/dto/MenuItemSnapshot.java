package com.irms.order.dto;

import lombok.Data;

import java.math.BigDecimal;

// Data Transfer Object used internally when fetching from Menu Service
@Data
public class MenuItemSnapshot {
    private Long id;
    private String name;
    private BigDecimal price;
    private boolean available;
}
