BEGIN;

-- Define target user ID
-- '057ca5af-05ba-449f-9537-6bd4a6e7b915'

-- 1. Delete profiles entry for the user
DELETE FROM "profiles" 
WHERE "user_id" = '057ca5af-05ba-449f-9537-6bd4a6e7b915';

-- 2. Delete messaging requests involving the user
DELETE FROM "messaging_requests" 
WHERE "sender_id" = '057ca5af-05ba-449f-9537-6bd4a6e7b915' 
   OR "receiver_id" = '057ca5af-05ba-449f-9537-6bd4a6e7b915';

-- 3. Delete message receipts for messages sent by the user
DELETE FROM "message_receipts" 
WHERE "message_id" IN (
    SELECT "id" FROM "messages" WHERE "sender_user_id" = '057ca5af-05ba-449f-9537-6bd4a6e7b915'
);

-- 4. Delete message receipts associated with the user
DELETE FROM "message_receipts" 
WHERE "user_id" = '057ca5af-05ba-449f-9537-6bd4a6e7b915';

-- 5. Delete message versions (if any exist) associated with the user's messages
DELETE FROM "message_versions"
WHERE "message_id" IN (
    SELECT "id" FROM "messages" WHERE "sender_user_id" = '057ca5af-05ba-449f-9537-6bd4a6e7b915'
) OR "usersId" = '057ca5af-05ba-449f-9537-6bd4a6e7b915';

-- 6. Delete message visibilities (if any exist) associated with the user's messages
DELETE FROM "message_visibilities"
WHERE "message_id" IN (
    SELECT "id" FROM "messages" WHERE "sender_user_id" = '057ca5af-05ba-449f-9537-6bd4a6e7b915'
) OR "user_id" = '057ca5af-05ba-449f-9537-6bd4a6e7b915';

-- 7. Delete messages sent by the user
DELETE FROM "messages" 
WHERE "sender_user_id" = '057ca5af-05ba-449f-9537-6bd4a6e7b915';

-- 8. Delete conversation participants entries for the user
DELETE FROM "conversation_participants" 
WHERE "user_id" = '057ca5af-05ba-449f-9537-6bd4a6e7b915';

-- 9. Delete notification log entries for the user
DELETE FROM "notification_log" 
WHERE "user_id" = '057ca5af-05ba-449f-9537-6bd4a6e7b915';

-- 10. Delete presences entry for the user
DELETE FROM "presences" 
WHERE "user_id" = '057ca5af-05ba-449f-9537-6bd4a6e7b915';

-- 11. Finally, delete the user from the users table
DELETE FROM "users" 
WHERE "id" = '057ca5af-05ba-449f-9537-6bd4a6e7b915';

COMMIT;
