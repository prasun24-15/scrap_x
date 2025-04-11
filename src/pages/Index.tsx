import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";
import Hero from "@/components/home/Hero";
import FeaturesSection from "@/components/home/FeaturesSection";
import MaterialsShowcase from "@/components/home/MaterialsShowcase";
import RecentListings from "@/components/home/RecentListings";
import CallToAction from "@/components/home/CallToAction";
import { toast } from "@/components/ui/use-toast";

// Type definitions for our data
type MaterialType = Database['public']['Tables']['material_types']['Row'];
type ScrapListing = Database['public']['Tables']['scrap_listings']['Row'];

const fetchMaterialTypes = async () => {
  const { data, error } = await supabase
    .from('material_types')
    .select('*');
  
  if (error) throw error;
  return data;
};

const fetchScrapListings = async () => {
  const { data, error } = await supabase
    .from('scrap_listings')
    .select('*');
  
  if (error) throw error;
  return data;
};

// ChatBot component removed since we added the script to the HTML file

const Index = () => {
  const [materialTypes, setMaterialTypes] = useState<MaterialType[]>([]);
  const [listings, setListings] = useState<ScrapListing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [materials, scrapListings] = await Promise.all([
          fetchMaterialTypes(),
          fetchScrapListings()
        ]);
        
        setMaterialTypes(materials || []);
        setListings(scrapListings || []);
      } catch (error) {
        console.error("Error loading data:", error);
        toast({
          title: "Error",
          description: "Failed to load data. Please try again later.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  return (
    <div className="min-h-screen">
      <Hero />
      <FeaturesSection />
      <MaterialsShowcase materials={materialTypes} loading={loading} />
      <RecentListings listings={listings} loading={loading} />
      <CallToAction />
    </div>
  );
};

export default Index;
