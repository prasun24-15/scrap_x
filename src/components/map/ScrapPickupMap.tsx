import { useState, useEffect, useCallback } from 'react';
import { GoogleMap, LoadScript, Marker, StandaloneSearchBox, InfoWindow } from '@react-google-maps/api';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { MapPin, Loader2, Navigation, Search } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

// Define types for our component
interface Location {
  lat: number;
  lng: number;
}

interface GeoJSONPoint {
  type: 'Point';
  coordinates: number[];
}

interface ListingMarker {
  id: string;
  location: Location;
  title: string;
  price?: number;
  quantity?: number;
  unit?: string;
  material_category?: string;
}

// Add types for RPC responses
interface ListingWithCoordinates {
  id: string;
  title: string;
  latitude: number;
  longitude: number;
  listed_price: number;
  quantity: number;
  unit: string;
  material_type: {
    name: string;
    category: string;
  };
}

interface GeographyPoint {
  type: string;
  coordinates: number[];
}

interface ScrapPickupMapProps {
  onLocationSelected?: (location: Location) => void;
  initialLocation?: Location;
  readOnly?: boolean;
  listingId?: string;
  showAllListings?: boolean;
  onMapLoad?: (map: google.maps.Map) => void;
}

interface MaterialType {
  name: string;
  category: string;
}

interface DatabaseListing {
  id: string;
  title: string;
  listed_price: number;
  quantity: number;
  unit: string;
  geolocation: string | {
    type: string;
    coordinates: number[];
  };
  material_type: MaterialType;
}

const mapContainerStyle = {
  width: '100%',
  height: '500px',
  borderRadius: '0.5rem'
};

const defaultCenter = {
  lat: 20.5937, // Centered on India as default
  lng: 78.9629
};

// Define libraries with correct type
const libraries: ("places" | "drawing" | "geometry" | "visualization")[] = ["places"];

