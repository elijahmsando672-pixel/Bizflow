"use client";

import { useEffect, useRef, useState } from "react";

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "1x00000000000000000000AA";

interface TurnstileProps {
  onVerify: (token: string) => void;
}

declare global {
  interface Window {
    turnstile?: {
      render: (container: string | HTMLElement, options: Record<string, unknown>) => string;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
    };
    onTurnstileVerify?: (token: string) => void;
  }
}

export default function TurnstileWidget({ onVerify }: TurnstileProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    window.onTurnstileVerify = (token: string) => {
      onVerify(token);
    };
    return () => { window.onTurnstileVerify = undefined; };
  }, [onVerify]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || ready) return;

    const checkTurnstile = () => {
      if (window.turnstile && container) {
        widgetId.current = window.turnstile.render(container, {
          sitekey: SITE_KEY,
          callback: "onTurnstileVerify",
        });
        setReady(true);
        return true;
      }
      return false;
    };

    if (!checkTurnstile()) {
      const script = document.createElement("script");
      script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
      script.async = true;
      script.defer = true;
      script.onload = () => checkTurnstile();
      document.head.appendChild(script);
      return () => {
        if (widgetId.current && window.turnstile) {
          window.turnstile.remove(widgetId.current);
        }
        document.head.removeChild(script);
      };
    }
  }, [ready]);

  return <div ref={containerRef} className="flex justify-center" />;
}
