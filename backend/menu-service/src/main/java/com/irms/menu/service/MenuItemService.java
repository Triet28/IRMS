package com.irms.menu.service;

import com.irms.menu.dto.CreateMenuItemRequest;
import com.irms.menu.dto.MenuItemDto;
import com.irms.menu.dto.UpdateMenuItemRequest;

import java.util.List;

// DIP: controllers depend on this interface
// ISP: interface only exposes operations relevant to menu items
public interface MenuItemService {
    List<MenuItemDto> findAll();
    List<MenuItemDto> findAvailable();
    MenuItemDto findById(Long id);
    MenuItemDto create(CreateMenuItemRequest request);
    MenuItemDto update(Long id, UpdateMenuItemRequest request);
    void delete(Long id);
}
