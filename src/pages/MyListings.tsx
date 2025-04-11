import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MapPin, Package, Clock, IndianRupee, Trash, Edit, Eye, AlertCircle, HandCoins } from "lucide-react";
import { motion } from "framer-motion";
import NegotiationsManager from "@/components/listing/NegotiationsManager";

interface ListingRequest {
  id: string;
  listing_id: string;
  buyer_id: string;
  buyer: {
    id: string;
    email: string;
  };
  quantity_requested: number;
  price_offered: number;
  message: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
}

interface Listing {
  id: string;
  title: string;
  description: string;
  listed_price: number;
  quantity: number;
  unit: string;
  status: string;
  created_at: string;
  image_url: string | null;
  material_type_id: string;
  material_type: {
    name: string;
    category: string;
  };
  requests?: ListingRequest[];
}

interface SupabaseRequest {
  id: string;
  listing_id: string;
  buyer_id: string;
  buyer: {
    id: string;
    email: string;
  } | null;
  quantity_requested: number;
  price_offered: number;
  message: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
}

const MyListings = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("selling");
  const [requestsCount, setRequestsCount] = useState(0);

  useEffect(() => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to view your listings",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }

    fetchListings();
  }, [user, navigate]);

  const fetchListings = async () => {
    try {
      setLoading(true);
      
      // Fetch only the listings for the current seller
      const { data: listingsData, error: listingsError } = await supabase
        .from('scrap_listings')
        .select(`
          id,
          title,
          description,
          listed_price,
          quantity,
          unit,
          status,
          created_at,
          image_url,
          material_type_id
        `)
        .eq('seller_id', user.id)
        .order('created_at', { ascending: false });
      
      if (listingsError) {
        console.error("Error fetching listings:", listingsError);
        throw listingsError;
      }

      // Fetch material types
      const materialTypeIds = listingsData?.map(listing => listing.material_type_id) || [];
      const { data: materialTypes, error: materialTypesError } = await supabase
        .from('material_types')
        .select('id, name, category')
        .in('id', materialTypeIds);

      if (materialTypesError) {
        console.error("Error fetching material types:", materialTypesError);
        throw materialTypesError;
      }

      // Fetch negotiations/requests only if we have listings
      let negotiationsData = [];
      if (listingsData && listingsData.length > 0) {
        const { data: negotiations, error: negotiationsError } = await supabase
          .from('listing_requests')
          .select(`
            id,
            listing_id,
            buyer_id,
            buyer:buyer_id (
              id,
              email
            ),
            quantity_requested,
            price_offered,
            message,
            status,
            created_at
          `)
          .in('listing_id', listingsData.map(listing => listing.id));

        if (negotiationsError) {
          console.error("Error fetching negotiations:", negotiationsError);
          throw negotiationsError;
        }
        
        negotiationsData = negotiations || [];
      }

      // Count pending negotiations
      const pendingCount = negotiationsData.filter(req => req.status === 'pending').length || 0;
      setRequestsCount(pendingCount);

      // Combine the data
      const combinedData: Listing[] = listingsData?.map(listing => {
        const materialType = materialTypes?.find(mt => mt.id === listing.material_type_id);
        
        // Convert SupabaseRequest to ListingRequest type
        const requests: ListingRequest[] = negotiationsData
          ?.filter(req => req.listing_id === listing.id)
          .map(req => {
            // Get the first buyer in the array or create a default buyer
            const buyerData = Array.isArray(req.buyer) && req.buyer.length > 0
              ? req.buyer[0]
              : { id: req.buyer_id, email: 'Unknown' };
            
            return {
              id: req.id,
              listing_id: req.listing_id,
              buyer_id: req.buyer_id,
              buyer: buyerData,
              quantity_requested: req.quantity_requested,
              price_offered: req.price_offered,
              message: req.message,
              status: req.status as 'pending' | 'accepted' | 'rejected',
              created_at: req.created_at
            };
          }) || [];
        
        return {
          ...listing,
          material_type: materialType || { name: 'Unknown', category: 'Unknown' },
          requests: requests
        };
      }) || [];
      
      setListings(combinedData);
      
    } catch (error) {
      console.error("Error in fetchListings:", error);
      toast({
        title: "Error",
        description: "Failed to load your listings. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteListing = async (id: string) => {
    if (!confirm("Are you sure you want to delete this listing?")) return;
    
    try {
      const { error } = await supabase
        .from('scrap_listings')
        .update({ status: 'deleted' })
        .eq('id', id)
        .eq('seller_id', user?.id);
      
      if (error) throw error;
      
      setListings(listings.filter(listing => listing.id !== id));
      
      toast({
        title: "Success",
        description: "Listing has been deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting listing:", error);
      toast({
        title: "Error",
        description: "Failed to delete the listing",
        variant: "destructive",
      });
    }
  };

  const handleMarkAsSold = async (id: string) => {
    try {
      const { error } = await supabase
        .from('scrap_listings')
        .update({ status: 'sold' })
        .eq('id', id)
        .eq('seller_id', user?.id);
      
      if (error) throw error;
      
      // Update local state
      setListings(
        listings.map(listing => 
          listing.id === id ? { ...listing, status: 'sold' } : listing
        )
      );
      
      toast({
        title: "Success",
        description: "Listing has been marked as sold",
      });
    } catch (error) {
      console.error("Error marking listing as sold:", error);
      toast({
        title: "Error",
        description: "Failed to update the listing status",
        variant: "destructive",
      });
    }
  };

  const handleRequestAction = async (requestId: string, listingId: string, action: 'accepted' | 'rejected') => {
    try {
      const { error } = await supabase
        .from('listing_requests')
        .update({ status: action })
        .eq('id', requestId);
      
      if (error) throw error;
      
      // Update the local state
      setListings(prevListings => 
        prevListings.map(listing => {
          if (listing.id === listingId && listing.requests) {
            return {
              ...listing,
              requests: listing.requests.map(request => 
                request.id === requestId 
                  ? { ...request, status: action } 
                  : request
              )
            };
          }
          return listing;
        })
      );
      
      toast({
        title: "Success",
        description: `Request ${action === 'accepted' ? 'accepted' : 'rejected'} successfully`,
      });
    } catch (error) {
      console.error(`Error ${action} request:`, error);
      toast({
        title: "Error",
        description: `Failed to ${action === 'accepted' ? 'accept' : 'reject'} the request`,
        variant: "destructive",
      });
    }
  };

  if (!user) {
    return null; // Already handled in useEffect
  }

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">My Listings</h1>
          <div className="flex gap-4">
            <Link to="/create-listing">
              <Button className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                Sell Scrap
              </Button>
            </Link>
            <Link to="/donate">
              <Button variant="outline" className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                Donate Items
              </Button>
            </Link>
          </div>
        </div>

        <Tabs defaultValue={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6 grid grid-cols-2 w-full max-w-md mx-auto">
            <TabsTrigger value="selling" className="relative">
              My Listings
              {listings.filter(l => l.status !== 'deleted').length > 0 && (
                <Badge className="ml-2 bg-teal-100 text-teal-800 border-teal-200">
                  {listings.filter(l => l.status !== 'deleted').length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="requests" className="relative">
              Negotiations
              {requestsCount > 0 && (
                <Badge className="ml-2 bg-amber-100 text-amber-800 border-amber-200">
                  {requestsCount}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="selling" className="space-y-4">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin h-8 w-8 border-4 border-teal-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-gray-500">Loading your listings...</p>
              </div>
            ) : listings.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg shadow">
                <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">You don't have any listings yet</h3>
                <p className="text-gray-500 mb-6">Start selling or donating your scrap materials!</p>
                <div className="flex justify-center gap-4">
                  <Link to="/create-listing">
                    <Button>Create Listing</Button>
                  </Link>
                  <Link to="/donate">
                    <Button variant="outline">Donate Items</Button>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {listings.map(listing => (
                  listing.status !== 'deleted' && (
                    <Card key={listing.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                      <div className="h-48 overflow-hidden bg-gray-100 relative">
                        {listing.image_url ? (
                          <img 
                            src={listing.image_url}
                            alt={listing.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full bg-gray-100">
                            <Package className="h-16 w-16 text-gray-300" />
                          </div>
                        )}
                        <Badge 
                          className={`absolute top-2 right-2 ${
                            listing.status === 'active' ? 'bg-green-500' :
                            listing.status === 'sold' ? 'bg-blue-500' :
                            listing.status === 'pending' ? 'bg-yellow-500' :
                            'bg-gray-500'
                          }`}
                        >
                          {listing.status.charAt(0).toUpperCase() + listing.status.slice(1)}
                        </Badge>
                      </div>
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                          <CardTitle className="text-xl truncate">{listing.title}</CardTitle>
                          <Badge variant="outline" className="capitalize">
                            {listing.material_type.category}
                          </Badge>
                        </div>
                        <CardDescription className="flex items-center text-sm text-gray-500">
                          <Clock className="h-3 w-3 inline mr-1" />
                          {new Date(listing.created_at).toLocaleDateString()}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="pb-2">
                        <div className="flex justify-between mb-2">
                          <div className="flex items-center">
                            <IndianRupee className="h-4 w-4 mr-1 text-gray-700" />
                            <span className="font-bold">₹{listing.listed_price}</span>
                          </div>
                          <div className="text-sm">
                            {listing.quantity} {listing.unit}
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 line-clamp-2">{listing.description}</p>
                        
                        {listing.requests && listing.requests.filter(r => r.status === 'pending').length > 0 && (
                          <div className="mt-3 flex items-center text-amber-600 bg-amber-50 rounded p-2 text-sm">
                            <AlertCircle className="h-4 w-4 mr-2" />
                            {listing.requests.filter(r => r.status === 'pending').length} pending request(s)
                          </div>
                        )}
                      </CardContent>
                      <CardFooter className="flex gap-2 pt-0">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex-1 flex items-center justify-center gap-1"
                          onClick={() => navigate(`/pickup/${listing.id}`)}
                        >
                          <Eye className="h-4 w-4" />
                          View
                        </Button>
                        
                        {listing.status !== 'sold' ? (
                          <>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="flex-1 flex items-center justify-center gap-1"
                              onClick={() => navigate(`/edit-listing/${listing.id}`)}
                            >
                              <Edit className="h-4 w-4" />
                              Edit
                            </Button>
                            <Button 
                              variant="default"
                              size="sm" 
                              className="flex-1 flex items-center justify-center gap-1"
                              onClick={() => handleMarkAsSold(listing.id)}
                            >
                              <Package className="h-4 w-4" />
                              Mark Sold
                            </Button>
                          </>
                        ) : (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="flex-2 flex items-center justify-center gap-1"
                            disabled
                          >
                            <Package className="h-4 w-4" />
                            Sold
                          </Button>
                        )}
                        
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="flex items-center justify-center gap-1 text-red-500 hover:text-red-700 hover:bg-red-50"
                          onClick={() => handleDeleteListing(listing.id)}
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </CardFooter>
                    </Card>
                  )
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="requests" className="space-y-6">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin h-8 w-8 border-4 border-teal-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-gray-500">Loading requests...</p>
              </div>
            ) : listings.length === 0 ? (
              <div className="text-center py-12">
                <HandCoins className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No negotiations yet</h3>
                <p className="text-gray-500 mb-6">Once you create listings, buyer offers will appear here.</p>
                <div className="flex justify-center">
                  <Link to="/create-listing">
                    <Button>Create Listing</Button>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {listings
                  .filter(listing => listing.status !== 'deleted' && listing.requests && listing.requests.length > 0)
                  .map(listing => (
                    <Card key={listing.id} className="overflow-hidden">
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-center">
                          <div>
                            <CardTitle className="text-lg flex items-center">
                              <span className="truncate">{listing.title}</span>
                              <Badge 
                                className={`ml-2 ${
                                  listing.status === 'active' ? 'bg-green-500' :
                                  listing.status === 'sold' ? 'bg-blue-500' :
                                  listing.status === 'pending' ? 'bg-yellow-500' :
                                  'bg-gray-500'
                                }`}
                              >
                                {listing.status.charAt(0).toUpperCase() + listing.status.slice(1)}
                              </Badge>
                            </CardTitle>
                            <CardDescription>
                              Price: ₹{listing.listed_price}/{listing.unit} · 
                              Quantity: {listing.quantity} {listing.unit}
                            </CardDescription>
                          </div>
                          
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => navigate(`/pickup/${listing.id}`)}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View Listing
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <NegotiationsManager
                          listingId={listing.id}
                          className="w-full"
                        />
                      </CardContent>
                    </Card>
                  ))}
                  
                {listings.filter(listing => listing.status !== 'deleted' && listing.requests && listing.requests.length > 0).length === 0 && (
                  <div className="text-center py-12 bg-white rounded-lg shadow">
                    <HandCoins className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No negotiations received yet</h3>
                    <p className="text-gray-500 mb-6">Your listings haven't received any offers yet.</p>
                  </div>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
};

export default MyListings; 