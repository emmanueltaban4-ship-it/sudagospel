import { useEffect, useRef } from "react";
import { useSubscription } from "@/hooks/use-subscription";

declare global {
  interface Window {
    adsbygoogle: any[];
  }
}

type AdFormat = "auto" | "fluid" | "rectangle" | "vertical" | "horizontal";

interface GoogleAdUnitProps {
  /** Your ad slot ID from AdSense (e.g. "1234567890") */
  slot: string;
  /** Ad format: auto, fluid, rectangle, vertical, horizontal */
  format?: AdFormat;
  /** Enable responsive sizing (default: true) */
  responsive?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Custom style overrides for the ins element */
  style?: React.CSSProperties;
}

/**
 * Google AdSense ad unit component.
 * 
 * Usage:
 *   <GoogleAdUnit slot="1234567890" />
 *   <GoogleAdUnit slot="1234567890" format="rectangle" />
 *   <GoogleAdUnit slot="1234567890" format="fluid" style={{ height: 250 }} />
 * 
 * Hidden automatically for premium subscribers.
 */
const GoogleAdUnit = ({
  slot,
  format = "auto",
  responsive = true,
  className = "",
  style,
}: GoogleAdUnitProps) => {
  const adRef = useRef<HTMLDivElement>(null);
  const pushed = useRef(false);
  const { subscribed } = useSubscription();

  useEffect(() => {
    if (subscribed || pushed.current) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      pushed.current = true;
    } catch {
      // adsbygoogle not loaded yet
    }
  }, [subscribed]);

  if (subscribed) return null;

  return (
    <div className={`google-ad-unit ${className}`} ref={adRef}>
      <ins
        className="adsbygoogle"
        style={{ display: "block", ...style }}
        data-ad-client="ca-pub-XXXXXXXXXXXXXXXX"
        data-ad-slot={slot}
        data-ad-format={format}
        {...(responsive ? { "data-full-width-responsive": "true" } : {})}
      />
      <span className="block text-center text-[9px] text-muted-foreground/40 mt-0.5">
        Ad
      </span>
    </div>
  );
};

export default GoogleAdUnit;
