package com.irms.order.service;

import com.irms.order.client.MenuClient;
import com.irms.order.domain.Order;
import com.irms.order.domain.OrderStatus;
import com.irms.order.domain.SessionStatus;
import com.irms.order.domain.TableSession;
import com.irms.order.dto.CreateOrderRequest;
import com.irms.order.dto.MenuItemSnapshot;
import com.irms.order.dto.OrderDto;
import com.irms.order.exception.BusinessRuleException;
import com.irms.order.exception.ResourceNotFoundException;
import com.irms.order.repository.OrderRepository;
import com.irms.order.repository.SessionRepository;
import com.irms.order.validator.OrderStatusValidator;
import com.irms.order.websocket.OrderEventPublisher;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class OrderServiceImpl implements OrderService {

    private final OrderRepository orderRepository;
    private final SessionRepository sessionRepository;
    private final MenuClient menuClient;                 // DIP: interface, not impl
    private final OrderStatusValidator statusValidator;  // SRP: validation delegated out
    private final OrderEventPublisher eventPublisher;

    @Override
    @Transactional
    public OrderDto createOrder(Long sessionId, CreateOrderRequest request) {
        TableSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Session not found: " + sessionId));

        if (session.getStatus() != SessionStatus.ACTIVE) {
            throw new BusinessRuleException("Cannot add orders to a non-ACTIVE session");
        }

        // Validate: exactly one of menuItemId / comboId must be set
        boolean hasItem  = request.getMenuItemId() != null;
        boolean hasCombo = request.getComboId()    != null;
        if (!hasItem && !hasCombo) {
            throw new BusinessRuleException("Either menuItemId or comboId must be provided");
        }
        if (hasItem && hasCombo) {
            throw new BusinessRuleException("Only one of menuItemId or comboId can be specified");
        }

        // Fetch and snapshot price — never query menu_schema directly
        boolean isCombo = hasCombo;
        MenuItemSnapshot item = isCombo
                ? menuClient.getCombo(request.getComboId())
                : menuClient.getMenuItem(request.getMenuItemId());

        if (!item.isAvailable()) {
            throw new BusinessRuleException((isCombo ? "Combo" : "Menu item") + " is not available: " + item.getName());
        }

        Order order = Order.builder()
                .session(session)
                .menuItemId(item.getId())
                .menuItemName(item.getName())
                .menuItemPrice(item.getPrice())
                .quantity(request.getQuantity())
                .notes(request.getNotes())
                .status(OrderStatus.PENDING)
                .combo(isCombo)
                .build();

        order = orderRepository.save(order);
        eventPublisher.publishOrderCreated(sessionId, order.getId(), order.getMenuItemName());
        return toDto(order);
    }

    @Override
    @Transactional(readOnly = true)
    public List<OrderDto> getOrdersBySession(Long sessionId) {
        return orderRepository.findBySessionId(sessionId).stream().map(this::toDto).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<OrderDto> getPendingOrders() {
        return orderRepository.findByStatus(OrderStatus.PENDING)
                .stream().map(this::toDto).toList();
    }

    @Override
    @Transactional
    public OrderDto updateStatus(Long orderId, String newStatusStr, String role) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found: " + orderId));

        OrderStatus newStatus;
        try {
            newStatus = OrderStatus.valueOf(newStatusStr.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new BusinessRuleException("Invalid status: " + newStatusStr);
        }

        // SRP: transition validation is fully handled by OrderStatusValidator
        statusValidator.validateTransition(order.getStatus(), newStatus, role);

        order.setStatus(newStatus);
        order = orderRepository.save(order);
        eventPublisher.publishOrderStatusChanged(order.getSession().getId(), orderId, newStatus.name());
        return toDto(order);
    }

    private OrderDto toDto(Order o) {
        OrderDto dto = new OrderDto();
        dto.setId(o.getId());
        dto.setSessionId(o.getSession().getId());
        dto.setMenuItemId(o.getMenuItemId());
        dto.setMenuItemName(o.getMenuItemName());
        dto.setMenuItemPrice(o.getMenuItemPrice());
        dto.setQuantity(o.getQuantity());
        dto.setStatus(o.getStatus().name());
        dto.setNotes(o.getNotes());
        dto.setCombo(o.isCombo());
        dto.setCreatedAt(o.getCreatedAt());
        return dto;
    }
}
