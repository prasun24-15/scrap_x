import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, IndianRupee, AlertCircle } from "lucide-react";

interface MaterialType {
  id: string;
  name: string;
  category: string;
}

const EditListing = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [materialTypes, setMaterialTypes] = useState<MaterialType[]>([]);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    listed_price: 0,
    quantity: 0,
    unit: "kg",
    material_type_id: "",
    image_url: "",
  });

  useEffect(() => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to edit listings",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }

    fetchListingAndMaterialTypes();
  }, [user, id, navigate]);

  const fetchListingAndMaterialTypes = async () => {
    try {
      setLoading(true);

      // Fetch material types
      const { data: materialTypesData, error: materialTypesError } = await supabase
        .from('material_types')
        .select('*')
        .order('name');

      if (materialTypesError) throw materialTypesError;
      setMaterialTypes(materialTypesData || []);

      // Fetch the listing
      const { data: listing, error: listingError } = await supabase
        .from('scrap_listings')
        .select('*')
        .eq('id', id)
        .eq('seller_id', user.id)
        .single();

      if (listingError) throw listingError;
      if (!listing) {
        toast({
          title: "Error",
          description: "Listing not found or you don't have permission to edit it",
          variant: "destructive",
        });
        navigate("/my-listings");
        return;
      }

      setFormData({
        title: listing.title,
        description: listing.description,
        listed_price: listing.listed_price,
        quantity: listing.quantity,
        unit: listing.unit,
        material_type_id: listing.material_type_id,
        image_url: listing.image_url || "",
      });
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({
        title: "Error",
        description: "Failed to load listing data",
        variant: "destructive",
      });
      navigate("/my-listings");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase
        .from('scrap_listings')
        .update({
          ...formData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('seller_id', user?.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Listing updated successfully",
      });
      navigate("/my-listings");
    } catch (error) {
      console.error("Error updating listing:", error);
      toast({
        title: "Error",
        description: "Failed to update listing",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-4 max-w-2xl">
        <div className="text-center py-12">
          <div className="animate-spin h-8 w-8 border-4 border-teal-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-500">Loading listing data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Edit Listing</CardTitle>
          <CardDescription>Update your scrap material listing details</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Price (₹)</Label>
                <Input
                  id="price"
                  type="number"
                  value={formData.listed_price}
                  onChange={(e) => setFormData({ ...formData, listed_price: Number(e.target.value) })}
                  required
                  min="0"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  id="quantity"
                  type="number"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
                  required
                  min="0"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="unit">Unit</Label>
                <Select
                  value={formData.unit}
                  onValueChange={(value) => setFormData({ ...formData, unit: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select unit" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="kg">Kilograms (kg)</SelectItem>
                    <SelectItem value="g">Grams (g)</SelectItem>
                    <SelectItem value="piece">Pieces</SelectItem>
                    <SelectItem value="ton">Tons</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="material_type">Material Type</Label>
                <Select
                  value={formData.material_type_id}
                  onValueChange={(value) => setFormData({ ...formData, material_type_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select material type" />
                  </SelectTrigger>
                  <SelectContent>
                    {materialTypes.map((type) => (
                      <SelectItem key={type.id} value={type.id}>
                        {type.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="image_url">Image URL (Optional)</Label>
              <Input
                id="image_url"
                value={formData.image_url}
                onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                placeholder="https://example.com/image.jpg"
              />
            </div>
          </CardContent>

          <CardFooter className="flex justify-between">
            <Button
              variant="outline"
              onClick={() => navigate("/my-listings")}
            >
              Cancel
            </Button>
            <Button type="submit">Update Listing</Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default EditListing; 