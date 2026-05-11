package com.irms.menu.service;

import com.irms.menu.domain.Category;
import com.irms.menu.domain.MenuItem;
import com.irms.menu.dto.CreateMenuItemRequest;
import com.irms.menu.dto.MenuItemDto;
import com.irms.menu.dto.UpdateMenuItemRequest;
import com.irms.menu.exception.ResourceNotFoundException;
import com.irms.menu.repository.CategoryRepository;
import com.irms.menu.repository.MenuItemRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class MenuItemServiceImpl implements MenuItemService {

    private final MenuItemRepository menuItemRepository;
    private final CategoryRepository categoryRepository;

    @Override
    @Transactional(readOnly = true)
    public List<MenuItemDto> findAll() {
        return menuItemRepository.findAll().stream().map(this::toDto).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<MenuItemDto> findAvailable() {
        return menuItemRepository.findByAvailableTrue().stream().map(this::toDto).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public MenuItemDto findById(Long id) {
        return toDto(findOrThrow(id));
    }

    @Override
    @Transactional
    public MenuItemDto create(CreateMenuItemRequest request) {
        Category category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Category not found: " + request.getCategoryId()));

        MenuItem item = MenuItem.builder()
                .category(category)
                .name(request.getName())
                .description(request.getDescription())
                .price(request.getPrice())
                .available(true)
                .imageUrl(request.getImageUrl())
                .build();

        return toDto(menuItemRepository.save(item));
    }

    @Override
    @Transactional
    public MenuItemDto update(Long id, UpdateMenuItemRequest request) {
        MenuItem item = findOrThrow(id);

        if (request.getName() != null)      item.setName(request.getName());
        if (request.getDescription() != null) item.setDescription(request.getDescription());
        if (request.getPrice() != null)     item.setPrice(request.getPrice());
        if (request.getAvailable() != null) item.setAvailable(request.getAvailable());
        if (request.getImageUrl() != null)  item.setImageUrl(request.getImageUrl());

        return toDto(menuItemRepository.save(item));
    }

    @Override
    @Transactional
    public void delete(Long id) {
        if (!menuItemRepository.existsById(id)) {
            throw new ResourceNotFoundException("MenuItem not found: " + id);
        }
        menuItemRepository.deleteById(id);
    }

    private MenuItem findOrThrow(Long id) {
        return menuItemRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("MenuItem not found: " + id));
    }

    private MenuItemDto toDto(MenuItem item) {
        MenuItemDto dto = new MenuItemDto();
        dto.setId(item.getId());
        dto.setCategoryId(item.getCategory().getId());
        dto.setCategoryName(item.getCategory().getName());
        dto.setName(item.getName());
        dto.setDescription(item.getDescription());
        dto.setPrice(item.getPrice());
        dto.setAvailable(item.isAvailable());
        dto.setImageUrl(item.getImageUrl());
        return dto;
    }
}
