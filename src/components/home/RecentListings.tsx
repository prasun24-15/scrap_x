import { motion } from "framer-motion";
import { Database } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight, Package } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { DEFAULT_SCRAP_IMAGE } from "@/components/listing/ImageUploader";

type ScrapListing = Database['public']['Tables']['scrap_listings']['Row'] & {
  material_type?: Database['public']['Tables']['material_types']['Row'] | null;
};

interface RecentListingsProps {
  listings: ScrapListing[];
  loading: boolean;
}

const RecentListings = ({ listings, loading }: RecentListingsProps) => {
  const { user } = useAuth();
  
  if (loading) {
    return (
      <div className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <div className="animate-pulse w-48 h-6 bg-gray-300 rounded mb-4 mx-auto"></div>
            <div className="animate-pulse w-64 h-4 bg-gray-200 rounded mx-auto"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-10">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-96 bg-white shadow rounded-lg animate-pulse overflow-hidden">
                <div className="h-48 bg-gray-300 w-full"></div>
                <div className="p-4">
                  <div className="h-6 bg-gray-300 rounded mb-4 w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded mb-2 w-full"></div>
                  <div className="h-4 bg-gray-200 rounded mb-2 w-5/6"></div>
                  <div className="h-4 bg-gray-200 rounded mb-4 w-4/6"></div>
                  <div className="h-10 bg-gray-300 rounded w-full mt-6"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }
  
  // Filter to show only the most recent 3 listings
  const recentListings = listings.slice(0, 3);
  
  return (
    <div className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold">Recent Listings</h2>
            <p className="text-gray-600 mt-2">Check out the latest recyclable materials</p>
          </div>
          <Link to="/listings">
            <Button variant="outline" className="hidden md:flex items-center gap-2">
              View All <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
        
        {recentListings.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No listings available yet.</p>
            {user && (
              <Button className="mt-4" asChild>
                <Link to="/create-listing">Create a Listing</Link>
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {recentListings.map((listing) => (
              <motion.div
                key={listing.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
              >
                <div className="h-48 relative overflow-hidden">
                  {listing.image_url ? (
                    <img 
                      src={listing.image_url} 
                      alt={listing.title} 
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        console.error("Failed to load listing image:", listing.image_url);
                        const target = e.target as HTMLImageElement;
                        target.src = DEFAULT_SCRAP_IMAGE;
                      }}
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center bg-gray-100">
                      <Package className="h-16 w-16 text-gray-300" />
                      <p className="text-gray-400 ml-2">No image</p>
                    </div>
                  )}
                  <div className="absolute top-2 right-2 bg-teal-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                    ₹{listing.listed_price}/{listing.unit}
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="text-xl font-semibold mb-2">{listing.title}</h3>
                  <p className="text-gray-600 mb-4 line-clamp-2">{listing.description || "No description provided."}</p>
                  <Link to={`/pickup/${listing.id}`}>
                    <Button className="w-full">View Details</Button>
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        )}
        
        <div className="text-center mt-8">
          <Link to="/listings" className="md:hidden inline-block">
            <Button variant="outline" className="flex items-center gap-2">
              View All Listings <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default RecentListings;