const ScrapPickupMap = ({ 
  onLocationSelected, 
  initialLocation, 
  readOnly = false, 
  listingId, 
  showAllListings = false,
  onMapLoad
}: ScrapPickupMapProps) => {
  const [currentLocation, setCurrentLocation] = useState<Location | null>(initialLocation || null);
  const [loading, setLoading] = useState(false);
  const [gettingCurrentLocation, setGettingCurrentLocation] = useState(false);
  const [locationError, setLocationError] = useState<string>('');
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [searchBox, setSearchBox] = useState<google.maps.places.SearchBox | null>(null);
  const [address, setAddress] = useState<string>("");
  const [allListings, setAllListings] = useState<ListingMarker[]>([]);
  const [selectedMarker, setSelectedMarker] = useState<string | null>(null);
  const { user } = useAuth();
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);

  const handleScriptLoad = useCallback(() => {
    setIsScriptLoaded(true);
  }, []);

  const handleMapLoad = useCallback((map: google.maps.Map) => {
    setMap(map);
    if (onMapLoad) {
      onMapLoad(map);
    }
  }, [onMapLoad]);

  // Fetch all listings with location data
  useEffect(() => {
    if (showAllListings) {
      fetchAllListings();
    }
  }, [showAllListings]);

  // Use a separate effect to set up the map when it loads
  useEffect(() => {
    if (map && initialLocation && !showAllListings) {
      console.log("Setting initial location on map:", initialLocation);
      map.setCenter(initialLocation);
      map.setZoom(14);
    }
  }, [map, initialLocation, showAllListings]);

  const fetchAllListings = async () => {
    try {
      setLoading(true);
      console.log("Fetching all listings with showAllListings =", showAllListings);
      
      // Use the RPC function that we created
      const { data, error } = await supabase
        .rpc('get_listings_with_coordinates');
      
      if (error) {
        console.error("Error fetching listings:", error);
        throw error;
      }
      
      if (data && data.length > 0) {
        console.log("Raw listings data:", data);
        
        const markers = data
          .filter(item => item.latitude && item.longitude)
          .map(item => {
            try {
              const location = {
                lat: item.latitude,
                lng: item.longitude
              };
              
              console.log(`Processed location for listing ${item.id}:`, location);
              
              return {
                id: item.id,
                location,
                title: item.title,
                price: item.listed_price,
                quantity: item.quantity,
                unit: item.unit,
                material_category: item.material_type?.category || 'Other'
              };
            } catch (error) {
              console.error(`Error processing listing ${item.id}:`, error);
              return null;
            }
          })
          .filter(Boolean) as ListingMarker[];
        
        console.log("Final processed markers:", markers);
        setAllListings(markers);
        
        // If we have markers and a map, adjust bounds to show all markers
        if (markers.length > 0 && map) {
          const bounds = new google.maps.LatLngBounds();
          markers.forEach(marker => {
            bounds.extend(marker.location);
          });
          
          map.fitBounds(bounds);
          
          // Don't zoom in too far on single markers
          const zoomListener = google.maps.event.addListenerOnce(map, 'bounds_changed', () => {
            if (map.getZoom() && map.getZoom() > 15) {
              map.setZoom(15);
            }
          });
        }
      } else {
        console.log("No listing data returned or empty array");
      }
    } catch (error) {
      console.error("Error in fetchAllListings:", error);
      toast({
        title: "Error",
        description: "Failed to load listing locations",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getUserLocation = useCallback(() => {
    if (navigator.geolocation) {
      setGettingCurrentLocation(true);
      setLocationError('');
      
      // Clear any previous timeout
      const timeoutId = setTimeout(() => {
        if (gettingCurrentLocation) {
          setGettingCurrentLocation(false);
          setLocationError('Location request timed out. Please try manual entry.');
          toast({
            title: "Location Timeout",
            description: "Could not get your location. Try entering it manually.",
            variant: "destructive",
          });
        }
      }, 10000);

      navigator.geolocation.getCurrentPosition(
        (position) => {
          clearTimeout(timeoutId);
          const userLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setCurrentLocation(userLocation);
          
          // If map is already loaded, center it on the user's location
          if (map) {
            map.panTo(userLocation);
            map.setZoom(14);
          }
          
          if (onLocationSelected) {
            onLocationSelected(userLocation);
          }
          
          setGettingCurrentLocation(false);
          toast({
            title: "Location Found",
            description: "Your current location has been set successfully",
          });
          
          // Get address from coordinates
          if (window.google && window.google.maps) {
            const geocoder = new google.maps.Geocoder();
            geocoder.geocode({ location: userLocation }, (results, status) => {
              if (status === "OK" && results && results[0]) {
                setAddress(results[0].formatted_address);
              }
            });
          }
        },
        (error) => {
          clearTimeout(timeoutId);
          console.error('Error getting location:', error);
          let errorMessage = "Unable to access your location. Please enable location services.";
          
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = "Location permission denied. Please enable location access in your browser.";
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = "Location information is unavailable. Please try again later.";
              break;
            case error.TIMEOUT:
              errorMessage = "Location request timed out. Please try again.";
              break;
          }
          
          setLocationError(errorMessage);
          toast({
            title: "Location Error",
            description: errorMessage,
            variant: "destructive",
          });
          setGettingCurrentLocation(false);
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
      );
    } else {
      setLocationError('Geolocation is not supported by your browser');
      toast({
        title: "Geolocation Not Supported",
        description: "Your browser doesn't support geolocation.",
        variant: "destructive",
      });
    }
  }, [map, onLocationSelected, gettingCurrentLocation]);

  // Get user's current location when component mounts
  useEffect(() => {
    if (!initialLocation && !readOnly && !currentLocation && !showAllListings) {
      getUserLocation();
    }
  }, [initialLocation, readOnly, getUserLocation, currentLocation, showAllListings]);

  const handleMapClick = (e: google.maps.MapMouseEvent) => {
    if (readOnly) return;
    
    if (e.latLng) {
      const clickedLocation = {
        lat: e.latLng.lat(),
        lng: e.latLng.lng()
      };
      setCurrentLocation(clickedLocation);
      
      if (onLocationSelected) {
        onLocationSelected(clickedLocation);
      }
      
      // Get address from coordinates
      if (window.google && window.google.maps) {
        const geocoder = new google.maps.Geocoder();
        geocoder.geocode({ location: clickedLocation }, (results, status) => {
          if (status === "OK" && results && results[0]) {
            setAddress(results[0].formatted_address);
          }
        });
      }
    }
  };

  const handlePlacesChanged = () => {
    if (!searchBox) return;
    
    const places = searchBox.getPlaces();
    if (places && places.length > 0) {
      const place = places[0];
      if (place.geometry && place.geometry.location) {
        const newLocation = {
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng()
        };
        
        setCurrentLocation(newLocation);
        map?.panTo(newLocation);
        map?.setZoom(15);
        
        if (onLocationSelected) {
          onLocationSelected(newLocation);
        }
        
        if (place.formatted_address) {
          setAddress(place.formatted_address);
        }
      }
    }
  };

  const handleMarkerClick = (id: string) => {
    setSelectedMarker(id);
    
    // Find the marker and center the map on it
    const marker = allListings.find(m => m.id === id);
    if (marker && map) {
      map.panTo(marker.location);
      map.setZoom(15);
    }
  };

  const handleInfoWindowClose = () => {
    setSelectedMarker(null);
  };

  const handleSearchBoxLoad = (ref: google.maps.places.SearchBox) => {
    setSearchBox(ref);
  };

  const handleRequestPickup = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to request a pickup.",
        variant: "destructive",
      });
      return;
    }
    
    if (!currentLocation) {
      toast({
        title: "No Location",
        description: "Please select a location first.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setLoading(true);
      
      if (listingId) {
        console.log("Saving geolocation for listing:", listingId);
        console.log("Location to save:", currentLocation);
        
        // First, convert coordinates to PostGIS format using the RPC function
        const { data: geoData, error: geoError } = await supabase
          .rpc('create_geography_point', {
            longitude: currentLocation.lng,
            latitude: currentLocation.lat
          });

        if (geoError) {
          console.error("Error creating geography point:", geoError);
          throw geoError;
        }

        // Then update the listing with the PostGIS point
        const { data, error } = await supabase
          .from('scrap_listings')
          .update({ 
            geolocation: geoData,
            address: address || null
          })
          .eq('id', listingId)
          .select();
        
        if (error) {
          console.error("Error updating listing with geolocation:", error);
          throw error;
        }
        
        console.log("Geolocation successfully saved:", data);
        
        if (!data || data.length === 0) {
          console.warn("No data returned after update, but no error occurred");
          toast({
            title: "Warning",
            description: "Location may not have been saved properly.",
            variant: "destructive",
          });
          return;
        }
        
        toast({
          title: "Pickup Location Set",
          description: "Your scrap pickup location has been saved successfully!",
        });
        
        // Force reload the page to show the updated location
        window.location.reload();
      }
      
      if (onLocationSelected) {
        onLocationSelected(currentLocation);
      }
    } catch (error) {
      console.error("Error storing pickup location:", error);
      toast({
        title: "Error",
        description: "Failed to store pickup location. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Function to get marker color based on material category
  const getMarkerColor = (category?: string): string => {
    if (category === "Current") return 'green'; // Current listing is green
    if (!category) return 'blue';
    
    switch(category.toLowerCase()) {
      case 'metal':
        return 'red';
      case 'plastic':
        return 'green';
      case 'paper':
        return 'yellow';
      case 'glass':
        return 'purple';
      case 'electronics':
        return 'orange';
      case 'textile':
        return 'pink';
      case 'organic':
        return 'brown';
      default:
        return 'blue';
    }
  };

  // Function to get marker size based on whether it's the current listing
  const getMarkerSize = (markerId: string): any => {
    if (typeof google === 'undefined') {
      console.warn('Google Maps API not loaded');
      return { width: markerId === listingId ? 40 : 30, height: markerId === listingId ? 40 : 30 };
    }
    
    return markerId === listingId ? 
      new google.maps.Size(40, 40) : // Current listing marker is larger
      new google.maps.Size(30, 30);  // Other markers are smaller
  };

  return (
    <motion.div 
      className="space-y-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <LoadScript
        googleMapsApiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}
        libraries={libraries}
        onLoad={handleScriptLoad}
      >
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold mb-4">
            {readOnly ? "Pickup Location" : showAllListings ? "Available Pickup Locations" : "Request Scrap Pickup"}
          </h2>
          
          {!readOnly && !showAllListings && (
            <div className="mb-4 space-y-2">
              <div className="flex gap-2">
                <Button 
                  onClick={getUserLocation} 
                  variant="outline" 
                  disabled={gettingCurrentLocation}
                  className="flex-shrink-0"
                >
                  {gettingCurrentLocation ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Navigation className="mr-2 h-4 w-4" />
                  )}
                  {gettingCurrentLocation ? "Getting Location..." : "Use My Location"}
                </Button>
                
                <div className="relative w-full">
                  <StandaloneSearchBox
                    onLoad={handleSearchBoxLoad}
                    onPlacesChanged={handlePlacesChanged}
                  >
                    <Input
                      type="text"
                      placeholder="Search for a location or address..."
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="w-full pr-10"
                    />
                  </StandaloneSearchBox>
                  <MapPin className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                </div>
              </div>
              {locationError && (
                <p className="text-sm text-red-500">
                  {locationError}
                </p>
              )}
              <p className="text-sm text-gray-500">
                {readOnly 
                  ? "This is the pickup location."
                  : "Search for an address, use your current location, or click on the map to set your pickup location."
                }
              </p>
            </div>
          )}
          
          <div className="relative">
            {isScriptLoaded ? (
              <GoogleMap
                mapContainerStyle={mapContainerStyle}
                center={currentLocation || defaultCenter}
                zoom={14}
                onClick={handleMapClick}
                onLoad={handleMapLoad}
                options={{
                  zoomControl: true,
                  streetViewControl: false,
                  mapTypeControl: false,
                  fullscreenControl: false,
                }}
              >
                {/* Show current location marker if set */}
                {currentLocation && !showAllListings && (
                  <Marker
                    position={currentLocation}
                    icon={{
                      url: 'https://maps.google.com/mapfiles/ms/icons/green-dot.png',
                      scaledSize: new google.maps.Size(40, 40)
                    }}
                    draggable={!readOnly}
                    onDragEnd={(e) => {
                      if (e.latLng) {
                        const newPosition = {
                          lat: e.latLng.lat(),
                          lng: e.latLng.lng()
                        };
                        setCurrentLocation(newPosition);
                        if (onLocationSelected) {
                          onLocationSelected(newPosition);
                        }
                      }
                    }}
                  />
                )}

                {/* Show all listings markers */}
                {showAllListings && allListings.map((marker) => {
                  console.log("Rendering marker:", marker);
                  return (
                    <Marker
                      key={marker.id}
                      position={marker.location}
                      onClick={() => handleMarkerClick(marker.id)}
                      icon={{
                        url: `https://maps.google.com/mapfiles/ms/icons/${getMarkerColor(marker.material_category)}-dot.png`,
                        scaledSize: new google.maps.Size(30, 30)
                      }}
                    />
                  );
                })}

                {/* Show info window for selected marker */}
                {selectedMarker && allListings.find(m => m.id === selectedMarker) && (
                  <InfoWindow
                    position={allListings.find(m => m.id === selectedMarker)!.location}
                    onCloseClick={handleInfoWindowClose}
                  >
                    <div className="p-2 max-w-xs">
                      <h3 className="font-semibold text-lg mb-1">
                        {allListings.find(m => m.id === selectedMarker)?.title}
                      </h3>
                      <p className="text-sm mb-2">
                        {allListings.find(m => m.id === selectedMarker)?.quantity} {allListings.find(m => m.id === selectedMarker)?.unit}
                      </p>
                      <Button
                        size="sm"
                        className="w-full bg-teal-600 hover:bg-teal-700"
                        asChild
                      >
                        <Link to={`/pickup/${selectedMarker}`}>
                          View Details
                        </Link>
                      </Button>
                    </div>
                  </InfoWindow>
                )}
              </GoogleMap>
            ) : (
              <div className="w-full h-[500px] flex items-center justify-center bg-gray-100 rounded-lg">
                <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
              </div>
            )}
            
            {gettingCurrentLocation && (
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-20 rounded-lg">
                <div className="bg-white p-4 rounded-md shadow-lg flex items-center">
                  <Loader2 className="animate-spin h-6 w-6 mr-2 text-teal-600" />
                  <p>Getting your location...</p>
                </div>
              </div>
            )}
          </div>
          
          <div className="mt-6 flex items-center justify-between">
            <div>
              {loading ? (
                <p className="text-sm text-gray-500">Loading scrap locations...</p>
              ) : currentLocation && !showAllListings ? (
                <div className="text-sm text-gray-500">
                  <p className="font-semibold">Selected Location:</p>
                  <p className="truncate max-w-sm">{address || `${currentLocation.lat.toFixed(6)}, ${currentLocation.lng.toFixed(6)}`}</p>
                </div>
              ) : showAllListings ? (
                <p className="text-sm text-gray-500">
                  {allListings.length > 0 
                    ? `${allListings.length} locations available for pickup`
                    : loading 
                      ? "Loading scrap locations..." 
                      : "No scrap listings found. Try searching in a different area or create a new listing."}
                </p>
              ) : (
                <p className="text-sm text-gray-500">No location selected. Click on the map to set your location.</p>
              )}
            </div>
            
            <div className="flex space-x-2">
              {!readOnly && !showAllListings && currentLocation && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      try {
                        console.log("Debug test - Simple object format");
                        console.log("Location to use:", currentLocation);
                        
                        if (listingId) {
                          // Try update with simple object format
                          const { data, error } = await supabase
                            .from('scrap_listings')
                            .update({ 
                              geolocation: currentLocation // Simple {lat, lng} object
                            })
                            .eq('id', listingId)
                            .select();
                          
                          if (error) {
                            console.error("Simple object format error:", error);
                            toast({
                              title: "Format Test Failed",
                              description: error.message,
                              variant: "destructive",
                            });
                          } else {
                            console.log("Simple object format success:", data);
                            toast({
                              title: "Format Test Success",
                              description: "Location saved in simple format",
                            });
                            setTimeout(() => window.location.reload(), 1500);
                          }
                        }
                      } catch (e) {
                        console.error("Debug test exception:", e);
                      }
                    }}
                  >
                    Test Format
                  </Button>
                </>
              )}
              
              {!readOnly && !showAllListings && (
                <Button 
                  onClick={handleRequestPickup}
                  disabled={!currentLocation || loading || gettingCurrentLocation}
                  className="bg-teal-600 hover:bg-teal-700 transition-colors"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    "Set Location"
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      </LoadScript>
    </motion.div>
  );
};

export default ScrapPickupMap;
