package com.irms.order.client;

import com.irms.order.dto.MenuItemSnapshot;

// DIP: OrderService depends on this interface, not on the HTTP implementation.
// Swappable for a mock in unit tests.
public interface MenuClient {
    MenuItemSnapshot getMenuItem(Long menuItemId);
    MenuItemSnapshot getCombo(Long comboId);
}
