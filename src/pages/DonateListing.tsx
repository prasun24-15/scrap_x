import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Upload, Loader2, Heart, Package } from "lucide-react";
import { motion } from "framer-motion";
import ScrapPickupMap from "@/components/map/ScrapPickupMap";

interface Location {
  lat: number;
  lng: number;
}

interface NGO {
  id: string;
  name: string;
  description: string;
  address: string;
  phone: string;
  email: string;
  website: string | null;
  image_url: string | null;
}

const DonateListing = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [unit, setUnit] = useState("kg");
  const [materialTypeId, setMaterialTypeId] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [materialTypes, setMaterialTypes] = useState<Array<{ id: string; name: string; category: string }>>([]);
  const [location, setLocation] = useState<Location | null>(null);
  const [address, setAddress] = useState("");
  const [selectedNgo, setSelectedNgo] = useState("");
  const [ngos, setNgos] = useState<NGO[]>([]);

  useEffect(() => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to donate items",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }

    fetchMaterialTypes();
    fetchNgos();
  }, [user, navigate]);

  const fetchMaterialTypes = async () => {
    try {
      const { data, error } = await supabase
        .from('material_types')
        .select('id, name, category')
        .order('name', { ascending: true });
      
      if (error) throw error;
      
      setMaterialTypes(data || []);
      
      if (data && data.length > 0) {
        setMaterialTypeId(data[0].id);
      }
    } catch (error) {
      console.error("Error fetching material types:", error);
      toast({
        title: "Error",
        description: "Failed to load material types",
        variant: "destructive",
      });
    }
  };

  const fetchNgos = async () => {
    try {
      const { data, error } = await supabase
        .from('ngos')
        .select('*')
        .order('name', { ascending: true });
      
      if (error) throw error;
      
      setNgos(data || []);
      
      if (data && data.length > 0) {
        setSelectedNgo(data[0].id);
      }
    } catch (error) {
      console.error("Error fetching NGOs:", error);
      toast({
        title: "Error",
        description: "Failed to load NGOs",
        variant: "destructive",
      });
    }
  };

  const handleLocationSelected = (location: Location) => {
    setLocation(location);
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    try {
      setUploadingImage(true);
      
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
      const filePath = `donation_images/${fileName}`;
      
      const { error: uploadError } = await supabase.storage
        .from('scrap_images')
        .upload(filePath, file);
      
      if (uploadError) throw uploadError;
      
      const { data } = supabase.storage
        .from('scrap_images')
        .getPublicUrl(filePath);
      
      setImageUrl(data.publicUrl);
      
      toast({
        title: "Success",
        description: "Image uploaded successfully",
      });
    } catch (error) {
      console.error("Error uploading image:", error);
      toast({
        title: "Error",
        description: "Failed to upload image",
        variant: "destructive",
      });
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to donate items",
        variant: "destructive",
      });
      return;
    }
    
    if (!title || !description || !materialTypeId || !selectedNgo) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setLoading(true);
      
      let geoPoint = null;
      if (location) {
        // Convert coordinates to PostGIS format
        const { data: geoData, error: geoError } = await supabase
          .rpc('create_geography_point', {
            longitude: location.lng,
            latitude: location.lat
          });
        
        if (geoError) throw geoError;
        geoPoint = geoData;
      }
      
      // Create donation listing
      const { data, error } = await supabase
        .from('scrap_listings')
        .insert({
          title,
          description,
          material_type_id: materialTypeId,
          quantity,
          unit,
          listed_price: 0, // Donations are free
          seller_id: user.id,
          image_url: imageUrl || null,
          status: 'active',
          is_donation: true,
          ngo_id: selectedNgo,
          geolocation: geoPoint,
          address: address || null
        })
        .select();
      
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Your donation has been listed successfully!",
      });
      
      // Redirect to the listings page
      navigate("/my-listings");
    } catch (error) {
      console.error("Error creating donation listing:", error);
      toast({
        title: "Error",
        description: "Failed to create donation listing",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
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
          <h1 className="text-3xl font-bold">Donate Items</h1>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Heart className="h-5 w-5 text-red-500 mr-2" />
                  Donation Details
                </CardTitle>
                <CardDescription>
                  Donate items you no longer need to NGOs who can put them to good use.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      placeholder="e.g., Used Books for Donation"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      placeholder="Describe the items you're donating..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={4}
                      required
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="quantity">Quantity</Label>
                      <Input
                        id="quantity"
                        type="number"
                        min="1"
                        value={quantity}
                        onChange={(e) => setQuantity(parseInt(e.target.value))}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="unit">Unit</Label>
                      <Select value={unit} onValueChange={setUnit}>
                        <SelectTrigger id="unit">
                          <SelectValue placeholder="Select unit" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="kg">Kilograms (kg)</SelectItem>
                          <SelectItem value="pieces">Pieces</SelectItem>
                          <SelectItem value="boxes">Boxes</SelectItem>
                          <SelectItem value="bundles">Bundles</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="materialType">Material Type</Label>
                    <Select value={materialTypeId} onValueChange={setMaterialTypeId}>
                      <SelectTrigger id="materialType">
                        <SelectValue placeholder="Select material type" />
                      </SelectTrigger>
                      <SelectContent>
                        {materialTypes.map((type) => (
                          <SelectItem key={type.id} value={type.id}>
                            {type.name} ({type.category})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="ngo">Select NGO</Label>
                    <Select value={selectedNgo} onValueChange={setSelectedNgo}>
                      <SelectTrigger id="ngo">
                        <SelectValue placeholder="Select NGO" />
                      </SelectTrigger>
                      <SelectContent>
                        {ngos.map((ngo) => (
                          <SelectItem key={ngo.id} value={ngo.id}>
                            {ngo.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="image">Upload Image (Optional)</Label>
                    <div className="flex items-center gap-4">
                      {imageUrl ? (
                        <div className="relative w-24 h-24 border rounded overflow-hidden">
                          <img
                            src={imageUrl}
                            alt="Donation preview"
                            className="w-full h-full object-cover"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute top-1 right-1 h-6 w-6"
                            onClick={() => setImageUrl("")}
                          >
                            ×
                          </Button>
                        </div>
                      ) : (
                        <Label
                          htmlFor="image-upload"
                          className="flex flex-col items-center justify-center w-24 h-24 border-2 border-dashed border-gray-300 rounded cursor-pointer hover:bg-gray-50"
                        >
                          {uploadingImage ? (
                            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                          ) : (
                            <>
                              <Upload className="h-6 w-6 text-gray-400" />
                              <span className="text-xs text-gray-500 mt-1">Upload</span>
                            </>
                          )}
                          <input
                            id="image-upload"
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleImageUpload}
                            disabled={uploadingImage}
                          />
                        </Label>
                      )}
                      {uploadingImage && (
                        <p className="text-sm text-gray-500">Uploading image...</p>
                      )}
                    </div>
                  </div>
                
                  <Button
                    type="submit"
                    className="w-full mt-6"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Creating Donation...
                      </>
                    ) : (
                      <>
                        <Heart className="h-4 w-4 mr-2" />
                        Donate Items
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
            
            {selectedNgo && ngos.length > 0 && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle className="text-lg">Selected NGO</CardTitle>
                </CardHeader>
                <CardContent>
                  {ngos.map(ngo => ngo.id === selectedNgo && (
                    <div key={ngo.id} className="space-y-3">
                      <div className="flex items-center gap-3">
                        {ngo.image_url ? (
                          <img
                            src={ngo.image_url}
                            alt={ngo.name}
                            className="w-16 h-16 object-cover rounded"
                          />
                        ) : (
                          <div className="w-16 h-16 bg-gray-100 rounded flex items-center justify-center">
                            <Package className="h-8 w-8 text-gray-400" />
                          </div>
                        )}
                        <div>
                          <h3 className="font-medium">{ngo.name}</h3>
                          <p className="text-sm text-gray-500">{ngo.email}</p>
                          <p className="text-sm text-gray-500">{ngo.phone}</p>
                        </div>
                      </div>
                      <p className="text-sm text-gray-700">{ngo.description}</p>
                      {ngo.website && (
                        <a
                          href={ngo.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:underline"
                        >
                          Visit Website
                        </a>
                      )}
                      <p className="text-sm text-gray-500">
                        <span className="font-medium">Address:</span> {ngo.address}
                      </p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
          
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Pickup Location</CardTitle>
                <CardDescription>
                  Set the location where the NGO can pick up your donation.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrapPickupMap 
                  onLocationSelected={handleLocationSelected}
                  readOnly={false}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default DonateListing; 