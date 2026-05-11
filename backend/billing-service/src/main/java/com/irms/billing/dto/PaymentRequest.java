package com.irms.billing.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class PaymentRequest {
    @NotBlank
    @Pattern(regexp = "CASH|CARD|DIGITAL_WALLET",
             message = "paymentMethod must be CASH, CARD, or DIGITAL_WALLET")
    private String paymentMethod;

    // Optional: discount type for this payment
    private String discountType;   // PERCENTAGE | FIXED | null
    private String discountValue;  // e.g. "0.10" for 10% or "50000" for fixed
}
