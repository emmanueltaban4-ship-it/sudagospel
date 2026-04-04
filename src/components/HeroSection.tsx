import { Play, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import heroBanner from "@/assets/hero-banner.jpg";

const HeroSection = () => {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0">
        <img
          src={heroBanner}
          alt="Gospel worship"
          className="h-full w-full object-cover"
          width={1920}
          height={1080}
        />
        <div className="absolute inset-0 bg-gradient-hero" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
      </div>

      <div className="container relative z-10 flex min-h-[60vh] flex-col items-center justify-center text-center py-16">
        <span className="mb-4 inline-block rounded-full bg-primary/20 px-4 py-1.5 text-xs font-semibold text-primary-foreground backdrop-blur-sm border border-primary/30">
          🎵 South Sudan's #1 Gospel Platform
        </span>
        <h1 className="font-heading text-4xl md:text-6xl font-extrabold text-primary-foreground mb-4 leading-tight max-w-3xl animate-slide-up">
          Worship. Praise. <br />
          <span className="text-gradient-brand">Inspire.</span>
        </h1>
        <p className="max-w-xl text-primary-foreground/80 mb-8 text-base md:text-lg">
          Discover, stream, and download the best gospel music from South Sudan.
          Connect with artists and grow in faith.
        </p>
        <div className="flex flex-wrap gap-3 justify-center">
          <Button size="lg" className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-full px-8 animate-pulse-glow">
            <Play className="h-5 w-5" /> Start Listening
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="gap-2 border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 rounded-full px-8"
          >
            <Download className="h-5 w-5" /> Download App
          </Button>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
