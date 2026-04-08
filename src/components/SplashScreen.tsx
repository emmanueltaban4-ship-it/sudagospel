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
        <img src={logoImg} alt="Sudagospel" className="h-20 object-contain drop-shadow-2xl" />
        <p className="text-white/70 text-sm font-medium">Home of Gospel Music</p>
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
