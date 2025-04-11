import { useState, useEffect } from "react";
import { Outlet, Link } from "react-router-dom";
import { Menu, X, MapPin, LogIn, LogOut, User, Package } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";

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

  return (
    <div className="flex flex-col min-h-screen">
      <header
        className={`sticky top-0 z-50 transition-all duration-200 ${
          scrolled ? "bg-white/90 backdrop-blur-sm shadow-sm" : "bg-white"
        }`}
      >
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-6 w-6 text-teal-600"
              >
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
              <span className="text-xl font-bold text-gray-900">EcoScrap</span>
            </Link>
            
            {/* Desktop Navigation */}
            <nav className="hidden md:flex md:items-center md:gap-6">
              <Link
                to="/"
                className="text-gray-700 hover:text-teal-600 transition-colors"
              >
                Home
              </Link>
              <Link
                to="/create-listing"
                className="text-gray-700 hover:text-teal-600 transition-colors flex items-center gap-1"
              >
                <Package className="w-4 h-4" />
                Create Listing
              </Link>
              <Link
                to="/listings"
                className="text-gray-700 hover:text-teal-600 transition-colors flex items-center gap-1"
              >
                <Package className="w-4 h-4" />
                View Listings
              </Link>
              <Link
                to="/map"
                className="text-gray-700 hover:text-teal-600 transition-colors flex items-center gap-1"
              >
                <MapPin className="w-4 h-4" />
                Map
              </Link>
              {user ? (
                <div className="flex items-center gap-4">
                  <span className="text-gray-700">
                    {user.email}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSignOut}
                    className="flex items-center gap-1"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </Button>
                </div>
              ) : (
                <Link to="/auth">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-1"
                  >
                    <LogIn className="w-4 h-4" />
                    Sign In
                  </Button>
                </Link>
              )}
            </nav>
            
            {/* Mobile Menu Button */}
            <button
              className="md:hidden text-gray-700"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
        
        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 px-4 bg-white border-t">
            <nav className="flex flex-col gap-4">
              <Link
                to="/"
                className="text-gray-700 hover:text-teal-600 transition-colors py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                Home
              </Link>
              <Link
                to="/create-listing"
                className="text-gray-700 hover:text-teal-600 transition-colors py-2 flex items-center gap-2"
                onClick={() => setIsMenuOpen(false)}
              >
                <Package className="w-4 h-4" />
                Create Listing
              </Link>
              <Link
                to="/listings"
                className="text-gray-700 hover:text-teal-600 transition-colors py-2 flex items-center gap-2"
                onClick={() => setIsMenuOpen(false)}
              >
                <Package className="w-4 h-4" />
                View Listings
              </Link>
              <Link
                to="/map"
                className="text-gray-700 hover:text-teal-600 transition-colors py-2 flex items-center gap-2"
                onClick={() => setIsMenuOpen(false)}
              >
                <MapPin className="w-4 h-4" />
                Map
              </Link>
              {user ? (
                <>
                  <div className="text-gray-700 py-2 flex items-center gap-2">
                    <User className="w-4 h-4" />
                    {user.email}
                  </div>
                  <Button
                    variant="outline"
                    onClick={handleSignOut}
                    className="flex items-center justify-center gap-2"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </Button>
                </>
              ) : (
                <Link
                  to="/auth"
                  className="flex items-center justify-center"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Button variant="outline" className="w-full flex items-center justify-center gap-2">
                    <LogIn className="w-4 h-4" />
                    Sign In
                  </Button>
                </Link>
              )}
            </nav>
          </div>
        )}
      </header>
      
      <main className="flex-1 bg-gray-50">
        <Outlet />
      </main>
      
      <footer className="bg-gray-900 text-white py-8">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-4">EcoScrap</h3>
              <p className="text-gray-400">
                Connecting recyclers with waste materials for a cleaner planet.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2">
                <li>
                  <Link to="/" className="text-gray-400 hover:text-white transition-colors">
                    Home
                  </Link>
                </li>
                <li>
                  <Link to="/listings" className="text-gray-400 hover:text-white transition-colors">
                    Scrap Listings
                  </Link>
                </li>
                <li>
                  <Link to="/map" className="text-gray-400 hover:text-white transition-colors">
                    Pickup Map
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
          <div className="border-t border-gray-800 mt-8 pt-4 text-center text-gray-500">
            <p>© {new Date().getFullYear()} EcoScrap. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
