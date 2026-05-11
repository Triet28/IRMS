package com.irms.menu.controller;

import com.irms.menu.dto.ComboDto;
import com.irms.menu.dto.CreateComboRequest;
import com.irms.menu.dto.UpdateComboRequest;
import com.irms.menu.service.ComboService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/combos")
@RequiredArgsConstructor
public class ComboController {

    private final ComboService comboService;

    // Public — Customer App and Order Service use this
    @GetMapping("/available")
    public ResponseEntity<List<ComboDto>> getAvailable() {
        return ResponseEntity.ok(comboService.findAvailable());
    }

    // Public — Order Service calls this to snapshot combo price
    @GetMapping("/{id}")
    public ResponseEntity<ComboDto> getById(@PathVariable Long id) {
        return ResponseEntity.ok(comboService.findById(id));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('WAITER', 'CHEF', 'MANAGER')")
    public ResponseEntity<List<ComboDto>> getAll() {
        return ResponseEntity.ok(comboService.findAll());
    }

    @PostMapping
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<ComboDto> create(@Valid @RequestBody CreateComboRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(comboService.create(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<ComboDto> update(@PathVariable Long id,
                                           @Valid @RequestBody UpdateComboRequest request) {
        return ResponseEntity.ok(comboService.update(id, request));
    }
}
