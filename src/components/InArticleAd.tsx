import React, { useEffect, useRef } from 'react';

export function InArticleAd() {
  const containerRef = useRef<HTMLDivElement>(null);
  const isLoaded = useRef(false);

  useEffect(() => {
    if (isLoaded.current) return;

    const pushAd = () => {
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

    // Check if container has width
    const checkWidth = () => {
      if (containerRef.current && containerRef.current.offsetWidth > 0) {
        pushAd();
      } else {
        // Try again in a moment if width is still 0
        setTimeout(checkWidth, 100);
      }
    };

    checkWidth();
  }, []);

  return (
    <div ref={containerRef} className="w-full my-8 flex justify-center text-center overflow-hidden border-y border-outline-variant/10 py-4">
      <ins
        className="adsbygoogle"
        style={{ display: 'block', textAlign: 'center' }}
        data-ad-layout="in-article"
        data-ad-format="fluid"
        data-ad-client="ca-pub-3389078013547284"
        data-ad-slot="6378858044"
      ></ins>
    </div>
  );
}
