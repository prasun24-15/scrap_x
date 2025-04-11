import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ScrapPickupMap from "@/components/map/ScrapPickupMap";
import ImageUploader from "@/components/listing/ImageUploader";
import { Loader2 } from "lucide-react";

interface Location {
  lat: number;
  lng: number;
}

const formSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().optional(),
  materialTypeId: z.string().uuid("Please select a material type"),
  quantity: z.string().min(1, "Quantity is required"),
  unit: z.string().min(1, "Unit is required"),
  listedPrice: z.string().min(1, "Price is required"),
  address: z.string().min(5, "Address is required"),
  imageUrl: z.string().optional(),
});

const CreateListing = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [materialTypes, setMaterialTypes] = useState<any[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [loadingMaterials, setLoadingMaterials] = useState(true);
  const [listingMethod, setListingMethod] = useState("manual");
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      materialTypeId: "",
      quantity: "",
      unit: "kg",
      listedPrice: "",
      address: "",
      imageUrl: "",
    },
  });

  useEffect(() => {
    const fetchMaterialTypes = async () => {
      try {
        setLoadingMaterials(true);
        const { data, error } = await supabase
          .from('material_types')
          .select('*')
          .order('name');

        if (error) throw error;
        setMaterialTypes(data || []);
      } catch (error) {
        console.error("Error fetching material types:", error);
        toast({
          title: "Error",
          description: "Failed to load material types. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoadingMaterials(false);
      }
    };

    fetchMaterialTypes();
  }, []);

  const handleLocationSelected = (location: Location) => {
    setSelectedLocation(location);
  };

  const handleImageSelected = (imageUrl: string) => {
    form.setValue("imageUrl", imageUrl);
  };

  const analyzeImage = () => {
    // This is where ML model integration would happen
    // For now, we'll simulate an ML response after a delay
    const imageUrl = form.getValues("imageUrl");
    
    if (!imageUrl) {
      toast({
        title: "No Image",
        description: "Please upload an image first",
        variant: "destructive",
      });
      return;
    }
    
    toast({
      title: "Analyzing Image",
      description: "Please wait while we analyze your image...",
    });
    
    // Simulate ML processing
    setTimeout(() => {
      // Mock results - in a real app, this would come from an ML model
      const mockMaterialType = materialTypes.length > 0 ? 
        materialTypes[Math.floor(Math.random() * materialTypes.length)].id : "";
      
      form.setValue("materialTypeId", mockMaterialType);
      form.setValue("title", "Recycled Material");
      form.setValue("description", "Automatically analyzed waste material");
      
      // Set the default price based on the selected material type
      if (mockMaterialType) {
        const selectedMaterial = materialTypes.find(type => type.id === mockMaterialType);
        if (selectedMaterial && selectedMaterial.base_price) {
          form.setValue("listedPrice", selectedMaterial.base_price.toString());
        }
      }
      
      toast({
        title: "Analysis Complete",
        description: "Material type has been detected. Please review and adjust if needed.",
      });
    }, 2000);
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to create a listing",
        variant: "destructive",
      });
      return;
    }
    
    if (!selectedLocation) {
      toast({
        title: "Location Required",
        description: "Please select a pickup location on the map",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setSubmitting(true);
      
      // Format geolocation using PostGIS functions
      const { data: geoData, error: geoError } = await supabase
        .rpc('create_geography_point', {
          longitude: selectedLocation.lng,
          latitude: selectedLocation.lat
        });

      if (geoError) throw geoError;
      
      // Convert values for database
      const listingData = {
        seller_id: user.id,
        title: values.title,
        description: values.description,
        material_type_id: values.materialTypeId,
        quantity: parseFloat(values.quantity),
        unit: values.unit,
        listed_price: parseFloat(values.listedPrice),
        address: values.address,
        image_url: values.imageUrl,
        geolocation: geoData,
        status: 'active',
      };
      
      console.log("Sending listing data:", listingData);
      
      const { data, error } = await supabase
        .from('scrap_listings')
        .insert(listingData)
        .select();
      
      if (error) throw error;
      
      toast({
        title: "Listing Created",
        description: "Your scrap listing has been created successfully",
      });
      
      navigate('/listings');
    } catch (error) {
      console.error("Error creating listing:", error);
      toast({
        title: "Error",
        description: "Failed to create listing. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>Please sign in to create a listing</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Button 
              onClick={() => navigate('/auth')}
              className="bg-teal-600 hover:bg-teal-700"
            >
              Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold text-gray-800">Create Scrap Listing</h1>
        <p className="text-gray-600 mt-2">
          List your recyclable materials for pickup
        </p>
      </motion.div>

      <Tabs defaultValue="manual" onValueChange={setListingMethod}>
        <TabsList className="grid w-full max-w-md grid-cols-2 mb-8">
          <TabsTrigger value="manual">Manual Entry</TabsTrigger>
          <TabsTrigger value="ml">ML-Assisted</TabsTrigger>
        </TabsList>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <Card className="h-full">
                  <CardHeader>
                    <CardTitle>Material Details</CardTitle>
                    <CardDescription>
                      {listingMethod === 'manual' 
                        ? 'Enter details about your recyclable material' 
                        : 'Upload an image and let our system analyze it'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <TabsContent value="manual" className="space-y-4 mt-0">
                      <FormField
                        control={form.control}
                        name="imageUrl"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Image (Optional)</FormLabel>
                            <FormControl>
                              <ImageUploader
                                initialImage={field.value}
                                onImageSelected={handleImageSelected}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Title</FormLabel>
                            <FormControl>
                              <Input placeholder="E.g., Metal Scrap Collection" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description (Optional)</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Describe the materials you're offering" 
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="materialTypeId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Material Type</FormLabel>
                            <Select 
                              onValueChange={(value) => {
                                field.onChange(value);
                                // Set default price when material type changes
                                const selectedMaterial = materialTypes.find(type => type.id === value);
                                if (selectedMaterial && selectedMaterial.base_price) {
                                  form.setValue("listedPrice", selectedMaterial.base_price.toString());
                                }
                              }} 
                              defaultValue={field.value}
                              disabled={loadingMaterials}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select a material type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {materialTypes.map((type) => (
                                  <SelectItem key={type.id} value={type.id}>
                                    {type.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </TabsContent>
                    
                    <TabsContent value="ml" className="space-y-4 mt-0">
                      <div className="space-y-4">
                        <FormField
                          control={form.control}
                          name="imageUrl"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Upload Material Image</FormLabel>
                              <FormControl>
                                <ImageUploader
                                  initialImage={field.value}
                                  onImageSelected={handleImageSelected}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <Button
                          type="button"
                          onClick={analyzeImage}
                          disabled={!form.getValues("imageUrl")}
                          className="w-full"
                        >
                          Analyze Image
                        </Button>
                        
                        <FormField
                          control={form.control}
                          name="title"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Title</FormLabel>
                              <FormControl>
                                <Input placeholder="Title will be auto-filled after analysis" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="materialTypeId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Detected Material Type</FormLabel>
                              <Select 
                                onValueChange={(value) => {
                                  field.onChange(value);
                                  // Set default price when material type changes
                                  const selectedMaterial = materialTypes.find(type => type.id === value);
                                  if (selectedMaterial && selectedMaterial.base_price) {
                                    form.setValue("listedPrice", selectedMaterial.base_price.toString());
                                  }
                                }}
                                defaultValue={field.value}
                                disabled={loadingMaterials}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Will be detected from image" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {materialTypes.map((type) => (
                                    <SelectItem key={type.id} value={type.id}>
                                      {type.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </TabsContent>
                    
                    <div className="grid grid-cols-2 gap-4 mt-4">
                      <FormField
                        control={form.control}
                        name="quantity"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Quantity</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                placeholder="0.00" 
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="unit"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Unit</FormLabel>
                            <Select 
                              onValueChange={field.onChange} 
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select unit" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="kg">Kilograms (kg)</SelectItem>
                                <SelectItem value="g">Grams (g)</SelectItem>
                                <SelectItem value="ton">Tons</SelectItem>
                                <SelectItem value="lb">Pounds (lb)</SelectItem>
                                <SelectItem value="pc">Pieces</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={form.control}
                      name="listedPrice"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Price (₹)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="Price per unit"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            {form.watch("materialTypeId") ? 
                              "Default price for selected material (you can change it)" : 
                              `Set a price per ${form.watch("unit") || "unit"} for your material`}
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              </motion.div>
              
              <motion.div 
                className="space-y-8"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle>Pickup Location</CardTitle>
                    <CardDescription>
                      Provide address and mark your location on the map
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <FormField
                      control={form.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem className="mb-4">
                          <FormLabel>Address</FormLabel>
                          <FormControl>
                            <Input placeholder="Street, City, State, ZIP" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="mt-4">
                      <ScrapPickupMap onLocationSelected={handleLocationSelected} />
                    </div>
                    {!selectedLocation && (
                      <p className="text-amber-600 text-sm mt-2">
                        Please select a location on the map
                      </p>
                    )}
                  </CardContent>
                </Card>
                
                <div className="flex justify-end">
                  <Button 
                    type="submit" 
                    className="bg-teal-600 hover:bg-teal-700 transition-all duration-300 transform hover:-translate-y-1"
                    disabled={submitting}
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      "Create Listing"
                    )}
                  </Button>
                </div>
              </motion.div>
            </div>
          </form>
        </Form>
      </Tabs>
    </div>
  );
};

export default CreateListing;
