import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { Loader2, MapPin, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";

type Listing = {
  id: string;
  title: string;
  has_valid_coords: boolean;
}

/**
 * This component provides tools to fix missing or invalid map coordinates
 * Use it when maps aren't correctly displaying listings
 */
const FixMapLocations = () => {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loadingListings, setLoadingListings] = useState(false);
  const [fixingListings, setFixingListings] = useState(false);
  const [processedCount, setProcessedCount] = useState(0);
  const [fixedCount, setFixedCount] = useState(0);

  // Load listings with invalid coordinates
  const loadListingsWithInvalidCoords = async () => {
    setLoadingListings(true);
    try {
      const { data, error } = await supabase.rpc("verify_listing_coordinates");
      
      if (error) {
        toast({
          title: "Error loading listings",
          description: error.message,
          variant: "destructive",
        });
        return;
      }
      
      if (data) {
        setListings(data);
      }
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Error",
        description: "Failed to load listings",
        variant: "destructive",
      });
    } finally {
      setLoadingListings(false);
    }
  };

  // Fix listings with invalid coordinates
  const fixListingsCoordinates = async () => {
    setFixingListings(true);
    setProcessedCount(0);
    setFixedCount(0);
    
    try {
      // Process listings that need fixing
      const listingsToFix = listings.filter(l => !l.has_valid_coords);
      
      for (const listing of listingsToFix) {
        const { data, error } = await supabase.rpc("update_test_geolocation", {
          listing_id: listing.id
        });
        
        setProcessedCount(prev => prev + 1);
        
        if (!error && data) {
          setFixedCount(prev => prev + 1);
        }
      }
      
      toast({
        title: "Update Complete",
        description: `Fixed ${fixedCount} of ${listingsToFix.length} listings`,
      });
      
      // Reload the list to show updated status
      await loadListingsWithInvalidCoords();
      
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Error",
        description: "Failed to fix listings",
        variant: "destructive",
      });
    } finally {
      setFixingListings(false);
    }
  };

  useEffect(() => {
    loadListingsWithInvalidCoords();
  }, []);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Fix Listing Locations</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {loadingListings ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
            </div>
          ) : (
            <>
              <div className="text-sm">
                {listings.length === 0 ? (
                  <p>All listings have valid coordinates! 🎉</p>
                ) : (
                  <p>{listings.filter(l => !l.has_valid_coords).length} listings need location data fixed</p>
                )}
              </div>
              
              {listings.length > 0 && (
                <div className="max-h-[300px] overflow-y-auto border rounded-md p-2">
                  <ul className="space-y-2">
                    {listings.map((listing) => (
                      <li key={listing.id} className="flex items-center justify-between text-sm">
                        <span className="truncate max-w-[200px]">{listing.title}</span>
                        {listing.has_valid_coords ? (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-500" />
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {fixingListings && (
                <div className="text-sm text-center">
                  Processing: {processedCount}/{listings.filter(l => !l.has_valid_coords).length} listings
                </div>
              )}
            </>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
          <Button 
        variant="outline" 
        onClick={loadListingsWithInvalidCoords}
        disabled={loadingListings || fixingListings}
          >
        {loadingListings ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Loading...
          </>
        ) : (
          "Refresh List"
        )}
          </Button>
          
          <Button 
        onClick={fixListingsCoordinates}
        disabled={loadingListings || fixingListings || listings.filter(l => !l.has_valid_coords).length === 0}
      >
        {fixingListings ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Fixing...
          </>
        ) : (
          "Fix Locations"
        )}
      </Button>
      </CardFooter>
    </Card>
  );
};

export default FixMapLocations; 