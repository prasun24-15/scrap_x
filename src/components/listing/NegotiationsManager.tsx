import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, IndianRupee, Check, X, HandCoins, Calendar, RefreshCw } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Negotiation {
  id: string;
  listing_id: string;
  dealer_id: string;
  seller_id: string;
  dealers: {
    id: string;
    email: string;
  };
  listing: {
    title: string;
    listed_price: number;
  };
  initial_offer: number;
  counter_offer: number | null;
  status: 'pending' | 'accepted' | 'rejected' | 'countered';
  created_at: string;
  updated_at: string;
}

interface NegotiationsManagerProps {
  listingId?: string; // Optional - if provided, only show negotiations for this listing
  className?: string;
}

const NegotiationsManager = ({ listingId, className }: NegotiationsManagerProps) => {
  const { user } = useAuth();
  const [negotiations, setNegotiations] = useState<Negotiation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [counterOffer, setCounterOffer] = useState<{ [key: string]: number }>({});
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchNegotiations();
    }
  }, [user, listingId]);

  const fetchNegotiations = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError(null);
      
      console.log("Checking negotiations table access...");
      console.log("Current user ID:", user.id);
      
      // First check if the negotiations table exists and is accessible
      try {
        const { data: tableCheck, error: tableError } = await supabase
          .from('negotiations')
          .select('count(*)', { count: 'exact', head: true });
          
        if (tableError) {
          console.error("Error accessing negotiations table:", {
            code: tableError.code,
            message: tableError.message,
            details: tableError.details,
            hint: tableError.hint
          });
          
          if (tableError.code === '42P01') { // Undefined table
            throw new Error("The negotiations table doesn't exist. Please check your database schema.");
          } else if (tableError.code === 'PGRST301') { // Permission denied
            throw new Error("You don't have permission to access negotiations. Check RLS policies.");
          } else {
            throw tableError;
          }
        }
        
        console.log("Table access verified, count result:", tableCheck);
      } catch (e: any) {
        setError(e.message || "Failed to access negotiations table");
        console.error("Negotiations table access error:", e);
        setLoading(false);
        return;
      }
      
      console.log("Negotiations table accessible");
      
      // Build query to get negotiations
      let query = supabase
        .from('negotiations')
        .select(`
          id,
          listing_id,
          dealer_id,
          seller_id,
          dealers:dealer_id (
            id,
            email
          ),
          listing:listing_id (
            title,
            listed_price
          ),
          initial_offer,
          counter_offer,
          status,
          created_at,
          updated_at
        `);
      
      // If listing ID is provided, filter by it 
      if (listingId) {
        query = query.eq('listing_id', listingId);
      } 
      // Otherwise, filter by user ID as either dealer or seller
      else {
        query = query.or(`dealer_id.eq.${user.id},seller_id.eq.${user.id}`);
      }
      
      // Filter by pending status if not showing a specific listing
      if (!listingId) {
        query = query.eq('status', 'pending');
      }
      
      // Order by creation date
      query = query.order('created_at', { ascending: false });
      
      console.log("Executing negotiations query...");
      
      const { data, error } = await query;
      
      if (error) {
        console.error("Error fetching negotiations data:", {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });
        throw new Error("Failed to load negotiations data");
      }
      
      console.log(`Retrieved ${data?.length || 0} negotiations:`, data);
      
      // Initialize counter offer state for each negotiation
      if (data && data.length > 0) {
        const offerDefaults = data.reduce((acc, negotiation) => {
          return {
            ...acc,
            [negotiation.id]: negotiation.initial_offer
          };
        }, {});
        
        setCounterOffer(offerDefaults);
        
        // Make sure we properly cast the data to avoid TypeScript errors
        const typedNegotiations = data.map(item => {
          // Extract values safely with null checks
          let dealerInfo = Array.isArray(item.dealers) ? item.dealers[0] : item.dealers;
          let listingInfo = Array.isArray(item.listing) ? item.listing[0] : item.listing;
          
          return {
            ...item,
            dealers: {
              id: dealerInfo?.id || '',
              email: dealerInfo?.email || 'Unknown user'
            },
            listing: {
              title: listingInfo?.title || 'Unknown listing',
              listed_price: listingInfo?.listed_price || 0
            }
          };
        }) as Negotiation[];
        
        setNegotiations(typedNegotiations);
      } else {
        setNegotiations([]);
      }
      
    } catch (error: any) {
      console.error("Error fetching negotiations:", error);
      setError(error.message || "Failed to load negotiations");
      toast({
        title: "Error",
        description: error.message || "Failed to load negotiations",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptOffer = async (negotiationId: string) => {
    try {
      setProcessingId(negotiationId);
      
      // Get the negotiation details
      const negotiation = negotiations.find(n => n.id === negotiationId);
      if (!negotiation) return;
      
      // Update the negotiation status to 'accepted'
      const { error } = await supabase
        .from('negotiations')
        .update({ status: 'accepted' })
        .eq('id', negotiationId);
      
      if (error) throw error;
      
      toast({
        title: "Offer Accepted",
        description: "You have accepted the dealer's offer",
      });
      
      // Update local state
      setNegotiations(prevNegotiations => 
        prevNegotiations.filter(n => n.id !== negotiationId)
      );
    } catch (error: any) {
      console.error("Error accepting offer:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to accept the offer",
        variant: "destructive",
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectOffer = async (negotiationId: string) => {
    try {
      setProcessingId(negotiationId);
      
      // Update the negotiation status to 'rejected'
      const { error } = await supabase
        .from('negotiations')
        .update({ status: 'rejected' })
        .eq('id', negotiationId);
      
      if (error) throw error;
      
      toast({
        title: "Offer Rejected",
        description: "You have rejected the dealer's offer",
      });
      
      // Update local state
      setNegotiations(prevNegotiations => 
        prevNegotiations.filter(n => n.id !== negotiationId)
      );
    } catch (error: any) {
      console.error("Error rejecting offer:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to reject the offer",
        variant: "destructive",
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleCounterOffer = async (negotiationId: string) => {
    try {
      setProcessingId(negotiationId);
      
      const offerAmount = counterOffer[negotiationId];
      if (!offerAmount || offerAmount <= 0) {
        toast({
          title: "Invalid Amount",
          description: "Please enter a valid counter offer amount",
          variant: "destructive",
        });
        return;
      }
      
      // Update the negotiation with counter offer
      const { error } = await supabase
        .from('negotiations')
        .update({ 
          counter_offer: offerAmount,
          status: 'countered'
        })
        .eq('id', negotiationId);
      
      if (error) throw error;
      
      toast({
        title: "Counter Offer Sent",
        description: "Your counter offer has been sent to the dealer",
      });
      
      // Update local state
      setNegotiations(prevNegotiations => 
        prevNegotiations.filter(n => n.id !== negotiationId)
      );
    } catch (error: any) {
      console.error("Error sending counter offer:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to send counter offer",
        variant: "destructive",
      });
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center gap-2">
                <HandCoins className="h-5 w-5" />
                Negotiations
              </CardTitle>
              <CardDescription>
                Manage offers from potential buyers
              </CardDescription>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={fetchNegotiations}
              disabled={loading}
              className="flex items-center gap-1"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <div className="text-red-500 mb-3">Error: {error}</div>
              <Button onClick={fetchNegotiations}>Try Again</Button>
            </div>
          ) : negotiations.length === 0 ? (
            <div className="text-center py-8">
              <HandCoins className="h-12 w-12 mx-auto text-gray-300 mb-2" />
              <p className="text-gray-500">No pending negotiations found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {negotiations.map(negotiation => (
                <Card key={negotiation.id} className="border border-gray-200">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-base">
                        {negotiation.listing?.title || "Unnamed Listing"}
                      </CardTitle>
                      <Badge className="bg-amber-500">
                        Pending
                      </Badge>
                    </div>
                    <CardDescription className="flex items-center">
                      <Calendar className="h-3 w-3 mr-1" />
                      {new Date(negotiation.created_at).toLocaleString()}
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent className="pb-2">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-sm text-gray-500">Dealer</p>
                        <p>{negotiation.dealers?.email || "Unknown"}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-500">Offer Amount</p>
                        <p className="font-bold text-lg">₹{negotiation.initial_offer}</p>
                        <p className="text-xs text-gray-500">
                          ({((negotiation.initial_offer / negotiation.listing?.listed_price) * 100).toFixed(0)}% of asking price)
                        </p>
                      </div>
                    </div>
                    
                    <div className="pt-2 border-t">
                      <p className="text-sm font-medium mb-2">Counter Offer (Optional)</p>
                      <div className="flex items-center gap-2">
                        <IndianRupee className="h-4 w-4 text-gray-500" />
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={counterOffer[negotiation.id] || negotiation.initial_offer}
                          onChange={(e) => setCounterOffer({
                            ...counterOffer,
                            [negotiation.id]: parseFloat(e.target.value)
                          })}
                          placeholder="Enter counter offer amount"
                        />
                      </div>
                    </div>
                  </CardContent>
                  
                  <CardFooter className="pt-2 pb-4 flex justify-end gap-2">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="flex-1"
                      onClick={() => handleRejectOffer(negotiation.id)}
                      disabled={processingId === negotiation.id}
                    >
                      {processingId === negotiation.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <X className="h-4 w-4 mr-2 text-red-500" />
                          Reject
                        </>
                      )}
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="flex-1"
                      onClick={() => handleCounterOffer(negotiation.id)}
                      disabled={processingId === negotiation.id}
                    >
                      {processingId === negotiation.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <IndianRupee className="h-4 w-4 mr-2 text-blue-500" />
                          Counter
                        </>
                      )}
                    </Button>
                    <Button 
                      size="sm" 
                      className="flex-1"
                      onClick={() => handleAcceptOffer(negotiation.id)}
                      disabled={processingId === negotiation.id}
                    >
                      {processingId === negotiation.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Check className="h-4 w-4 mr-2" />
                          Accept
                        </>
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default NegotiationsManager; 