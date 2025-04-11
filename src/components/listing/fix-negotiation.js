// Direct Negotiation Insert Debug Script
// Can be used to test if the issue is with the Supabase JavaScript client
// or with the database/permissions

import { createClient } from '@supabase/supabase-js';

// Replace with your Supabase URL and anon key
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'YOUR_SUPABASE_URL';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY';

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

async function testNegotiationInsert() {
  console.log('Starting negotiation insert test...');

  // Test authentication - make sure user is logged in
  const { data: authData, error: authError } = await supabase.auth.getSession();
  
  if (authError) {
    console.error('Authentication error:', authError);
    return;
  }
  
  if (!authData?.session?.user) {
    console.error('Not authenticated - please log in first');
    return;
  }
  
  console.log('Authenticated as:', authData.session.user.id);
  
  // Get a sample listing to use for the test
  const { data: listings, error: listingsError } = await supabase
    .from('scrap_listings')
    .select('id')
    .limit(1);
    
  if (listingsError) {
    console.error('Error getting sample listing:', listingsError);
    return;
  }
  
  if (!listings || listings.length === 0) {
    console.error('No listings found to test with');
    return;
  }
  
  const sampleListingId = listings[0].id;
  console.log('Using sample listing ID:', sampleListingId);
  
  // Try direct insert
  const negotiationData = {
    listing_id: sampleListingId,
    dealer_id: authData.session.user.id,
    initial_offer: 100.00,
    status: 'pending'
  };
  
  console.log('Attempting to insert:', negotiationData);
  
  try {
    const { data, error } = await supabase
      .from('negotiations')
      .insert(negotiationData);
    
    if (error) {
      console.error('Insert failed:', error);
    } else {
      console.log('Insert successful!', data);
    }
  } catch (err) {
    console.error('Exception during insert:', err);
  }
  
  // Try direct SQL query as fallback (requires database access)
  try {
    console.log('Trying direct SQL query...');
    
    const { data, error } = await supabase.rpc('insert_negotiation', {
      p_listing_id: sampleListingId,
      p_dealer_id: authData.session.user.id,
      p_initial_offer: 100.00
    });
    
    if (error) {
      console.error('SQL function call failed:', error);
    } else {
      console.log('SQL function call successful!', data);
    }
  } catch (err) {
    console.error('Exception during SQL function call:', err);
  }
}

// Run the test when the script is executed
testNegotiationInsert();

export default testNegotiationInsert; 