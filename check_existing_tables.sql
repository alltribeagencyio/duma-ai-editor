-- =====================================================
-- CHECK EXISTING TABLES IN SUPABASE
-- Run this first to see what tables already exist
-- =====================================================

-- List all tables in public schema
SELECT
    table_name,
    (SELECT COUNT(*)
     FROM information_schema.columns
     WHERE table_name = t.table_name
     AND table_schema = 'public') as column_count
FROM information_schema.tables t
WHERE table_schema = 'public'
    AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- =====================================================
-- Check for specific tables needed by the app
-- =====================================================
SELECT
    CASE
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'User' AND table_schema = 'public')
        THEN '✅ User table EXISTS'
        ELSE '❌ User table MISSING'
    END as user_table_status,

    CASE
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'Job' AND table_schema = 'public')
        THEN '✅ Job table EXISTS'
        ELSE '❌ Job table MISSING'
    END as job_table_status,

    CASE
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'PromptPreset' AND table_schema = 'public')
        THEN '✅ PromptPreset table EXISTS'
        ELSE '❌ PromptPreset table MISSING'
    END as prompt_preset_status,

    CASE
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'CustomPrompt' AND table_schema = 'public')
        THEN '✅ CustomPrompt table EXISTS'
        ELSE '❌ CustomPrompt table MISSING'
    END as custom_prompt_status,

    CASE
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'BrandPrompt' AND table_schema = 'public')
        THEN '✅ BrandPrompt table EXISTS'
        ELSE '❌ BrandPrompt table MISSING'
    END as brand_prompt_status,

    CASE
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'CreditUsage' AND table_schema = 'public')
        THEN '✅ CreditUsage table EXISTS'
        ELSE '❌ CreditUsage table MISSING'
    END as credit_usage_status,

    CASE
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'SubscriptionPlan' AND table_schema = 'public')
        THEN '✅ SubscriptionPlan table EXISTS'
        ELSE '❌ SubscriptionPlan table MISSING'
    END as subscription_plan_status,

    CASE
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'Subscription' AND table_schema = 'public')
        THEN '✅ Subscription table EXISTS'
        ELSE '❌ Subscription table MISSING'
    END as subscription_status,

    CASE
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'Payment' AND table_schema = 'public')
        THEN '✅ Payment table EXISTS'
        ELSE '❌ Payment table MISSING'
    END as payment_status;

-- =====================================================
-- If User table exists, check its columns
-- =====================================================
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'User' AND table_schema = 'public') THEN
        RAISE NOTICE '--- User Table Columns ---';
    END IF;
END $$;

SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'User'
    AND table_schema = 'public'
ORDER BY ordinal_position;
