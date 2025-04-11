-- Function to convert PostGIS binary format to text
CREATE OR REPLACE FUNCTION convert_geolocation_to_text(listing_row scrap_listings)
RETURNS TABLE (
  id uuid,
  title text,
  geolocation text,
  listed_price numeric,
  quantity numeric,
  unit text,
  material_type jsonb
) 
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    listing_row.id,
    listing_row.title,
    ST_AsText(listing_row.geolocation::geometry) as geolocation,
    listing_row.listed_price,
    listing_row.quantity,
    listing_row.unit,
    row_to_json(m.*)::jsonb as material_type
  FROM (SELECT * FROM material_types WHERE id = listing_row.material_type_id) m;
END;
$$; 