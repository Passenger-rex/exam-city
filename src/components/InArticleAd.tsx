import React, { useEffect, useRef } from 'react';

export function InArticleAd() {
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
    <div ref={containerRef} className="w-full my-8 flex justify-center text-center overflow-hidden border-y border-outline-variant/10 py-4 min-h-[100px]">
      <ins
        className="adsbygoogle"
        style={{ display: 'block', textAlign: 'center', minWidth: '250px' }}
        data-ad-layout="in-article"
        data-ad-format="fluid"
        data-ad-client="ca-pub-3389078013547284"
        data-ad-slot="6378858044"
      ></ins>
    </div>
  );
}
