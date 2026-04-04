import Layout from "@/components/Layout";
import SongCard from "@/components/SongCard";
import MiniPlayer from "@/components/MiniPlayer";
import { Search, SlidersHorizontal } from "lucide-react";
import { useSongs } from "@/hooks/use-music-data";
import { Track } from "@/hooks/use-player";
import { useState } from "react";

const demoSongs = [
  { title: "Hallelujah Praise", artist: "Grace Worship", plays: "12.5K" },
  { title: "Juba Rejoice", artist: "Emmanuel Choir", plays: "8.3K" },
  { title: "South Sudan Worship", artist: "Faith Singers", plays: "6.1K" },
  { title: "New Dawn", artist: "Hope Ministry", plays: "4.7K" },
  { title: "Glory to God", artist: "David Lual", plays: "3.9K" },
  { title: "Praise Him", artist: "Sarah Ayen", plays: "2.8K" },
  { title: "Mighty Savior", artist: "Juba Praise", plays: "2.1K" },
  { title: "Rise Up", artist: "Gospel Stars", plays: "1.9K" },
  { title: "Holy Ground", artist: "Worship Team", plays: "1.5K" },
  { title: "Amazing Grace", artist: "Mary Akech", plays: "1.2K" },
  { title: "Blessed Assurance", artist: "Faith Choir", plays: "980" },
  { title: "Redeemed", artist: "Christ Ensemble", plays: "870" },
];

const categories = ["All", "Worship", "Praise", "Afro Gospel", "Traditional", "Contemporary"];

const MusicPage = () => {
  const { data: songs } = useSongs();
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");

  const hasRealSongs = songs && songs.length > 0;

  const realSongCards = hasRealSongs
    ? songs.map((s) => ({
        id: s.id,
        title: s.title,
        artist: (s.artists as any)?.name || "Unknown",
        plays: `${s.play_count || 0}`,
        coverUrl: s.cover_url || "",
        fileUrl: s.file_url,
      }))
    : [];

  const queue: Track[] = realSongCards.map((s) => ({
    id: s.id,
    title: s.title,
    artist: s.artist,
    fileUrl: s.fileUrl,
    coverUrl: s.coverUrl,
  }));

  const displaySongs = hasRealSongs
    ? realSongCards
    : demoSongs.map((s) => ({ ...s, id: undefined as string | undefined, coverUrl: "", fileUrl: "" }));

  const filtered = displaySongs.filter((s) => {
    const matchSearch =
      s.title.toLowerCase().includes(search.toLowerCase()) ||
      s.artist.toLowerCase().includes(search.toLowerCase());
    return matchSearch;
  });

  return (
    <Layout>
      <div className="container py-6">
        <h1 className="font-heading text-2xl md:text-3xl font-bold text-foreground mb-4">
          🎵 Explore Music
        </h1>

        <div className="flex gap-2 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search songs, artists..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-full border border-input bg-card pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <button className="rounded-full border border-input bg-card p-2.5 text-muted-foreground hover:text-foreground transition-colors">
            <SlidersHorizontal className="h-4 w-4" />
          </button>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide mb-4">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                activeCategory === cat
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4">
          {filtered.map((song) => (
            <SongCard
              key={song.id || song.title}
              id={song.id}
              title={song.title}
              artist={song.artist}
              coverUrl={song.coverUrl}
              plays={song.plays}
              fileUrl={song.fileUrl}
              queue={queue}
            />
          ))}
        </div>
      </div>
      <MiniPlayer />
    </Layout>
  );
};

export default MusicPage;
