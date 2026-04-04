import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
import Index from "./pages/Index.tsx";
import MusicPage from "./pages/MusicPage.tsx";
import ArtistsPage from "./pages/ArtistsPage.tsx";
import NewsPage from "./pages/NewsPage.tsx";
import ProfilePage from "./pages/ProfilePage.tsx";
import AuthPage from "./pages/AuthPage.tsx";
import UploadPage from "./pages/UploadPage.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/music" element={<MusicPage />} />
            <Route path="/artists" element={<ArtistsPage />} />
            <Route path="/news" element={<NewsPage />} />
            <Route path="/blog" element={<NewsPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/upload" element={<UploadPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
