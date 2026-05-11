package com.irms.billing.strategy;

import lombok.RequiredArgsConstructor;

import java.math.BigDecimal;

// OCP: another discount type added without changing BillCalculator
@RequiredArgsConstructor
public class FixedDiscountStrategy implements DiscountStrategy {

    private final BigDecimal amount;

    @Override
    public BigDecimal calculate(BigDecimal subtotal) {
        BigDecimal discount = amount.min(subtotal); // can't discount more than subtotal
        return discount.max(BigDecimal.ZERO);
    }
}
