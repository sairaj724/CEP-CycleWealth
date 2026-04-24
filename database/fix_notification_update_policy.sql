-- Fix to allow users to update their notification data (status)
-- Run this in Supabase SQL Editor

-- ============================================
-- STEP 1: Drop and recreate the update policy
-- ============================================

DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON public.notifications;

-- Create policy that allows users to update their own notifications (including data field)
CREATE POLICY "Users can update own notifications"
ON public.notifications FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- ============================================
-- STEP 2: Grant update permission
-- ============================================

GRANT UPDATE ON public.notifications TO authenticated;

-- ============================================
-- STEP 3: Test the update functionality
-- ============================================

CREATE OR REPLACE FUNCTION test_notification_status_update()
RETURNS TEXT AS $$
DECLARE
    test_notif_id UUID;
    test_user_id UUID;
    current_data JSONB;
BEGIN
    -- Get first notification
    SELECT id, user_id, data INTO test_notif_id, test_user_id, current_data
    FROM notifications 
    LIMIT 1;
    
    IF test_notif_id IS NULL THEN
        RETURN 'No notifications found to test';
    END IF;
    
    -- Try to update the data field
    UPDATE notifications 
    SET data = jsonb_set(
        COALESCE(data, '{}'::jsonb),
        '{status}',
        '"test_accepted"'::jsonb
    )
    WHERE id = test_notif_id;
    
    RETURN 'SUCCESS: Updated notification ' || test_notif_id || ' data field';
EXCEPTION WHEN OTHERS THEN
    RETURN 'ERROR: ' || SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Run test
SELECT test_notification_status_update();

-- ============================================
-- STEP 4: Verify all policies are correct
-- ============================================

SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'notifications';
