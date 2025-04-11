import { motion } from "framer-motion";
import ScrapPickupMap from "@/components/map/ScrapPickupMap";
import FixMapLocations from "@/components/map/FixMapLocations";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { Search, MapPin, Navigation, Loader2 } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Location {
  lat: number;
  lng: number;
}

const Map = () => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchingLocation, setSearchingLocation] = useState(false);
  const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null);
  const [showMap, setShowMap] = useState(false);
  const [userLocation, setUserLocation] = useState<Location | null>(null);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [creatingTestListing, setCreatingTestListing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  
  const handleLocationSelected = (location: { lat: number; lng: number }) => {
    console.log("Selected location in parent component:", location);
    // This function could be used to store the location in state or send to backend
  };

  const handleSearchLocation = () => {
    if (!mapInstance || !searchQuery.trim()) {
      toast({
        title: "Search Error",
        description: "Please enter a location to search",
        variant: "destructive",
      });
      return;
    }
    
    setSearchingLocation(true);
    const geocoder = new google.maps.Geocoder();
    
    geocoder.geocode({ address: searchQuery }, (results, status) => {
      setSearchingLocation(false);
      
      if (status === "OK" && results && results[0]) {
        const location = results[0].geometry.location;
        
        mapInstance.setCenter({
          lat: location.lat(),
          lng: location.lng()
        });
        
        mapInstance.setZoom(12); // Zoom in to city level
        
        toast({
          title: "Location Found",
          description: `Showing results for ${searchQuery}`,
        });
      } else {
        console.error("Geocode was not successful:", status);
        toast({
          title: "Location Error",
          description: `Could not find location: ${searchQuery}`,
          variant: "destructive",
        });
      }
    });
  };

  const handleSetMapInstance = (map: google.maps.Map) => {
    setMapInstance(map);
  };

  // Handle getting user's location
  const handleGetMyLocation = () => {
    if (navigator.geolocation) {
      setGettingLocation(true);
      
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setUserLocation(location);
          setShowMap(true);
          setGettingLocation(false);
          
          // If map instance exists, center it on user location
          if (mapInstance) {
            mapInstance.setCenter(location);
            mapInstance.setZoom(14);
          }
          
          toast({
            title: "Location Found",
            description: "Showing scrap listings in your area",
          });
        },
        (error) => {
          console.error("Error getting location:", error);
          setGettingLocation(false);
          toast({
            title: "Location Error",
            description: "Could not access your location. Please allow location access or search manually.",
            variant: "destructive",
          });
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      toast({
        title: "Location Error",
        description: "Your browser doesn't support geolocation. Please search manually.",
        variant: "destructive",
      });
    }
  };

  // Create a test listing at current location
  const createTestListing = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to create a test listing.",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      
      // Get the first material type for the test listing
      const { data: materialTypes, error: materialTypesError } = await supabase
        .from('material_types')
        .select('id')
        .limit(1);
        
      if (materialTypesError) throw materialTypesError;
      if (!materialTypes || materialTypes.length === 0) {
        toast({
          title: "Error",
          description: "No material types found. Please create material types first.",
          variant: "destructive",
        });
        return;
      }
      
      // Create a test listing
      const { data, error } = await supabase
        .from('scrap_listings')
        .insert({
          title: `Test Listing ${new Date().toISOString().slice(0, 10)}`,
          description: 'This is a test listing created from the map page',
          listed_price: 10.00,
          quantity: 5.00,
          unit: 'kg',
          status: 'active',
          seller_id: user.id,
          material_type_id: materialTypes[0].id,
        })
        .select();
        
      if (error) throw error;
      
      if (data && data.length > 0) {
        toast({
          title: "Success",
          description: "Test listing created. You can now set its location on the map.",
        });
        
        // Redirect to pickup request page for the new listing
        window.location.href = `/pickup/${data[0].id}`;
      }
    } catch (error) {
      console.error("Error creating test listing:", error);
      toast({
        title: "Error",
        description: "Failed to create test listing. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Refresh the page data when it loads
    const fetchData = async () => {
      try {
        // You can add code here to load any additional data needed for the map
        
        // Check if user is admin
        if (user) {
          const { data, error } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();
            
          if (!error && data && data.role === 'admin') {
            setIsAdmin(true);
          }
        }
      } catch (error) {
        console.error("Error fetching map data:", error);
      }
    };
    
    fetchData();
  }, [user]);

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold text-gray-800">Scrap Pickup Map</h1>
        <p className="text-gray-600 mt-2">
          View all available pickup locations or request a pickup for your recyclable materials
        </p>
      </motion.div>

      {user ? (
        <>
          <div className="mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="relative flex-1">
                <Input 
                  placeholder="Search for a city (e.g., Delhi, Chennai, Bangalore)" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearchLocation()}
                  className="pr-10"
                />
                <button 
                  onClick={handleSearchLocation}
                  disabled={searchingLocation}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  aria-label="Search"
                >
                  <Search className="h-5 w-5" />
                </button>
              </div>
              
              <Button 
                onClick={handleGetMyLocation}
                disabled={gettingLocation}
                className="bg-teal-600 hover:bg-teal-700 h-full"
              >
                <Navigation className="mr-2 h-5 w-5" />
                {gettingLocation ? "Getting Your Location..." : "Find Scrap Near Me"}
              </Button>
            </div>
            
            <div className="flex justify-between items-center">
              <p className="text-sm text-gray-500">
                Click "Find Scrap Near Me" to see available scrap materials in your location,
                or search for scrap in other cities.
              </p>
              
              {userLocation && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={createTestListing}
                  disabled={loading}
                  className="ml-2"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : "Create Test Listing Here"}
                </Button>
              )}
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-3">
              <ScrapPickupMap 
                onLocationSelected={handleLocationSelected}
                initialLocation={userLocation}
                showAllListings={true}
                onMapLoad={handleSetMapInstance}
              />
            </div>
            
            {isAdmin && (
              <div className="lg:col-span-1">
                <FixMapLocations />
              </div>
            )}
          </div>
        </>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white p-8 rounded-lg shadow-md text-center"
        >
          <h2 className="text-2xl font-semibold mb-4">Sign In Required</h2>
          <p className="mb-6 text-gray-600">
            Please sign in to use the map and request scrap pickups.
          </p>
          <Button asChild>
            <Link to="/auth">Sign In</Link>
          </Button>
        </motion.div>
      )}
    </div>
  );
};

export default Map;
