import React, { useEffect, useRef, useState } from 'react';
import { ShieldCheck, ShieldAlert, RefreshCw } from 'lucide-react';

interface TurnstileWidgetProps {
  onVerify: (token: string) => void;
  onExpire?: () => void;
  onError?: (error: string) => void;
  theme?: 'dark' | 'light' | 'auto';
  className?: string;
}

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement | string,
        options: {
          sitekey: string;
          theme?: 'dark' | 'light' | 'auto';
          callback?: (token: string) => void;
          'error-callback'?: (err: any) => void;
          'expired-callback'?: () => void;
        }
      ) => string;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
    };
    onloadTurnstileCallback?: () => void;
  }
}

/**
 * Cloudflare Turnstile CAPTCHA & Bot Protection Component
 * Prevents automated scripts and bots from triggering EmailJS or booking APIs.
 *
 * Uses testing sitekey '1x00000000000000000000AA' (always passes) by default,
 * or live sitekey from VITE_TURNSTILE_SITE_KEY.
 */
export const TurnstileWidget: React.FC<TurnstileWidgetProps> = ({
  onVerify,
  onExpire,
  onError,
  theme = 'dark',
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const widgetIdRef = useRef<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Cloudflare Turnstile Site Key:
  // Testing key: '1x00000000000000000000AA' (Always passes)
  const siteKey =
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_TURNSTILE_SITE_KEY) ||
    '1x00000000000000000000AA';

  useEffect(() => {
    let isMounted = true;

    const renderWidget = () => {
      if (!containerRef.current || !window.turnstile) return;

      // Clean up previous widget instance if any
      if (widgetIdRef.current) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch (_) {}
      }

      try {
        const id = window.turnstile.render(containerRef.current, {
          sitekey: siteKey,
          theme,
          callback: (token: string) => {
            if (!isMounted) return;
            setIsVerified(true);
            setHasError(false);
            onVerify(token);
          },
          'expired-callback': () => {
            if (!isMounted) return;
            setIsVerified(false);
            if (onExpire) onExpire();
          },
          'error-callback': (err: any) => {
            if (!isMounted) return;
            setHasError(true);
            setIsVerified(false);
            if (onError) onError(String(err || 'Turnstile verification error'));
          },
        });
        widgetIdRef.current = id;
        setIsLoaded(true);
      } catch (err) {
        console.warn('Turnstile render warning:', err);
      }
    };

    // If script is already loaded
    if (window.turnstile) {
      renderWidget();
      return () => {
        isMounted = false;
        if (widgetIdRef.current && window.turnstile) {
          try {
            window.turnstile.remove(widgetIdRef.current);
          } catch (_) {}
        }
      };
    }

    // Load Turnstile Script
    const existingScript = document.getElementById('cloudflare-turnstile-script');
    if (!existingScript) {
      const script = document.createElement('script');
      script.id = 'cloudflare-turnstile-script';
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
      script.async = true;
      script.defer = true;
      script.onload = () => {
        if (isMounted) renderWidget();
      };
      script.onerror = () => {
        if (isMounted) setHasError(true);
      };
      document.head.appendChild(script);
    } else {
      const interval = setInterval(() => {
        if (window.turnstile) {
          clearInterval(interval);
          if (isMounted) renderWidget();
        }
      }, 100);
      return () => {
        clearInterval(interval);
        isMounted = false;
      };
    }

    return () => {
      isMounted = false;
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch (_) {}
      }
    };
  }, [siteKey, theme]);

  return (
    <div className={`p-3 rounded-xl bg-stone-900/90 border border-stone-800 text-left space-y-2 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-stone-300">
          {isVerified ? (
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          ) : hasError ? (
            <ShieldAlert className="w-4 h-4 text-rose-400" />
          ) : (
            <RefreshCw className="w-4 h-4 text-amber-400 animate-spin" />
          )}
          <span>Bot Protection & Humanity Verification</span>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-black/60 border border-stone-700 text-stone-400">
          Cloudflare Turnstile
        </span>
      </div>

      <div className="flex justify-center py-1 overflow-hidden min-h-[65px] items-center">
        <div ref={containerRef} />
      </div>

      <div className="flex items-center justify-between text-[11px] text-stone-400">
        <span>Protected against automated form submission attacks</span>
        {isVerified && (
          <span className="text-emerald-400 font-bold flex items-center gap-1">
            ✓ Verified Human
          </span>
        )}
      </div>
    </div>
  );
};
