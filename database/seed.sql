

-- TENANT A: Nike Store
INSERT INTO tenants (id, name, slug, email, phone, address) VALUES
  ('a0000000-0000-0000-0000-000000000001',
   'Nike Store',
   'nike-store',
   'owner@nikestore.vn',
   '028-1234-5678',
   '123 Nguyễn Huệ, Q1, TP.HCM');

-- Users for Tenant A (Nike)
INSERT INTO users (id, tenant_id, username, email, password_hash, role) VALUES
  ('a1000000-0000-0000-0000-000000000001',
   'a0000000-0000-0000-0000-000000000001',
   'admin_nike',
   'admin@nikestore.vn',
   '$2b$10$s2pYHcHml6aUSxqfHXxrsetbJEUUTYcD1bS01NE92eeTqzPmU4k6a',
   'admin'),
  ('a1000000-0000-0000-0000-000000000002',
   'a0000000-0000-0000-0000-000000000001',
   'cashier_nike',
   'cashier@nikestore.vn',
   '$2b$10$s2pYHcHml6aUSxqfHXxrsetbJEUUTYcD1bS01NE92eeTqzPmU4k6a',
   'cashier');

-- Products for Tenant A (Nike) — 4 sản phẩm
INSERT INTO products (tenant_id, name, price, description, category, sku, stock_quantity) VALUES
  ('a0000000-0000-0000-0000-000000000001',
   'Nike Air Max 270',
   2850000,
   'Giày thể thao Nam Nike Air Max 270, đệm khí lớn, thoáng khí, bền bỉ',
   'Giày Nam', 'NK-AM270', 30),

  ('a0000000-0000-0000-0000-000000000001',
   'Nike Air Force 1 Low',
   2100000,
   'Giày sneaker classic Nike Air Force 1 Low, phong cách streetwear, unisex',
   'Giày Unisex', 'NK-AF1L', 40),

  ('a0000000-0000-0000-0000-000000000001',
   'Nike Pegasus 41',
   3200000,
   'Giày chạy bộ Nike Pegasus 41, đế React êm ái, phù hợp tập luyện hàng ngày',
   'Giày Chạy Bộ', 'NK-PEG41', 25),

  ('a0000000-0000-0000-0000-000000000001',
   'Nike Dunk Low Retro',
   2650000,
   'Giày Nike Dunk Low Retro phong cách cổ điển, thiết kế da lộn cao cấp',
   'Giày Unisex', 'NK-DLR01', 20);

-- ============================================================
-- TENANT B: Uniqlo Store
-- ============================================================

INSERT INTO tenants (id, name, slug, email, phone, address) VALUES
  ('b0000000-0000-0000-0000-000000000002',
   'Uniqlo Store',
   'uniqlo-store',
   'owner@uniqlo.vn',
   '028-9876-5432',
   '456 Lê Lợi, Q1, TP.HCM');

-- Users for Tenant B (Uniqlo)
INSERT INTO users (id, tenant_id, username, email, password_hash, role) VALUES
  ('b1000000-0000-0000-0000-000000000001',
   'b0000000-0000-0000-0000-000000000002',
   'admin_uniqlo',
   'admin@uniqlo.vn',
   '$2b$10$s2pYHcHml6aUSxqfHXxrsetbJEUUTYcD1bS01NE92eeTqzPmU4k6a',
   'admin'),
  ('b1000000-0000-0000-0000-000000000002',
   'b0000000-0000-0000-0000-000000000002',
   'cashier_uniqlo',
   'cashier@uniqlo.vn',
   '$2b$10$s2pYHcHml6aUSxqfHXxrsetbJEUUTYcD1bS01NE92eeTqzPmU4k6a',
   'cashier');

-- Products for Tenant B (Uniqlo) — 4 sản phẩm
INSERT INTO products (tenant_id, name, price, description, category, sku, stock_quantity) VALUES
  ('b0000000-0000-0000-0000-000000000002',
   'Áo Phông Uniqlo AIRism Cotton',
   390000,
   'Áo phông nam chất liệu AIRism Cotton, mát mẻ, thấm hút mồ hôi tốt, nhiều màu',
   'Áo Phông', 'UQ-ARC01', 100),

  ('b0000000-0000-0000-0000-000000000002',
   'Quần Kaki Slim Fit',
   690000,
   'Quần kaki nam dáng slim fit, co giãn 4 chiều, phù hợp công sở và dạo phố',
   'Quần', 'UQ-QKS01', 60),

  ('b0000000-0000-0000-0000-000000000002',
   'Áo Khoác Ultra Light Down',
   1290000,
   'Áo khoác lông vũ siêu nhẹ Uniqlo Ultra Light Down, gấp gọn tiện lợi',
   'Áo Khoác', 'UQ-ULD01', 45),

  ('b0000000-0000-0000-0000-000000000002',
   'Quần Jeans Slim Straight',
   890000,
   'Quần jeans nam Slim Straight, chất liệu denim cao cấp, form dáng chuẩn',
   'Quần', 'UQ-QJS01', 55);



--$2b$10$s2pYHcHml6aUSxqfHXxrsetbJEUUTYcD1bS01NE92eeTqzPmU4k6a