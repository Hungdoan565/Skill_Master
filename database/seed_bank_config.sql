INSERT INTO public.system_settings (center_id, key, value, description)
VALUES (
  NULL,
  'bank_config',
  '{
    "bankId": "VCB",
    "bankName": "Vietcombank",
    "accountNo": "1029849106",
    "accountName": "SKILL MASTER EDU",
    "template": "compact2"
  }'::jsonb,
  'Cau hinh ngan hang nhan thanh toan VietQR'
)
ON CONFLICT (center_id, key) DO UPDATE SET
  value = EXCLUDED.value,
  updated_at = NOW();
