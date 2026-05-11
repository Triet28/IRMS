package com.irms.billing.strategy;

import java.math.BigDecimal;

/**
 * OCP + LSP: DiscountStrategy is an abstraction that BillCalculator depends on.
 * Adding a new discount type (e.g. LoyaltyDiscount) only requires adding a new
 * class that implements this interface — BillCalculator never changes.
 *
 * LSP: any DiscountStrategy implementation can replace another inside
 * BillCalculator without breaking the calculation logic.
 */
public interface DiscountStrategy {
    BigDecimal calculate(BigDecimal subtotal);
}
