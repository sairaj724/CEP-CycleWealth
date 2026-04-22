-- ============================================
-- NOTIFICATION SYSTEM - Database Setup
-- ============================================

-- 1. Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('connection', 'inventory', 'system')),
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    related_id UUID -- Optional: reference to related record (connection_id, inventory_id, etc.)
);

-- Create index for faster queries
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);

-- Enable Row Level Security
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own notifications
CREATE POLICY "Users can view their own notifications"
    ON notifications FOR SELECT
    USING (auth.uid() = user_id);

-- Policy: Users can update their own notifications (mark as read)
CREATE POLICY "Users can update their own notifications"
    ON notifications FOR UPDATE
    USING (auth.uid() = user_id);

-- Policy: Users can delete their own notifications
CREATE POLICY "Users can delete their own notifications"
    ON notifications FOR DELETE
    USING (auth.uid() = user_id);

-- Policy: System can insert notifications for any user
CREATE POLICY "System can insert notifications"
    ON notifications FOR INSERT
    WITH CHECK (true);

-- ============================================
-- 2. Function to get user's full name
-- ============================================
CREATE OR REPLACE FUNCTION get_user_name(user_uuid UUID)
RETURNS TEXT AS $$
DECLARE
    full_name TEXT;
    first_name TEXT;
    last_name TEXT;
    user_email TEXT;
BEGIN
    -- Try to get from user metadata
    SELECT 
        raw_user_meta_data->>'first_name',
        raw_user_meta_data->>'last_name',
        email
    INTO first_name, last_name, user_email
    FROM auth.users
    WHERE id = user_uuid;
    
    -- Build full name or fallback to email
    IF first_name IS NOT NULL AND last_name IS NOT NULL THEN
        full_name := first_name || ' ' || last_name;
    ELSIF first_name IS NOT NULL THEN
        full_name := first_name;
    ELSIF user_email IS NOT NULL THEN
        -- Extract name from email (before @)
        full_name := split_part(user_email, '@', 1);
    ELSE
        full_name := 'A user';
    END IF;
    
    RETURN full_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 3. Trigger: When connection request is SENT
-- Notify the receiver
-- ============================================
CREATE OR REPLACE FUNCTION notify_connection_request_sent()
RETURNS TRIGGER AS $$
DECLARE
    requester_name TEXT;
BEGIN
    requester_name := get_user_name(NEW.requester_id);
    
    INSERT INTO notifications (user_id, message, type, related_id)
    VALUES (
        NEW.receiver_id,
        'You received a new connection request from ' || requester_name,
        'connection',
        NEW.id
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_connection_request_sent ON connections;
CREATE TRIGGER trg_connection_request_sent
    AFTER INSERT ON connections
    FOR EACH ROW
    WHEN (NEW.status = 'pending')
    EXECUTE FUNCTION notify_connection_request_sent();

-- ============================================
-- 4. Trigger: When connection request is ACCEPTED
-- Notify the requester
-- ============================================
CREATE OR REPLACE FUNCTION notify_connection_accepted()
RETURNS TRIGGER AS $$
DECLARE
    receiver_name TEXT;
BEGIN
    -- Only trigger when status changes to 'accepted'
    IF NEW.status = 'accepted' AND OLD.status = 'pending' THEN
        receiver_name := get_user_name(NEW.receiver_id);
        
        INSERT INTO notifications (user_id, message, type, related_id)
        VALUES (
            NEW.requester_id,
            receiver_name || ' accepted your connection request',
            'connection',
            NEW.id
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_connection_accepted ON connections;
CREATE TRIGGER trg_connection_accepted
    AFTER UPDATE ON connections
    FOR EACH ROW
    EXECUTE FUNCTION notify_connection_accepted();

-- ============================================
-- 5. Trigger: When new scrap is added
-- Notify all connected users with accepted status
-- ============================================
CREATE OR REPLACE FUNCTION notify_new_scrap_added()
RETURNS TRIGGER AS $$
DECLARE
    scrap_owner_name TEXT;
    connected_user RECORD;
BEGIN
    scrap_owner_name := get_user_name(NEW.user_id);
    
    -- Notify users who have accepted connections with the scrap owner
    -- (where scrap owner is either requester or receiver)
    FOR connected_user IN
        SELECT 
            CASE 
                WHEN requester_id = NEW.user_id THEN receiver_id
                ELSE requester_id
            END AS user_to_notify
        FROM connections
        WHERE (requester_id = NEW.user_id OR receiver_id = NEW.user_id)
          AND status = 'accepted'
    LOOP
        INSERT INTO notifications (user_id, message, type, related_id)
        VALUES (
            connected_user.user_to_notify,
            'New scrap added by ' || scrap_owner_name || ' in category ' || COALESCE(NEW.category, 'Uncategorized'),
            'inventory',
            NEW.id
        );
    END LOOP;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_new_scrap_added ON scrap_inventory;
CREATE TRIGGER trg_new_scrap_added
    AFTER INSERT ON scrap_inventory
    FOR EACH ROW
    EXECUTE FUNCTION notify_new_scrap_added();

-- ============================================
-- 6. Real-time: Enable publications for notifications
-- ============================================
-- Add notifications to supabase_realtime publication
BEGIN;
  -- Drop the table from publication if it exists
  ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS notifications;
  -- Add the table to publication
  ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
COMMIT;
