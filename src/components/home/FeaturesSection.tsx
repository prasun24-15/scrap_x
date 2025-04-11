import { motion } from "framer-motion";
import {
  Recycle,
  DollarSign,
  Trees,
  Truck,
  UserCheck,
  ShieldCheck,
} from "lucide-react";

const features = [
  {
    icon: <Recycle className="h-8 w-8" />,
    title: "Easy Recycling",
    description: "List your recyclable materials with just a few clicks and connect with buyers.",
  },
  {
    icon: <DollarSign className="h-8 w-8" />,
    title: "Competitive Pricing",
    description: "Get the best value for your materials with our transparent marketplace.",
  },
  {
    icon: <Trees className="h-8 w-8" />,
    title: "Eco Rewards",
    description: "Earn points and rewards for your positive environmental impact.",
  },
  {
    icon: <Truck className="h-8 w-8" />,
    title: "Local Pickup",
    description: "Connect with nearby recyclers for efficient collection and delivery.",
  },
  {
    icon: <UserCheck className="h-8 w-8" />,
    title: "Verified Users",
    description: "Our community of vetted buyers and sellers ensures trustworthy transactions.",
  },
  {
    icon: <ShieldCheck className="h-8 w-8" />,
    title: "Secure Transactions",
    description: "All payments and transactions are protected by our secure platform.",
  },
];

const FeaturesSection = () => {
  const cardVariants = {
    initial: { 
      scale: 1,
      y: 0,
      boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)"
    },
    hover: {
      scale: 1.1,
      y: -10,
      boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 10,
        mass: 1
      }
    }
  };

  const iconVariants = {
    initial: { 
      scale: 1,
      rotate: 0
    },
    hover: {
      scale: 1.3,
      rotate: [0, 10, -10, 10, -10, 0],
      transition: {
        rotate: {
          duration: 0.8,
          repeat: 0,
          ease: "easeInOut"
        },
        scale: {
          type: "spring",
          stiffness: 500,
          damping: 10
        }
      }
    }
  };

  return (
    <section className="py-24 bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-20"
        >
          <h2 className="text-5xl font-extrabold text-emerald-900">Why Choose <span className="text-emerald-600">ScrapCycle?</span></h2>
          <p className="mt-4 text-lg text-emerald-800 max-w-2xl mx-auto">
            Redefining recycling with tech-powered simplicity, sustainability, and rewards.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-12">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              variants={cardVariants}
              whileHover="hover"
              className="bg-white/80 backdrop-blur-sm p-10 rounded-3xl border border-emerald-100 cursor-pointer"
            >
              <motion.div 
                className="w-16 h-16 mb-6 flex items-center justify-center bg-gradient-to-br from-emerald-400 to-green-500 text-white rounded-full shadow-md shadow-emerald-200"
                variants={iconVariants}
              >
                {feature.icon}
              </motion.div>
              <h3 className="text-2xl font-semibold text-emerald-900 mb-2">{feature.title}</h3>
              <p className="text-emerald-800 text-md">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
