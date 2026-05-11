package com.irms.menu.controller;

import com.irms.menu.dto.CreateMenuItemRequest;
import com.irms.menu.dto.MenuItemDto;
import com.irms.menu.dto.UpdateMenuItemRequest;
import com.irms.menu.service.MenuItemService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/menu-items")
@RequiredArgsConstructor
public class MenuItemController {

    private final MenuItemService menuItemService;

    // Customer App and staff can browse available items (no auth required)
    @GetMapping("/available")
    public ResponseEntity<List<MenuItemDto>> getAvailable() {
        return ResponseEntity.ok(menuItemService.findAvailable());
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('WAITER', 'CHEF', 'MANAGER')")
    public ResponseEntity<List<MenuItemDto>> getAll() {
        return ResponseEntity.ok(menuItemService.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<MenuItemDto> getById(@PathVariable Long id) {
        return ResponseEntity.ok(menuItemService.findById(id));
    }

    @PostMapping
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<MenuItemDto> create(@Valid @RequestBody CreateMenuItemRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(menuItemService.create(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<MenuItemDto> update(@PathVariable Long id,
                                              @Valid @RequestBody UpdateMenuItemRequest request) {
        return ResponseEntity.ok(menuItemService.update(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        menuItemService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
