-- ============================================
-- 16_more_centers_seed.sql
-- Thêm dữ liệu demo cho Centers (từ 3 -> 15 centers)
-- ============================================

-- Tạm disable RLS để seed
ALTER TABLE centers DISABLE ROW LEVEL SECURITY;

-- Insert thêm 12 centers mới (đã có 3: Hà Nội, TP.HCM, Đà Nẵng)
INSERT INTO centers (name, code, address, hotline, email, logo_url, status, working_hours, description, created_at) VALUES

-- Miền Bắc
('Trung tâm Hải Phòng', 'HP-01', '45 Lạch Tray, Ngô Quyền, Hải Phòng', '0225.369.1234', 'haiphong@skillmaster.edu.vn', NULL, 'active',
'{"mon": {"open": "07:30", "close": "21:00"}, "tue": {"open": "07:30", "close": "21:00"}, "wed": {"open": "07:30", "close": "21:00"}, "thu": {"open": "07:30", "close": "21:00"}, "fri": {"open": "07:30", "close": "21:00"}, "sat": {"open": "08:00", "close": "17:00"}, "sun": {"closed": true}}',
'Trung tâm đào tạo tại Hải Phòng - Cảng biển lớn nhất miền Bắc', NOW() - INTERVAL '8 months'),

('Trung tâm Quảng Ninh', 'QN-01', '89 Trần Hưng Đạo, Hạ Long, Quảng Ninh', '0203.388.5678', 'quangninh@skillmaster.edu.vn', NULL, 'active',
'{"mon": {"open": "08:00", "close": "20:30"}, "tue": {"open": "08:00", "close": "20:30"}, "wed": {"open": "08:00", "close": "20:30"}, "thu": {"open": "08:00", "close": "20:30"}, "fri": {"open": "08:00", "close": "20:30"}, "sat": {"open": "08:30", "close": "16:30"}, "sun": {"closed": true}}',
'Trung tâm tại thành phố du lịch Hạ Long', NOW() - INTERVAL '6 months'),

('Trung tâm Bắc Ninh', 'BN-01', '167 Lý Thái Tổ, TP Bắc Ninh, Bắc Ninh', '0222.365.9012', 'bacninh@skillmaster.edu.vn', NULL, 'active',
'{"mon": {"open": "07:00", "close": "21:30"}, "tue": {"open": "07:00", "close": "21:30"}, "wed": {"open": "07:00", "close": "21:30"}, "thu": {"open": "07:00", "close": "21:30"}, "fri": {"open": "07:00", "close": "21:30"}, "sat": {"open": "07:30", "close": "18:00"}, "sun": {"open": "08:00", "close": "12:00"}}',
'Trung tâm phục vụ các khu công nghiệp lớn tại Bắc Ninh', NOW() - INTERVAL '5 months'),

-- Miền Trung
('Trung tâm Huế', 'HUE-01', '56 Hùng Vương, TP Huế, Thừa Thiên Huế', '0234.382.3456', 'hue@skillmaster.edu.vn', NULL, 'active',
'{"mon": {"open": "07:30", "close": "21:00"}, "tue": {"open": "07:30", "close": "21:00"}, "wed": {"open": "07:30", "close": "21:00"}, "thu": {"open": "07:30", "close": "21:00"}, "fri": {"open": "07:30", "close": "21:00"}, "sat": {"open": "08:00", "close": "17:00"}, "sun": {"closed": true}}',
'Trung tâm tại cố đô Huế - Thành phố di sản', NOW() - INTERVAL '7 months'),

