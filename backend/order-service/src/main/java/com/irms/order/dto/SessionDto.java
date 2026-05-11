package com.irms.order.dto;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class SessionDto {
    private Long id;
    private int tableNumber;
    private Long waiterId;
    private String status;
    private String tableToken;
    private LocalDateTime openedAt;
    private LocalDateTime closedAt;
}
