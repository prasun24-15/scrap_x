import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Map from "./pages/Map";
import Listings from "./pages/Listings";
import CreateListing from "./pages/CreateListing";
import PickupRequest from "./pages/PickupRequest";
import MyListings from "./pages/MyListings";
import DonateListing from "./pages/DonateListing";
import MyNegotiations from "./pages/MyNegotiations";
import NotFound from "./pages/NotFound";
import Layout from "./components/Layout";
import { AuthProvider } from "./contexts/AuthContext";
import { Suspense } from "react";
import EditListing from "@/pages/EditListing";

const App = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 5, // 5 minutes
      },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <BrowserRouter>
          <AuthProvider>
            <Suspense fallback={<div className="flex items-center justify-center h-screen">Loading...</div>}>
              <Routes>
                <Route path="/" element={<Layout />}>
                  <Route index element={<Index />} />
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/map" element={<Map />} />
                  <Route path="/listings" element={<Listings />} />
                  <Route path="/create-listing" element={<CreateListing />} />
                  <Route path="/pickup/:id" element={<PickupRequest />} />
                  <Route path="/my-listings" element={<MyListings />} />
                  <Route path="/edit-listing/:id" element={<EditListing />} />
                  <Route path="/donate" element={<DonateListing />} />
                  <Route path="/my-negotiations" element={<MyNegotiations />} />
                  {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                  <Route path="*" element={<NotFound />} />
                </Route>
              </Routes>
            </Suspense>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
      <Toaster />
      <Sonner />
    </QueryClientProvider>
  );
};

export default App;
