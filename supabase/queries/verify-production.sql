-- ============================================
-- Production Database Verification Queries
-- Run these in Supabase SQL Editor
-- ============================================

-- 1. Count total restaurants
SELECT COUNT(*) as total_restaurants FROM restaurants;

-- 2. Count active vs inactive restaurants
SELECT 
  is_active,
  COUNT(*) as count
FROM restaurants
GROUP BY is_active
ORDER BY is_active DESC;

-- 3. List all restaurants with their status
SELECT 
  id,
  name,
  slug,
  is_active,
  is_featured,
  created_at,
  CASE 
    WHEN is_active THEN '✅ Active'
    ELSE '❌ Inactive'
  END as status
FROM restaurants
ORDER BY created_at DESC
LIMIT 20;

-- 4. Check restaurants_with_rating view
SELECT 
  id,
  name,
  slug,
  is_active,
  avg_rating,
  review_count
FROM restaurants_with_rating
WHERE is_active = true
ORDER BY avg_rating DESC NULLS LAST
LIMIT 10;

-- 5. Activate all inactive restaurants (if needed)
-- UNCOMMENT TO RUN:
-- UPDATE restaurants 
-- SET is_active = true 
-- WHERE is_active = false;

-- 6. Check RLS policies are enabled
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename IN ('restaurants', 'restaurants_with_rating')
ORDER BY tablename, policyname;

-- 7. Verify public read policy exists
SELECT 
  policyname,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'restaurants'
  AND policyname = 'restaurants_public_read_active';

-- 8. Test public access (simulate anon user)
-- This should return active restaurants
SET ROLE anon;
SELECT COUNT(*) as public_readable_restaurants
FROM restaurants
WHERE is_active = true;
RESET ROLE;

-- 9. Sample active restaurants for homepage
SELECT 
  id,
  name,
  slug,
  cuisine_types,
  price_range,
  avg_rating,
  review_count,
  is_featured
FROM restaurants_with_rating
WHERE is_active = true
ORDER BY 
  is_featured DESC,
  avg_rating DESC NULLS LAST,
  created_at DESC
LIMIT 12;
