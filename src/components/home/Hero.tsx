
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight, Recycle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const Hero = () => {
  const { user } = useAuth();
  
  return (
    <div className="relative bg-gradient-to-br from-teal-500 to-emerald-700 text-white py-16 md:py-24 overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          backgroundSize: '30px 30px'
        }}></div>
      </div>
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="flex flex-col md:flex-row items-center justify-between">
          <motion.div 
            className="md:w-1/2 mb-10 md:mb-0"
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.7 }}
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6">
                Turn Waste Into <span className="text-yellow-300">Value</span>
              </h1>
            </motion.div>
            
            <motion.p 
              className="text-xl md:text-2xl mb-8 text-teal-50"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
            >
              Join our platform to buy and sell recyclable materials while earning rewards for sustainable choices.
            </motion.p>
            
            <motion.div
              className="flex flex-wrap gap-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.5 }}
            >
              {!user ? (
                <>
                  <Button asChild size="lg" className="bg-white text-teal-600 hover:bg-teal-50">
                    <Link to="/auth?mode=signup">
                      Get Started <ArrowRight className="ml-2 h-5 w-5" />
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="lg" className="border-white text-white hover:bg-white/10">
                    <Link to="/listings">Browse Listings</Link>
                  </Button>
                </>
              ) : (
                <>
                  <Button asChild size="lg" className="bg-white text-teal-600 hover:bg-teal-50">
                    <Link to="/create-listing">
                      Create Listing <ArrowRight className="ml-2 h-5 w-5" />
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="lg" className="border-white text-white hover:bg-white/10">
                    <Link to="/listings">Browse Listings</Link>
                  </Button>
                </>
              )}
            </motion.div>
          </motion.div>
          
          <motion.div 
            className="md:w-1/2 flex justify-center"
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.7 }}
          >
            <div className="relative">
              <motion.div
                className="p-8 bg-white/10 backdrop-blur-lg rounded-2xl shadow-xl w-full max-w-md"
                animate={{ y: [0, -10, 0] }}
                transition={{ 
                  repeat: Infinity,
                  duration: 4,
                  ease: "easeInOut"
                }}
              >
                <div className="flex items-center justify-center mb-6">
                  <div className="p-4 bg-emerald-500 rounded-full">
                    <Recycle className="h-12 w-12" />
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="h-8 bg-white/20 rounded-md" />
                  <div className="h-8 bg-white/20 rounded-md w-3/4" />
                  <div className="h-8 bg-white/20 rounded-md" />
                  <div className="h-8 bg-white/20 rounded-md w-2/3" />
                  <div className="flex justify-between items-center mt-6">
                    <div className="h-10 w-20 bg-white/20 rounded-md" />
                    <div className="h-10 w-32 bg-emerald-500 rounded-md" />
                  </div>
                </div>
              </motion.div>
              
              <motion.div
                className="absolute -bottom-5 -right-5 h-20 w-20 bg-yellow-400 rounded-full flex items-center justify-center text-emerald-800 font-bold text-xl"
                animate={{ 
                  rotate: [0, 10, 0, -10, 0],
                  scale: [1, 1.1, 1, 1.1, 1]
                }}
                transition={{ 
                  repeat: Infinity,
                  duration: 5,
                  ease: "easeInOut"
                }}
              >
                New!
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Hero;
