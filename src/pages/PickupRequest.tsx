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
  Eye,
  Heart,
  AlertCircle,
  HandCoins,
  ShoppingCart,
  Check,
  IndianRupee
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
import RequestListingDialog from "@/components/listing/RequestListingDialog";
import NegotiationDialog from "@/components/listing/NegotiationDialog";
import NegotiationsManager from "@/components/listing/NegotiationsManager";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DEFAULT_SCRAP_IMAGE } from '@/components/listing/ImageUploader';

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
  category: string;
  description: string | null;
}

interface NGO {
  id: string;
  name: string;
  description?: string;
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
  is_donation?: boolean;
  ngo_id?: string;
  ngo?: NGO | null;
}

interface SupabaseScrapListing extends Omit<ScrapListing, 'profiles' | 'material_type'> {
  profiles: Profile | null;
  material_type: MaterialType | null;
  ngo?: NGO | null;
  is_donation?: boolean;
  latitude?: number;
  longitude?: number;
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
  const [requestSent, setRequestSent] = useState(false);
  
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
      
      // Cast the data to our SupabaseScrapListing type
      const typedListingData = listingData as SupabaseScrapListing;
      setListing(typedListingData);
      
      if (typedListingData.latitude && typedListingData.longitude) {
        setPickupLocation({
          lat: typedListingData.latitude,
          lng: typedListingData.longitude
        });
      }

