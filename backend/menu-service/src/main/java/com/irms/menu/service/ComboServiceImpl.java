package com.irms.menu.service;

import com.irms.menu.domain.Combo;
import com.irms.menu.domain.ComboItemEntry;
import com.irms.menu.domain.ComboItemKey;
import com.irms.menu.domain.MenuItem;
import com.irms.menu.dto.ComboDto;
import com.irms.menu.dto.ComboItemDto;
import com.irms.menu.dto.CreateComboRequest;
import com.irms.menu.dto.UpdateComboRequest;
import com.irms.menu.exception.ResourceNotFoundException;
import com.irms.menu.repository.ComboRepository;
import com.irms.menu.repository.MenuItemRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ComboServiceImpl implements ComboService {

    private final ComboRepository comboRepository;
    private final MenuItemRepository menuItemRepository;

    @Override
    public List<ComboDto> findAll() {
        return comboRepository.findAll().stream().map(this::toDto).toList();
    }

    @Override
    public List<ComboDto> findAvailable() {
        return comboRepository.findByAvailableTrue().stream().map(this::toDto).toList();
    }

    @Override
    public ComboDto findById(Long id) {
        return toDto(findOrThrow(id));
    }

    @Override
    @Transactional
    public ComboDto create(CreateComboRequest request) {
        Combo combo = new Combo();
        combo.setName(request.getName());
        combo.setDescription(request.getDescription());
        combo.setPrice(request.getPrice());
        combo.setAvailable(true);
        combo = comboRepository.save(combo);

        for (CreateComboRequest.ItemEntry entry : request.getItems()) {
            MenuItem item = menuItemRepository.findById(entry.getMenuItemId())
                    .orElseThrow(() -> new ResourceNotFoundException("Menu item not found: " + entry.getMenuItemId()));
            ComboItemEntry comboItem = new ComboItemEntry();
            comboItem.setId(new ComboItemKey(combo.getId(), item.getId()));
            comboItem.setCombo(combo);
            comboItem.setMenuItem(item);
            comboItem.setQuantity(entry.getQuantity());
            combo.getItems().add(comboItem);
        }

        return toDto(comboRepository.save(combo));
    }

    @Override
    @Transactional
    public ComboDto update(Long id, UpdateComboRequest request) {
        Combo combo = findOrThrow(id);
        if (request.getName()        != null) combo.setName(request.getName());
        if (request.getDescription() != null) combo.setDescription(request.getDescription());
        if (request.getPrice()       != null) combo.setPrice(request.getPrice());
        if (request.getAvailable()   != null) combo.setAvailable(request.getAvailable());

        // Replace items nếu client gửi danh sách mới
        if (request.getItems() != null) {
            combo.getItems().clear();
            for (UpdateComboRequest.ItemEntry entry : request.getItems()) {
                MenuItem item = menuItemRepository.findById(entry.getMenuItemId())
                        .orElseThrow(() -> new ResourceNotFoundException(
                                "Menu item not found: " + entry.getMenuItemId()));
                ComboItemEntry comboItem = new ComboItemEntry();
                comboItem.setId(new ComboItemKey(combo.getId(), item.getId()));
                comboItem.setCombo(combo);
                comboItem.setMenuItem(item);
                comboItem.setQuantity(entry.getQuantity());
                combo.getItems().add(comboItem);
            }
        }

        return toDto(comboRepository.save(combo));
    }

    private Combo findOrThrow(Long id) {
        return comboRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Combo not found: " + id));
    }

    private ComboDto toDto(Combo c) {
        ComboDto dto = new ComboDto();
        dto.setId(c.getId());
        dto.setName(c.getName());
        dto.setDescription(c.getDescription());
        dto.setPrice(c.getPrice());
        dto.setAvailable(c.isAvailable());
        dto.setItems(c.getItems().stream().map(ci -> {
            ComboItemDto itemDto = new ComboItemDto();
            itemDto.setMenuItemId(ci.getMenuItem().getId());
            itemDto.setMenuItemName(ci.getMenuItem().getName());
            itemDto.setQuantity(ci.getQuantity());
            return itemDto;
        }).toList());
        return dto;
    }
}
