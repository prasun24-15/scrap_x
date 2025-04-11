-- Create a stored procedure to insert a negotiation
-- This bypasses RLS for diagnosis purposes
CREATE OR REPLACE FUNCTION insert_negotiation(
  p_listing_id UUID,
  p_dealer_id UUID,
  p_initial_offer NUMERIC,
  p_seller_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER -- This means it runs with the privileges of the user who created it
AS $$
DECLARE
  v_id UUID;
BEGIN
  -- Insert the negotiation
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
  
  -- Return the ID of the created negotiation
  RETURN v_id;
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Error inserting negotiation: %', SQLERRM;
END;
$$;

-- Create a policy to allow the function to be called by authenticated users
GRANT EXECUTE ON FUNCTION insert_negotiation TO authenticated; 