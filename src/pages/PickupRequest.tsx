import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import ScrapPickupMap from "@/components/map/ScrapPickupMap";
import { 
  ArrowLeft, 
  Calendar, 
  MapPin, 
  Package, 
  Tag, 
  User, 
  Truck, 
  Loader2,
  Info, 
  Eye 
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { ListingWithCoordinates, Database } from "@/lib/database.types";

interface Profile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  error?: string;
}

interface Location {
  lat: number;
  lng: number;
}

interface MaterialType {
  id: string;
  name: string;
  description: string | null;
}

interface ScrapListing {
  id: string;
  title: string;
  description: string | null;
  material_type_id: string;
  quantity: number;
  unit: string;
  listed_price: number;
  image_url: string | null;
  status: string;
  seller_id: string;
  created_at: string;
  address: string | null;
  material_type: MaterialType | null;
  profiles: Profile | null;
  latitude?: number;
  longitude?: number;
  geolocation?: Location;
}

interface SupabaseScrapListing extends Omit<ScrapListing, 'profiles' | 'material_type'> {
  profiles: Profile | null;
  material_type: MaterialType | null;
}

const PickupRequest = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [listing, setListing] = useState<SupabaseScrapListing | null>(null);
  const [loading, setLoading] = useState(true);
  const [pickupLocation, setPickupLocation] = useState<Location | null>(null);
  const [requestingPickup, setRequestingPickup] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [isLocationDialogOpen, setIsLocationDialogOpen] = useState(false);
  const [showAllListings, setShowAllListings] = useState(false);
  const [isSettingLocation, setIsSettingLocation] = useState(false);
  const [manualLocation, setManualLocation] = useState<Location | null>(null);
  
  useEffect(() => {
    if (!id) {
      toast({
        title: "Error",
        description: "No listing ID provided",
        variant: "destructive",
      });
      navigate('/listings');
      return;
    }
    fetchListing();
  }, [id]);
  
  const fetchListing = async () => {
    try {
      console.log("Fetching listing with ID:", id);
      setLoading(true);

      const { data: listingData, error: listingError } = await supabase
        .rpc('get_listing_coordinates', { listing_id: id })
        .single();

      if (listingError) throw listingError;
      if (!listingData) throw new Error('Listing not found');

      console.log("Listing data:", listingData);
      setListing(listingData);
      
      if (listingData.latitude && listingData.longitude) {
        setPickupLocation({
          lat: listingData.latitude,
          lng: listingData.longitude
        });
      }

      setLoading(false);
    } catch (error) {
      console.error("Error fetching listing:", error);
      toast({
        title: "Error",
        description: "Failed to load listing details",
        variant: "destructive",
      });
      setLoading(false);
      navigate('/listings');
    }
  };
  
  const handleRequestPickup = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to request a pickup",
        variant: "destructive",
      });
      navigate('/auth');
      return;
    }
    
    if (!listing) return;
    
    try {
      setRequestingPickup(true);
      
      // First create a transaction record
      const { data, error } = await supabase
        .from('transactions')
        .insert({
          buyer_id: user.id,
          seller_id: listing.seller_id,
          listing_id: listing.id,
          amount: listing.listed_price,
          status: 'pending'
        })
        .select();
      
      if (error) throw error;
      
      // Then update the listing status to "pending_pickup"
      const { error: updateError } = await supabase
        .from('scrap_listings')
        .update({ status: 'pending_pickup' })
        .eq('id', listing.id);
      
      if (updateError) throw updateError;
      
      toast({
        title: "Pickup Requested",
        description: "Your pickup request has been submitted successfully",
      });
      
      navigate('/listings');
    } catch (error) {
      console.error("Error requesting pickup:", error);
      toast({
        title: "Error",
        description: "Failed to request pickup. Please try again.",
        variant: "destructive",
      });
    } finally {
      setRequestingPickup(false);
    }
  };
  
  const formattedDate = listing ? new Date(listing.created_at).toLocaleDateString() : '';
  
  // New function to save location manually
  const handleSaveLocation = async (location: Location) => {
    if (!listing || !location) return;
    
    try {
      setLoading(true);
      
      // Now update the listing with the new location
      const { data, error } = await supabase
        .from('scrap_listings')
        .update({ 
          geolocation: location // Store as simple {lat, lng} object
        })
        .eq('id', listing.id)
        .select();
      
      if (error) {
        console.error("Error saving location:", error);
        toast({
          title: "Error",
          description: `Failed to save location: ${error.message}`,
          variant: "destructive",
        });
        return;
      }
      
      if (!data || data.length === 0) {
        console.warn("No data returned after update, but no error occurred");
        toast({
          title: "Warning",
          description: "Location may not have been saved. Please check and try again.",
          variant: "destructive",
        });
        return;
      }
      
      console.log("Location saved successfully:", data);
      
      // Verify the update was successful by checking the returned data
      const updatedListing = data[0];
      console.log("Updated geolocation:", updatedListing.geolocation);
      
      // Update local state
      setPickupLocation(location);
      setIsSettingLocation(false);
      
      toast({
        title: "Location Saved",
        description: "Pickup location has been set successfully",
      });
      
      // Refresh the page to show the updated location
      window.location.reload();
      
    } catch (error) {
      console.error("Error saving location:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred while saving location.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center gap-4 mb-8"
        >
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/listings')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Listings
          </Button>
          
          {loading ? (
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Loading listing details...</span>
            </div>
          ) : listing ? (
            <div>
              <h1 className="text-3xl font-bold text-gray-800">{listing.title}</h1>
              <div className="flex items-center gap-2 mt-1">
                <p className="text-gray-600">
                  Posted on {formattedDate}
                </p>
                <div className="mt-1">
                  <Badge variant={listing.status === 'active' ? 'default' : 'secondary'}>
                    {listing.status}
                  </Badge>
                </div>
              </div>
            </div>
          ) : null}
        </motion.div>
        
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
          </div>
        ) : listing ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card className="overflow-hidden h-full flex flex-col">
              <div className="h-64 overflow-hidden">
                {listing.image_url ? (
                  <img
                    src={listing.image_url}
                    alt={listing.title}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center text-white">
                    <span className="text-3xl font-bold">{listing.title.charAt(0)}</span>
                  </div>
                )}
              </div>
              
              <CardHeader>
                <CardTitle>Material Details</CardTitle>
                <CardDescription>Information about the listed material</CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-4 flex-grow">
                <div className="flex gap-2">
                  <Tag className="h-5 w-5 text-teal-600" />
                  <p>
                    <span className="font-semibold">Material:</span>{' '}
                    <Badge variant="outline" className="bg-teal-50 ml-1">
                      {listing.material_type?.name || 'Unknown'}
                    </Badge>
                  </p>
                </div>
                
                <div className="flex gap-2">
                  <Package className="h-5 w-5 text-teal-600" />
                  <p>
                    <span className="font-semibold">Quantity:</span>{' '}
                    {listing.quantity} {listing.unit}
                  </p>
                </div>
                
                <div className="flex gap-2">
                  <Calendar className="h-5 w-5 text-teal-600" />
                  <p>
                    <span className="font-semibold">Listed:</span>{' '}
                    {formattedDate}
                  </p>
                </div>
                
                  {listing.profiles && !listing.profiles.error && (
                  <div className="flex gap-2">
                    <User className="h-5 w-5 text-teal-600" />
                    <p>
                      <span className="font-semibold">Seller:</span>{' '}
                      {listing.profiles.full_name || 'Anonymous User'}
                    </p>
                  </div>
                )}
                
                {listing.address && (
                  <div className="flex gap-2">
                    <MapPin className="h-5 w-5 text-teal-600" />
                    <p>
                      <span className="font-semibold">Address:</span>{' '}
                      {listing.address}
                    </p>
                  </div>
                )}
                
                {listing.description && (
                  <div className="pt-4 border-t">
                    <h4 className="font-semibold mb-2">Description</h4>
                    <p className="text-gray-600">{listing.description}</p>
                  </div>
                )}
              </CardContent>
              
              <CardFooter className="border-t pt-4 mt-auto">
                <div className="w-full flex justify-between items-center">
                  <div className="text-2xl font-bold text-teal-600">
                    ${listing.listed_price}
                  </div>
                  
                  <div className="flex space-x-2">
                    <Dialog open={isLocationDialogOpen} onOpenChange={setIsLocationDialogOpen}>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          onClick={() => setIsLocationDialogOpen(true)}
                          className="flex items-center transition-all duration-300"
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          View Location
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Pickup Location for {listing.title}</DialogTitle>
                          <DialogDescription>
                              {pickupLocation 
                                ? "View the exact location for this material pickup" 
                                : "No pickup location has been set for this listing"}
                          </DialogDescription>
                        </DialogHeader>
                        
                        {pickupLocation ? (
                          <div className="h-[400px] mt-4">
                              <div className="mb-4 flex justify-between items-center">
                                <h3 className="font-medium">Pickup Location</h3>
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  onClick={() => setShowAllListings(!showAllListings)}
                                >
                                  {showAllListings ? "Show Only This Listing" : "Show All Listings"}
                                </Button>
                              </div>
                              
                            <ScrapPickupMap 
                              initialLocation={pickupLocation} 
                              readOnly={true} 
                              listingId={listing.id}
                                showAllListings={showAllListings}
                              />
                              
                              {showAllListings && (
                                <div className="mt-4 p-3 border rounded-md bg-gray-50">
                                  <h4 className="font-medium text-sm mb-2">Material Categories</h4>
                                  <div className="grid grid-cols-2 gap-2 text-xs">
                                    <div className="flex items-center">
                                      <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
                                      <span>Metal</span>
                                    </div>
                                    <div className="flex items-center">
                                      <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                                      <span>Plastic</span>
                                    </div>
                                    <div className="flex items-center">
                                      <div className="w-3 h-3 rounded-full bg-yellow-500 mr-2"></div>
                                      <span>Paper</span>
                                    </div>
                                    <div className="flex items-center">
                                      <div className="w-3 h-3 rounded-full bg-purple-500 mr-2"></div>
                                      <span>Glass</span>
                                    </div>
                                    <div className="flex items-center">
                                      <div className="w-3 h-3 rounded-full bg-orange-500 mr-2"></div>
                                      <span>Electronics</span>
                                    </div>
                                    <div className="flex items-center">
                                      <div className="w-3 h-3 rounded-full bg-blue-500 mr-2"></div>
                                      <span>Other</span>
                                    </div>
                                  </div>
                                </div>
                              )}
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center p-6 border rounded-lg">
                            <MapPin className="h-10 w-10 text-gray-400 mb-2" />
                              <p className="text-gray-600 mb-4">No location information available for this listing</p>
                              
                              {user?.id === listing.seller_id && !isSettingLocation && (
                                <Button 
                                  onClick={() => setIsSettingLocation(true)}
                                  variant="outline"
                                  className="mt-2"
                                >
                                  Set Pickup Location
                                </Button>
                              )}
                              
                              {!isSettingLocation && (
                                <>
                                  <Button
                                    onClick={() => {
                                      setShowAllListings(true);
                                      setIsSettingLocation(false);
                                    }}
                                    variant="outline"
                                    className="mt-2"
                                  >
                                    View Other Listings on Map
                                  </Button>
                                  
                                  {user?.id === listing.seller_id && (
                                    <div className="flex space-x-2 mt-2">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={async () => {
                                          try {
                                            const testLocation = { lat: 13.0827, lng: 80.2707 }; // Chennai
                                            console.log("Direct test - Chennai location with GeoJSON:", testLocation);
                                            
                                            // Try GeoJSON format
                                            const { data, error } = await supabase
                                              .from('scrap_listings')
                                              .update({ 
                                                geolocation: {
                                                  type: 'Point',
                                                  coordinates: [testLocation.lng, testLocation.lat]
                                                }
                                              })
                                              .eq('id', listing.id)
                                              .select();
                                            
                                            if (error) {
                                              console.error("GeoJSON test failed:", error);
                                              toast({
                                                title: "GeoJSON Failed",
                                                description: error.message,
                                                variant: "destructive",
                                              });
                                            } else {
                                              console.log("GeoJSON test succeeded:", data);
                                              toast({
                                                title: "GeoJSON Success",
                                                description: "Location saved with GeoJSON format",
                                              });
                                              setTimeout(() => window.location.reload(), 1500);
                                            }
                                          } catch (e) {
                                            console.error("GeoJSON test exception:", e);
                                          }
                                        }}
                                      >
                                        GeoJSON
                                      </Button>
                                      
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={async () => {
                                          try {
                                            const testLocation = { lat: 13.0827, lng: 80.2707 }; // Chennai
                                            console.log("Direct test - Chennai location with String:", testLocation);
                                            
                                            // Try string format
                                            const pointString = `POINT(${testLocation.lng} ${testLocation.lat})`;
                                            const { data, error } = await supabase
                                              .from('scrap_listings')
                                              .update({ 
                                                geolocation: pointString
                                              })
                                              .eq('id', listing.id)
                                              .select();
                                            
                                            if (error) {
                                              console.error("String test failed:", error);
                                              toast({
                                                title: "String Failed",
                                                description: error.message,
                                                variant: "destructive",
                                              });
                                            } else {
                                              console.log("String test succeeded:", data);
                                              toast({
                                                title: "String Success",
                                                description: "Location saved with string format",
                                              });
                                              setTimeout(() => window.location.reload(), 1500);
                                            }
                                          } catch (e) {
                                            console.error("String test exception:", e);
                                          }
                                        }}
                                      >
                                        String
                                      </Button>
                                      
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={async () => {
                                          try {
                                            const testLocation = { lat: 13.0827, lng: 80.2707 }; // Chennai
                                            console.log("Direct test - Chennai location using SQL:", testLocation);
                                            
                                            // Try direct SQL update
                                            const { data, error } = await supabase.rpc(
                                              'update_geolocation',
                                              { 
                                                listing_id: listing.id,
                                                lat: testLocation.lat,
                                                lng: testLocation.lng
                                              }
                                            );
                                            
                                            if (error) {
                                              console.error("Direct SQL test failed:", error);
                                              toast({
                                                title: "SQL Test Failed",
                                                description: error.message,
                                                variant: "destructive",
                                              });
                                            } else {
                                              console.log("Direct SQL test succeeded:", data);
                                              toast({
                                                title: "SQL Success",
                                                description: "Location saved with SQL function",
                                              });
                                              setTimeout(() => window.location.reload(), 1500);
                                            }
                                          } catch (e) {
                                            console.error("SQL test exception:", e);
                                          }
                                        }}
                                      >
                                        SQL
                                      </Button>
                                    </div>
                                  )}
                                </>
                              )}
                              
                              {isSettingLocation && (
                                <div className="w-full mt-4">
                                  <h4 className="font-medium mb-2">Set a Pickup Location</h4>
                                  <p className="text-sm text-gray-500 mb-4">Click on the map or search for an address to set the pickup location</p>
                                  
                                  <ScrapPickupMap
                                    onLocationSelected={(location) => setManualLocation(location)}
                                    readOnly={false}
                                  />
                                  
                                  <div className="flex justify-end mt-4 space-x-2">
                                    <Button 
                                      variant="outline" 
                                      onClick={() => setIsSettingLocation(false)}
                                    >
                                      Cancel
                                    </Button>
                                    <Button 
                                      onClick={() => handleSaveLocation(manualLocation!)}
                                      disabled={!manualLocation || loading}
                                    >
                                      {loading ? (
                                        <>
                                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                          Saving...
                                        </>
                                      ) : (
                                        "Save Location"
                                      )}
                                    </Button>
                                  </div>
                                </div>
                              )}
                          </div>
                        )}
                      </DialogContent>
                    </Dialog>
                    
                    <Button
                      onClick={handleRequestPickup}
                      disabled={requestingPickup || user?.id === listing.seller_id || listing.status !== 'active'}
                      className="bg-teal-600 hover:bg-teal-700 transition-all duration-300 transform hover:-translate-y-1"
                    >
                      {requestingPickup ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <Truck className="mr-2 h-4 w-4" />
                          Request Pickup
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardFooter>
            </Card>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <AnimatePresence mode="wait">
              {showMap ? (
                <motion.div
                  key="map"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.5 }}
                  className="h-full"
                >
                  <Card className="h-full flex flex-col">
                    <CardHeader>
                      <CardTitle>Pickup Location</CardTitle>
                      <CardDescription>
                        View the location for material pickup
                      </CardDescription>
                    </CardHeader>
                    
                    <CardContent className="flex-grow">
                      {pickupLocation ? (
                          <div className="h-full min-h-[400px]">
                            <div className="mb-4 flex justify-between items-center">
                              <h3 className="font-medium">Pickup Location</h3>
                              <Button 
                                size="sm" 
                                variant="outline" 
                                onClick={() => setShowAllListings(!showAllListings)}
                              >
                                {showAllListings ? "Show Only This Listing" : "Show All Listings"}
                              </Button>
                            </div>
                            
                            <ScrapPickupMap 
                              initialLocation={pickupLocation} 
                              readOnly={true} 
                              listingId={listing.id}
                              showAllListings={showAllListings}
                            />
                            
                            {showAllListings && (
                              <div className="mt-4 p-3 border rounded-md bg-gray-50">
                                <h4 className="font-medium text-sm mb-2">Material Categories</h4>
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                  <div className="flex items-center">
                                    <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
                                    <span>Metal</span>
                                  </div>
                                  <div className="flex items-center">
                                    <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                                    <span>Plastic</span>
                                  </div>
                                  <div className="flex items-center">
                                    <div className="w-3 h-3 rounded-full bg-yellow-500 mr-2"></div>
                                    <span>Paper</span>
                                  </div>
                                  <div className="flex items-center">
                                    <div className="w-3 h-3 rounded-full bg-purple-500 mr-2"></div>
                                    <span>Glass</span>
                                  </div>
                                  <div className="flex items-center">
                                    <div className="w-3 h-3 rounded-full bg-orange-500 mr-2"></div>
                                    <span>Electronics</span>
                                  </div>
                                  <div className="flex items-center">
                                    <div className="w-3 h-3 rounded-full bg-blue-500 mr-2"></div>
                                    <span>Other</span>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                      ) : (
                        <div className="h-64 flex items-center justify-center bg-gray-100 rounded-lg">
                          <div className="text-center p-6">
                            <MapPin className="h-10 w-10 text-gray-400 mx-auto mb-2" />
                              <p className="text-gray-500 mb-4">No location information available</p>
                              
                              {user?.id === listing.seller_id ? (
                                <Button 
                                  onClick={() => setIsLocationDialogOpen(true)}
                                  variant="outline"
                                  size="sm"
                                >
                                  Set Pickup Location
                                </Button>
                              ) : (
                                <div className="text-sm text-gray-500">
                                  <p>The seller has not provided a pickup location yet.</p>
                                  <Button
                                    onClick={() => setShowAllListings(true)}
                                    variant="link"
                                    size="sm"
                                    className="mt-2"
                                  >
                                    View Other Listings Instead
                                  </Button>
                                </div>
                              )}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              ) : (
                <motion.div
                  key="details"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.5 }}
                >
                  <Card className="h-full flex flex-col">
                    <CardHeader>
                      <CardTitle>Additional Information</CardTitle>
                      <CardDescription>
                        More details about this listing
                      </CardDescription>
                    </CardHeader>
                    
                    <CardContent className="flex-grow">
                      <div className="space-y-6">
                        <div className="p-4 bg-teal-50 rounded-lg border border-teal-100">
                          <div className="flex items-start">
                            <Info className="h-5 w-5 text-teal-600 mt-0.5 mr-2" />
                            <div>
                              <h3 className="font-medium text-teal-900">About this Material</h3>
                              <p className="text-teal-700 text-sm mt-1">
                                This {listing.material_type?.name.toLowerCase() || 'material'} can be recycled or repurposed. 
                                Request pickup to arrange collection with the seller.
                              </p>
                            </div>
                          </div>
                        </div>
                        
                        <div>
                          <h3 className="font-semibold mb-2 text-gray-800">Material Category</h3>
                          <p className="text-gray-600">{listing.material_type?.category || 'Uncategorized'}</p>
                        </div>
                        
                        <div>
                          <h3 className="font-semibold mb-2 text-gray-800">Listing Status</h3>
                          <Badge className={listing.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}>
                            {listing.status === 'active' ? 'Available for pickup' : 'Pending pickup'}
                          </Badge>
                        </div>
                        
                        <div>
                          <h3 className="font-semibold mb-2 text-gray-800">Pickup Instructions</h3>
                          <p className="text-gray-600">
                            {listing.description || 'Contact the seller for specific pickup instructions after requesting pickup.'}
                          </p>
                        </div>
                        
                        {listing.address && (
                          <div className="flex gap-2">
                            <MapPin className="h-5 w-5 text-teal-600 mt-1" />
                            <div>
                              <h3 className="font-semibold text-gray-800">Pickup Location</h3>
                              <p className="text-gray-600">{listing.address}</p>
                              <Button 
                                variant="link" 
                                onClick={() => setShowMap(true)}
                                className="p-0 h-auto text-teal-600 hover:text-teal-700"
                              >
                                View on map
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
        ) : (
          <div className="text-center py-12">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Listing Not Found</h2>
            <p className="text-gray-600 mb-6">The listing you're looking for doesn't exist or has been removed.</p>
            <Button onClick={() => navigate('/listings')} className="bg-teal-600 hover:bg-teal-700">
              Back to Listings
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PickupRequest;
