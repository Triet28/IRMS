package com.irms.order.websocket;

import com.irms.order.config.RabbitMQConfig;
import lombok.RequiredArgsConstructor;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;

import java.util.Map;

// SRP: only publishes events (STOMP → browsers, AMQP → other services)
// OCP: AMQP publishing added without modifying existing STOMP logic
@Component
@RequiredArgsConstructor
public class OrderEventPublisher {

    private final SimpMessagingTemplate messagingTemplate;
    private final RabbitTemplate rabbitTemplate;

    // Chef view subscribes to /topic/kitchen; billing-service listens on AMQP
    public void publishOrderCreated(Long sessionId, Long orderId, String itemName) {
        messagingTemplate.convertAndSend("/topic/kitchen", Map.of(
                "event", "ORDER_CREATED",
                "sessionId", sessionId,
                "orderId", orderId,
                "itemName", itemName
        ));
        rabbitTemplate.convertAndSend(
                RabbitMQConfig.EXCHANGE,
                RabbitMQConfig.ROUTING_ORDER_CREATED,
                Map.of("event", "ORDER_CREATED", "sessionId", sessionId,
                        "orderId", orderId, "itemName", itemName)
        );
    }

    // All staff viewing the session subscribe to /topic/session/{sessionId}
    public void publishOrderStatusChanged(Long sessionId, Long orderId, String newStatus) {
        messagingTemplate.convertAndSend("/topic/session/" + sessionId, Map.of(
                "event", "ORDER_STATUS_CHANGED",
                "orderId", orderId,
                "newStatus", newStatus
        ));
        rabbitTemplate.convertAndSend(
                RabbitMQConfig.EXCHANGE,
                RabbitMQConfig.ROUTING_ORDER_STATUS,
                Map.of("event", "ORDER_STATUS_CHANGED", "sessionId", sessionId,
                        "orderId", orderId, "newStatus", newStatus)
        );
    }

    // Waiter subscribes to /topic/billing; billing-service can also listen via AMQP
    public void publishBillRequested(Long sessionId, int tableNumber) {
        messagingTemplate.convertAndSend("/topic/billing", Map.of(
                "event", "BILL_REQUESTED",
                "sessionId", sessionId,
                "tableNumber", tableNumber
        ));
        rabbitTemplate.convertAndSend(
                RabbitMQConfig.EXCHANGE,
                RabbitMQConfig.ROUTING_BILL_REQUESTED,
                Map.of("event", "BILL_REQUESTED", "sessionId", sessionId,
                        "tableNumber", tableNumber)
        );
    }

    // Staff apps subscribe to /topic/sessions to keep the table grid in sync
    public void publishSessionOpened(Long sessionId, int tableNumber) {
        messagingTemplate.convertAndSend("/topic/sessions", Map.of(
                "event", "SESSION_OPENED",
                "sessionId", sessionId,
                "tableNumber", tableNumber
        ));
    }

    // Customer App subscribes to /topic/table/{sessionId} (browser-only, no AMQP needed)
    public void publishSessionClosed(Long sessionId) {
        messagingTemplate.convertAndSend("/topic/table/" + sessionId, Map.of(
                "event", "SESSION_CLOSED",
                "sessionId", sessionId
        ));
    }
}
