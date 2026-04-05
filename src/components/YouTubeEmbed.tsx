import { Youtube } from "lucide-react";

interface YouTubeEmbedProps {
  channelUrl: string;
  artistName: string;
}

/**
 * Extracts the YouTube channel ID or handle from various URL formats
 */
const extractChannelIdentifier = (url: string): { type: "channel" | "handle" | "user"; value: string } | null => {
  try {
    const cleaned = url.trim();
    // Handle: @handle format (no full URL)
    if (cleaned.startsWith("@")) {
      return { type: "handle", value: cleaned };
    }

    const parsed = new URL(cleaned.startsWith("http") ? cleaned : `https://${cleaned}`);

    // /channel/UC... format
    const channelMatch = parsed.pathname.match(/\/channel\/(UC[\w-]+)/);
    if (channelMatch) return { type: "channel", value: channelMatch[1] };

    // /@handle format
    const handleMatch = parsed.pathname.match(/\/@([\w.-]+)/);
    if (handleMatch) return { type: "handle", value: `@${handleMatch[1]}` };

    // /c/customname or /user/username
    const userMatch = parsed.pathname.match(/\/(c|user)\/([\w.-]+)/);
    if (userMatch) return { type: "user", value: userMatch[2] };

    // Just a path like youtube.com/channelname
    const simplePath = parsed.pathname.replace(/^\//, "").split("/")[0];
    if (simplePath) return { type: "handle", value: `@${simplePath}` };
  } catch {
    // If it looks like a channel ID
    if (url.startsWith("UC")) return { type: "channel", value: url };
  }
  return null;
};

const YouTubeEmbed = ({ channelUrl, artistName }: YouTubeEmbedProps) => {
  const identifier = extractChannelIdentifier(channelUrl);

  if (!identifier) {
    return null;
  }

  // Build the channel URL for linking
  let fullChannelUrl = channelUrl;
  if (!channelUrl.startsWith("http")) {
    fullChannelUrl = `https://www.youtube.com/${channelUrl.startsWith("@") ? channelUrl : `@${channelUrl}`}`;
  }

  return (
    <div className="rounded-xl bg-card/50 border border-border p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-heading text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
          <Youtube className="h-4 w-4 text-red-500" /> YouTube
        </h2>
        <a
          href={fullChannelUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-primary hover:underline"
        >
          Visit Channel →
        </a>
      </div>
      <div className="aspect-video rounded-lg overflow-hidden bg-muted">
        {identifier.type === "channel" ? (
          <iframe
            src={`https://www.youtube.com/embed?listType=user_uploads&list=${identifier.value}`}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            title={`${artistName} YouTube Channel`}
            loading="lazy"
          />
        ) : (
          <div className="h-full w-full flex flex-col items-center justify-center gap-3 p-4">
            <Youtube className="h-12 w-12 text-red-500" />
            <p className="text-sm text-muted-foreground text-center">
              Watch {artistName}'s videos on YouTube
            </p>
            <a
              href={fullChannelUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors"
            >
              <Youtube className="h-4 w-4" /> Open YouTube Channel
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

export default YouTubeEmbed;
