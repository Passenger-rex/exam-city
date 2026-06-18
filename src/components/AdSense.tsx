import React, { useEffect, useRef } from 'react';

export function AdSense() {
  const isLoaded = useRef(false);

  useEffect(() => {
    if (!isLoaded.current) {
      try {
        // @ts-ignore
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch (e: any) {
        if (!e.message?.includes('already have ads')) {
          console.error('AdSense error', e);
        }
      }
      isLoaded.current = true;
    }
  }, []);

  return (
    <div className="w-full my-4 flex justify-center text-center overflow-hidden">
      <ins
        className="adsbygoogle"
        style={{ display: 'block', width: '100%' }}
        data-ad-client="ca-pub-3389078013547284"
        data-ad-slot="7197508906"
        data-ad-format="auto"
        data-full-width-responsive="true"
      ></ins>
    </div>
  );
}
