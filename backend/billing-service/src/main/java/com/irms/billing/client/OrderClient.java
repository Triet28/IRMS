package com.irms.billing.client;

import com.irms.billing.dto.ServedOrderDto;

import java.util.List;

// DIP: BillingService depends on this interface, not on the HTTP implementation
public interface OrderClient {
    List<ServedOrderDto> getServedOrders(Long sessionId);
}
