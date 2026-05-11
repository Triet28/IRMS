package com.irms.billing.messaging;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

import java.util.Map;

// SRP: only consumes order events — billing business logic stays in BillingService
@Slf4j
@Component
@RequiredArgsConstructor
public class OrderEventListener {

    @RabbitListener(queues = "order.created.queue")
    public void onOrderCreated(Map<String, Object> payload) {
        log.info("[AMQP] order.created received: sessionId={}, orderId={}, item={}",
                payload.get("sessionId"), payload.get("orderId"), payload.get("itemName"));
    }

    @RabbitListener(queues = "order.status.changed.queue")
    public void onOrderStatusChanged(Map<String, Object> payload) {
        log.info("[AMQP] order.status.changed received: sessionId={}, orderId={}, status={}",
                payload.get("sessionId"), payload.get("orderId"), payload.get("newStatus"));
    }

    @RabbitListener(queues = "bill.requested.queue")
    public void onBillRequested(Map<String, Object> payload) {
        log.info("[AMQP] bill.requested received: sessionId={}, tableNumber={}",
                payload.get("sessionId"), payload.get("tableNumber"));
    }
}
