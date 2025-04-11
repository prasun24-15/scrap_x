
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
import { Filter, PlusCircle, MapPin, X } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu";

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
  const [listings, setListings] = useState<ScrapListing[]>([]);
  const [filteredListings, setFilteredListings] = useState<ScrapListing[]>([]);
  const [materialTypes, setMaterialTypes] = useState<MaterialType[]>([]);
  const [selectedMaterialTypes, setSelectedMaterialTypes] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch material types for filters
        const { data: typeData, error: typeError } = await supabase
          .from('material_types')
          .select('*')
          .order('name');
          
        if (typeError) throw typeError;
        setMaterialTypes(typeData || []);
        
        // Extract unique categories
        const uniqueCategories = Array.from(
          new Set((typeData || []).map(type => type.category))
        ).filter(Boolean) as string[];
        
        setCategories(uniqueCategories);
        
        // Fetch listings with material types included
        const { data, error } = await supabase
          .from('scrap_listings')
          .select(`
            *,
            material_type:material_type_id (
              id, name, category
            )
          `)
          .eq('status', 'active')
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        setListings(data || []);
        setFilteredListings(data || []);
      } catch (error) {
        console.error("Error fetching data:", error);
        toast({
          title: "Error",
          description: "Failed to load listings. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <div className="h-48 bg-gray-200"></div>
              <CardHeader className="bg-gray-100 h-24"></CardHeader>
              <CardContent className="bg-gray-50 h-24"></CardContent>
              <CardFooter className="bg-gray-100 h-16"></CardFooter>
            </Card>
          ))}
        </div>
      ) : filteredListings.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
        >
          <Card className="text-center p-8">
            <div className="mb-4 text-gray-400">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-12 w-12 mx-auto"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">
              {(selectedMaterialTypes.length > 0 || selectedCategories.length > 0)
                ? "No listings match your filters" 
                : "No Listings Found"}
            </h3>
            <p className="text-gray-500 mb-6">
              {(selectedMaterialTypes.length > 0 || selectedCategories.length > 0)
                ? "Try changing your filter selection" 
                : "Be the first to create a scrap listing"}
            </p>
            {(selectedMaterialTypes.length > 0 || selectedCategories.length > 0) ? (
              <Button 
                variant="outline" 
                onClick={clearFilters}
                className="mr-2"
              >
                Clear Filters
              </Button>
            ) : null}
            <Button asChild className="bg-teal-600 hover:bg-teal-700">
              <Link to="/create-listing">
                Create Listing
              </Link>
            </Button>
          </Card>
        </motion.div>
      ) : (
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <AnimatePresence>
            {filteredListings.map((listing, index) => (
              <motion.div
                key={listing.id}
                variants={itemVariants}
                layout
                exit={{ opacity: 0, scale: 0.8 }}
                whileHover={{ y: -5 }}
                className="transition-shadow duration-300 hover:shadow-xl"
              >
                <Card className="h-full flex flex-col overflow-hidden hover:border-teal-300">
                  <div className="h-48 overflow-hidden">
                    {listing.image_url ? (
                      <img
                        src={listing.image_url}
                        alt={listing.title}
                        className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center text-white">
                        <span className="text-2xl font-bold">{listing.title.charAt(0)}</span>
                      </div>
                    )}
                  </div>
                  
                  <CardHeader>
                    <CardTitle className="line-clamp-1">{listing.title}</CardTitle>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {listing.material_type && (
                        <Badge variant="outline" className="text-sm bg-teal-50">
                          {listing.material_type.name}
                        </Badge>
                      )}
                      {listing.material_type?.category && (
                        <Badge variant="secondary" className="text-sm">
                          {listing.material_type.category}
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  
                  <CardContent className="flex-grow">
                    <p className="text-gray-600 line-clamp-3 mb-2">
                      {listing.description || "No description provided"}
                    </p>
                    {listing.address && (
                      <div className="flex items-center gap-1 text-gray-500">
                        <MapPin className="h-4 w-4" />
                        <span className="text-sm line-clamp-1">
                          {listing.address}
                        </span>
                      </div>
                    )}
                  </CardContent>
                  
                  <CardFooter className="flex justify-between items-center border-t pt-4">
                    <div>
                      <span className="text-teal-600 font-bold">${listing.listed_price}</span>
                      <span className="text-gray-500 ml-2">• {listing.quantity} {listing.unit}</span>
                    </div>
                    <div className="flex space-x-2">
                      <Button 
                        asChild 
                        variant="outline"
                        size="sm"
                        className="transition-colors hover:bg-teal-50"
                      >
                        <Link to={`/pickup/${listing.id}`}>
                          View Details
                        </Link>
                      </Button>
                      <Button 
                        asChild 
                        size="sm" 
                        className="bg-teal-600 hover:bg-teal-700 text-white transition-colors"
                      >
                        <Link to={`/pickup/${listing.id}`}>
                          Request
                        </Link>
                      </Button>
                    </div>
                  </CardFooter>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
};

export default Listings;
