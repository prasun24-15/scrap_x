-- Add is_donation column to scrap_listings
ALTER TABLE scrap_listings ADD COLUMN IF NOT EXISTS is_donation BOOLEAN DEFAULT FALSE;

-- Create NGOs table
CREATE TABLE IF NOT EXISTS ngos (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  address TEXT,
  phone TEXT,
  email TEXT,
  website TEXT,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  CONSTRAINT ngos_pkey PRIMARY KEY (id)
);

-- Add NGO reference to scrap_listings
ALTER TABLE scrap_listings ADD COLUMN IF NOT EXISTS ngo_id UUID REFERENCES ngos(id);

-- Create listing_requests table
CREATE TABLE IF NOT EXISTS listing_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES scrap_listings(id),
  buyer_id UUID NOT NULL REFERENCES auth.users(id),
  quantity_requested NUMERIC(10, 2) NOT NULL,
  price_offered NUMERIC(10, 2) NOT NULL,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  CONSTRAINT listing_requests_pkey PRIMARY KEY (id)
);

-- Create negotiations table
CREATE TABLE IF NOT EXISTS negotiations (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL,
  dealer_id UUID NOT NULL,
  seller_id UUID NOT NULL,
  initial_offer NUMERIC(10, 2) NOT NULL,
  counter_offer NUMERIC(10, 2) NULL,
  status TEXT NOT NULL DEFAULT 'pending'::text,
  created_at TIMESTAMP WITH TIME ZONE NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NULL DEFAULT now(),
  CONSTRAINT negotiations_pkey PRIMARY KEY (id),
  CONSTRAINT negotiations_dealer_id_fkey FOREIGN KEY (dealer_id) REFERENCES auth.users(id),
  CONSTRAINT negotiations_listing_id_fkey FOREIGN KEY (listing_id) REFERENCES scrap_listings(id),
  CONSTRAINT negotiations_seller_id_fkey FOREIGN KEY (seller_id) REFERENCES auth.users(id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_listing_requests_listing_id ON listing_requests(listing_id);
CREATE INDEX IF NOT EXISTS idx_listing_requests_buyer_id ON listing_requests(buyer_id);
CREATE INDEX IF NOT EXISTS idx_listing_requests_status ON listing_requests(status);
CREATE INDEX IF NOT EXISTS idx_scrap_listings_ngo_id ON scrap_listings(ngo_id);
CREATE INDEX IF NOT EXISTS idx_scrap_listings_is_donation ON scrap_listings(is_donation);
CREATE INDEX IF NOT EXISTS idx_negotiations_listing_id ON negotiations(listing_id);
CREATE INDEX IF NOT EXISTS idx_negotiations_dealer_id ON negotiations(dealer_id);
CREATE INDEX IF NOT EXISTS idx_negotiations_status ON negotiations(status);

-- Create update triggers
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = now();
   RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_ngos_modtime
BEFORE UPDATE ON ngos
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_listing_requests_modtime
BEFORE UPDATE ON listing_requests
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_negotiations_modtime
BEFORE UPDATE ON negotiations
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

-- Insert some example NGOs
INSERT INTO ngos (name, description, address, phone, email, website)
VALUES
  ('Green Earth Foundation', 'Recycling and environmental conservation organization focused on promoting sustainable practices.', '123 Green Street, Chennai, Tamil Nadu', '+91 98765 43210', 'contact@greenearthfoundation.org', 'https://www.greenearthfoundation.org'),
  ('Books for All', 'Non-profit organization that collects and distributes books to underprivileged children.', '45 Library Road, Mumbai, Maharashtra', '+91 87654 32109', 'info@booksforall.org', 'https://www.booksforall.org'),
  ('Upcycle India', 'Organization that transforms waste materials into useful products while providing employment to marginalized communities.', '78 Craft Avenue, Delhi, Delhi', '+91 76543 21098', 'hello@upcycleindia.org', 'https://www.upcycleindia.org'); 