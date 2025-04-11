-- This migration adds functions for checking and fixing map coordinates

-- Verify Listing Coordinates Function
-- This function checks if listings have valid latitude and longitude values
CREATE OR REPLACE FUNCTION public.verify_listing_coordinates()
RETURNS TABLE (
  id uuid,
  title text,
  has_valid_coords boolean
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    l.id,
    l.title,
    CASE 
      WHEN l.latitude IS NOT NULL 
       AND l.longitude IS NOT NULL
       AND l.latitude BETWEEN -90 AND 90
       AND l.longitude BETWEEN -180 AND 180
       AND l.latitude <> 0
       AND l.longitude <> 0
      THEN true
      ELSE false
    END as has_valid_coords
  FROM 
    scrap_listings l
  WHERE 
    l.status = 'active'
  ORDER BY 
    has_valid_coords ASC, 
    l.created_at DESC;
END;
$$;

-- Comment on function
COMMENT ON FUNCTION public.verify_listing_coordinates IS 'Checks if scrap listings have valid latitude and longitude coordinates';

-- Update Listing Geolocation Function
-- Sets default coordinates for listings with missing or invalid coordinates
CREATE OR REPLACE FUNCTION public.update_test_geolocation(
  listing_id uuid DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  title text,
  updated boolean
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- If listing_id is provided, update only that listing
  IF listing_id IS NOT NULL THEN
    RETURN QUERY
    WITH updated_rows AS (
      UPDATE scrap_listings
      SET 
        latitude = 51.505,  -- Default latitude (London)
        longitude = -0.09,  -- Default longitude (London)
        updated_at = NOW()
      WHERE 
        id = listing_id
        AND (
          latitude IS NULL OR 
          longitude IS NULL OR
          latitude = 0 OR
          longitude = 0 OR
          latitude < -90 OR latitude > 90 OR
          longitude < -180 OR longitude > 180
        )
      RETURNING id, title
    )
    SELECT 
      ur.id,
      ur.title,
      TRUE as updated
    FROM 
      updated_rows ur;
  
  -- If no listing_id is provided, update all listings with invalid coordinates
  ELSE
    RETURN QUERY
    WITH updated_rows AS (
      UPDATE scrap_listings
      SET 
        latitude = 51.505,  -- Default latitude (London)
        longitude = -0.09,  -- Default longitude (London)
        updated_at = NOW()
      WHERE 
        latitude IS NULL OR 
        longitude IS NULL OR
        latitude = 0 OR
        longitude = 0 OR
        latitude < -90 OR latitude > 90 OR
        longitude < -180 OR longitude > 180
      RETURNING id, title
    )
    SELECT 
      ur.id,
      ur.title,
      TRUE as updated
    FROM 
      updated_rows ur;
  END IF;
END;
$$;

-- Comment on function
COMMENT ON FUNCTION public.update_test_geolocation IS 'Updates listings with missing or invalid coordinates to default test values'; 