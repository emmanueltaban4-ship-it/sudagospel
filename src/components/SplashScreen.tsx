import { useEffect, useState } from "react";
import logoImg from "@/assets/logo.png";

interface SplashScreenProps {
  onComplete: () => void;
}

const SplashScreen = ({ onComplete }: SplashScreenProps) => {
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const timer1 = setTimeout(() => setFadeOut(true), 2000);
    const timer2 = setTimeout(() => onComplete(), 2500);
    return () => { clearTimeout(timer1); clearTimeout(timer2); };
  }, [onComplete]);

  return (
    <div
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center transition-opacity duration-500 ${
        fadeOut ? "opacity-0" : "opacity-100"
      }`}
      style={{
        background: "linear-gradient(135deg, hsl(270 70% 25%) 0%, hsl(270 70% 45%) 50%, hsl(45 90% 50%) 100%)",
      }}
    >
      <div className="flex flex-col items-center gap-4 animate-slide-up">
        <div className="h-24 w-24 rounded-3xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-2xl">
          <Music className="h-12 w-12 text-white" />
        </div>
        <h1 className="font-heading text-3xl font-extrabold text-white tracking-tight">
          SudaGospel
        </h1>
        <p className="text-white/70 text-sm font-medium">South Sudan's Gospel Music</p>
      </div>

      <div className="absolute bottom-12 flex flex-col items-center gap-3">
        <div className="h-1 w-16 rounded-full bg-white/30 overflow-hidden">
          <div className="h-full bg-white rounded-full animate-[loading_2s_ease-in-out]" />
        </div>
      </div>

      <style>{`
        @keyframes loading {
          0% { width: 0%; }
          100% { width: 100%; }
        }
      `}</style>
    </div>
  );
};

export default SplashScreen;