      // Check if user has already sent a request
      if (user) {
        const { data: requestData, error: requestError } = await supabase
          .from('listing_requests')
          .select('*')
          .eq('listing_id', id)
          .eq('buyer_id', user.id)
          .eq('status', 'pending');
        
        if (!requestError && requestData && requestData.length > 0) {
          setRequestSent(true);
        }
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
  
  const handleRequestSent = () => {
    setRequestSent(true);
    toast({
      title: "Request Sent",
      description: "The seller will be notified of your request",
    });
  };
  
  if (loading) {
    return (
      <div className="container mx-auto p-4 flex justify-center items-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="animate-spin h-8 w-8 mx-auto mb-4 text-teal-600" />
          <p className="text-gray-500">Loading listing details...</p>
        </div>
      </div>
    );
  }
  
  if (!listing) {
    return (
      <div className="container mx-auto p-4 flex justify-center items-center min-h-[60vh]">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Listing Not Found</h2>
          <p className="text-gray-500 mb-6">This listing may have been removed or is no longer available.</p>
          <Button onClick={() => navigate("/listings")}>
            Browse Listings
          </Button>
        </div>
      </div>
    );
  }
  
  const isOwner = user && user.id === listing.seller_id;
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="mb-6">
          {listing.is_donation && (
            <Badge className="mb-2 bg-red-500">
              <Heart className="w-3 h-3 mr-1" />
              Donation
            </Badge>
          )}
          <h1 className="text-3xl font-bold">{listing.title}</h1>
          <p className="text-gray-500 flex items-center mt-2">
            <Calendar className="w-4 h-4 mr-2" />
            Listed on {formatDate(listing.created_at)}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card className="overflow-hidden">
              <div className="h-[400px] overflow-hidden bg-gray-100 relative">
                {listing.image_url ? (
                  <img
                    src={listing.image_url}
                    alt={listing.title}
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      console.error("Failed to load listing image:", listing.image_url);
                      const target = e.target as HTMLImageElement;
                      target.src = DEFAULT_SCRAP_IMAGE;
                    }}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full bg-gray-100">
                    <Package className="h-24 w-24 text-gray-300" />
                    <p className="text-gray-400 ml-2">No image available</p>
                  </div>
                )}
                <Badge 
                  className={`absolute top-4 right-4 px-3 py-1 text-sm ${
                    listing.status === 'active' ? 'bg-green-500' :
                    listing.status === 'sold' ? 'bg-blue-500' :
                    listing.status === 'pending' ? 'bg-yellow-500' :
                    'bg-gray-500'
                  }`}
                >
                  {listing.status.charAt(0).toUpperCase() + listing.status.slice(1)}
                </Badge>
              </div>
              
              <CardContent className="p-6">
                <Tabs defaultValue="details">
                  <TabsList className="mb-4">
                    <TabsTrigger value="details">Details</TabsTrigger>
                    <TabsTrigger value="location">Location</TabsTrigger>
                    {listing.ngo && (
                      <TabsTrigger value="ngo">NGO Information</TabsTrigger>
                    )}
                  </TabsList>
                  
                  <TabsContent value="details" className="space-y-4">
                    <div className="space-y-4">
                      <div>
                        <h3 className="font-medium text-gray-900">Description</h3>
                        <p className="mt-1 text-gray-700 whitespace-pre-wrap">{listing.description}</p>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-gray-50 p-4 rounded-md">
                          <div className="flex items-center mb-2">
                            <Package className="h-5 w-5 text-teal-600 mr-2" />
                            <h3 className="font-medium">Material Details</h3>
                          </div>
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-500">Type:</span>
                              <span>{listing.material_type?.name || 'Unknown'}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-500">Category:</span>
                              <span>{listing.material_type?.category || 'Uncategorized'}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-500">Quantity:</span>
                              <span>{listing.quantity} {listing.unit}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="bg-gray-50 p-4 rounded-md">
                          <div className="flex items-center mb-2">
                            <IndianRupee className="h-5 w-5 text-teal-600 mr-2" />
                            <h3 className="font-medium">Listing Details</h3>
                          </div>
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-500">Price:</span>
                              <span className="font-bold">
                                {listing.is_donation ? 
                                  "Free (Donation)" : 
                                  `₹${listing.listed_price} per ${listing.unit}`
                                }
                              </span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-500">Status:</span>
                              <span className="capitalize">{listing.status}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-500">Seller:</span>
                              <span>{listing.profiles?.full_name || "Anonymous"}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="location">
                    <div className="space-y-4">
                      {listing.address && (
                        <div className="flex items-start gap-2">
                          <MapPin className="h-5 w-5 text-teal-600 mt-0.5" />
                          <p className="text-gray-700">{listing.address}</p>
                        </div>
                      )}
                      
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg">Pickup Location</CardTitle>
                          <CardDescription>
                            {isOwner ? 
                              "This is where buyers can pick up your scrap materials" :
                              "This is where you can pick up the scrap materials"
                            }
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <ScrapPickupMap
                            initialLocation={pickupLocation}
                            readOnly={true}
                            listingId={listing.id}
                          />
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>
                  
                  {listing.ngo && (
                    <TabsContent value="ngo" className="space-y-4">
                      <Card>
                        <CardHeader>
                          <CardTitle>Donation Recipient</CardTitle>
                          <CardDescription>
                            This item is being donated to the following organization
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <div className="flex items-center gap-3">
                              <Heart className="h-8 w-8 text-red-500" />
                              <div>
                                <h3 className="font-medium text-lg">{listing.ngo.name}</h3>
                              </div>
                            </div>
                            <p className="text-gray-700">
                              Contact the seller for more information about this donation.
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>
                  )}
                </Tabs>
              </CardContent>
            </Card>
          </div>
          
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Request This Listing</CardTitle>
                <CardDescription>
                  {listing.is_donation ? 
                    "Request this donation or contact the seller for more information" :
                    "Send a request to negotiate or purchase this listing"
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isOwner ? (
                  <div className="bg-blue-50 p-4 rounded-md flex gap-3">
                    <AlertCircle className="h-5 w-5 text-blue-500" />
                    <p className="text-blue-700 text-sm">
                      This is your listing. You can edit it or view requests from buyers.
                    </p>
                  </div>
                ) : listing.status !== 'active' ? (
                  <div className="bg-yellow-50 p-4 rounded-md flex gap-3">
                    <AlertCircle className="h-5 w-5 text-yellow-500" />
                    <p className="text-yellow-700 text-sm">
                      This listing is currently {listing.status.toLowerCase()} and not available for requests.
                    </p>
                  </div>
                ) : requestSent ? (
                  <div className="bg-green-50 p-4 rounded-md flex gap-3">
                    <AlertCircle className="h-5 w-5 text-green-500" />
                    <p className="text-green-700 text-sm">
                      You have already sent a request for this listing. The seller will contact you soon.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="bg-gray-50 p-4 rounded-md">
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-500">Available:</span>
                        <span>{listing.quantity} {listing.unit}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Listed Price:</span>
                        <span className="font-bold">
                          {listing.is_donation ? "Free" : `₹${listing.listed_price} per ${listing.unit}`}
                        </span>
                      </div>
                    </div>
                    
                    <div className="pt-4 space-y-3">
                      {!user ? (
                        <Button 
                          className="w-full" 
                          onClick={() => navigate("/auth", { state: { returnTo: `/pickup/${id}` } })}
                        >
                          Sign In to Request
                        </Button>
                      ) : listing.is_donation ? (
                        <Button className="w-full">
                          <Heart className="w-4 h-4 mr-2" />
                          Request Donation
                        </Button>
                      ) : (
                        <>
                          <RequestListingDialog
                            listingId={listing.id}
                            listingTitle={listing.title}
                            originalPrice={listing.listed_price}
                            quantity={listing.quantity}
                            unit={listing.unit}
                            onRequestSent={handleRequestSent}
                          />
                          
                          <NegotiationDialog
                            listingId={listing.id}
                            listingTitle={listing.title}
                            askingPrice={listing.listed_price}
                            trigger={
                              <Button 
                                className="w-full flex items-center gap-2 mt-3" 
                                variant="outline"
                              >
                                <HandCoins className="h-4 w-4" />
                                Make an Offer
                              </Button>
                            }
                          />
                        </>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
            
            {isOwner && (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle>Manage Listing</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button 
                      className="w-full"
                      onClick={() => navigate(`/my-listings`)}
                    >
                      View All Your Listings
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => navigate(`/edit-listing/${listing.id}`)}
                    >
                      Edit This Listing
                    </Button>
                  </CardContent>
                </Card>
                
                <Card className="mt-4">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <HandCoins className="h-5 w-5" />
                      Negotiations
                    </CardTitle>
                    <CardDescription>
                      View and respond to offers from potential buyers
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <NegotiationsManager 
                      listingId={String(listing.id)} 
                    />
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default PickupRequest;
