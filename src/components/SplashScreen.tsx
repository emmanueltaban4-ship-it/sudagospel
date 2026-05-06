import { useEffect, useState } from "react";
import logoImg from "@/assets/logo.png";

interface SplashScreenProps {
  onComplete: () => void;
}

const SplashScreen = ({ onComplete }: SplashScreenProps) => {
  const [fadeOut, setFadeOut] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    const t0 = setTimeout(() => setStep(1), 500);
    const t1 = setTimeout(() => setStep(2), 1200);
    const t2 = setTimeout(() => setStep(3), 2000);
    const t3 = setTimeout(() => setFadeOut(true), 4500);
    const t4 = setTimeout(() => onComplete(), 5000);
    return () => { clearTimeout(t0); clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
  }, [onComplete]);

  return (
    <div
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center transition-opacity duration-500 overflow-hidden ${
        fadeOut ? "opacity-0" : "opacity-100"
      }`}
      style={{
        background: "linear-gradient(160deg, hsl(0 0% 5%) 0%, hsl(270 50% 12%) 40%, hsl(0 70% 18%) 70%, hsl(0 0% 5%) 100%)",
      }}
    >
      {/* Animated sound wave bars background */}
      <div className="absolute inset-0 flex items-end justify-center gap-[3px] pb-[30%] opacity-[0.08] pointer-events-none">
        {Array.from({ length: 40 }).map((_, i) => (
          <div
            key={i}
            className="w-[3px] sm:w-1.5 rounded-full bg-white"
            style={{
              height: `${20 + Math.sin(i * 0.5) * 30 + Math.random() * 50}%`,
              animation: `wave ${0.8 + Math.random() * 0.6}s ease-in-out infinite alternate`,
              animationDelay: `${i * 0.05}s`,
            }}
          />
        ))}
      </div>

      {/* Floating music notes */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {["♪", "♫", "♬", "♩", "♪", "♫"].map((note, i) => (
          <span
            key={i}
            className="absolute text-white/10 text-2xl sm:text-3xl"
            style={{
              left: `${10 + i * 15}%`,
              animation: `float ${3 + i * 0.5}s ease-in-out infinite`,
              animationDelay: `${i * 0.4}s`,
              top: `${20 + i * 10}%`,
            }}
          >
            {note}
          </span>
        ))}
      </div>

      {/* Radial glow */}
      <div
        className="absolute w-64 h-64 sm:w-80 sm:h-80 rounded-full opacity-30 blur-3xl"
        style={{
          background: "radial-gradient(circle, hsl(0 70% 50% / 0.4), transparent 70%)",
        }}
      />

      {/* Logo + text */}
      <div className="relative flex flex-col items-center gap-5 z-10">
        <div
          className={`transition-all duration-700 ${step >= 1 ? "opacity-100 scale-100" : "opacity-0 scale-75"}`}
        >
          <div className="relative">
            <div className="absolute -inset-3 rounded-full bg-primary/20 blur-xl animate-pulse" />
            <img
              src={logoImg}
              alt="SudaGospel"
              className="h-20 sm:h-24 object-contain drop-shadow-2xl relative z-10"
             loading="lazy" decoding="async" />
          </div>
        </div>

        <div
          className={`flex flex-col items-center gap-2 transition-all duration-700 delay-100 ${
            step >= 2 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          <h1 className="text-white text-xl sm:text-2xl font-bold tracking-tight">
            SudaGospel
          </h1>
          <div className="flex items-center gap-2">
            <div className="h-px w-6 bg-gradient-to-r from-transparent to-white/40" />
            <p className="text-white/60 text-xs sm:text-sm font-medium tracking-widest uppercase">
              Stream • Worship • Connect
            </p>
            <div className="h-px w-6 bg-gradient-to-l from-transparent to-white/40" />
          </div>
        </div>

        {/* Equalizer bars */}
        <div
          className={`flex items-end gap-1 h-8 transition-all duration-700 delay-200 ${
            step >= 3 ? "opacity-100" : "opacity-0"
          }`}
        >
          {[0.6, 1, 0.4, 0.8, 0.5, 1, 0.7, 0.3, 0.9, 0.5].map((h, i) => (
            <div
              key={i}
              className="w-1 rounded-full"
              style={{
                height: `${h * 100}%`,
                background: `linear-gradient(to top, hsl(0 70% 50%), hsl(45 90% 60%))`,
                animation: `eq ${0.4 + Math.random() * 0.4}s ease-in-out infinite alternate`,
                animationDelay: `${i * 0.08}s`,
              }}
            />
          ))}
        </div>
      </div>

      {/* Loading bar */}
      <div className="absolute bottom-10 sm:bottom-14 flex flex-col items-center gap-3 z-10">
        <div className="h-1 w-24 rounded-full bg-white/10 overflow-hidden">
          <div
            className="h-full rounded-full animate-[loading_4.5s_ease-in-out]"
            style={{
              background: "linear-gradient(90deg, hsl(0 70% 50%), hsl(45 90% 55%))",
            }}
          />
        </div>
        <p className="text-white/30 text-[10px] tracking-wider uppercase">Loading your music</p>
      </div>

      <style>{`
        @keyframes loading {
          0% { width: 0%; }
          100% { width: 100%; }
        }
        @keyframes wave {
          0% { transform: scaleY(0.3); }
          100% { transform: scaleY(1); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(10deg); }
        }
        @keyframes eq {
          0% { transform: scaleY(0.3); }
          100% { transform: scaleY(1); }
        }
      `}</style>
    </div>
  );
};

export default SplashScreen;
