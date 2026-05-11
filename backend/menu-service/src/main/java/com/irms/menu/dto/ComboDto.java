package com.irms.menu.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
public class ComboDto {
    private Long id;
    private String name;
    private String description;
    private BigDecimal price;
    private boolean available;
    private List<ComboItemDto> items;
}
