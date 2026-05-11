package com.irms.order.client;

import com.irms.order.dto.MenuItemSnapshot;
import com.irms.order.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

// Concrete HTTP implementation — only this class knows about the network call
@Slf4j
@Component
@RequiredArgsConstructor
public class MenuClientImpl implements MenuClient {

    private final RestTemplate restTemplate;

    @Value("${menu-service.url}")
    private String menuServiceUrl;

    @Override
    public MenuItemSnapshot getMenuItem(Long menuItemId) {
        try {
            return restTemplate.getForObject(
                    menuServiceUrl + "/api/menu-items/" + menuItemId,
                    MenuItemSnapshot.class
            );
        } catch (HttpClientErrorException.NotFound e) {
            throw new ResourceNotFoundException("Menu item not found: " + menuItemId);
        } catch (Exception e) {
            log.error("Failed to fetch menu item {}: {}", menuItemId, e.getMessage());
            throw new RuntimeException("Menu service unavailable");
        }
    }

    @Override
    public MenuItemSnapshot getCombo(Long comboId) {
        try {
            return restTemplate.getForObject(
                    menuServiceUrl + "/api/combos/" + comboId,
                    MenuItemSnapshot.class
            );
        } catch (HttpClientErrorException.NotFound e) {
            throw new ResourceNotFoundException("Combo not found: " + comboId);
        } catch (Exception e) {
            log.error("Failed to fetch combo {}: {}", comboId, e.getMessage());
            throw new RuntimeException("Menu service unavailable");
        }
    }
}
