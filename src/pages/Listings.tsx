import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Filter, PlusCircle, MapPin, X, Package, Calendar, Eye, ShoppingCart, RefreshCw, Edit, Check } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";
import { DEFAULT_SCRAP_IMAGE } from "@/components/listing/ImageUploader";

interface MaterialType {
  id: string;
  name: string;
  category: string;
}

interface ScrapListing {
  id: string;
  title: string;
  description: string | null;
  material_type_id: string;
  quantity: number;
  unit: string;
  listed_price: number;
  address: string | null;
  image_url: string | null;
  geolocation: any;
  status: string;
  created_at: string;
  updated_at: string;
  seller_id: string;
  material_type?: {
    id: string;
    name: string;
    category: string;
  } | null;
}

const Listings = () => {
  const { user } = useAuth();
  const [listings, setListings] = useState<ScrapListing[]>([]);
  const [filteredListings, setFilteredListings] = useState<ScrapListing[]>([]);
  const [materialTypes, setMaterialTypes] = useState<MaterialType[]>([]);
  const [selectedMaterialTypes, setSelectedMaterialTypes] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log("Fetching all available listings...");
      console.log("Current user:", user?.id);
      
      // Fetch material types for filters
      const { data: typeData, error: typeError } = await supabase
        .from('material_types')
        .select('*')
        .order('name');
        
      if (typeError) {
        console.error("Error fetching material types:", typeError);
        throw typeError;
      }
        
      console.log(`Fetched ${typeData?.length || 0} material types`);
      setMaterialTypes(typeData || []);
        
      // Extract unique categories
      const uniqueCategories = Array.from(
        new Set((typeData || []).map(type => type.category))
      ).filter(Boolean) as string[];
        
      setCategories(uniqueCategories);
        
      // Fetch ALL listings with material types included
      const { data, error } = await supabase
        .from('scrap_listings')
        .select(`
          *,
          material_type:material_type_id (
            id, name, category
          )
        `)
        // Temporarily remove status filter to check if that's the issue
        // .eq('status', 'active')
        .order('created_at', { ascending: false });
        
      if (error) {
        console.error("Error fetching listings:", error);
        throw error;
      }
        
      console.log(`Fetched ${data?.length || 0} listings:`, data);
        
      if (!data || data.length === 0) {
        // Log the result of a simple query to check if there are any listings at all
        console.log("No listings found, checking all listings");
        const { data: checkData, error: checkError } = await supabase
          .from('scrap_listings')
          .select('id, status, title, created_at')
          .limit(10);
          
        console.log("Raw listing check results:", checkData, checkError);
        
        if (checkData && checkData.length > 0) {
          console.log("Found listings but they may not be active, showing all listings instead");
          // If we found listings but they're not active, use them anyway
          const { data: allData, error: allError } = await supabase
            .from('scrap_listings')
            .select(`
              *,
              material_type:material_type_id (
                id, name, category
              )
            `)
            .order('created_at', { ascending: false });
            
          if (!allError && allData) {
            console.log(`Using all ${allData.length} listings regardless of status`);
            setListings(allData);
            setFilteredListings(allData);
            return;
          }
        }
      }
        
      setListings(data || []);
      setFilteredListings(data || []);
    } catch (error: any) {
      console.error("Error fetching data:", error);
      setError(error.message || "Failed to load listings");
      toast({
        title: "Error",
        description: "Failed to load listings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchData();
  }, []);
  
  // Apply filters when selectedFilters change
  useEffect(() => {
    let filtered = [...listings];
    
    // Filter by material type if any selected
    if (selectedMaterialTypes.length > 0) {
      filtered = filtered.filter(listing => 
        selectedMaterialTypes.includes(listing.material_type_id)
      );
    }
    
    // Filter by category if any selected
    if (selectedCategories.length > 0) {
      filtered = filtered.filter(listing => 
        listing.material_type && 
        selectedCategories.includes(listing.material_type.category)
      );
    }
    
    console.log(`Applied filters: ${filtered.length} listings remaining`);
    setFilteredListings(filtered);
  }, [selectedMaterialTypes, selectedCategories, listings]);
  
  const toggleMaterialType = (typeId: string) => {
    setSelectedMaterialTypes(prev => 
      prev.includes(typeId) 
        ? prev.filter(id => id !== typeId) 
        : [...prev, typeId]
    );
  };
  
  const toggleCategory = (category: string) => {
    setSelectedCategories(prev => 
      prev.includes(category) 
        ? prev.filter(cat => cat !== category) 
        : [...prev, category]
    );
  };
  
  const clearFilters = () => {
    setSelectedMaterialTypes([]);
    setSelectedCategories([]);
  };
  
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };
  
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 100
      }
    }
  };
  
  // Handle marking a listing as sold
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
  
  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div 
        className="flex justify-between items-center mb-8"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Scrap Listings</h1>
          <p className="text-gray-600 mt-2">
            Browse available recyclable materials
          </p>
        </div>
        
        <div className="flex gap-3">
          <Button 
            variant="outline" 
            onClick={fetchData} 
            disabled={loading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Filter
                {(selectedMaterialTypes.length > 0 || selectedCategories.length > 0) && (
                  <Badge className="ml-1 bg-teal-500">
                    {selectedMaterialTypes.length + selectedCategories.length}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              <div className="p-2">
                <div className="flex justify-between items-center mb-2">
                  <DropdownMenuLabel>Filter Options</DropdownMenuLabel>
                  {(selectedMaterialTypes.length > 0 || selectedCategories.length > 0) && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={clearFilters}
                      className="h-8 px-2 text-xs"
                    >
                      <X className="h-3 w-3 mr-1" />
                      Clear all
                    </Button>
                  )}
                </div>
                
                <DropdownMenuSeparator />
                
                <DropdownMenuGroup>
                  <DropdownMenuLabel className="text-sm">Categories</DropdownMenuLabel>
                  {categories.map((category) => (
                    <DropdownMenuCheckboxItem
                      key={category}
                      checked={selectedCategories.includes(category)}
                      onCheckedChange={() => toggleCategory(category)}
                    >
                      {category}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuGroup>
                
                <DropdownMenuSeparator className="my-2" />
                
                <DropdownMenuGroup>
                  <DropdownMenuLabel className="text-sm">Material Types</DropdownMenuLabel>
                  <div className="max-h-60 overflow-y-auto">
                    {materialTypes.map((type) => (
                      <DropdownMenuCheckboxItem
                        key={type.id}
                        checked={selectedMaterialTypes.includes(type.id)}
                        onCheckedChange={() => toggleMaterialType(type.id)}
                      >
                        {type.name}
                      </DropdownMenuCheckboxItem>
                    ))}
                  </div>
                </DropdownMenuGroup>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <Button asChild className="bg-teal-600 hover:bg-teal-700">
            <Link to="/create-listing">
              <PlusCircle className="mr-2 h-4 w-4" />
              Create Listing
            </Link>
          </Button>
        </div>
      </motion.div>
      
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin h-8 w-8 border-4 border-teal-500 border-t-transparent rounded-full"></div>
          <span className="ml-3 text-gray-500">Loading listings...</span>
        </div>
      ) : filteredListings.length === 0 ? (
        <div className="text-center py-20">
          <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No Listings Found</h3>
          <p className="text-gray-500 max-w-md mx-auto mb-6">
            {selectedMaterialTypes.length > 0 || selectedCategories.length > 0
              ? "No listings match your current filters. Try adjusting your filter criteria."
              : "There are no listings available at the moment. Check back later or create your own listing."
            }
          </p>
          <Button asChild>
            <Link to="/create-listing">
              <PlusCircle className="h-4 w-4 mr-2" />
              Create Listing
            </Link>
          </Button>
        </div>
      ) : (
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {filteredListings.map((listing) => (
            <motion.div key={listing.id} variants={itemVariants}>
              <Card className="h-full overflow-hidden flex flex-col hover:shadow-md transition-shadow">
                <div className="relative h-48 bg-gray-100">
                  {listing.image_url && listing.image_url.length > 10 ? (
                    <img 
                      src={listing.image_url}
                      alt={listing.title} 
                      className="h-48 w-full object-cover rounded-t-md"
                      onError={(e) => {
                        console.error("Failed to load listing image:", listing.image_url);
                        const target = e.target as HTMLImageElement;
                        target.src = DEFAULT_SCRAP_IMAGE;
                      }}
                    />
                  ) : (
                    <div className="h-48 w-full flex flex-col items-center justify-center bg-gray-100">
                      <Package className="h-16 w-16 text-gray-300" />
                      <p className="text-gray-400 mt-2">No image</p>
                    </div>
                  )}
                  
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                    <div className="flex justify-between items-center">
                      <Badge className="bg-teal-500 hover:bg-teal-600">
                        {listing.material_type?.name || "Unknown"}
                      </Badge>
                      <Badge variant="outline" className="bg-white">
                        {listing.material_type?.category || "Uncategorized"}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="absolute top-3 right-3">
                    <Badge className="text-lg font-semibold px-3 py-1 bg-white text-teal-700 border border-teal-200 shadow-sm">
                      ₹{listing.listed_price}/{listing.unit}
                    </Badge>
                  </div>
                </div>
                
                <CardHeader className="pb-2">
                  <CardTitle className="line-clamp-1 text-lg">{listing.title}</CardTitle>
                </CardHeader>
                
                <CardContent className="py-2 flex-grow">
                  <p className="text-gray-500 text-sm line-clamp-2 min-h-[40px]">
                    {listing.description || "No description provided."}
                  </p>
                  
                  <div className="flex mt-3 text-sm text-gray-500">
                    <div className="flex items-center mr-4">
                      <Package className="h-4 w-4 mr-1" />
                      <span>{listing.quantity} {listing.unit}</span>
                    </div>
                    
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      <span>{new Date(listing.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </CardContent>
                
                <CardFooter className="pt-0 pb-4">
                  <div className="w-full grid grid-cols-2 gap-2">
                    <Button variant="outline" asChild>
                      <Link to={`/pickup/${listing.id}`}>
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </Link>
                    </Button>
                    
                    {user && listing.seller_id === user.id ? (
                      // Show edit and mark as sold buttons for user's own listings
                      listing.status === 'active' ? (
                        <Button 
                          onClick={() => handleMarkAsSold(listing.id)}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <Check className="h-4 w-4 mr-2" />
                          Mark as Sold
                        </Button>
                      ) : (
                        <Button asChild variant="secondary">
                          <Link to={`/edit-listing/${listing.id}`}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Listing
                          </Link>
                        </Button>
                      )
                    ) : (
                      // Show buy button for listings that aren't user's own
                      <Button asChild>
                        <Link to={`/pickup/${listing.id}`}>
                          <ShoppingCart className="h-4 w-4 mr-2" />
                          Buy
                        </Link>
                      </Button>
                    )}
                  </div>
                </CardFooter>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
};

export default Listings;
