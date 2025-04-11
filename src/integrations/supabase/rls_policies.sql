-- RLS (Row Level Security) Policies for Negotiations Table

-- First check if negotiations table exists, create if it doesn't
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM pg_tables
        WHERE schemaname = 'public'
        AND tablename = 'negotiations'
    ) THEN
        -- Create the negotiations table with proper column types
        CREATE TABLE negotiations (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          listing_id UUID NOT NULL REFERENCES scrap_listings(id),
          dealer_id UUID NOT NULL REFERENCES auth.users(id),
          seller_id UUID NOT NULL REFERENCES auth.users(id),
          initial_offer NUMERIC(10, 2) NOT NULL,
          counter_offer NUMERIC(10, 2) NULL,
          status TEXT NOT NULL DEFAULT 'pending',
          created_at TIMESTAMPTZ DEFAULT now(),
          updated_at TIMESTAMPTZ DEFAULT now()
        );

        -- Create indexes for better performance
        CREATE INDEX idx_negotiations_listing_id ON negotiations(listing_id);
        CREATE INDEX idx_negotiations_dealer_id ON negotiations(dealer_id);
        CREATE INDEX idx_negotiations_seller_id ON negotiations(seller_id);
        CREATE INDEX idx_negotiations_status ON negotiations(status);
        
        -- Add a trigger for updating the updated_at timestamp
        CREATE TRIGGER update_negotiations_modtime
        BEFORE UPDATE ON negotiations
        FOR EACH ROW
        EXECUTE FUNCTION update_modified_column();
        
        RAISE NOTICE 'Created negotiations table successfully';
    ELSE
        RAISE NOTICE 'Negotiations table already exists, not creating';
    END IF;
END
$$;

-- Enable RLS on negotiations table
ALTER TABLE negotiations ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view their own negotiations as dealer" ON negotiations;
DROP POLICY IF EXISTS "Users can view negotiations for their listings" ON negotiations;
DROP POLICY IF EXISTS "Users can create negotiations" ON negotiations;
DROP POLICY IF EXISTS "Dealers can update their own negotiations" ON negotiations;
DROP POLICY IF EXISTS "Listing owners can update negotiations on their listings" ON negotiations;
DROP POLICY IF EXISTS "Users can view their negotiations" ON negotiations;

-- Create policies with proper permissions

-- Policy for users to see negotiations where they are either dealer or seller
CREATE POLICY "Users can view their negotiations"
ON negotiations
FOR SELECT
USING (auth.uid() = dealer_id OR auth.uid() = seller_id);

-- Policy for creating negotiations
CREATE POLICY "Users can create negotiations"
ON negotiations
FOR INSERT
WITH CHECK (auth.uid() = dealer_id);

-- Policy for dealers to update their own negotiations
CREATE POLICY "Dealers can update their own negotiations"
ON negotiations
FOR UPDATE
USING (auth.uid() = dealer_id)
WITH CHECK (auth.uid() = dealer_id AND status != 'accepted' AND status != 'rejected');

-- Policy for sellers to update negotiations for their listings
CREATE POLICY "Sellers can update negotiations"
ON negotiations
FOR UPDATE
USING (auth.uid() = seller_id)
WITH CHECK (auth.uid() = seller_id);

-- Insert a test negotiation if you want to verify the table works
-- Uncomment and modify with valid IDs to test
/*
INSERT INTO negotiations (listing_id, dealer_id, seller_id, initial_offer, status)
VALUES 
  ('replace-with-valid-listing-id', 'replace-with-valid-user-id', 'replace-with-valid-seller-id', 100.00, 'pending');
*/ 