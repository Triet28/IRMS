package com.irms.billing.strategy;

import org.springframework.stereotype.Component;

import java.math.BigDecimal;

// Default strategy: no discount applied
@Component("noDiscount")
public class NoDiscountStrategy implements DiscountStrategy {

    @Override
    public BigDecimal calculate(BigDecimal subtotal) {
        return BigDecimal.ZERO;
    }
}
