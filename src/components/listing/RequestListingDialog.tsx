import { useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, IndianRupee, Package, MessageCircle, ShoppingCart, ArrowRightLeft } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface RequestListingDialogProps {
  listingId: string;
  listingTitle: string;
  originalPrice: number;
  quantity: number;
  unit: string;
  trigger?: React.ReactNode;
  onRequestSent?: () => void;
}

const RequestListingDialog = ({
  listingId,
  listingTitle,
  originalPrice,
  quantity,
  unit,
  trigger,
  onRequestSent
}: RequestListingDialogProps) => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [requestMode, setRequestMode] = useState<'buy' | 'negotiate'>('buy');
  const [requestedQuantity, setRequestedQuantity] = useState(quantity);
  const [offeredPrice, setOfferedPrice] = useState(originalPrice);
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to send a request",
        variant: "destructive",
      });
      return;
    }
    
    if (requestedQuantity <= 0 || offeredPrice <= 0) {
      toast({
        title: "Invalid Input",
        description: "Please enter valid quantity and price",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setLoading(true);
      
      // Check if user has already sent a request for this listing
      const { data: existingRequests, error: checkError } = await supabase
        .from('listing_requests')
        .select('id, status')
        .eq('listing_id', listingId)
        .eq('buyer_id', user.id);
      
      if (checkError) throw checkError;
      
      const pendingRequest = existingRequests?.find(req => req.status === 'pending');
      
      if (pendingRequest) {
        toast({
          title: "Request Already Sent",
          description: "You already have a pending request for this listing",
          variant: "destructive",
        });
        return;
      }
      
      // Submit the request
      const { error } = await supabase
        .from('listing_requests')
        .insert({
          listing_id: listingId,
          buyer_id: user.id,
          quantity_requested: requestedQuantity,
          price_offered: requestMode === 'buy' ? originalPrice : offeredPrice,
          message: message || null,
          status: 'pending',
          is_negotiation: requestMode === 'negotiate'
        });
      
      if (error) throw error;
      
      toast({
        title: requestMode === 'buy' ? "Purchase Request Sent" : "Negotiation Request Sent",
        description: requestMode === 'buy' 
          ? "Your purchase request has been sent to the seller" 
          : "Your negotiation offer has been sent to the seller",
      });
      
      // Close dialog and trigger callback
      setOpen(false);
      if (onRequestSent) {
        onRequestSent();
      }
    } catch (error) {
      console.error("Error sending request:", error);
      toast({
        title: "Error",
        description: "Failed to send your request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  const calculateTotal = () => {
    const price = requestMode === 'buy' ? originalPrice : offeredPrice;
    return (price * requestedQuantity).toFixed(2);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="w-full">
            <ShoppingCart className="w-4 h-4 mr-2" />
            Buy Now
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Purchase {listingTitle}</DialogTitle>
          <DialogDescription>
            Choose how you'd like to purchase this item
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="buy" className="w-full" onValueChange={(value) => setRequestMode(value as 'buy' | 'negotiate')}>
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="buy" className="flex items-center justify-center">
              <ShoppingCart className="w-4 h-4 mr-2" />
              Buy at Listed Price
            </TabsTrigger>
            <TabsTrigger value="negotiate" className="flex items-center justify-center">
              <ArrowRightLeft className="w-4 h-4 mr-2" />
              Negotiate Price
            </TabsTrigger>
          </TabsList>
          
          <form onSubmit={handleSubmit} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity ({unit})</Label>
              <div className="flex items-center">
                <Package className="w-4 h-4 mr-2 text-gray-500" />
                <Input
                  id="quantity"
                  type="number"
                  min="0.01"
                  step="0.01"
                  max={quantity}
                  value={requestedQuantity}
                  onChange={(e) => setRequestedQuantity(parseFloat(e.target.value))}
                  required
                />
              </div>
              <p className="text-xs text-gray-500">Maximum available: {quantity} {unit}</p>
            </div>
            
            <TabsContent value="negotiate" className="space-y-2 mt-0 pt-0">
              <Label htmlFor="price">Your Offered Price per {unit} (₹)</Label>
              <div className="flex items-center">
                <IndianRupee className="w-4 h-4 mr-2 text-gray-500" />
                <Input
                  id="price"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={offeredPrice}
                  onChange={(e) => setOfferedPrice(parseFloat(e.target.value))}
                  required
                />
              </div>
              <p className="text-xs text-gray-500">Listed price: ₹{originalPrice} per {unit}</p>
            </TabsContent>
            
            <TabsContent value="buy" className="space-y-2 mt-0 pt-0">
              <Label>Price per {unit}</Label>
              <div className="flex items-center p-2 border rounded-md bg-gray-50">
                <IndianRupee className="w-4 h-4 mr-2 text-gray-500" />
                <span className="font-medium">₹{originalPrice}</span>
              </div>
            </TabsContent>
            
            <div className="space-y-2">
              <Label htmlFor="message">Message (Optional)</Label>
              <Textarea
                id="message"
                placeholder="Include any details or questions for the seller..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
              />
            </div>
            
            <div className="bg-gray-50 p-3 rounded-md">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-500">Quantity:</span>
                <span>{requestedQuantity} {unit}</span>
              </div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-500">Price per {unit}:</span>
                <span>₹{requestMode === 'buy' ? originalPrice : offeredPrice}</span>
              </div>
              <div className="flex justify-between font-medium border-t pt-2 mt-2">
                <span>Total:</span>
                <span>₹{calculateTotal()}</span>
              </div>
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
                  requestMode === 'buy' ? "Buy Now" : "Send Offer"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default RequestListingDialog; 