package com.irms.billing.strategy;

import lombok.RequiredArgsConstructor;

import java.math.BigDecimal;
import java.math.RoundingMode;

// OCP: extends discount behaviour without modifying BillCalculator
@RequiredArgsConstructor
public class PercentageDiscountStrategy implements DiscountStrategy {

    private final BigDecimal percentage; // e.g. 0.10 for 10%

    @Override
    public BigDecimal calculate(BigDecimal subtotal) {
        return subtotal.multiply(percentage).setScale(2, RoundingMode.HALF_UP);
    }
}
