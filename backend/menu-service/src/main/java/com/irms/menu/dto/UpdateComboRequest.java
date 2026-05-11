package com.irms.menu.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class UpdateComboRequest {

    @Size(max = 150)
    private String name;

    private String description;

    @DecimalMin("0.0")
    private BigDecimal price;

    private Boolean available;
}
