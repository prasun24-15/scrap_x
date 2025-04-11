
import { motion } from "framer-motion";
import { useState } from "react";
import { Database } from "@/integrations/supabase/types";

type MaterialType = Database['public']['Tables']['material_types']['Row'];

interface MaterialsShowcaseProps {
  materials: MaterialType[];
  loading: boolean;
}

const MaterialsShowcase = ({ materials, loading }: MaterialsShowcaseProps) => {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  
  const categories = materials && materials.length > 0 
    ? [...new Set(materials.map(material => material.category))]
    : [];
    
  const filteredMaterials = activeCategory 
    ? materials.filter(material => material.category === activeCategory)
    : materials;
    
  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl font-bold text-gray-800">Materials We Accept</h2>
          <div className="mt-4 h-1 w-20 bg-teal-500 mx-auto"></div>
          <p className="mt-6 text-lg text-gray-600 max-w-2xl mx-auto">
            Browse our extensive collection of recyclable materials that can be traded on our platform.
          </p>
        </motion.div>
        
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-12 bg-gray-200 animate-pulse rounded-md"></div>
            ))}
          </div>
        ) : (
          <div className="flex flex-wrap gap-2 mb-8 justify-center">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveCategory(null)}
              className={`px-4 py-2 rounded-full ${
                activeCategory === null 
                  ? 'bg-teal-500 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              } transition-colors`}
            >
              All
            </motion.button>
            {categories.map((category, index) => (
              <motion.button
                key={index}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setActiveCategory(category)}
                className={`px-4 py-2 rounded-full ${
                  activeCategory === category 
                    ? 'bg-teal-500 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                } transition-colors`}
              >
                {category}
              </motion.button>
            ))}
          </div>
        )}
        
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-gray-100 rounded-lg p-6 h-60 animate-pulse"></div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredMaterials.map((material, index) => (
              <motion.div
                key={material.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                whileHover={{ 
                  scale: 1.03,
                  boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
                }}
                className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all"
              >
                <div className="h-40 bg-gradient-to-r from-teal-500 to-emerald-400 flex items-center justify-center text-white">
                  <span className="text-4xl font-bold">{material.name.charAt(0)}</span>
                </div>
                <div className="p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800">{material.name}</h3>
                      <p className="text-sm text-gray-500 mt-1">{material.category}</p>
                    </div>
                    <div className="bg-teal-50 text-teal-700 px-3 py-1 rounded-full text-sm font-medium">
                    ₹ {material.base_price}/kg
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default MaterialsShowcase;
