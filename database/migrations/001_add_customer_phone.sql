-- Add customer_phone column to transactions table
ALTER TABLE transactions
ADD COLUMN customer_phone VARCHAR(20);
