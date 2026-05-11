package com.irms.order.service;

import com.irms.order.domain.Order;
import com.irms.order.domain.OrderStatus;
import com.irms.order.domain.SessionStatus;
import com.irms.order.domain.TableSession;
import com.irms.order.dto.ServedOrderDto;
import com.irms.order.dto.SessionDto;
import com.irms.order.exception.BusinessRuleException;
import com.irms.order.exception.ResourceNotFoundException;
import com.irms.order.repository.OrderRepository;
import com.irms.order.repository.SessionRepository;
import com.irms.order.security.JwtTokenProvider;
import com.irms.order.websocket.OrderEventPublisher;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class SessionServiceImpl implements SessionService {

    private final SessionRepository sessionRepository;
    private final OrderRepository orderRepository;
    private final JwtTokenProvider jwtTokenProvider;
    private final OrderEventPublisher eventPublisher;

    @Override
    @Transactional
    public SessionDto openSession(int tableNumber, Long waiterId) {
        boolean hasActive = !sessionRepository
                .findByTableNumberAndStatus(tableNumber, SessionStatus.ACTIVE)
                .isEmpty();
        if (hasActive) {
            throw new BusinessRuleException("Table " + tableNumber + " already has an active session");
        }

        TableSession session = TableSession.builder()
                .tableNumber(tableNumber)
                .waiterId(waiterId)
                .status(SessionStatus.ACTIVE)
                .build();
        session = sessionRepository.save(session);

        // Generate short-lived table token (Customer App credential)
        String tableToken = jwtTokenProvider.generateTableToken(session.getId(), tableNumber);
        session.setTableToken(tableToken);
        session = sessionRepository.save(session);

        return toDto(session);
    }

    @Override
    @Transactional(readOnly = true)
    public SessionDto findById(Long id) {
        return toDto(findOrThrow(id));
    }

    @Override
    @Transactional(readOnly = true)
    public SessionDto findOpenByTableNumber(int tableNumber) {
        return sessionRepository
                .findByTableNumberAndStatusIn(tableNumber,
                        List.of(SessionStatus.ACTIVE, SessionStatus.BILL_REQUESTED))
                .stream().findFirst()
                .map(this::toDto)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "No open session for table " + tableNumber));
    }

    @Override
    @Transactional(readOnly = true)
    public List<SessionDto> findActiveSessions() {
        return sessionRepository.findByStatus(SessionStatus.ACTIVE)
                .stream().map(this::toDto).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<SessionDto> findOpenSessions() {
        return sessionRepository.findByStatusIn(
                        List.of(SessionStatus.ACTIVE, SessionStatus.BILL_REQUESTED))
                .stream()
                .sorted((a, b) -> a.getTableNumber() - b.getTableNumber())
                .map(this::toDto)
                .toList();
    }

    @Override
    @Transactional
    public SessionDto requestBill(Long sessionId) {
        TableSession session = findOrThrow(sessionId);
        if (session.getStatus() != SessionStatus.ACTIVE) {
            throw new BusinessRuleException("Session is not ACTIVE");
        }
        session.setStatus(SessionStatus.BILL_REQUESTED);
        session = sessionRepository.save(session);
        eventPublisher.publishBillRequested(sessionId, session.getTableNumber());
        return toDto(session);
    }

    @Override
    @Transactional
    public SessionDto closeSession(Long sessionId) {
        TableSession session = findOrThrow(sessionId);
        if (session.getStatus() == SessionStatus.CLOSED) {
            throw new BusinessRuleException("Session is already CLOSED");
        }
        session.setStatus(SessionStatus.CLOSED);
        session.setClosedAt(LocalDateTime.now());
        session.setTableToken(null); // invalidate table token
        session = sessionRepository.save(session);
        eventPublisher.publishSessionClosed(sessionId);
        return toDto(session);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ServedOrderDto> getServedOrders(Long sessionId) {
        findOrThrow(sessionId);
        return orderRepository.findBySessionIdAndStatus(sessionId, OrderStatus.SERVED)
                .stream()
                .map(o -> {
                    ServedOrderDto dto = new ServedOrderDto();
                    dto.setOrderId(o.getId());
                    dto.setItemName(o.getMenuItemName());
                    dto.setUnitPrice(o.getMenuItemPrice());
                    dto.setQuantity(o.getQuantity());
                    dto.setSubtotal(o.getMenuItemPrice()
                            .multiply(BigDecimal.valueOf(o.getQuantity())));
                    return dto;
                })
                .toList();
    }

    private TableSession findOrThrow(Long id) {
        return sessionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Session not found: " + id));
    }

    private SessionDto toDto(TableSession s) {
        SessionDto dto = new SessionDto();
        dto.setId(s.getId());
        dto.setTableNumber(s.getTableNumber());
        dto.setWaiterId(s.getWaiterId());
        dto.setStatus(s.getStatus().name());
        dto.setTableToken(s.getTableToken());
        dto.setOpenedAt(s.getOpenedAt());
        dto.setClosedAt(s.getClosedAt());
        return dto;
    }
}
