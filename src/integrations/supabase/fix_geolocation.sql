-- Fix geolocation data in the database

-- Function to get listings with properly formatted coordinates
-- This ensures we return proper lat/lng values for the frontend
CREATE OR REPLACE FUNCTION get_listings_with_coordinates()
RETURNS TABLE (
  id uuid,
  title text,
  description text,
  material_type_id uuid,
  quantity numeric,
  unit text,
  listed_price numeric,
  address text,
  latitude double precision,
  longitude double precision,
  status text,
  created_at timestamptz,
  seller_id uuid,
  material_type jsonb
) LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  SELECT 
    l.id,
    l.title,
    l.description,
    l.material_type_id,
    l.quantity,
    l.unit,
    l.listed_price,
    l.address,
    -- Extract coordinates safely with fallbacks
    CASE 
      WHEN l.geolocation IS NOT NULL AND ST_X(l.geolocation::geometry) IS NOT NULL THEN ST_X(l.geolocation::geometry)
      ELSE NULL
    END AS latitude,
    CASE 
      WHEN l.geolocation IS NOT NULL AND ST_Y(l.geolocation::geometry) IS NOT NULL THEN ST_Y(l.geolocation::geometry)
      ELSE NULL
    END AS longitude,
    l.status,
    l.created_at,
    l.seller_id,
    (SELECT jsonb_build_object(
      'id', mt.id,
      'name', mt.name,
      'category', mt.category
    ) FROM material_types mt WHERE mt.id = l.material_type_id) AS material_type
  FROM scrap_listings l
  WHERE l.status != 'deleted';
END; $$;

-- Update geolocation for test data
CREATE OR REPLACE FUNCTION update_test_geolocation()
RETURNS text LANGUAGE plpgsql AS $$
DECLARE
  count_updated int := 0;
BEGIN
  -- Update any listings with null geolocation to a default location (Chennai, India)
  UPDATE scrap_listings
  SET geolocation = ST_SetSRID(ST_MakePoint(80.2707, 13.0827), 4326)
  WHERE geolocation IS NULL AND status != 'deleted';
  
  GET DIAGNOSTICS count_updated = ROW_COUNT;
  
  RETURN 'Updated ' || count_updated || ' listings with default location';
END; $$;

-- Verify coordinate data
CREATE OR REPLACE FUNCTION verify_listing_coordinates()
RETURNS TABLE (
  id uuid,
  has_valid_coordinates boolean,
  latitude double precision,
  longitude double precision
) LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  SELECT 
    l.id,
    CASE 
      WHEN l.geolocation IS NOT NULL 
           AND ST_X(l.geolocation::geometry) IS NOT NULL
           AND ST_Y(l.geolocation::geometry) IS NOT NULL
      THEN true
      ELSE false
    END AS has_valid_coordinates,
    CASE 
      WHEN l.geolocation IS NOT NULL THEN ST_X(l.geolocation::geometry)
      ELSE NULL
    END AS latitude,
    CASE 
      WHEN l.geolocation IS NOT NULL THEN ST_Y(l.geolocation::geometry)
      ELSE NULL
    END AS longitude
  FROM scrap_listings l
  WHERE l.status != 'deleted';
END; $$;

-- Example usage:
-- SELECT * FROM get_listings_with_coordinates();
-- SELECT update_test_geolocation();
-- SELECT * FROM verify_listing_coordinates(); 