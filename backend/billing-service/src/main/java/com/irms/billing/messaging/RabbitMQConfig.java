package com.irms.billing.messaging;

import org.springframework.amqp.core.Queue;
import org.springframework.amqp.core.QueueBuilder;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

// DIP: declare queues as beans — @RabbitListener depends on these abstractions, not hardcoded infra
@Configuration
public class RabbitMQConfig {

    @Bean
    public Queue orderCreatedQueue() {
        return QueueBuilder.durable("order.created.queue").build();
    }

    @Bean
    public Queue orderStatusQueue() {
        return QueueBuilder.durable("order.status.changed.queue").build();
    }

    @Bean
    public Queue billRequestedQueue() {
        return QueueBuilder.durable("bill.requested.queue").build();
    }

    @Bean
    public Jackson2JsonMessageConverter messageConverter() {
        return new Jackson2JsonMessageConverter();
    }
}
