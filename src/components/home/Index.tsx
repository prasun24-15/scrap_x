import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import Hero from "./Hero";
import FeaturesSection from "./FeaturesSection";
import CallToAction from "./CallToAction";
import MaterialsShowcase from "./MaterialsShowcase";
import RecentListings from "./RecentListings";

const HomePage = () => {
  const [materials, setMaterials] = useState([]);
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch materials
        const { data: materialsData, error: materialsError } = await supabase
          .from('material_types')
          .select('*')
          .order('name');
          
        if (materialsError) throw materialsError;
        setMaterials(materialsData || []);
        
        // Fetch recent listings
        const { data: listingsData, error: listingsError } = await supabase
          .from('scrap_listings')
          .select(`
            *,
            material_type: material_type_id (*)
          `)
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(6);
          
        if (listingsError) throw listingsError;
        setListings(listingsData || []);
      } catch (error) {
        console.error('Error fetching homepage data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <Hero />
      <FeaturesSection />
      <MaterialsShowcase materials={materials} loading={loading} />
      <RecentListings listings={listings} loading={loading} />
      <CallToAction />
    </motion.div>
  );
};

export default HomePage; 