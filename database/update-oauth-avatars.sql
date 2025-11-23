-- ============================================
-- Update OAuth Avatars Migration
-- ============================================
-- This script updates existing profiles to include
-- avatar URLs from OAuth providers (picture field)
-- ============================================

-- Update profiles with avatar_url from auth.users metadata
-- This handles cases where OAuth providers use 'picture' instead of 'avatar_url'
UPDATE public.profiles p
SET avatar_url = COALESCE(
  p.avatar_url,  -- Keep existing if present
  (
    SELECT COALESCE(
      au.raw_user_meta_data->>'avatar_url',
      au.raw_user_meta_data->>'picture'
    )
    FROM auth.users au
    WHERE au.id = p.id
  )
)
WHERE p.avatar_url IS NULL
  AND EXISTS (
    SELECT 1
    FROM auth.users au
    WHERE au.id = p.id
    AND (
      au.raw_user_meta_data->>'avatar_url' IS NOT NULL
      OR au.raw_user_meta_data->>'picture' IS NOT NULL
    )
  );

-- Verify the update
SELECT 
  id,
  email,
  full_name,
  avatar_url,
  CASE 
    WHEN avatar_url IS NOT NULL THEN 'Has avatar'
    ELSE 'No avatar'
  END as avatar_status
FROM public.profiles
ORDER BY updated_at DESC
LIMIT 10;

