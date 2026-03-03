-- Fix certificates_status_check constraint to allow pending_approval and active statuses
ALTER TABLE certificates DROP CONSTRAINT IF EXISTS certificates_status_check;
ALTER TABLE certificates ADD CONSTRAINT certificates_status_check 
  CHECK (status = ANY (ARRAY['issued', 'revoked', 'expired', 'pending_approval', 'active']));
