import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
import { PlayerProvider } from "@/hooks/use-player";
import { lazy, Suspense, useState, useCallback, useEffect } from "react";
import SplashScreen from "@/components/SplashScreen";

// Lazy loaded pages
const Index = lazy(() => import("./pages/Index.tsx"));
const MusicPage = lazy(() => import("./pages/MusicPage.tsx"));
const ArtistsPage = lazy(() => import("./pages/ArtistsPage.tsx"));
const NewsPage = lazy(() => import("./pages/NewsPage.tsx"));
const ProfilePage = lazy(() => import("./pages/ProfilePage.tsx"));
const AuthPage = lazy(() => import("./pages/AuthPage.tsx"));
const UploadPage = lazy(() => import("./pages/UploadPage.tsx"));
const AdminPage = lazy(() => import("./pages/AdminPage.tsx"));
const SongDetailPage = lazy(() => import("./pages/SongDetailPage.tsx"));
const ArtistDetailPage = lazy(() => import("./pages/ArtistDetailPage.tsx"));
const PlaylistsPage = lazy(() => import("./pages/PlaylistsPage.tsx"));
const PlaylistDetailPage = lazy(() => import("./pages/PlaylistDetailPage.tsx"));
const ArticleDetailPage = lazy(() => import("./pages/ArticleDetailPage.tsx"));
const ResetPasswordPage = lazy(() => import("./pages/ResetPasswordPage.tsx"));
const SubscriptionPage = lazy(() => import("./pages/SubscriptionPage.tsx"));
const ArtistDashboardPage = lazy(() => import("./pages/ArtistDashboardPage.tsx"));
const PrivacyPolicyPage = lazy(() => import("./pages/PrivacyPolicyPage.tsx"));
const TermsOfServicePage = lazy(() => import("./pages/TermsOfServicePage.tsx"));
const VideosPage = lazy(() => import("./pages/VideosPage.tsx"));
const HallOfFamePage = lazy(() => import("./pages/HallOfFamePage.tsx"));
const MostListenedPage = lazy(() => import("./pages/MostListenedPage.tsx"));
const NewSongsPage = lazy(() => import("./pages/NewSongsPage.tsx"));
const OnboardingPage = lazy(() => import("./pages/OnboardingPage.tsx"));
const AlbumDetailPage = lazy(() => import("./pages/AlbumDetailPage.tsx"));
const DownloadsPage = lazy(() => import("./pages/DownloadsPage.tsx"));
const LibraryPage = lazy(() => import("./pages/LibraryPage.tsx"));
const NotFound = lazy(() => import("./pages/NotFound.tsx"));

const queryClient = new QueryClient();

const PageLoader = () => (
  <div className="flex items-center justify-center h-screen bg-background">
    <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
);

const App = () => {
  const [showSplash, setShowSplash] = useState(() => {
    return !localStorage.getItem("sudagospel_visited");
  });
  const [needsOnboarding, setNeedsOnboarding] = useState(() => {
    return !localStorage.getItem("sudagospel_onboarded");
  });

  const handleSplashComplete = useCallback(() => {
    localStorage.setItem("sudagospel_visited", "true");
    setShowSplash(false);
  }, []);

  const handleOnboardingComplete = useCallback(() => {
    setNeedsOnboarding(false);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
        <TooltipProvider>
          <AuthProvider>
            <PlayerProvider>
              <Toaster />
              <Sonner />
              {showSplash && <SplashScreen onComplete={handleSplashComplete} />}
              <BrowserRouter>
                <Suspense fallback={<PageLoader />}>
                  <Routes>
                    {needsOnboarding && !showSplash && (
                      <Route path="/" element={<OnboardingPage onComplete={handleOnboardingComplete} />} />
                    )}
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
                    <Route path="/new-songs" element={<NewSongsPage />} />
                    <Route path="/onboarding" element={<OnboardingPage />} />
                    <Route path="/album/:id" element={<AlbumDetailPage />} />
                    <Route path="/downloads" element={<DownloadsPage />} />
                    <Route path="/library" element={<LibraryPage />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </Suspense>
              </BrowserRouter>
            </PlayerProvider>
          </AuthProvider>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
