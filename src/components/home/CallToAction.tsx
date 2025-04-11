
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const CallToAction = () => {
  const { user } = useAuth();
  
  return (
    <section className="py-16 bg-gradient-to-br from-teal-600 to-emerald-700 text-white">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to start recycling smarter?</h2>
            <p className="text-xl text-teal-100 mb-8">
              Join our community of eco-conscious individuals and businesses making a difference through sustainable recycling practices.
            </p>
            
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              {!user ? (
                <>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button asChild size="lg" className="bg-white text-teal-600 hover:bg-teal-50">
                      <Link to="/auth?mode=signup">Create Account</Link>
                    </Button>
                  </motion.div>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button asChild size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                      <Link to="/auth">Sign In</Link>
                    </Button>
                  </motion.div>
                </>
              ) : (
                <>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button asChild size="lg" className="bg-white text-teal-600 hover:bg-teal-50">
                      <Link to="/create-listing">Create Listing</Link>
                    </Button>
                  </motion.div>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button asChild size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                      <Link to="/listings">Browse Materials</Link>
                    </Button>
                  </motion.div>
                </>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default CallToAction;
