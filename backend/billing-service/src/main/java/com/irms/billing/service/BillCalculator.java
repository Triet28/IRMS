package com.irms.billing.service;

import com.irms.billing.strategy.DiscountStrategy;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;

/**
 * SRP: only handles bill arithmetic.
 * DIP: depends on DiscountStrategy interface, not on any concrete discount class.
 * OCP: to support a new discount type, inject a different DiscountStrategy — this
 *      class never needs to change.
 */
@Component
@RequiredArgsConstructor
public class BillCalculator {

    public BillResult calculate(BigDecimal subtotal, BigDecimal vatRate, DiscountStrategy discountStrategy) {
        BigDecimal discountAmount = discountStrategy.calculate(subtotal);
        BigDecimal taxBase        = subtotal.subtract(discountAmount);
        BigDecimal taxAmount      = taxBase.multiply(vatRate).setScale(2, RoundingMode.HALF_UP);
        BigDecimal total          = taxBase.add(taxAmount);

        return new BillResult(subtotal, vatRate, taxAmount, discountAmount, total);
    }

    public record BillResult(
            BigDecimal subtotal,
            BigDecimal taxRate,
            BigDecimal taxAmount,
            BigDecimal discountAmount,
            BigDecimal total
    ) {}
}
