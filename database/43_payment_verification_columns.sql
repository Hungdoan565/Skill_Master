-- ============================================================
-- Add missing columns to payments table for student payment verification
-- Run this in Supabase SQL Editor
-- ============================================================

-- Add bank_proof_url column
ALTER TABLE public.payments
ADD COLUMN IF NOT EXISTS bank_proof_url TEXT;

-- Add verification_status column
ALTER TABLE public.payments
ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'verified' 
CHECK (verification_status IN ('pending', 'verified', 'rejected'));

-- Add verified_by column
ALTER TABLE public.payments
ADD COLUMN IF NOT EXISTS verified_by UUID REFERENCES public.users(id);

-- Add verified_at column
ALTER TABLE public.payments
ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ;

-- Add indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_payments_verification_status ON public.payments(verification_status);
CREATE INDEX IF NOT EXISTS idx_payments_verified_by ON public.payments(verified_by);

-- Comment
COMMENT ON COLUMN public.payments.bank_proof_url IS 'URL of bank transfer proof image uploaded by student';
COMMENT ON COLUMN public.payments.verification_status IS 'pending = awaiting verification, verified = confirmed, rejected = declined';
COMMENT ON COLUMN public.payments.verified_by IS 'Staff who verified this payment';
COMMENT ON COLUMN public.payments.verified_at IS 'When the payment was verified';

-- Done
SELECT 'Payment verification columns added successfully!' as result;
