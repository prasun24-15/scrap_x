-- Fix for negotiations table
-- This script addresses common issues that could cause 400 errors

-- First, make sure the update_modified_column function exists
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = now();
   RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop and recreate the negotiations table with specific settings
DROP TABLE IF EXISTS negotiations CASCADE;

-- Create the negotiations table from scratch
CREATE TABLE negotiations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL,
  dealer_id UUID NOT NULL,
  seller_id UUID NOT NULL,
  initial_offer NUMERIC(10, 2) NOT NULL,
  counter_offer NUMERIC(10, 2) NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add foreign key constraints after the table creation
ALTER TABLE negotiations 
ADD CONSTRAINT negotiations_listing_id_fkey 
FOREIGN KEY (listing_id) REFERENCES scrap_listings(id);

ALTER TABLE negotiations 
ADD CONSTRAINT negotiations_dealer_id_fkey 
FOREIGN KEY (dealer_id) REFERENCES auth.users(id);

ALTER TABLE negotiations 
ADD CONSTRAINT negotiations_seller_id_fkey 
FOREIGN KEY (seller_id) REFERENCES auth.users(id);

-- Create the trigger for updated_at
CREATE TRIGGER update_negotiations_modtime
BEFORE UPDATE ON negotiations
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

-- Create indexes
CREATE INDEX idx_negotiations_listing_id ON negotiations(listing_id);
CREATE INDEX idx_negotiations_dealer_id ON negotiations(dealer_id);
CREATE INDEX idx_negotiations_seller_id ON negotiations(seller_id);
CREATE INDEX idx_negotiations_status ON negotiations(status);

-- Enable Row Level Security
ALTER TABLE negotiations ENABLE ROW LEVEL SECURITY;

-- Create policies for both buyers and sellers
-- This allows users to view negotiations where they are either the dealer or the seller
CREATE POLICY "Allow users to view their own negotiations" 
ON negotiations
FOR SELECT
TO authenticated
USING (auth.uid() = dealer_id OR auth.uid() = seller_id);

-- Allow dealers to insert negotiations
CREATE POLICY "Allow dealers to insert negotiations" 
ON negotiations
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = dealer_id);

-- Allow dealers to update their own negotiations
CREATE POLICY "Allow dealers to update their negotiations" 
ON negotiations
FOR UPDATE
TO authenticated
USING (auth.uid() = dealer_id)
WITH CHECK (auth.uid() = dealer_id);

-- Allow sellers to update negotiations for their listings
CREATE POLICY "Allow sellers to update negotiations for their listings" 
ON negotiations
FOR UPDATE
TO authenticated
USING (auth.uid() = seller_id)
WITH CHECK (auth.uid() = seller_id);

-- Insert a test record to verify it works (optional)
-- Replace with actual values if you want to test
-- INSERT INTO negotiations (listing_id, dealer_id, initial_offer, status)
-- VALUES ('your-listing-id', 'your-user-id', 100.00, 'pending');

-- Add the insert_negotiation function in case it's needed
CREATE OR REPLACE FUNCTION insert_negotiation(
  p_listing_id UUID,
  p_dealer_id UUID,
  p_initial_offer NUMERIC,
  p_seller_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO negotiations (
    listing_id,
    dealer_id,
    seller_id,
    initial_offer,
    status,
    created_at,
    updated_at
  ) VALUES (
    p_listing_id,
    p_dealer_id,
    p_seller_id,
    p_initial_offer,
    'pending',
    now(),
    now()
  ) RETURNING id INTO v_id;
  
  RETURN v_id;
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Error inserting negotiation: %', SQLERRM;
END;
$$;

GRANT EXECUTE ON FUNCTION insert_negotiation TO authenticated; 