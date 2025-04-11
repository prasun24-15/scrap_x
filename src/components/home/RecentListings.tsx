
import { motion } from "framer-motion";
import { Database } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

type ScrapListing = Database['public']['Tables']['scrap_listings']['Row'] & {
  material_type?: Database['public']['Tables']['material_types']['Row'] | null;
};

interface RecentListingsProps {
  listings: ScrapListing[];
  loading: boolean;
}

const RecentListings = ({ listings, loading }: RecentListingsProps) => {
  const { user } = useAuth();

  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl font-bold text-gray-800">Recent Listings</h2>
            <div className="mt-4 h-1 w-20 bg-teal-500"></div>
            <p className="mt-6 text-lg text-gray-600 max-w-2xl">
              Browse the latest materials available on our marketplace.
            </p>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-6 md:mt-0"
          >
            <Button asChild variant="outline" className="group">
              <Link to="/listings" className="flex items-center">
                View All Listings 
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
          </motion.div>
        </div>
        
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-gray-200 rounded-lg h-72 animate-pulse"></div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {listings.slice(0, 6).map((listing, index) => (
              <motion.div
                key={listing.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
              >
                {listing.image_url ? (
                  <img 
                    src={listing.image_url} 
                    alt={listing.title} 
                    className="w-full h-48 object-cover"
                  />
                ) : (
                  <div className="w-full h-48 bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center text-white">
                    <span className="text-2xl font-bold">{listing.title.charAt(0)}</span>
                  </div>
                )}
                
                <div className="p-6">
                  <h3 className="text-xl font-semibold mb-2 text-gray-800">{listing.title}</h3>
                  <p className="text-gray-600 mb-4 line-clamp-2">{listing.description || "No description provided"}</p>
                  
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="text-teal-600 font-bold">${listing.listed_price}</span>
                      <span className="text-gray-500 ml-2">• {listing.quantity} {listing.unit}</span>
                    </div>
                    <Button asChild size="sm" variant="outline">
                      <Link to={`/pickup/${listing.id}`}>View Details</Link>
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
            
            {listings.length === 0 && (
              <div className="col-span-1 md:col-span-3 py-12 text-center bg-white rounded-lg shadow">
                <p className="text-gray-500 mb-4">No listings available at the moment.</p>
                {user && (
                  <Button asChild>
                    <Link to="/create-listing">Create First Listing</Link>
                  </Button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
};

export default RecentListings;
