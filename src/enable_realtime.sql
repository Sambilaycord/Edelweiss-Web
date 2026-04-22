-- Enable Realtime for cart_items table
-- This allows the Navbar to receive "INSERT/UPDATE/DELETE" events automatically
ALTER PUBLICATION supabase_realtime ADD TABLE cart_items;

-- If you get an error that it already exists, ignore it.
-- If the publication doesn't exist at all, you might need to create it:
-- CREATE PUBLICATION supabase_realtime FOR TABLE cart_items;
