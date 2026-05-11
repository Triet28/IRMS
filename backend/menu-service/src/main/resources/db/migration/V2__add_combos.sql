CREATE TABLE IF NOT EXISTS menu_schema.combos (
    id          BIGSERIAL       PRIMARY KEY,
    name        VARCHAR(150)    NOT NULL,
    description TEXT,
    price       NUMERIC(10, 2)  NOT NULL CHECK (price >= 0),
    available   BOOLEAN         NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMP       NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS menu_schema.combo_items (
    combo_id    BIGINT  NOT NULL REFERENCES menu_schema.combos(id) ON DELETE CASCADE,
    item_id     BIGINT  NOT NULL REFERENCES menu_schema.menu_items(id),
    quantity    INT     NOT NULL DEFAULT 1 CHECK (quantity > 0),
    PRIMARY KEY (combo_id, item_id)
);
