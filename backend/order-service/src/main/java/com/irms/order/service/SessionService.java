package com.irms.order.service;

import com.irms.order.dto.SessionDto;
import com.irms.order.dto.ServedOrderDto;

import java.util.List;

// ISP: session operations are separated from order operations
public interface SessionService {
    SessionDto openSession(int tableNumber, Long waiterId);
    SessionDto findById(Long id);
    SessionDto findOpenByTableNumber(int tableNumber); // for static QR — used by customer app
    List<SessionDto> findActiveSessions();
    List<SessionDto> findOpenSessions();   // ACTIVE + BILL_REQUESTED
    SessionDto requestBill(Long sessionId);
    SessionDto closeSession(Long sessionId);
    List<ServedOrderDto> getServedOrders(Long sessionId);
}
