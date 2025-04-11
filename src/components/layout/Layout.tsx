import { useState, useEffect } from "react";
import { Outlet, Link } from "react-router-dom";
import { Menu, X, MapPin, LogIn, LogOut, User, Package, Heart, List, HandCoins, Leaf, ChevronDown, Home } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Layout = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user, signOut } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      const offset = window.scrollY;
      setScrolled(offset > 20);
    };

    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut();
      setIsMenuOpen(false);
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const navItemVariants = {
    hidden: { opacity: 0, y: -10 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.3,
      }
    },
    hover: {
      y: -2,
      transition: {
        duration: 0.2
      }
    }
  };

  const mobileMenuVariants = {
    hidden: { opacity: 0, x: "100%" },
    visible: { 
      opacity: 1, 
      x: 0,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30
      }
    },
    exit: {
      opacity: 0,
      x: "100%",
      transition: {
        duration: 0.2
      }
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <header
        className={`sticky top-0 z-50 transition-all duration-300 bg-gradient-to-r from-emerald-50/80 via-teal-50/80 to-emerald-50/80 backdrop-blur-sm border-b border-emerald-100/20 ${
          scrolled ? "shadow-md" : ""
        }`}
      >
        <div className="container mx-auto px-4 py-4">
          <nav className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2 group">
              <motion.div
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.5 }}
                className="h-10 w-10 rounded-full overflow-hidden"
              >
                <img 
                  src="/features_img/logo.png" 
                  alt="EcoScrap Logo" 
                  className="w-full h-full object-cover"
                />
              </motion.div>
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 to-teal-600">
                ScrapX
              </span>
            </Link>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex md:items-center md:gap-8">
              <motion.div className="flex items-center gap-6">
                <motion.div
                  variants={navItemVariants}
                  initial="hidden"
                  animate="visible"
                  whileHover="hover"
                >
                  <Link
                    to="/"
                    className="text-emerald-900 hover:text-emerald-600 transition-colors font-medium flex items-center gap-1"
                  >
                    <Home className="w-4 h-4" />
                    Home
                  </Link>
                </motion.div>
                
                <motion.div
                  variants={navItemVariants}
                  initial="hidden"
                  animate="visible"
                  whileHover="hover"
                >
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="text-emerald-900 hover:text-emerald-600 transition-colors font-medium flex items-center gap-1">
                        <Package className="w-4 h-4" />
                        Listings
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="bg-white/90 backdrop-blur-sm border border-emerald-100">
                      <DropdownMenuItem asChild>
                        <Link to="/create-listing" className="flex items-center gap-2 text-emerald-900 hover:text-emerald-600">
                          <Package className="w-4 h-4" />
                          Sell Scrap
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to="/donate" className="flex items-center gap-2 text-emerald-900 hover:text-emerald-600">
                          <Heart className="w-4 h-4" />
                          Donate Items
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to="/listings" className="flex items-center gap-2 text-emerald-900 hover:text-emerald-600">
                          <List className="w-4 h-4" />
                          View All Listings
                        </Link>
                      </DropdownMenuItem>
                      {user && (
                        <>
                          <DropdownMenuSeparator className="bg-emerald-100/50" />
                          <DropdownMenuItem asChild>
                            <Link to="/my-listings" className="flex items-center gap-2 text-emerald-900 hover:text-emerald-600">
                              <User className="w-4 h-4" />
                              My Listings
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link to="/my-negotiations" className="flex items-center gap-2 text-emerald-900 hover:text-emerald-600">
                              <HandCoins className="w-4 h-4" />
                              My Negotiations
                            </Link>
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </motion.div>
                
                <motion.div
                  variants={navItemVariants}
                  initial="hidden"
                  animate="visible"
                  whileHover="hover"
                >
                  <Link
                    to="/map"
                    className="text-emerald-900 hover:text-emerald-600 transition-colors font-medium flex items-center gap-1"
                  >
                    <MapPin className="w-4 h-4" />
                    Map
                  </Link>
                </motion.div>
              </motion.div>

              {user ? (
                <div className="flex items-center gap-4 border-l pl-4 border-emerald-200/30">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="flex items-center gap-2 hover:bg-emerald-100/50 p-1.5 rounded-full transition-colors">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500/90 to-teal-500/90 flex items-center justify-center">
                          <User className="w-4 h-4 text-white" />
                        </div>
                        <ChevronDown className="w-4 h-4 text-emerald-700" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-white/90 backdrop-blur-sm border border-emerald-100 w-60">
                      <DropdownMenuLabel className="font-normal">
                        <div className="flex flex-col">
                          <span className="font-medium text-emerald-900">Profile</span>
                          <span className="text-sm text-emerald-700 truncate">{user.email}</span>
                        </div>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator className="bg-emerald-100/50" />
                      <DropdownMenuItem onClick={handleSignOut} className="text-emerald-900 cursor-pointer">
                        <LogOut className="w-4 h-4 mr-2 text-emerald-700" />
                        Sign Out
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ) : (
                <Link to="/auth">
                  <Button
                    size="sm"
                    className="bg-gradient-to-r from-emerald-600/90 to-teal-600/90 hover:from-emerald-700/90 hover:to-teal-700/90 text-white shadow-md hover:shadow-lg transition-all duration-300"
                  >
                    <LogIn className="w-4 h-4 mr-1" />
                    Sign In
                  </Button>
                </Link>
              )}
            </div>
            
            {/* Mobile Menu Button */}
            <motion.button
              className="md:hidden text-emerald-900 p-2 hover:bg-emerald-100/50 rounded-lg"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </motion.button>
          </nav>
        </div>
        
        {/* Mobile Navigation */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              className="md:hidden fixed inset-0 z-50 bg-white"
              variants={mobileMenuVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <div className="flex flex-col h-full">
                <div className="p-4 border-b">
                  <div className="flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-2" onClick={() => setIsMenuOpen(false)}>
                      <div className="h-10 w-10 rounded-full overflow-hidden">
                        <img 
                          src="/features_img/logo.png" 
                          alt="EcoScrap Logo" 
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 to-teal-600">
                        EcoScrap
                      </span>
                    </Link>
                    <button
                      className="p-2 hover:bg-gray-100 rounded-lg"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <X className="h-6 w-6 text-gray-700" />
                    </button>
                  </div>
                </div>

                <nav className="flex-1 overflow-y-auto p-4">
                  <div className="flex flex-col gap-4">
                    <Link
                      to="/"
                      className="text-gray-700 hover:text-emerald-600 transition-colors py-2 text-lg font-medium flex items-center gap-2"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <Home className="w-5 h-5" />
                      Home
                    </Link>
                    
                    <div className="border-t border-gray-100 pt-2">
                      <p className="text-sm text-gray-500 mb-2 font-medium">Listings</p>
                      <Link
                        to="/create-listing"
                        className="text-gray-700 hover:text-emerald-600 transition-colors py-2 text-lg font-medium flex items-center gap-2 pl-2"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <Package className="w-5 h-5" />
                        Sell Scrap
                      </Link>
                      <Link
                        to="/donate"
                        className="text-gray-700 hover:text-emerald-600 transition-colors py-2 text-lg font-medium flex items-center gap-2 pl-2"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <Heart className="w-5 h-5" />
                        Donate Items
                      </Link>
                      <Link
                        to="/listings"
                        className="text-gray-700 hover:text-emerald-600 transition-colors py-2 text-lg font-medium flex items-center gap-2 pl-2"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <List className="w-5 h-5" />
                        View All Listings
                      </Link>
                      {user && (
                        <>
                          <Link
                            to="/my-listings"
                            className="text-gray-700 hover:text-emerald-600 transition-colors py-2 text-lg font-medium flex items-center gap-2 pl-2"
                            onClick={() => setIsMenuOpen(false)}
                          >
                            <User className="w-5 h-5" />
                            My Listings
                          </Link>
                          <Link
                            to="/my-negotiations"
                            className="text-gray-700 hover:text-emerald-600 transition-colors py-2 text-lg font-medium flex items-center gap-2 pl-2"
                            onClick={() => setIsMenuOpen(false)}
                          >
                            <HandCoins className="w-5 h-5" />
                            My Negotiations
                          </Link>
                        </>
                      )}
                    </div>
                    
                    <Link
                      to="/map"
                      className="text-gray-700 hover:text-emerald-600 transition-colors py-2 text-lg font-medium flex items-center gap-2"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <MapPin className="w-5 h-5" />
                      Map
                    </Link>
                  </div>
                </nav>

                <div className="p-4 border-t">
                  {user ? (
                    <div className="flex flex-col gap-4">
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
                          <User className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex flex-col">
                          <span className="font-medium text-emerald-900">Profile</span>
                          <span className="text-sm text-emerald-700 truncate">{user.email}</span>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        onClick={handleSignOut}
                        className="w-full flex items-center justify-center gap-2 border-2 border-emerald-600/20 hover:bg-emerald-50 text-emerald-700"
                      >
                        <LogOut className="w-5 h-5" />
                        Sign Out
                      </Button>
                    </div>
                  ) : (
                    <Link
                      to="/auth"
                      className="w-full"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <Button
                        className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-md hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-2"
                      >
                        <LogIn className="w-5 h-5" />
                        Sign In
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>
      
      <main className="flex-1 bg-gray-50">
        <Outlet />
      </main>
      
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 rounded-full bg-gradient-to-br from-emerald-500/20 to-teal-500/20">
                  <Leaf className="h-6 w-6 text-emerald-400" />
                </div>
                <span className="text-xl font-bold text-white">EcoScrap</span>
              </div>
              <p className="text-gray-400 leading-relaxed">
                Connecting recyclers with waste materials for a cleaner planet.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2">
                <li>
                  <Link to="/" className="text-gray-400 hover:text-emerald-400 transition-colors">
                    Home
                  </Link>
                </li>
                <li>
                  <Link to="/listings" className="text-gray-400 hover:text-emerald-400 transition-colors">
                    Scrap Listings
                  </Link>
                </li>
                <li>
                  <Link to="/map" className="text-gray-400 hover:text-emerald-400 transition-colors">
                    Pickup Map
                  </Link>
                </li>
                <li>
                  <Link to="/donate" className="text-gray-400 hover:text-emerald-400 transition-colors">
                    Donate Items
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Contact</h3>
              <p className="text-gray-400">info@ecoscrap.example</p>
              <p className="text-gray-400">+1 (555) 123-4567</p>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-500">
            <p>© {new Date().getFullYear()} EcoScrap. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout; 