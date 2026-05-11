-- Billing Service schema: bills + bill_items
CREATE TABLE IF NOT EXISTS billing_schema.bills (
    id               BIGSERIAL      PRIMARY KEY,
    -- session_id is a logical FK to order_schema (no physical FK — cross-schema)
    session_id       BIGINT         NOT NULL UNIQUE,
    subtotal         NUMERIC(10, 2) NOT NULL,
    tax_rate         NUMERIC(5, 4)  NOT NULL,
    tax_amount       NUMERIC(10, 2) NOT NULL,
    discount_amount  NUMERIC(10, 2) NOT NULL DEFAULT 0,
    total            NUMERIC(10, 2) NOT NULL,
    status           VARCHAR(20)    NOT NULL DEFAULT 'PENDING_PAYMENT'
                         CHECK (status IN ('PENDING_PAYMENT', 'PAID')),
    payment_method   VARCHAR(20)
                         CHECK (payment_method IN ('CASH', 'CARD', 'DIGITAL_WALLET')),
    created_at       TIMESTAMP      NOT NULL DEFAULT NOW(),
    paid_at          TIMESTAMP
);

-- Bill line items (snapshot of each SERVED order)
CREATE TABLE IF NOT EXISTS billing_schema.bill_items (
    id           BIGSERIAL      PRIMARY KEY,
    bill_id      BIGINT         NOT NULL REFERENCES billing_schema.bills(id),
    -- order_id is a logical FK to order_schema (no physical FK — cross-schema)
    order_id     BIGINT         NOT NULL,
    item_name    VARCHAR(150)   NOT NULL,
    quantity     INT            NOT NULL,
    unit_price   NUMERIC(10, 2) NOT NULL,
    subtotal     NUMERIC(10, 2) NOT NULL
);

CREATE INDEX idx_bill_items_bill_id ON billing_schema.bill_items(bill_id);
