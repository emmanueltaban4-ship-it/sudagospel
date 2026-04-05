import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
import { PlayerProvider } from "@/hooks/use-player";
import Index from "./pages/Index.tsx";
import MusicPage from "./pages/MusicPage.tsx";
import ArtistsPage from "./pages/ArtistsPage.tsx";
import NewsPage from "./pages/NewsPage.tsx";
import ProfilePage from "./pages/ProfilePage.tsx";
import AuthPage from "./pages/AuthPage.tsx";
import UploadPage from "./pages/UploadPage.tsx";
import AdminPage from "./pages/AdminPage.tsx";
import SongDetailPage from "./pages/SongDetailPage.tsx";
import ArtistDetailPage from "./pages/ArtistDetailPage.tsx";
import PlaylistsPage from "./pages/PlaylistsPage.tsx";
import PlaylistDetailPage from "./pages/PlaylistDetailPage.tsx";
import ArticleDetailPage from "./pages/ArticleDetailPage.tsx";
import ResetPasswordPage from "./pages/ResetPasswordPage.tsx";
import SubscriptionPage from "./pages/SubscriptionPage.tsx";
import ArtistDashboardPage from "./pages/ArtistDashboardPage.tsx";
import PrivacyPolicyPage from "./pages/PrivacyPolicyPage.tsx";
import TermsOfServicePage from "./pages/TermsOfServicePage.tsx";
import VideosPage from "./pages/VideosPage.tsx";
import NotFound from "./pages/NotFound.tsx";
import HallOfFamePage from "./pages/HallOfFamePage.tsx";
import MostListenedPage from "./pages/MostListenedPage.tsx";
import NewSongsPage from "./pages/NewSongsPage.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <TooltipProvider>
        <AuthProvider>
          <PlayerProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/music" element={<MusicPage />} />
              <Route path="/artists" element={<ArtistsPage />} />
              <Route path="/news" element={<NewsPage />} />
              <Route path="/blog" element={<NewsPage />} />
              <Route path="/news/:slug" element={<ArticleDetailPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/auth" element={<AuthPage />} />
            <Route path="/upload" element={<UploadPage />} />
            <Route path="/admin" element={<AdminPage />} />
              <Route path="/song/:id" element={<SongDetailPage />} />
              <Route path="/artist/:slug" element={<ArtistDetailPage />} />
              <Route path="/playlists" element={<PlaylistsPage />} />
              <Route path="/playlist/:id" element={<PlaylistDetailPage />} />
              <Route path="/subscription" element={<SubscriptionPage />} />
              <Route path="/artist-dashboard" element={<ArtistDashboardPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
              <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
              <Route path="/terms-of-service" element={<TermsOfServicePage />} />
              <Route path="/videos" element={<VideosPage />} />
              <Route path="/hall-of-fame" element={<HallOfFamePage />} />
              <Route path="/most-listened" element={<MostListenedPage />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
          </PlayerProvider>
        </AuthProvider>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
