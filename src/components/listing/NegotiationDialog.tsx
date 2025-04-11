import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, IndianRupee, HandCoins } from "lucide-react";

interface NegotiationDialogProps {
  listingId: string;
  listingTitle: string;
  askingPrice: number;
  trigger?: React.ReactNode;
  onNegotiationCreated?: () => void;
}

interface Negotiation {
  id: string;
  listing_id: string;
  dealer_id: string;
  seller_id?: string;
  initial_offer: number;
  counter_offer: number | null;
  status: 'pending' | 'accepted' | 'rejected' | 'countered';
  created_at: string;
}

const NegotiationDialog = ({
  listingId,
  listingTitle,
  askingPrice,
  trigger,
  onNegotiationCreated
}: NegotiationDialogProps) => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkingExisting, setCheckingExisting] = useState(true);
  const [existingNegotiation, setExistingNegotiation] = useState<Negotiation | null>(null);
  const [initialOffer, setInitialOffer] = useState(askingPrice * 0.9); // Start at 90% of asking price
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (user && open) {
      checkExistingNegotiation();
    }
  }, [user, open, listingId]);

  const checkExistingNegotiation = async () => {
    if (!user) return;
    
    try {
      setCheckingExisting(true);
      
      const { data, error } = await supabase
        .from('negotiations')
        .select('*')
        .eq('listing_id', listingId)
        .eq('dealer_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1);
      
      if (error) throw error;
      
      if (data && data.length > 0) {
        setExistingNegotiation(data[0]);
      } else {
        setExistingNegotiation(null);
      }
    } catch (error) {
      console.error("Error checking existing negotiations:", error);
    } finally {
      setCheckingExisting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to make an offer",
        variant: "destructive",
      });
      return;
    }
    
    if (initialOffer <= 0) {
      toast({
        title: "Invalid Offer",
        description: "Please enter a valid offer amount",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setLoading(true);
      
      // Verify that listing exists and get seller_id
      const { data: listingData, error: listingError } = await supabase
        .from('scrap_listings')
        .select('id, title, seller_id')
        .eq('id', listingId)
        .single();
      
      if (listingError) {
        console.error("Listing verification error:", listingError);
        throw new Error("Could not verify listing existence. Please try again.");
      }
      
      if (!listingData) {
        throw new Error("The listing you're trying to make an offer on doesn't exist anymore.");
      }
      
      console.log("Listing verified:", listingData.title);
      
      // Verify user authentication status
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError) {
        console.error("Auth verification error:", authError);
        throw new Error("Authentication error. Please sign in again.");
      }
      
      if (!authData.user) {
        throw new Error("You need to be logged in to make an offer. Please sign in.");
      }
      
      console.log("User verified:", authData.user.id);
      
      // Simple data matching exact table structure
      const negotiationData = {
        listing_id: listingId,
        dealer_id: user.id,
        seller_id: listingData.seller_id,
        initial_offer: initialOffer,
        status: 'pending'
      };
      
      console.log("Inserting negotiation with data:", negotiationData);
      
      // Direct insert using the exact table structure
      const { error } = await supabase
        .from('negotiations')
        .insert(negotiationData);
      
      if (error) {
        console.error("Insert error:", error.message);
        console.error("Error code:", error.code);
        console.error("Error details:", error.details);
        
        // Check for specific errors
        if (error.code === '23503') { // Foreign key violation
          throw new Error("There was a reference error. Make sure the listing still exists.");
        } else if (error.code === '23505') { // Unique violation
          // Try updating existing negotiation instead
          console.log("Negotiation may already exist, trying to update");
          
          const { error: updateError } = await supabase
            .from('negotiations')
            .update({ initial_offer: initialOffer, status: 'pending' })
            .eq('listing_id', listingId)
            .eq('dealer_id', user.id);
            
          if (updateError) {
            console.error("Update error:", updateError);
            throw updateError;
          }
        } else {
          // Last resort: Try with the stored procedure if it exists
          console.log("Attempting to use stored procedure as fallback");
          try {
            const { data: rpcData, error: rpcError } = await supabase.rpc(
              'insert_negotiation_with_seller',
              {
                p_listing_id: listingId,
                p_dealer_id: user.id,
                p_initial_offer: initialOffer,
                p_seller_id: listingData.seller_id
              }
            );
            
            if (rpcError) {
              console.error("Stored procedure error:", rpcError);
              throw error; // Throw the original error
            }
            
            console.log("Negotiation created via stored procedure:", rpcData);
            // Handle success case for stored procedure
            toast({
              title: "Offer Sent",
              description: "Your offer has been sent to the seller (via fallback method)",
            });
            
            // Close dialog and trigger callback
            setOpen(false);
            if (onNegotiationCreated) {
              onNegotiationCreated();
            }
            
            return; // Exit early as we succeeded with stored procedure
          } catch (rpcException) {
            console.error("Exception during stored procedure call:", rpcException);
            throw error; // Throw the original error
          }
        }
      }
      
      console.log("Negotiation created successfully");
      toast({
        title: "Offer Sent",
        description: "Your offer has been sent to the seller",
      });
      
      // Close dialog and trigger callback
      setOpen(false);
      if (onNegotiationCreated) {
        onNegotiationCreated();
      }
    } catch (error: any) {
      console.error("Error creating negotiation:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to send your offer. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Your offer is waiting for the seller to respond.';
      case 'accepted':
        return 'The seller has accepted your offer!';
      case 'rejected':
        return 'The seller has rejected your offer.';
      case 'countered':
        return 'The seller has made a counter offer.';
      default:
        return 'Unknown status';
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="w-full" variant="outline">
            <HandCoins className="w-4 h-4 mr-2" />
            Make an Offer
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Negotiate for {listingTitle}</DialogTitle>
          <DialogDescription>
            {existingNegotiation 
              ? "View your current negotiation status" 
              : "Make an offer to negotiate the price"
            }
          </DialogDescription>
        </DialogHeader>
        
        {checkingExisting ? (
          <div className="flex justify-center py-6">
            <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
          </div>
        ) : existingNegotiation ? (
          <div className="py-4 space-y-4">
            <div className="bg-gray-50 p-4 rounded-md">
              <h3 className="font-medium mb-2">Current Negotiation</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="text-gray-500">Status:</div>
                <div className="font-medium capitalize">
                  {existingNegotiation.status}
                </div>
                <div className="text-gray-500">Your Offer:</div>
                <div className="font-medium">₹{existingNegotiation.initial_offer}</div>
                {existingNegotiation.counter_offer && (
                  <>
                    <div className="text-gray-500">Counter Offer:</div>
                    <div className="font-medium">₹{existingNegotiation.counter_offer}</div>
                  </>
                )}
                <div className="text-gray-500">Date:</div>
                <div>
                  {new Date(existingNegotiation.created_at).toLocaleDateString()}
                </div>
              </div>
            </div>
            
            <p className="text-sm text-gray-500">
              {getStatusText(existingNegotiation.status)}
            </p>
            
            {existingNegotiation.status === 'countered' && (
              <div className="space-y-4 pt-4 border-t">
                <h3 className="font-medium">Accept Counter Offer?</h3>
                <div className="flex gap-2">
                  <Button 
                    className="flex-1" 
                    onClick={async () => {
                      try {
                        setLoading(true);
                        
                        // Update the negotiation status to 'accepted'
                        const { error } = await supabase
                          .from('negotiations')
                          .update({ 
                            status: 'accepted'
                          })
                          .eq('id', existingNegotiation.id);
                        
                        if (error) throw error;
                        
                        toast({
                          title: "Counter Offer Accepted",
                          description: "You have accepted the seller's counter offer",
                        });
                        
                        setOpen(false);
                      } catch (error: any) {
                        console.error("Error accepting counter offer:", error);
                        toast({
                          title: "Error",
                          description: error.message || "Failed to accept the counter offer",
                          variant: "destructive",
                        });
                      } finally {
                        setLoading(false);
                      }
                    }}
                    disabled={loading}
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Accept Offer"
                    )}
                  </Button>
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={async () => {
                      try {
                        setLoading(true);
                        
                        // Update the negotiation status to 'rejected'
                        const { error } = await supabase
                          .from('negotiations')
                          .update({ 
                            status: 'rejected'
                          })
                          .eq('id', existingNegotiation.id);
                        
                        if (error) throw error;
                        
                        toast({
                          title: "Counter Offer Declined",
                          description: "You have declined the seller's counter offer",
                        });
                        
                        setOpen(false);
                      } catch (error: any) {
                        console.error("Error declining counter offer:", error);
                        toast({
                          title: "Error",
                          description: error.message || "Failed to decline the counter offer",
                          variant: "destructive",
                        });
                      } finally {
                        setLoading(false);
                      }
                    }}
                    disabled={loading}
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Decline"
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 py-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label htmlFor="initialOffer">Your Offer (₹)</Label>
                <span className="text-sm text-gray-500">
                  Asking Price: ₹{askingPrice}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <IndianRupee className="h-4 w-4 text-gray-500" />
                <Input
                  id="initialOffer"
                  type="number"
                  min="0"
                  step="0.01"
                  value={initialOffer}
                  onChange={(e) => setInitialOffer(parseFloat(e.target.value))}
                  required
                />
              </div>
              <div className="pt-2">
                <Slider
                  defaultValue={[initialOffer]}
                  max={askingPrice * 1.1}
                  min={askingPrice * 0.5}
                  step={askingPrice * 0.01}
                  onValueChange={(value) => setInitialOffer(value[0])}
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>-50%</span>
                  <span>Asking Price</span>
                  <span>+10%</span>
                </div>
              </div>
              <p className="text-xs text-gray-500 pt-1">
                Offering {((initialOffer / askingPrice) * 100).toFixed(0)}% of asking price
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="message">Message (Optional)</Label>
              <Textarea
                id="message"
                placeholder="Include any details about your offer..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
              />
            </div>

            <DialogFooter className="pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setOpen(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  "Send Offer"
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default NegotiationDialog; 