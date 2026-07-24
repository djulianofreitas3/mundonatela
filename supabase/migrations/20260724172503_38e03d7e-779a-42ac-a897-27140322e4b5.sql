BEGIN;

-- 1. Identify and delete activation requests for test installation_ids
DELETE FROM codigos_ativacao 
WHERE installation_id IN (
  'test-uuid-1234',
  'test-device-1784839004',
  'test-device-uuid-12345',
  'TEST_DEVICE_123',
  'test_device_123'
);

-- 2. Delete the devices themselves
DELETE FROM dispositivos 
WHERE installation_id IN (
  'test-uuid-1234',
  'test-device-1784839004',
  'test-device-uuid-12345',
  'TEST_DEVICE_123',
  'test_device_123'
);

-- 3. Verify real data remains
SELECT count(*) as devices_remaining FROM dispositivos;
SELECT count(*) as activations_remaining FROM codigos_ativacao;
SELECT device_name, installation_id FROM dispositivos WHERE installation_id = 'c7d89570-ac6f-4157-89a6-872bf6f2afae';

COMMIT;