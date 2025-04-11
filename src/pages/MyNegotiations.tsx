import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, IndianRupee, Check, X, HandCoins, Calendar, Package } from "lucide-react";
import { motion } from "framer-motion";

interface Negotiation {
  id: string;
  listing_id: string;
  dealer_id: string;
  seller_id: string;
  initial_offer: number;
  counter_offer: number | null;
  status: 'pending' | 'accepted' | 'rejected' | 'countered';
  created_at: string;
  listing: {
    id: string;
    title: string;
    listed_price: number;
    image_url: string | null;
    seller: {
      id: string;
      email: string;
    };
  };
}

const MyNegotiations = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [negotiations, setNegotiations] = useState<Negotiation[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("pending");
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to view your negotiations",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }

    fetchNegotiations();
  }, [user, navigate, activeTab]);

  const fetchNegotiations = async () => {
    try {
      setLoading(true);
      
      // Fetch negotiations where user is either dealer or seller
      const { data: negotiationsData, error: negotiationsError } = await supabase
        .from('negotiations')
        .select(`
          id,
          listing_id,
          dealer_id,
          seller_id,
          initial_offer,
          counter_offer,
          status,
          created_at
        `)
        .or(`dealer_id.eq.${user.id},seller_id.eq.${user.id}`)
        .eq('status', activeTab)
        .order('created_at', { ascending: false });
      
      if (negotiationsError) {
        console.error("Error fetching negotiations:", negotiationsError);
        throw negotiationsError;
      }
      
      // If there are no negotiations, return early
      if (!negotiationsData || negotiationsData.length === 0) {
        setNegotiations([]);
        setLoading(false);
        return;
      }
      
      // Get all the listing IDs
      const listingIds = negotiationsData.map(neg => neg.listing_id);
      
      // Fetch the listings separately
      const { data: listingsData, error: listingsError } = await supabase
        .from('scrap_listings')
        .select(`
          id,
          title,
          listed_price,
          image_url,
          seller_id
        `)
        .in('id', listingIds);
      
      if (listingsError) {
        console.error("Error fetching listings:", listingsError);
        throw listingsError;
      }
      
      // Get all seller IDs
      const sellerIds = listingsData.map(listing => listing.seller_id).filter(Boolean);
      
      // Fetch the sellers (users) information - use the profiles table that has the right fields
      const { data: sellersData, error: sellersError } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', sellerIds);
      
      if (sellersError) {
        console.error("Error fetching sellers:", sellersError);
        throw sellersError;
      }
      
      // Combine all the data
      const combinedData: Negotiation[] = negotiationsData.map(negotiation => {
        const listing = listingsData.find(l => l.id === negotiation.listing_id) || {
          id: negotiation.listing_id,
          title: 'Unknown Listing',
          listed_price: 0,
          image_url: null,
          seller_id: null
        };
        
        const sellerProfile = sellersData?.find(s => s.id === listing.seller_id);
        const seller = {
          id: sellerProfile?.id || listing.seller_id || 'unknown',
          email: sellerProfile?.full_name || 'Unknown Seller'
        };
        
        return {
          ...negotiation,
          listing: {
            id: listing.id,
            title: listing.title,
            listed_price: listing.listed_price,
            image_url: listing.image_url,
            seller: {
              id: seller.id,
              email: seller.email
            }
          }
        };
      });
      
      setNegotiations(combinedData);
    } catch (error) {
      console.error("Error fetching negotiations:", error);
      toast({
        title: "Error",
        description: "Failed to load your negotiations",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleAcceptCounterOffer = async (negotiationId: string) => {
    try {
      setProcessingId(negotiationId);
      
      const { error } = await supabase
        .from('negotiations')
        .update({ status: 'accepted' })
        .eq('id', negotiationId)
        .eq('dealer_id', user.id);
      
      if (error) throw error;
      
      toast({
        title: "Counter Offer Accepted",
        description: "You have accepted the seller's counter offer",
      });
      
      // Refresh the list
      fetchNegotiations();
    } catch (error) {
      console.error("Error accepting counter offer:", error);
      toast({
        title: "Error",
        description: "Failed to accept the counter offer",
        variant: "destructive",
      });
    } finally {
      setProcessingId(null);
    }
  };
  
  const handleRejectCounterOffer = async (negotiationId: string) => {
    try {
      setProcessingId(negotiationId);
      
      const { error } = await supabase
        .from('negotiations')
        .update({ status: 'rejected' })
        .eq('id', negotiationId)
        .eq('dealer_id', user.id);
      
      if (error) throw error;
      
      toast({
        title: "Counter Offer Rejected",
        description: "You have rejected the seller's counter offer",
      });
      
      // Refresh the list
      fetchNegotiations();
    } catch (error) {
      console.error("Error rejecting counter offer:", error);
      toast({
        title: "Error",
        description: "Failed to reject the counter offer",
        variant: "destructive",
      });
    } finally {
      setProcessingId(null);
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
          <h1 className="text-3xl font-bold">My Negotiations</h1>
          <div className="flex gap-4">
            <Link to="/listings">
              <Button className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                Browse Listings
              </Button>
            </Link>
          </div>
        </div>

        <Tabs defaultValue="pending" value={activeTab} onValueChange={setActiveTab} className="my-4">
          <TabsList className="grid grid-cols-4 mb-6">
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="countered">Countered</TabsTrigger>
            <TabsTrigger value="accepted">Accepted</TabsTrigger>
            <TabsTrigger value="rejected">Rejected</TabsTrigger>
          </TabsList>

          {['pending', 'countered', 'accepted', 'rejected'].map(status => (
            <TabsContent key={status} value={status}>
              {loading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-12 h-12 animate-spin text-gray-400" />
                </div>
              ) : negotiations.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <HandCoins className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                  <h3 className="text-xl font-medium mb-2">No {status} negotiations</h3>
                  <p className="text-gray-500 mb-4">
                    You don't have any {status} negotiations at the moment.
                  </p>
                  <Link to="/listings">
                    <Button>Browse Listings</Button>
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {negotiations.map(negotiation => {
                    const isBuyer = negotiation.dealer_id === user.id;
                    const isSeller = negotiation.seller_id === user.id;
                    
                    return (
                      <motion.div
                        key={negotiation.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3 }}
                      >
                        <Card className="h-full">
                          <CardHeader className="pb-2">
                            <CardTitle className="line-clamp-1 text-base font-bold">
                              <Link to={`/listing/${negotiation.listing_id}`} className="hover:underline">
                                {negotiation.listing.title}
                              </Link>
                            </CardTitle>
                            <CardDescription className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(negotiation.created_at).toLocaleDateString()}
                              <Badge className="ml-auto" variant={
                                status === 'accepted' ? 'default' : 
                                status === 'rejected' ? 'destructive' : 
                                status === 'countered' ? 'secondary' : 'outline'
                              }>
                                {status}
                              </Badge>
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="pb-2">
                            <div className="flex justify-between items-start mb-4">
                              {negotiation.listing.image_url ? (
                                <img 
                                  src={negotiation.listing.image_url} 
                                  alt={negotiation.listing.title}
                                  className="w-20 h-20 object-cover rounded-md"
                                />
                              ) : (
                                <div className="w-20 h-20 bg-gray-200 rounded-md flex items-center justify-center">
                                  <Package className="w-8 h-8 text-gray-400" />
                                </div>
                              )}
                              
                              <div className="text-right">
                                <p className="text-sm text-gray-500">
                                  {isBuyer ? 'Your Offer' : 'Buyer\'s Offer'}
                                </p>
                                <p className="text-lg font-bold">₹{negotiation.initial_offer}</p>
                                <p className="text-xs text-gray-500">
                                  Listed: ₹{negotiation.listing.listed_price}
                                </p>
                              </div>
                            </div>
                            
                            {negotiation.counter_offer && (
                              <div className="border-t pt-2 mt-2">
                                <p className="text-sm text-gray-500">
                                  {isBuyer ? 'Seller\'s Counter Offer' : 'Your Counter Offer'}
                                </p>
                                <p className="text-lg font-bold">₹{negotiation.counter_offer}</p>
                              </div>
                            )}
                            
                            <div className="mt-2">
                              <p className="text-sm text-gray-500 mt-2">
                                {isBuyer ? 'Seller' : 'Buyer'}: {
                                  isBuyer 
                                    ? negotiation.listing.seller.email 
                                    : 'Unknown Buyer'
                                }
                              </p>
                            </div>
                          </CardContent>
                          
                          <CardFooter className="pt-2">
                            {status === 'pending' && isSeller && (
                              <div className="w-full space-y-2">
                                <div className="flex gap-2">
                                  <Button 
                                    size="sm" className="flex-1" 
                                    onClick={() => handleAcceptCounterOffer(negotiation.id)}
                                    disabled={processingId === negotiation.id}
                                  >
                                    <Check className="w-4 h-4 mr-1" /> Accept
                                  </Button>
                                  <Button 
                                    size="sm" className="flex-1" 
                                    variant="outline"
                                    onClick={() => handleRejectCounterOffer(negotiation.id)}
                                    disabled={processingId === negotiation.id}
                                  >
                                    <X className="w-4 h-4 mr-1" /> Decline
                                  </Button>
                                </div>
                                <div className="w-full">
                                  <Label htmlFor={`counter-${negotiation.id}`} className="text-xs">
                                    Counter offer
                                  </Label>
                                  <div className="flex items-center gap-2 mt-1">
                                    <IndianRupee className="w-4 h-4 text-gray-500" />
                                    <Input
                                      id={`counter-${negotiation.id}`}
                                      type="number"
                                      placeholder="Enter amount"
                                      min={1}
                                      className="flex-1"
                                    />
                                    <Button size="sm">Send</Button>
                                  </div>
                                </div>
                              </div>
                            )}
                            
                            {status === 'countered' && isBuyer && (
                              <div className="flex gap-2 w-full">
                                <Button 
                                  size="sm" className="flex-1" 
                                  onClick={() => handleAcceptCounterOffer(negotiation.id)}
                                  disabled={processingId === negotiation.id}
                                >
                                  {processingId === negotiation.id ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <>
                                      <Check className="w-4 h-4 mr-1" /> Accept
                                    </>
                                  )}
                                </Button>
                                <Button 
                                  size="sm" className="flex-1" 
                                  variant="outline"
                                  onClick={() => handleRejectCounterOffer(negotiation.id)}
                                  disabled={processingId === negotiation.id}
                                >
                                  {processingId === negotiation.id ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <>
                                      <X className="w-4 h-4 mr-1" /> Decline
                                    </>
                                  )}
                                </Button>
                              </div>
                            )}
                            
                            {status === 'accepted' && (
                              <Link to={`/listing/${negotiation.listing_id}`} className="w-full">
                                <Button variant="outline" size="sm" className="w-full">
                                  View Listing
                                </Button>
                              </Link>
                            )}
                          </CardFooter>
                        </Card>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </motion.div>
    </div>
  );
};

export default MyNegotiations; 