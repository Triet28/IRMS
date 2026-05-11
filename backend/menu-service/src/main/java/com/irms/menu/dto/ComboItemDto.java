package com.irms.menu.dto;

import lombok.Data;

@Data
public class ComboItemDto {
    private Long menuItemId;
    private String menuItemName;
    private int quantity;
}
