import { Play, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import heroBanner from "@/assets/hero-banner.jpg";

const HeroSection = () => {
  return (
    <section className="relative overflow-hidden bg-gospel-dark">
      <div className="absolute inset-0">
        <img
          src={heroBanner}
          alt="Gospel worship"
          className="h-full w-full object-cover opacity-30"
          width={1920}
          height={600}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-transparent" />
      </div>

      <div className="container relative z-10 flex min-h-[220px] md:min-h-[280px] flex-col justify-center py-10 md:py-14">
        <h1 className="font-heading text-2xl md:text-4xl lg:text-5xl font-extrabold text-foreground mb-2 leading-tight max-w-lg">
          The gospel platform{" "}
          <span className="text-primary">empowering artists.</span>
        </h1>
        <p className="max-w-md text-muted-foreground mb-5 text-sm md:text-base">
          Sudagospel is an artist-first platform that helps South Sudanese gospel musicians{" "}
          <span className="text-foreground font-medium">reach and engage fans across the world.</span>
        </p>
        <div className="flex flex-wrap gap-3">
          <Link to="/upload">
            <Button size="sm" className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-full px-6">
              <Upload className="h-4 w-4" /> Upload your music for FREE
            </Button>
          </Link>
          <Link to="/music">
            <Button
              size="sm"
              variant="outline"
              className="gap-2 border-border text-foreground hover:bg-muted rounded-full px-6"
            >
              <Play className="h-4 w-4" /> Start Listening
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
