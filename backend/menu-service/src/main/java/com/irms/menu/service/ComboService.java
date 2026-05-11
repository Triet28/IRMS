package com.irms.menu.service;

import com.irms.menu.dto.ComboDto;
import com.irms.menu.dto.CreateComboRequest;
import com.irms.menu.dto.UpdateComboRequest;

import java.util.List;

public interface ComboService {
    List<ComboDto> findAll();
    List<ComboDto> findAvailable();
    ComboDto findById(Long id);
    ComboDto create(CreateComboRequest request);
    ComboDto update(Long id, UpdateComboRequest request);
}
