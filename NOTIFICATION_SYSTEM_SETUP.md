# 🔔 Notification System Setup Guide

## Overview
This notification system provides real-time notifications for:
- **Scrap Dealers**
- **Artisans**
- **Recycling Companies**

## Features
✅ Real-time notifications via Supabase Realtime  
✅ Bell icon with unread count badge  
✅ Dropdown panel with filters (All, Connections, Inventory)  
✅ Mark individual as read  
✅ Mark all as read  
✅ Delete individual notifications  
✅ Clear all notifications  

---

## 📦 Files Created

### 1. Database Migration
```
supabase/migrations/001_create_notifications.sql
```

### 2. Service Layer
```
src/services/notificationService.js
```

### 3. UI Components
```
src/components/NotificationDropdown.jsx
src/components/NotificationDropdown.css
```

### 4. Updated Navbar
```
src/components/SharedNavbar.jsx (updated)
```

---

## 🚀 Setup Instructions

### Step 1: Run the SQL Migration

Execute the SQL file in your Supabase SQL Editor:

1. Go to your Supabase Dashboard → SQL Editor
2. Copy the contents of `supabase/migrations/001_create_notifications.sql`
3. Run the SQL

This will create:
- `notifications` table
- Row Level Security policies
- Database triggers for automatic notifications

### Step 2: Install Dependencies

The notification system uses `lucide-react` for icons. If not already installed:

```bash
npm install lucide-react
```

### Step 3: Enable Realtime (if not already enabled)

In Supabase Dashboard:
1. Go to Database → Replication
2. Ensure `supabase_realtime` publication exists
3. Add `notifications` table to the publication

Or run this SQL:
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
```

---

## 📋 Notification Triggers

### 1. New Scrap Added
**When:** A user adds scrap to `scrap_inventory`  
**Notifies:** All connected users (accepted connections)  
**Message:** `"New scrap added by [User Name] in category [Category Name]"`

### 2. Connection Request Sent
**When:** A new connection is created with status 'pending'  
**Notifies:** The receiver  
**Message:** `"You received a new connection request from [User Name]"`

### 3. Connection Request Accepted
**When:** A connection status changes from 'pending' to 'accepted'  
**Notifies:** The requester  
**Message:** `"[User Name] accepted your connection request"`

---

## 🔌 API Functions

### Fetch Notifications
```javascript
import { fetchNotifications } from './services/notificationService';

const { data, error } = await fetchNotifications(20, 'connection');
// limit: 20, type: 'connection' | 'inventory' | 'system' | null
```

### Get Unread Count
```javascript
import { getUnreadNotificationCount } from './services/notificationService';

const { count, error } = await getUnreadNotificationCount();
```

### Mark as Read
```javascript
import { markNotificationAsRead } from './services/notificationService';

const { success, error } = await markNotificationAsRead(notificationId);
```

### Mark All as Read
```javascript
import { markAllNotificationsAsRead } from './services/notificationService';

const { success, error } = await markAllNotificationsAsRead();
```

### Delete Notification
```javascript
import { deleteNotification } from './services/notificationService';

const { success, error } = await deleteNotification(notificationId);
```

### Clear All
```javascript
import { clearAllNotifications } from './services/notificationService';

const { success, error } = await clearAllNotifications();
```

### Real-time Subscription
```javascript
import { subscribeToNotifications, unsubscribeFromNotifications } from './services/notificationService';

const subscription = subscribeToNotifications((newNotification) => {
    console.log('New notification:', newNotification);
});

// Cleanup
unsubscribeFromNotifications(subscription);
```

---

## 🎨 UI Components

### NotificationDropdown

The `NotificationDropdown` component is automatically integrated into `SharedNavbar`. It will show for all authenticated users.

**Features:**
- Bell icon with animated badge (shows unread count)
- Click to open dropdown panel
- Filter tabs: All, Connections (🔗), Inventory (📦)
- Unread indicators (green dot + green left border)
- Hover to show delete button
- Mark all as read button
- Clear all button with confirmation

---

## 🧪 Testing

### Test Scenario 1: Connection Request
1. User A sends connection request to User B
2. User B should receive notification: "You received a new connection request from User A"

### Test Scenario 2: Accept Connection
1. User B accepts the connection request
2. User A should receive notification: "User B accepted your connection request"

### Test Scenario 3: New Scrap
1. User A adds scrap to inventory
2. All accepted connections of User A should receive notification

---

## 📝 Database Schema

### notifications table
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | Recipient (references auth.users) |
| message | TEXT | Notification message |
| type | VARCHAR(50) | 'connection', 'inventory', 'system' |
| is_read | BOOLEAN | Default false |
| created_at | TIMESTAMP | When created |
| related_id | UUID | Optional reference to related record |

---

## 🛡️ Security

- **RLS Policies**: Users can only see their own notifications
- **Row Level Security**: Enabled on notifications table
- **Authentication Required**: All notification operations require valid session

---

## 🐛 Troubleshooting

### Notifications not appearing
1. Check SQL migration was executed
2. Verify `supabase_realtime` publication includes `notifications` table
3. Check browser console for errors
4. Verify user is authenticated (sessionStorage has 'user')

### Real-time not working
1. Check Supabase project settings → Database → Realtime
2. Verify `notifications` table is in the publication
3. Check browser network tab for WebSocket connections

### Badge count not updating
1. Refresh page to get initial count
2. Check that `getUnreadNotificationCount()` is being called
3. Verify `user.user_id` is available

---

## 🔄 Future Enhancements

- [ ] Push notifications using service workers
- [ ] Email notifications for important events
- [ ] In-app notification sound
- [ ] Notification preferences/settings
- [ ] Pagination for large notification lists
- [ ] Group similar notifications

---

## 📞 Support

For issues or questions, check:
1. Browser console for JavaScript errors
2. Supabase Logs for database errors
3. Network tab for API call failures
