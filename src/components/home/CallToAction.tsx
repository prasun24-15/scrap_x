import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowRight, Search } from "lucide-react";

const CallToAction = () => {
  const { user } = useAuth();
  
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.3,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 10,
      },
    },
  };

  const buttonHoverVariants = {
    hover: {
      scale: 1.05,
      rotate: [0, -5, 5, -5, 0],
      transition: {
        rotate: {
          repeat: Infinity,
          duration: 1,
          ease: "easeInOut",
        },
      },
    },
    tap: { scale: 0.95 },
  };

  const iconHoverVariants = {
    hover: {
      rotate: 360,
      scale: 1.2,
      transition: {
        rotate: {
          duration: 0.8,
          ease: "easeInOut",
        },
      },
    },
  };

  return (
    <section className="relative py-16 bg-gradient-to-br from-teal-600 to-emerald-700 text-white overflow-hidden">
      {/* Animated Background Elements */}
      <motion.div
        className="absolute inset-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      >
        <motion.div
          className="absolute top-0 left-0 w-32 h-32 bg-teal-400/20 rounded-full"
          animate={{
            x: [0, 100, 0],
            y: [0, 50, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute bottom-0 right-0 w-48 h-48 bg-emerald-400/20 rounded-full"
          animate={{
            x: [0, -100, 0],
            y: [0, -50, 0],
            scale: [1, 1.3, 1],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </motion.div>

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto text-center"
        >
          <motion.h2 
            className="text-3xl md:text-4xl font-bold mb-6"
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            Ready to start recycling smarter?
          </motion.h2>
          <motion.p 
            className="text-xl text-teal-100 mb-8"
            whileHover={{ scale: 1.01 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            Join our community of eco-conscious individuals and businesses making a difference through sustainable recycling practices.
          </motion.p>
          
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            {!user ? (
              <>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button 
                    asChild 
                    size="lg" 
                    className="bg-white text-teal-600 hover:bg-teal-50 transition-all duration-300 shadow-lg hover:shadow-xl"
                  >
                    <Link to="/auth?mode=signup" className="flex items-center gap-2">
                      Create Account
                      <motion.div
                        whileHover={{ rotate: 360 }}
                        transition={{ duration: 0.8 }}
                      >
                        <ArrowRight className="h-5 w-5" />
                      </motion.div>
                    </Link>
                  </Button>
                </motion.div>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button 
                    asChild 
                    size="lg" 
                    variant="outline" 
                    className="border-teal-600 text-teal-600 hover:bg-white/20 transition-all duration-300 backdrop-blur-sm"
                  >
                    <Link to="/auth" className="flex items-center gap-2">
                      Sign In
                      <motion.div
                        whileHover={{ rotate: 360 }}
                        transition={{ duration: 0.8 }}
                      >
                        <ArrowRight className="h-5 w-5" />
                      </motion.div>
                    </Link>
                  </Button>
                </motion.div>
              </>
            ) : (
              <>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button 
                    asChild 
                    size="lg" 
                    className="bg-white text-teal-600 hover:bg-teal-50 transition-all duration-300 shadow-lg hover:shadow-xl"
                  >
                    <Link to="/create-listing" className="flex items-center gap-2">
                      Create Listing
                      <motion.div
                        whileHover={{ rotate: 360 }}
                        transition={{ duration: 0.8 }}
                      >
                        <ArrowRight className="h-5 w-5" />
                      </motion.div>
                    </Link>
                  </Button>
                </motion.div>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button 
                    asChild 
                    size="lg" 
                    variant="outline" 
                    className="border-teal-600 text-teal-600 hover:bg-white/20 transition-all duration-300 backdrop-blur-sm"
                  >
                    <Link to="/listings" className="flex items-center gap-2">
                      Browse Materials
                      <motion.div
                        whileHover={{ rotate: 360 }}
                        transition={{ duration: 0.8 }}
                      >
                        <Search className="h-5 w-5" />
                      </motion.div>
                    </Link>
                  </Button>
                </motion.div>
              </>
            )}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default CallToAction;
