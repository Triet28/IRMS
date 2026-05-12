package com.irms.menu.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
public class UpdateComboRequest {

    @Size(max = 150)
    private String name;

    private String description;

    @DecimalMin("0.0")
    private BigDecimal price;

    private Boolean available;

    // null = không thay đổi items; non-null = replace toàn bộ
    private List<ItemEntry> items;

    @Data
    public static class ItemEntry {
        private Long menuItemId;
        @Min(1)
        private int quantity = 1;
    }
}
