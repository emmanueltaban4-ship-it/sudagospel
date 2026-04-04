import Layout from "@/components/Layout";
import SongCard from "@/components/SongCard";
import MiniPlayer from "@/components/MiniPlayer";
import { Search, SlidersHorizontal } from "lucide-react";

const allSongs = [
  { title: "Hallelujah Praise", artist: "Grace Worship", coverUrl: "", plays: "12.5K" },
  { title: "Juba Rejoice", artist: "Emmanuel Choir", coverUrl: "", plays: "8.3K" },
  { title: "South Sudan Worship", artist: "Faith Singers", coverUrl: "", plays: "6.1K" },
  { title: "New Dawn", artist: "Hope Ministry", coverUrl: "", plays: "4.7K" },
  { title: "Glory to God", artist: "David Lual", coverUrl: "", plays: "3.9K" },
  { title: "Praise Him", artist: "Sarah Ayen", coverUrl: "", plays: "2.8K" },
  { title: "Mighty Savior", artist: "Juba Praise", coverUrl: "", plays: "2.1K" },
  { title: "Rise Up", artist: "Gospel Stars", coverUrl: "", plays: "1.9K" },
  { title: "Holy Ground", artist: "Worship Team", coverUrl: "", plays: "1.5K" },
  { title: "Amazing Grace", artist: "Mary Akech", coverUrl: "", plays: "1.2K" },
  { title: "Blessed Assurance", artist: "Faith Choir", coverUrl: "", plays: "980" },
  { title: "Redeemed", artist: "Christ Ensemble", coverUrl: "", plays: "870" },
];

const categories = ["All", "Worship", "Praise", "Afro Gospel", "Traditional", "Contemporary"];

const MusicPage = () => {
  return (
    <Layout>
      <div className="container py-6">
        <h1 className="font-heading text-2xl md:text-3xl font-bold text-foreground mb-4">
          🎵 Explore Music
        </h1>

        {/* Search */}
        <div className="flex gap-2 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search songs, artists..."
              className="w-full rounded-full border border-input bg-card pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <button className="rounded-full border border-input bg-card p-2.5 text-muted-foreground hover:text-foreground transition-colors">
            <SlidersHorizontal className="h-4 w-4" />
          </button>
        </div>

        {/* Categories */}
        <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide mb-4">
          {categories.map((cat, i) => (
            <button
              key={cat}
              className={`whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                i === 0
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Songs Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4">
          {allSongs.map((song) => (
            <SongCard key={song.title} {...song} />
          ))}
        </div>
      </div>
      <MiniPlayer />
    </Layout>
  );
};

export default MusicPage;
