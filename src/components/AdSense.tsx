import React, { useEffect, useRef } from 'react';

export function AdSense() {
  const containerRef = useRef<HTMLDivElement>(null);
  const isLoaded = useRef(false);

  useEffect(() => {
    if (isLoaded.current) return;

    const pushAd = () => {
      if (isLoaded.current) return;
      try {
        // @ts-ignore
        (window.adsbygoogle = window.adsbygoogle || []).push({});
        isLoaded.current = true;
      } catch (e: any) {
        if (!e.message?.includes('already have ads')) {
          console.error('AdSense error', e);
        }
      }
    };

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentRect.width > 0 && !isLoaded.current) {
          // Add a small delay to ensure layout is fully settled
          setTimeout(() => {
            if (!isLoaded.current) {
              pushAd();
            }
          }, 100);
          observer.disconnect();
        }
      }
    });

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} className="w-full my-4 flex justify-center text-center overflow-hidden min-h-[100px]">
      <ins
        className="adsbygoogle"
        style={{ display: 'block', width: '100%', minWidth: '250px' }}
        data-ad-client="ca-pub-3389078013547284"
        data-ad-slot="7197508906"
        data-ad-format="auto"
        data-full-width-responsive="true"
      ></ins>
    </div>
  );
}
