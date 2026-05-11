-- Menu Service schema: categories + menu_items
CREATE TABLE IF NOT EXISTS menu_schema.categories (
    id            BIGSERIAL    PRIMARY KEY,
    name          VARCHAR(100) NOT NULL UNIQUE,
    description   TEXT,
    display_order INT          NOT NULL DEFAULT 0,
    created_at    TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS menu_schema.menu_items (
    id            BIGSERIAL      PRIMARY KEY,
    category_id   BIGINT         NOT NULL REFERENCES menu_schema.categories(id),
    name          VARCHAR(150)   NOT NULL,
    description   TEXT,
    price         NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
    available     BOOLEAN        NOT NULL DEFAULT TRUE,
    image_url     VARCHAR(500),
    created_at    TIMESTAMP      NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMP      NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_menu_items_category ON menu_schema.menu_items(category_id);
CREATE INDEX idx_menu_items_available ON menu_schema.menu_items(available);

-- Seed categories
INSERT INTO menu_schema.categories (name, description, display_order) VALUES
    ('Khai vị',   'Các món ăn khai vị',        1),
    ('Món chính', 'Các món ăn chính',            2),
    ('Tráng miệng','Các món tráng miệng',        3),
    ('Đồ uống',   'Nước ngọt, sinh tố, bia...',  4)
ON CONFLICT DO NOTHING;

-- Seed sample menu items
INSERT INTO menu_schema.menu_items (category_id, name, description, price, available) VALUES
    (1, 'Gỏi cuốn tôm thịt',    'Gỏi cuốn tươi với tôm và thịt heo',  45000,  TRUE),
    (1, 'Chả giò chiên',         'Chả giò giòn rụm nhân thịt cua',       40000,  TRUE),
    (2, 'Cơm sườn nướng',        'Cơm với sườn heo nướng BBQ',           85000,  TRUE),
    (2, 'Phở bò đặc biệt',       'Phở bò tái chín với nước dùng đặc',   75000,  TRUE),
    (2, 'Bún bò Huế',            'Bún bò Huế cay truyền thống',          70000,  TRUE),
    (3, 'Chè ba màu',            'Chè ba màu mát lạnh',                  35000,  TRUE),
    (4, 'Cà phê sữa đá',         'Cà phê phin với sữa đặc',              30000,  TRUE),
    (4, 'Nước cam ép',           'Cam ép tươi nguyên chất',              40000,  TRUE)
ON CONFLICT DO NOTHING;
