package com.irms.auth.dto;

import lombok.Data;

import java.time.LocalDateTime;

// DTO pattern: entity never leaks outside the service layer
@Data
public class UserDto {
    private Long id;
    private String username;
    private String email;
    private String role;
    private boolean active;
    private LocalDateTime createdAt;
}
