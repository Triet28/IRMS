-- UNIQUE constraint cần thiết cho ON CONFLICT bên dưới
ALTER TABLE menu_schema.combos
    ADD CONSTRAINT combos_name_unique UNIQUE (name);

-- ── Thêm món ăn mới ────────────────────────────────────────────────────────
INSERT INTO menu_schema.menu_items (category_id, name, description, price, available) VALUES
    -- Khai vị
    (1, 'Súp cua',              'Súp cua thịt cua tươi béo ngậy',          55000, TRUE),
    (1, 'Nem cuốn chay',        'Nem cuốn rau củ chay thanh mát',           35000, TRUE),
    (1, 'Bánh xèo nhỏ',         'Bánh xèo giòn nhân tôm thịt',             50000, TRUE),

    -- Món chính
    (2, 'Bún thịt nướng',       'Bún với thịt heo nướng sả ớt thơm lừng',  65000, TRUE),
    (2, 'Mì xào hải sản',       'Mì xào giòn với tôm mực nghêu',            95000, TRUE),
    (2, 'Cơm chiên dương châu', 'Cơm chiên với tôm trứng và rau củ',        70000, TRUE),
    (2, 'Hủ tiếu Nam Vang',     'Hủ tiếu nước hoặc khô nhân tôm thịt',     72000, TRUE),

    -- Tráng miệng
    (3, 'Bánh flan caramel',    'Bánh flan mềm mịn với caramel đắng',       30000, TRUE),
    (3, 'Kem dừa',              'Kem dừa tươi mát lạnh',                    25000, TRUE),
    (3, 'Chè đậu xanh',         'Chè đậu xanh nước dừa thanh mát',          28000, TRUE),

    -- Đồ uống
    (4, 'Sinh tố xoài',         'Sinh tố xoài cát tươi nguyên chất',        45000, TRUE),
    (4, 'Trà sữa trân châu',    'Trà sữa trân châu đường nâu',              42000, TRUE),
    (4, 'Bia Tiger',            'Bia Tiger lon 330ml',                       35000, TRUE),
    (4, 'Nước suối',            'Nước khoáng đóng chai 500ml',              15000, TRUE)
ON CONFLICT DO NOTHING;


-- ── Thêm combo ─────────────────────────────────────────────────────────────
-- Combo 1: Gia đình (4 người)
WITH c AS (
    INSERT INTO menu_schema.combos (name, description, price)
    VALUES ('Combo Gia đình', 'Dành cho 4 người: Gỏi cuốn × 4 + Phở bò × 2 + Cơm sườn × 2 + Chè ba màu × 4 + Cà phê sữa đá × 4', 490000)
    ON CONFLICT (name) DO NOTHING
    RETURNING id
)
INSERT INTO menu_schema.combo_items (combo_id, item_id, quantity)
SELECT c.id, m.id, 4 FROM c, menu_schema.menu_items m WHERE m.name = 'Gỏi cuốn tôm thịt'
UNION ALL
SELECT c.id, m.id, 2 FROM c, menu_schema.menu_items m WHERE m.name = 'Phở bò đặc biệt'
UNION ALL
SELECT c.id, m.id, 2 FROM c, menu_schema.menu_items m WHERE m.name = 'Cơm sườn nướng'
UNION ALL
SELECT c.id, m.id, 4 FROM c, menu_schema.menu_items m WHERE m.name = 'Chè ba màu'
UNION ALL
SELECT c.id, m.id, 4 FROM c, menu_schema.menu_items m WHERE m.name = 'Cà phê sữa đá'
ON CONFLICT DO NOTHING;

-- Combo 2: Đôi (2 người)
WITH c AS (
    INSERT INTO menu_schema.combos (name, description, price)
    VALUES ('Combo Đôi', 'Dành cho 2 người: Chả giò × 2 + Bún bò Huế × 1 + Cơm sườn × 1 + Nước cam ép × 2', 230000)
    ON CONFLICT (name) DO NOTHING
    RETURNING id
)
INSERT INTO menu_schema.combo_items (combo_id, item_id, quantity)
SELECT c.id, m.id, 2 FROM c, menu_schema.menu_items m WHERE m.name = 'Chả giò chiên'
UNION ALL
SELECT c.id, m.id, 1 FROM c, menu_schema.menu_items m WHERE m.name = 'Bún bò Huế'
UNION ALL
SELECT c.id, m.id, 1 FROM c, menu_schema.menu_items m WHERE m.name = 'Cơm sườn nướng'
UNION ALL
SELECT c.id, m.id, 2 FROM c, menu_schema.menu_items m WHERE m.name = 'Nước cam ép'
ON CONFLICT DO NOTHING;

-- Combo 3: Văn phòng (1 người)
WITH c AS (
    INSERT INTO menu_schema.combos (name, description, price)
    VALUES ('Combo Văn phòng', 'Bữa trưa nhanh: Bún thịt nướng × 1 + Chè ba màu × 1 + Cà phê sữa đá × 1', 120000)
    ON CONFLICT (name) DO NOTHING
    RETURNING id
)
INSERT INTO menu_schema.combo_items (combo_id, item_id, quantity)
SELECT c.id, m.id, 1 FROM c, menu_schema.menu_items m WHERE m.name = 'Bún thịt nướng'
UNION ALL
SELECT c.id, m.id, 1 FROM c, menu_schema.menu_items m WHERE m.name = 'Chè ba màu'
UNION ALL
SELECT c.id, m.id, 1 FROM c, menu_schema.menu_items m WHERE m.name = 'Cà phê sữa đá'
ON CONFLICT DO NOTHING;

-- Combo 4: Hải sản (2 người)
WITH c AS (
    INSERT INTO menu_schema.combos (name, description, price)
    VALUES ('Combo Hải sản', 'Dành cho 2 người yêu hải sản: Súp cua × 2 + Mì xào hải sản × 2 + Sinh tố xoài × 2', 285000)
    ON CONFLICT (name) DO NOTHING
    RETURNING id
)
INSERT INTO menu_schema.combo_items (combo_id, item_id, quantity)
SELECT c.id, m.id, 2 FROM c, menu_schema.menu_items m WHERE m.name = 'Súp cua'
UNION ALL
SELECT c.id, m.id, 2 FROM c, menu_schema.menu_items m WHERE m.name = 'Mì xào hải sản'
UNION ALL
SELECT c.id, m.id, 2 FROM c, menu_schema.menu_items m WHERE m.name = 'Sinh tố xoài'
ON CONFLICT DO NOTHING;

-- Combo 5: Nhậu vui (3–4 người)
WITH c AS (
    INSERT INTO menu_schema.combos (name, description, price)
    VALUES ('Combo Nhậu vui', 'Nhậu cuối tuần: Bánh xèo × 2 + Gỏi cuốn × 4 + Chả giò × 4 + Bia Tiger × 4', 310000)
    ON CONFLICT (name) DO NOTHING
    RETURNING id
)
INSERT INTO menu_schema.combo_items (combo_id, item_id, quantity)
SELECT c.id, m.id, 2 FROM c, menu_schema.menu_items m WHERE m.name = 'Bánh xèo nhỏ'
UNION ALL
SELECT c.id, m.id, 4 FROM c, menu_schema.menu_items m WHERE m.name = 'Gỏi cuốn tôm thịt'
UNION ALL
SELECT c.id, m.id, 4 FROM c, menu_schema.menu_items m WHERE m.name = 'Chả giò chiên'
UNION ALL
SELECT c.id, m.id, 4 FROM c, menu_schema.menu_items m WHERE m.name = 'Bia Tiger'
ON CONFLICT DO NOTHING;
