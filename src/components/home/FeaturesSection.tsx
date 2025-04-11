import { motion } from "framer-motion";
import { 
  Recycle, 
  IndianRupee,
  Trees, // Changed from Tree to Trees
  Truck, 
  UserCheck, 
  ShieldCheck 
} from "lucide-react";

const features = [
  {
    icon: <Recycle className="h-8 w-8" />,
    title: "Easy Recycling",
    description: "List your recyclable materials with just a few clicks and connect with buyers."
  },
  {
    icon: <IndianRupee className="h-8 w-8" />,
    title: "Competitive Pricing",
    description: "Get the best value for your materials with our transparent marketplace."
  },
  {
    icon: <Trees className="h-8 w-8" />, // Updated icon name
    title: "Eco Rewards",
    description: "Earn points and rewards for your positive environmental impact."
  },
  {
    icon: <Truck className="h-8 w-8" />,
    title: "Local Pickup",
    description: "Connect with nearby recyclers for efficient collection and delivery."
  },
  {
    icon: <UserCheck className="h-8 w-8" />,
    title: "Verified Users",
    description: "Our community of vetted buyers and sellers ensures trustworthy transactions."
  },
  {
    icon: <ShieldCheck className="h-8 w-8" />,
    title: "Secure Transactions",
    description: "All payments and transactions are protected by our secure platform."
  }
];

const FeaturesSection = () => {
  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl font-bold text-gray-800">Why Choose ScrapCycle?</h2>
          <div className="mt-4 h-1 w-20 bg-teal-500 mx-auto"></div>
          <p className="mt-6 text-lg text-gray-600 max-w-2xl mx-auto">
            Our platform makes recycling easy, profitable, and rewarding for everyone involved.
          </p>
        </motion.div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="bg-white p-8 rounded-lg shadow-md hover:shadow-lg transition-shadow"
            >
              <div className="bg-teal-100 w-16 h-16 rounded-full flex items-center justify-center text-teal-600 mb-6">
                {feature.icon}
              </div>
              <h3 className="text-xl font-semibold mb-3 text-gray-800">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
