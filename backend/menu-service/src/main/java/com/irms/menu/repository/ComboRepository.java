package com.irms.menu.repository;

import com.irms.menu.domain.Combo;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ComboRepository extends JpaRepository<Combo, Long> {
    List<Combo> findByAvailableTrue();
}
