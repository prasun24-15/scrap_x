-- SQL function to update geolocation in scrap_listings table
CREATE OR REPLACE FUNCTION update_geolocation(
  listing_id UUID,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update the geolocation using PostGIS syntax
  UPDATE scrap_listings
  SET geolocation = ST_SetSRID(ST_MakePoint(lng, lat), 4326)
  WHERE id = listing_id;
  
  RETURN FOUND;
END;
$$;

-- Example of how to call this function:
-- SELECT update_geolocation('your-listing-id-here', 13.0827, 80.2707); 