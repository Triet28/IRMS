package com.irms.auth.service;

import com.irms.auth.dto.*;

import java.util.List;

// DIP: controllers depend on this abstraction, not on UserServiceImpl
// ISP: interface is focused — only methods the auth domain actually needs
public interface UserService {
    LoginResponse login(LoginRequest request);
    UserDto createUser(CreateUserRequest request);
    List<UserDto> findAll();
    UserDto findById(Long id);
    void deactivateUser(Long id);
}
