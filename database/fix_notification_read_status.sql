-- Fix notification read status persistence
-- Run this in Supabase SQL Editor

-- ============================================
-- STEP 1: Ensure notifications table exists with correct columns
-- ============================================

CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'system',
    is_read BOOLEAN DEFAULT false,
    data JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- ============================================
-- STEP 2: Create indexes for performance
-- ============================================

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at);

-- ============================================
-- STEP 3: Drop ALL existing policies and recreate
-- ============================================

DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.notifications;
DROP POLICY IF EXISTS "Enable select for users based on user_id" ON public.notifications;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON public.notifications;
DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON public.notifications;
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can insert own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can delete own notifications" ON public.notifications;

-- ============================================
-- STEP 4: Create CORRECT policies
-- ============================================

-- Policy: Users can view their own notifications
CREATE POLICY "Users can view own notifications"
ON public.notifications FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Authenticated users can insert notifications (for system notifications)
CREATE POLICY "Users can insert notifications"
ON public.notifications FOR INSERT
TO authenticated
WITH CHECK (true);

-- Policy: Users can UPDATE (mark as read) their own notifications
-- THIS IS THE KEY FIX - allows updating is_read field
CREATE POLICY "Users can update own notifications"
ON public.notifications FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own notifications
CREATE POLICY "Users can delete own notifications"
ON public.notifications FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- ============================================
-- STEP 5: Grant proper permissions
-- ============================================

GRANT ALL ON public.notifications TO authenticated;
GRANT SELECT, UPDATE ON public.notifications TO anon;

-- ============================================
-- STEP 6: Verify the fix
-- ============================================

-- Check if there are any notifications in the table
SELECT 
    id, 
    user_id, 
    message, 
    is_read, 
    created_at 
FROM public.notifications 
ORDER BY created_at DESC 
LIMIT 10;

-- ============================================
-- STEP 7: Create function to test read status update
-- ============================================

CREATE OR REPLACE FUNCTION test_notification_update()
RETURNS TEXT AS $$
DECLARE
    test_notif_id UUID;
    test_user_id UUID;
BEGIN
    -- Get first user with notifications
    SELECT user_id, id INTO test_user_id, test_notif_id 
    FROM notifications 
    WHERE is_read = false 
    LIMIT 1;
    
    IF test_notif_id IS NULL THEN
        RETURN 'No unread notifications found to test';
    END IF;
    
    -- Try to update
    UPDATE notifications 
    SET is_read = true 
    WHERE id = test_notif_id;
    
    RETURN 'SUCCESS: Updated notification ' || test_notif_id || ' for user ' || test_user_id;
EXCEPTION WHEN OTHERS THEN
    RETURN 'ERROR: ' || SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Run test
SELECT test_notification_update();