('Trung tâm Nha Trang', 'NT-01', '123 Trần Phú, Lộc Thọ, Nha Trang, Khánh Hòa', '0258.352.7890', 'nhatrang@skillmaster.edu.vn', NULL, 'active',
'{"mon": {"open": "08:00", "close": "21:00"}, "tue": {"open": "08:00", "close": "21:00"}, "wed": {"open": "08:00", "close": "21:00"}, "thu": {"open": "08:00", "close": "21:00"}, "fri": {"open": "08:00", "close": "21:00"}, "sat": {"open": "08:30", "close": "17:30"}, "sun": {"open": "09:00", "close": "12:00"}}',
'Trung tâm tại thành phố biển Nha Trang xinh đẹp', NOW() - INTERVAL '4 months'),

('Trung tâm Quy Nhơn', 'QNH-01', '78 An Dương Vương, Quy Nhơn, Bình Định', '0256.389.1234', 'quynhon@skillmaster.edu.vn', NULL, 'active',
'{"mon": {"open": "07:30", "close": "20:30"}, "tue": {"open": "07:30", "close": "20:30"}, "wed": {"open": "07:30", "close": "20:30"}, "thu": {"open": "07:30", "close": "20:30"}, "fri": {"open": "07:30", "close": "20:30"}, "sat": {"open": "08:00", "close": "16:00"}, "sun": {"closed": true}}',
'Trung tâm tại Quy Nhơn - Thành phố của những bãi biển hoang sơ', NOW() - INTERVAL '3 months'),

-- Miền Nam
('Trung tâm Cần Thơ', 'CT-01', '234 Nguyễn Văn Cừ, Ninh Kiều, Cần Thơ', '0292.376.5432', 'cantho@skillmaster.edu.vn', NULL, 'active',
'{"mon": {"open": "07:00", "close": "21:30"}, "tue": {"open": "07:00", "close": "21:30"}, "wed": {"open": "07:00", "close": "21:30"}, "thu": {"open": "07:00", "close": "21:30"}, "fri": {"open": "07:00", "close": "21:30"}, "sat": {"open": "07:30", "close": "18:00"}, "sun": {"open": "08:00", "close": "12:00"}}',
'Trung tâm tại thủ phủ miền Tây - Cần Thơ', NOW() - INTERVAL '9 months'),

('Trung tâm Bình Dương', 'BD-01', '456 Đại lộ Bình Dương, Thủ Dầu Một, Bình Dương', '0274.365.8901', 'binhduong@skillmaster.edu.vn', NULL, 'active',
'{"mon": {"open": "06:30", "close": "22:00"}, "tue": {"open": "06:30", "close": "22:00"}, "wed": {"open": "06:30", "close": "22:00"}, "thu": {"open": "06:30", "close": "22:00"}, "fri": {"open": "06:30", "close": "22:00"}, "sat": {"open": "07:00", "close": "18:00"}, "sun": {"open": "08:00", "close": "14:00"}}',
'Trung tâm phục vụ công nhân các khu công nghiệp Bình Dương', NOW() - INTERVAL '10 months'),

('Trung tâm Đồng Nai', 'DN-01', '789 Nguyễn Ái Quốc, Biên Hòa, Đồng Nai', '0251.382.4567', 'dongnai@skillmaster.edu.vn', NULL, 'active',
'{"mon": {"open": "06:30", "close": "21:30"}, "tue": {"open": "06:30", "close": "21:30"}, "wed": {"open": "06:30", "close": "21:30"}, "thu": {"open": "06:30", "close": "21:30"}, "fri": {"open": "06:30", "close": "21:30"}, "sat": {"open": "07:00", "close": "17:00"}, "sun": {"closed": true}}',
'Trung tâm tại Biên Hòa - Trung tâm công nghiệp lớn nhất miền Nam', NOW() - INTERVAL '11 months'),

('Trung tâm Vũng Tàu', 'VT-01', '321 Thùy Vân, Bãi Sau, Vũng Tàu', '0254.385.6789', 'vungtau@skillmaster.edu.vn', NULL, 'active',
'{"mon": {"open": "08:00", "close": "20:30"}, "tue": {"open": "08:00", "close": "20:30"}, "wed": {"open": "08:00", "close": "20:30"}, "thu": {"open": "08:00", "close": "20:30"}, "fri": {"open": "08:00", "close": "20:30"}, "sat": {"open": "08:30", "close": "17:00"}, "sun": {"open": "09:00", "close": "12:00"}}',
'Trung tâm tại thành phố biển Vũng Tàu', NOW() - INTERVAL '2 months'),

