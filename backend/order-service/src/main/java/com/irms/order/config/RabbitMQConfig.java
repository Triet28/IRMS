package com.irms.order.config;

import org.springframework.amqp.core.*;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

// DIP: expose named beans so OrderEventPublisher depends on abstractions, not hardcoded strings
@Configuration
public class RabbitMQConfig {

    public static final String EXCHANGE = "irms.exchange";

    public static final String ORDER_CREATED_QUEUE   = "order.created.queue";
    public static final String ORDER_STATUS_QUEUE    = "order.status.changed.queue";
    public static final String BILL_REQUESTED_QUEUE  = "bill.requested.queue";

    public static final String ROUTING_ORDER_CREATED  = "order.created";
    public static final String ROUTING_ORDER_STATUS   = "order.status.changed";
    public static final String ROUTING_BILL_REQUESTED = "bill.requested";

    @Bean
    public TopicExchange irmsExchange() {
        return new TopicExchange(EXCHANGE);
    }

    @Bean
    public Queue orderCreatedQueue() {
        return QueueBuilder.durable(ORDER_CREATED_QUEUE).build();
    }

    @Bean
    public Queue orderStatusQueue() {
        return QueueBuilder.durable(ORDER_STATUS_QUEUE).build();
    }

    @Bean
    public Queue billRequestedQueue() {
        return QueueBuilder.durable(BILL_REQUESTED_QUEUE).build();
    }

    @Bean
    public Binding bindOrderCreated(Queue orderCreatedQueue, TopicExchange irmsExchange) {
        return BindingBuilder.bind(orderCreatedQueue).to(irmsExchange).with(ROUTING_ORDER_CREATED);
    }

    @Bean
    public Binding bindOrderStatus(Queue orderStatusQueue, TopicExchange irmsExchange) {
        return BindingBuilder.bind(orderStatusQueue).to(irmsExchange).with(ROUTING_ORDER_STATUS);
    }

    @Bean
    public Binding bindBillRequested(Queue billRequestedQueue, TopicExchange irmsExchange) {
        return BindingBuilder.bind(billRequestedQueue).to(irmsExchange).with(ROUTING_BILL_REQUESTED);
    }

    @Bean
    public Jackson2JsonMessageConverter messageConverter() {
        return new Jackson2JsonMessageConverter();
    }
}
