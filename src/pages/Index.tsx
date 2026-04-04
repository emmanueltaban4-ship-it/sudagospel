import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import Layout from "@/components/Layout";
import HeroSection from "@/components/HeroSection";
import SongCard from "@/components/SongCard";
import ArtistCard from "@/components/ArtistCard";
import NewsCard from "@/components/NewsCard";
import MiniPlayer from "@/components/MiniPlayer";

const featuredSongs = [
  { title: "Hallelujah Praise", artist: "Grace Worship", coverUrl: "", plays: "12.5K" },
  { title: "Juba Rejoice", artist: "Emmanuel Choir", coverUrl: "", plays: "8.3K" },
  { title: "South Sudan Worship", artist: "Faith Singers", coverUrl: "", plays: "6.1K" },
  { title: "New Dawn", artist: "Hope Ministry", coverUrl: "", plays: "4.7K" },
  { title: "Glory to God", artist: "David Lual", coverUrl: "", plays: "3.9K" },
  { title: "Praise Him", artist: "Sarah Ayen", coverUrl: "", plays: "2.8K" },
];

const topArtists = [
  { name: "Grace Worship", genre: "Contemporary", songs: 24 },
  { name: "Emmanuel Choir", genre: "Traditional", songs: 18 },
  { name: "David Lual", genre: "Afro Gospel", songs: 12 },
  { name: "Sarah Ayen", genre: "Worship", songs: 15 },
  { name: "Hope Ministry", genre: "Praise", songs: 9 },
];

const latestNews = [
  {
    title: "National Gospel Music Festival Coming to Juba This December",
    excerpt: "The biggest gospel music event in South Sudan returns with performances from top artists across the country.",
    date: "Mar 28, 2026",
    category: "Events",
  },
  {
    title: "New Worship Album Released by Grace Worship Band",
    excerpt: "The acclaimed worship group drops their third studio album featuring 12 powerful tracks.",
    date: "Mar 25, 2026",
    category: "Music",
  },
  {
    title: "How Gospel Music Is Uniting South Sudan's Youth",
    excerpt: "A deep dive into the role of gospel music in bringing together young people across different communities.",
    date: "Mar 22, 2026",
    category: "Inspiration",
  },
];

const Index = () => {
  return (
    <Layout>
      <HeroSection />

      {/* Featured Songs */}
      <section className="container py-8">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-heading text-xl md:text-2xl font-bold text-foreground">
            🔥 Trending Now
          </h2>
          <Link
            to="/music"
            className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:gap-2 transition-all"
          >
            View All <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4">
          {featuredSongs.map((song) => (
            <SongCard key={song.title} {...song} />
          ))}
        </div>
      </section>

      {/* Top Artists */}
      <section className="container py-8">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-heading text-xl md:text-2xl font-bold text-foreground">
            ⭐ Top Artists
          </h2>
          <Link
            to="/artists"
            className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:gap-2 transition-all"
          >
            View All <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="flex gap-6 overflow-x-auto pb-2 scrollbar-hide">
          {topArtists.map((artist) => (
            <ArtistCard key={artist.name} {...artist} />
          ))}
        </div>
      </section>

      {/* Latest News */}
      <section className="container py-8">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-heading text-xl md:text-2xl font-bold text-foreground">
            📰 Gospel News
          </h2>
          <Link
            to="/news"
            className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:gap-2 transition-all"
          >
            View All <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {latestNews.map((news) => (
            <NewsCard key={news.title} {...news} />
          ))}
        </div>
      </section>

      {/* Inspirational Quote */}
      <section className="container py-8">
        <div className="rounded-2xl bg-gradient-brand p-8 md:p-12 text-center">
          <p className="font-heading text-lg md:text-2xl font-bold text-primary-foreground italic max-w-2xl mx-auto">
            "Make a joyful noise unto the Lord, all the earth: make a loud noise, and rejoice, and sing praise."
          </p>
          <p className="mt-3 text-primary-foreground/80 text-sm font-medium">— Psalm 98:4</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card py-8">
        <div className="container text-center">
          <p className="font-heading font-bold text-gradient-brand text-lg mb-2">Sudagospel</p>
          <p className="text-sm text-muted-foreground">
            South Sudan's premier gospel music platform.
          </p>
          <p className="text-xs text-muted-foreground mt-4">
            © 2026 Sudagospel.net. All rights reserved.
          </p>
        </div>
      </footer>

      <MiniPlayer />
    </Layout>
  );
};

export default Index;
