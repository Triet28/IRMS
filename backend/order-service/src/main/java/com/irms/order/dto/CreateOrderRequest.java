package com.irms.order.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class CreateOrderRequest {
    private Long menuItemId;

    private Long comboId;

    @Min(1)
    private int quantity = 1;

    private String notes;
}
