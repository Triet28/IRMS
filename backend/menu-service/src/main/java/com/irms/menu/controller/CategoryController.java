package com.irms.menu.controller;

import com.irms.menu.domain.Category;
import com.irms.menu.dto.CategoryDto;
import com.irms.menu.repository.CategoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/categories")
@RequiredArgsConstructor
public class CategoryController {

    private final CategoryRepository categoryRepository;

    @GetMapping
    public ResponseEntity<List<CategoryDto>> getAll() {
        List<CategoryDto> result = categoryRepository.findAll().stream()
            .sorted((a, b) -> Integer.compare(a.getDisplayOrder(), b.getDisplayOrder()))
            .map(c -> {
                CategoryDto dto = new CategoryDto();
                dto.setId(c.getId());
                dto.setName(c.getName());
                dto.setDescription(c.getDescription());
                dto.setDisplayOrder(c.getDisplayOrder());
                return dto;
            })
            .toList();
        return ResponseEntity.ok(result);
    }
}
