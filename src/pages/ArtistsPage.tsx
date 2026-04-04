import Layout from "@/components/Layout";
import ArtistCard from "@/components/ArtistCard";
import { Search } from "lucide-react";
import { useArtists } from "@/hooks/use-music-data";
import { useState } from "react";

const demoArtists = [
  { name: "Grace Worship", genre: "Contemporary", songs: 24 },
  { name: "Emmanuel Choir", genre: "Traditional", songs: 18 },
  { name: "David Lual", genre: "Afro Gospel", songs: 12 },
  { name: "Sarah Ayen", genre: "Worship", songs: 15 },
  { name: "Hope Ministry", genre: "Praise", songs: 9 },
  { name: "Juba Praise", genre: "Praise", songs: 7 },
  { name: "Gospel Stars", genre: "Contemporary", songs: 11 },
  { name: "Mary Akech", genre: "Worship", songs: 6 },
  { name: "Faith Choir", genre: "Traditional", songs: 14 },
  { name: "Christ Ensemble", genre: "Afro Gospel", songs: 8 },
  { name: "Worship Team", genre: "Worship", songs: 20 },
  { name: "Paul Deng", genre: "Praise", songs: 5 },
];

const ArtistsPage = () => {
  const { data: artists } = useArtists();
  const [search, setSearch] = useState("");

  const displayArtists = artists && artists.length > 0
    ? artists.map((a) => ({
        name: a.name,
        genre: a.genre || "Gospel",
        songs: (a.songs as any)?.[0]?.count || 0,
      }))
    : demoArtists;

  const filtered = displayArtists.filter((a) =>
    a.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Layout>
      <div className="container py-6">
        <h1 className="font-heading text-2xl md:text-3xl font-bold text-foreground mb-4">
          ⭐ Artists
        </h1>
        <div className="relative mb-6 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search artists..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-full border border-input bg-card pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-6">
          {filtered.map((artist) => (
            <ArtistCard key={artist.name} {...artist} />
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default ArtistsPage;
