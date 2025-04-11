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
            <h2 className="text-5xl md:text-7xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-br from-emerald-600 via-teal-500 to-emerald-400 mb-4 drop-shadow-sm font-display leading-tight">
              Recent Listings
            </h2>
            <div className="mt-4 h-2 w-32 bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-400 rounded-full opacity-90"></div>
            <p className="mt-8 text-2xl text-gray-700 max-w-2xl leading-relaxed font-light">
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
            <Button asChild variant="outline" className="group bg-white/80 backdrop-blur-sm border-2 border-emerald-800/20 hover:bg-emerald-50">
              <Link to="/listings" className="flex items-center text-lg font-medium">
                View All Listings 
                <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
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
                className="bg-white rounded-lg shadow-[0_8px_30px_rgb(0,0,0,0.12)] overflow-hidden hover:shadow-[0_8px_30px_rgb(0,0,0,0.2)] transition-all duration-300"
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
                  <h3 className="text-2xl font-semibold mb-3 text-gray-800">{listing.title}</h3>
                  <p className="text-lg text-gray-600 mb-6 line-clamp-2">{listing.description || "No description provided"}</p>
                  
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="text-2xl font-bold text-emerald-600">${listing.listed_price}</span>
                      <span className="text-lg text-gray-500 ml-2">• {listing.quantity} {listing.unit}</span>
                    </div>
                    <Button asChild size="lg" variant="outline" className="bg-white/80 backdrop-blur-sm border-2 border-emerald-800/20 hover:bg-emerald-50">
                      <Link to={`/pickup/${listing.id}`} className="text-lg font-medium">View Details</Link>
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
            
            {listings.length === 0 && (
              <div className="col-span-1 md:col-span-3 py-12 text-center bg-white rounded-lg shadow-[0_8px_30px_rgb(0,0,0,0.12)]">
                <p className="text-2xl text-gray-500 mb-6">No listings available at the moment.</p>
                {user && (
                  <Button asChild size="lg" className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white px-8 py-6 text-lg font-semibold rounded-full shadow-lg hover:shadow-xl transition-all duration-300">
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
