import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Music, Download, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";

const slides = [
  {
    icon: Music,
    title: "Discover Gospel Music",
    description: "Explore South Sudan's finest gospel music. Stream worship, praise, choir and sermons from talented artists.",
    gradient: "from-primary/20 to-primary/5",
  },
  {
    icon: Download,
    title: "Stream & Download",
    description: "Listen online or download songs for offline playback. Enjoy music anytime, even with low internet.",
    gradient: "from-secondary/20 to-secondary/5",
  },
  {
    icon: Heart,
    title: "Support Gospel Artists",
    description: "Follow your favorite artists, create playlists, and help spread the gospel through music.",
    gradient: "from-primary/15 to-secondary/10",
  },
];

interface OnboardingPageProps {
  onComplete?: () => void;
}

const OnboardingPage = ({ onComplete }: OnboardingPageProps) => {
  const [current, setCurrent] = useState(0);
  const navigate = useNavigate();

  const finish = () => {
    localStorage.setItem("sudagospel_onboarded", "true");
    onComplete?.();
    navigate("/", { replace: true });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Skip */}
      <div className="flex justify-end p-4">
        <button onClick={finish} className="text-sm text-muted-foreground hover:text-foreground transition-colors font-medium">
          Skip
        </button>
      </div>

      {/* Slide content */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
        <div className={`w-32 h-32 rounded-full bg-gradient-to-br ${slides[current].gradient} flex items-center justify-center mb-8`}>
          {(() => {
            const Icon = slides[current].icon;
            return <Icon className="h-14 w-14 text-primary" />;
          })()}
        </div>
        <h2 className="font-heading text-2xl font-extrabold text-foreground mb-3">
          {slides[current].title}
        </h2>
        <p className="text-muted-foreground text-sm leading-relaxed max-w-sm">
          {slides[current].description}
        </p>
      </div>

      {/* Dots */}
      <div className="flex justify-center gap-2 mb-6">
        {slides.map((_, i) => (
          <div
            key={i}
            className={`h-2 rounded-full transition-all duration-300 ${
              i === current ? "w-8 bg-primary" : "w-2 bg-muted-foreground/30"
            }`}
          />
        ))}
      </div>

      {/* Navigation */}
      <div className="flex gap-3 px-6 pb-8 safe-area-bottom">
        {current > 0 && (
          <Button variant="outline" className="flex-1" onClick={() => setCurrent(current - 1)}>
            Back
          </Button>
        )}
        {current < slides.length - 1 ? (
          <Button className="flex-1" onClick={() => setCurrent(current + 1)}>
            Next
          </Button>
        ) : (
          <Button className="flex-1 bg-gradient-brand text-white border-0" onClick={finish}>
            Get Started
          </Button>
        )}
      </div>
    </div>
  );
};

export default OnboardingPage;
