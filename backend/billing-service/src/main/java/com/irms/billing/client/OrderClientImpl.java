package com.irms.billing.client;

import com.irms.billing.dto.ServedOrderDto;
import com.irms.billing.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpMethod;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class OrderClientImpl implements OrderClient {

    private final RestTemplate restTemplate;

    @Value("${order-service.url}")
    private String orderServiceUrl;

    @Override
    public List<ServedOrderDto> getServedOrders(Long sessionId) {
        try {
            var response = restTemplate.exchange(
                    orderServiceUrl + "/api/sessions/" + sessionId + "/served-orders",
                    HttpMethod.GET,
                    null,
                    new ParameterizedTypeReference<List<ServedOrderDto>>() {}
            );
            return response.getBody() != null ? response.getBody() : List.of();
        } catch (HttpClientErrorException.NotFound e) {
            throw new ResourceNotFoundException("Session not found: " + sessionId);
        } catch (Exception e) {
            log.error("Failed to fetch served orders for session {}: {}", sessionId, e.getMessage());
            throw new RuntimeException("Order service unavailable");
        }
    }
}
