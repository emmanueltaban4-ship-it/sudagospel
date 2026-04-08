import { useState, useEffect } from "react";
import { Clock } from "lucide-react";

interface CountdownTimerProps {
  targetDate: string;
  className?: string;
  compact?: boolean;
}

const CountdownTimer = ({ targetDate, className = "", compact = false }: CountdownTimerProps) => {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    const update = () => {
      const diff = new Date(targetDate).getTime() - Date.now();
      if (diff <= 0) {
        setExpired(true);
        return;
      }
      setTimeLeft({
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        seconds: Math.floor((diff % 60000) / 1000),
      });
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [targetDate]);

  if (expired) return null;

  if (compact) {
    return (
      <span className={`inline-flex items-center gap-1 text-xs font-semibold text-primary ${className}`}>
        <Clock className="h-3 w-3" />
        {timeLeft.days > 0 ? `${timeLeft.days}d ` : ""}
        {String(timeLeft.hours).padStart(2, "0")}:{String(timeLeft.minutes).padStart(2, "0")}:{String(timeLeft.seconds).padStart(2, "0")}
      </span>
    );
  }

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <Clock className="h-5 w-5 text-primary animate-pulse" />
      <div className="flex gap-2">
        {[
          { label: "Days", value: timeLeft.days },
          { label: "Hrs", value: timeLeft.hours },
          { label: "Min", value: timeLeft.minutes },
          { label: "Sec", value: timeLeft.seconds },
        ].map((unit) => (
          <div key={unit.label} className="flex flex-col items-center bg-card border border-border rounded-lg px-3 py-2 min-w-[52px]">
            <span className="font-heading text-xl font-extrabold text-foreground tabular-nums">{String(unit.value).padStart(2, "0")}</span>
            <span className="text-[9px] uppercase tracking-widest text-muted-foreground">{unit.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CountdownTimer;