-- Tây Nguyên
('Trung tâm Đắk Lắk', 'DL-01', '147 Nguyễn Tất Thành, Buôn Ma Thuột, Đắk Lắk', '0262.385.0123', 'daklak@skillmaster.edu.vn', NULL, 'active',
'{"mon": {"open": "07:30", "close": "20:00"}, "tue": {"open": "07:30", "close": "20:00"}, "wed": {"open": "07:30", "close": "20:00"}, "thu": {"open": "07:30", "close": "20:00"}, "fri": {"open": "07:30", "close": "20:00"}, "sat": {"open": "08:00", "close": "16:00"}, "sun": {"closed": true}}',
'Trung tâm tại thủ phủ cà phê Tây Nguyên', NOW() - INTERVAL '4 months'),

('Trung tâm Lâm Đồng', 'LD-01', '258 Phan Đình Phùng, Đà Lạt, Lâm Đồng', '0263.382.3456', 'lamdong@skillmaster.edu.vn', NULL, 'active',
'{"mon": {"open": "08:00", "close": "20:30"}, "tue": {"open": "08:00", "close": "20:30"}, "wed": {"open": "08:00", "close": "20:30"}, "thu": {"open": "08:00", "close": "20:30"}, "fri": {"open": "08:00", "close": "20:30"}, "sat": {"open": "08:30", "close": "17:00"}, "sun": {"open": "09:00", "close": "12:00"}}',
'Trung tâm tại thành phố ngàn hoa Đà Lạt', NOW() - INTERVAL '3 months')

ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    address = EXCLUDED.address,
    hotline = EXCLUDED.hotline,
    email = EXCLUDED.email,
    working_hours = EXCLUDED.working_hours,
    description = EXCLUDED.description;

-- Seed thêm rooms cho các centers mới
DO $$
DECLARE
    center_rec RECORD;
    room_count INTEGER;
    i INTEGER;
    equipment_json JSONB := '["projector", "whiteboard", "air_conditioner"]'::jsonb;
BEGIN
    FOR center_rec IN SELECT id, code FROM centers WHERE code NOT IN ('CTR01', 'CTR02', 'CTR03')
    LOOP
        -- Random số phòng từ 3-8 cho mỗi center
        room_count := 3 + floor(random() * 6)::int;
        
        FOR i IN 1..room_count LOOP
            INSERT INTO rooms (name, code, center_id, capacity, room_type, status, equipment, notes)
            VALUES (
                'Phòng ' || i || ' - ' || center_rec.code,
                center_rec.code || '-P' || LPAD(i::text, 2, '0'),
                center_rec.id,
                20 + floor(random() * 30)::int, -- capacity 20-50
                CASE floor(random() * 3)::int
                    WHEN 0 THEN 'standard'
                    WHEN 1 THEN 'lab'
                    ELSE 'vip'
                END,
                CASE floor(random() * 10)::int
                    WHEN 0 THEN 'maintenance'
                    ELSE 'active'
                END,
                equipment_json,
                'Phòng học tại ' || center_rec.code
            )
            ON CONFLICT (code) DO NOTHING;
        END LOOP;
    END LOOP;
END $$;

-- Re-enable RLS
ALTER TABLE centers ENABLE ROW LEVEL SECURITY;

-- Verify
SELECT 
    c.name,
    c.code,
    c.status,
    COUNT(r.id) as room_count
FROM centers c
LEFT JOIN rooms r ON r.center_id = c.id
GROUP BY c.id, c.name, c.code, c.status
ORDER BY c.created_at;
