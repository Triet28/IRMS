-- Order Service schema: table_sessions + orders
CREATE TABLE IF NOT EXISTS order_schema.table_sessions (
    id           BIGSERIAL   PRIMARY KEY,
    table_number INT         NOT NULL,
    waiter_id    BIGINT      NOT NULL,
    status       VARCHAR(20) NOT NULL DEFAULT 'ACTIVE'
                     CHECK (status IN ('ACTIVE', 'BILL_REQUESTED', 'CLOSED')),
    -- Short-lived JWT scoped to this session (used by Customer App)
    table_token  TEXT,
    opened_at    TIMESTAMP   NOT NULL DEFAULT NOW(),
    closed_at    TIMESTAMP
);

CREATE INDEX idx_sessions_status       ON order_schema.table_sessions(status);
CREATE INDEX idx_sessions_table_number ON order_schema.table_sessions(table_number);

CREATE TABLE IF NOT EXISTS order_schema.orders (
    id               BIGSERIAL      PRIMARY KEY,
    session_id       BIGINT         NOT NULL
                         REFERENCES order_schema.table_sessions(id),
    -- Snapshot of menu data at order time (avoids cross-schema JOIN)
    menu_item_id     BIGINT         NOT NULL,
    menu_item_name   VARCHAR(150)   NOT NULL,
    menu_item_price  NUMERIC(10, 2) NOT NULL,
    quantity         INT            NOT NULL CHECK (quantity > 0),
    status           VARCHAR(20)    NOT NULL DEFAULT 'PENDING'
                         CHECK (status IN ('PENDING', 'PREPARED', 'SERVED', 'CANCELLED')),
    notes            TEXT,
    created_at       TIMESTAMP      NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMP      NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_orders_session_id ON order_schema.orders(session_id);
CREATE INDEX idx_orders_status     ON order_schema.orders(status);
