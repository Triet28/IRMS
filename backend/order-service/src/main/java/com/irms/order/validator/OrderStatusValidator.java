package com.irms.order.validator;

import com.irms.order.domain.OrderStatus;
import com.irms.order.exception.BusinessRuleException;
import org.springframework.stereotype.Component;

/**
 * SRP: This class has exactly one responsibility — enforcing the order
 * status state machine. OrderService delegates validation here instead
 * of containing the transition logic itself.
 *
 * State machine:
 *   PENDING  --[chef]-->  PREPARED  --[waiter]--> SERVED  (terminal)
 *   PENDING  --[waiter/manager]--> CANCELLED      (terminal)
 *   PREPARED --[waiter/manager]--> CANCELLED
 */
@Component
public class OrderStatusValidator {

    public void validateTransition(OrderStatus current, OrderStatus next, String role) {
        if (current == OrderStatus.SERVED || current == OrderStatus.CANCELLED) {
            throw new BusinessRuleException("Cannot change status of a terminal order: " + current);
        }

        switch (role) {
            case "CHEF" -> {
                if (current != OrderStatus.PENDING || next != OrderStatus.PREPARED) {
                    throw new BusinessRuleException("CHEF can only transition PENDING → PREPARED");
                }
            }
            case "WAITER" -> {
                boolean serveOk   = current == OrderStatus.PREPARED && next == OrderStatus.SERVED;
                boolean cancelOk  = (current == OrderStatus.PENDING || current == OrderStatus.PREPARED)
                                    && next == OrderStatus.CANCELLED;
                if (!serveOk && !cancelOk) {
                    throw new BusinessRuleException(
                            "WAITER can only: PREPARED→SERVED or {PENDING,PREPARED}→CANCELLED");
                }
            }
            case "MANAGER" -> {
                // Manager has the union of WAITER + CHEF permissions
                boolean chefOk   = current == OrderStatus.PENDING && next == OrderStatus.PREPARED;
                boolean serveOk  = current == OrderStatus.PREPARED && next == OrderStatus.SERVED;
                boolean cancelOk = (current == OrderStatus.PENDING || current == OrderStatus.PREPARED)
                                   && next == OrderStatus.CANCELLED;
                if (!chefOk && !serveOk && !cancelOk) {
                    throw new BusinessRuleException("MANAGER: invalid status transition " + current + " → " + next);
                }
            }
            default -> throw new BusinessRuleException("Unknown role: " + role);
        }
    }
}
