import { motion, AnimatePresence } from "framer-motion";
import { useState, useRef, useEffect } from "react";
import { Database } from "@/integrations/supabase/types";
import { Sparkles, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

type MaterialType = Database['public']['Tables']['material_types']['Row'];

interface MaterialsShowcaseProps {
  materials: MaterialType[];
  loading: boolean;
}

const getCategoryImage = (category: string): string => {
  // Normalize the category name to handle case sensitivity
  const normalizedCategory = category.trim();
  
  // Add more detailed logging
  console.log('Original category:', category);
  console.log('Normalized category:', normalizedCategory);

  const imageMap: { [key: string]: string } = {
    'Biological': '/features_img/biological.jpg',
    'Clothes': '/features_img/clothes.jpg',
    'Electronics': '/features_img/electric.jpg',
    'Electronic': '/features_img/electric.jpg',
    'Electronic Waste': '/features_img/electric.jpg',
    'Electric': '/features_img/electric.jpg',
    'Electrical': '/features_img/electric.jpg',
    'Electrical Waste': '/features_img/electric.jpg',
    'E-Waste': '/features_img/electric.jpg',
    'Metal': '/features_img/metal.jpg',
    'Paper': '/features_img/paper.jpg',
    'Plastic': '/features_img/plastic.jpeg',
    'Glass': '/features_img/glass.jpg'
  };

  // Log more details for debugging
  console.log('Trying to find image for category:', normalizedCategory);
  console.log('Available mappings:', Object.keys(imageMap));
  console.log('Selected image path:', imageMap[normalizedCategory]);

  const selectedImage = imageMap[normalizedCategory];
  if (!selectedImage) {
    console.log('No exact match found for category:', normalizedCategory);
    // Try case-insensitive match
    const lowerCategory = normalizedCategory.toLowerCase();
    const matchingKey = Object.keys(imageMap).find(key => key.toLowerCase() === lowerCategory);
    if (matchingKey) {
      console.log('Found case-insensitive match:', matchingKey);
      return imageMap[matchingKey];
    }
  }

  return selectedImage || '/features_img/default.jpg';
};

const MaterialsShowcase = ({ materials, loading }: MaterialsShowcaseProps) => {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  
  const categories = materials && materials.length > 0 
    ? [...new Set(materials.map(material => material.category))]
    : [];
    
  const filteredMaterials = activeCategory 
    ? materials.filter(material => material.category === activeCategory)
    : materials;

  console.log('Available categories:', materials.map(m => m.category)); // Debug log

  useEffect(() => {
    // Log all materials and their categories on mount
    if (materials && materials.length > 0) {
      console.log('All materials and their categories:', 
        materials.map(m => ({
          id: m.id,
          name: m.name,
          category: m.category,
          exactCategory: JSON.stringify(m.category) // Shows exact string including whitespace
        }))
      );
    }
  }, [materials]);

  // Add debugging for materials
  useEffect(() => {
    if (materials && materials.length > 0) {
      console.log('All categories in data:', materials.map(m => m.category));
    }
  }, [materials]);

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? filteredMaterials.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === filteredMaterials.length - 1 ? 0 : prev + 1));
  };

  // Auto-slide every 3 seconds when not hovered
  useEffect(() => {
    if (!isHovered && filteredMaterials.length > 0) {
      const interval = setInterval(() => {
        setCurrentIndex((prev) => (prev === filteredMaterials.length - 1 ? 0 : prev + 1));
      }, 3000);

      return () => clearInterval(interval);
    }
  }, [isHovered, filteredMaterials.length]);

  const cardVariants = {
    hidden: { opacity: 0, x: 100 },
    visible: { 
      opacity: 1, 
      x: 0,
      transition: {
        duration: 0.5,
        ease: "easeOut"
      }
    },
    exit: { 
      opacity: 0, 
      x: -100,
      transition: {
        duration: 0.5,
        ease: "easeIn"
      }
    }
  };

  return (
    <section className="py-16 bg-gradient-to-b from-white to-teal-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-7xl font-extrabold text-transparent bg-clip-text bg-gradient-to-br from-emerald-800 via-teal-600 to-teal-400 font-heading mb-4 drop-shadow-sm">
            Materials We Accept
          </h2>
          <div className="mt-6 h-2 w-40 bg-gradient-to-r from-emerald-800 via-teal-600 to-teal-400 mx-auto rounded-full opacity-80" />
          <p className="mt-8 text-xl text-emerald-800/80 max-w-3xl mx-auto leading-relaxed font-light">
            Redefining recycling with tech-powered simplicity, sustainability, and rewards.
          </p>
        </div>
        
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[1, 2, 3, 4].map(i => (
              <div 
                key={i} 
                className="h-12 bg-gradient-to-r from-gray-200 to-gray-300 animate-pulse rounded-md"
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-wrap gap-3 mb-10 justify-center">
            <button
              onClick={() => setActiveCategory(null)}
              className={`px-6 py-3 rounded-full text-lg font-medium ${
                activeCategory === null 
                  ? 'bg-gradient-to-r from-emerald-800 to-teal-500 text-white shadow-md' 
                  : 'bg-white text-emerald-800 hover:bg-emerald-50 border-2 border-emerald-800/20'
              } transition-all duration-300`}
            >
              All Materials
              <Sparkles className="h-5 w-5 inline-block ml-2" />
            </button>
            {categories.map((category, index) => (
              <button
                key={index}
                onClick={() => setActiveCategory(category)}
                className={`px-6 py-3 rounded-full text-lg font-medium ${
                  activeCategory === category 
                    ? 'bg-gradient-to-r from-emerald-800 to-teal-500 text-white shadow-md' 
                    : 'bg-white text-emerald-800 hover:bg-emerald-50 border-2 border-emerald-800/20'
                } transition-all duration-300`}
              >
                {category}
              </button>
            ))}
          </div>
        )}
        
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => (
              <div 
                key={i} 
                className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg p-6 h-60 animate-pulse"
              />
            ))}
          </div>
        ) : (
          <div 
            className="relative overflow-hidden"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={handlePrev}
                className="p-2 rounded-full bg-white shadow-md hover:bg-gray-50 transition-colors"
                aria-label="View previous materials"
              >
                <ChevronLeft className="h-6 w-6 text-gray-600" />
              </button>
              <button
                onClick={handleNext}
                className="p-2 rounded-full bg-white shadow-md hover:bg-gray-50 transition-colors"
                aria-label="View next materials"
              >
                <ChevronRight className="h-6 w-6 text-gray-600" />
              </button>
            </div>
            
            <div 
              ref={containerRef}
              className="flex transition-transform duration-500 ease-in-out"
              style={{ transform: `translateX(-${currentIndex * 25}%)` }}
            >
              {filteredMaterials.map((material, index) => (
                <motion.div
                  key={material.id}
                  className="w-1/4 px-4 flex-shrink-0"
                  initial={{ opacity: 0, x: 100 }}
                  animate={{ 
                    opacity: 1, 
                    x: 0,
                    transition: {
                      duration: 0.5,
                      delay: index * 0.1
                    }
                  }}
                  exit={{ opacity: 0, x: -100 }}
                >
                  <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] overflow-hidden hover:shadow-[0_8px_30px_rgb(0,0,0,0.2)] transition-all duration-300 relative after:absolute after:bottom-0 after:left-0 after:right-0 after:h-20 after:bg-gradient-to-t after:from-black/10 after:to-transparent">
                    <div className="h-72 relative">
                      <img
                        src={getCategoryImage(material.category)}
                        alt={material.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          console.error('Image failed to load:', e);
                          const imgElement = e.target as HTMLImageElement;
                          console.log('Failed image path:', imgElement.src);
                          imgElement.src = "/features_img/default.jpg";
                        }}
                      />
                    </div>
                    <div className="p-6 relative z-10">
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        {material.name}
                      </h3>
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-sm font-medium text-gray-500">
                          {material.category}
                        </span>
                        <span className="text-lg font-bold text-emerald-600">
                          ₹{material.base_price}/kg
                        </span>
                      </div>
                      <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-md hover:shadow-lg transition-all duration-300">
                        View Details
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default MaterialsShowcase;
