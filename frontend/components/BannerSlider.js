'use client';
import { useState, useEffect } from 'react';
import Image from 'next/image';

export default function BannerSlider({ banners }) {
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (banners.length <= 1) return;
    const timer = setInterval(() => setActive(i => (i + 1) % banners.length), 2030);
    return () => clearInterval(timer);
  }, [banners.length]);

  return (
    <section className="relative w-full bg-gray-900" style={{ aspectRatio: '1400/500' }}>
      {banners.map((url, i) => (
        <div key={i} className={`absolute inset-0 transition-opacity duration-700 ${i === active ? 'opacity-100' : 'opacity-0'}`}>
          <Image src={url} alt={`Banner ${i + 1}`} fill className="object-fill" priority={i === 0} sizes="100vw" />
        </div>
      ))}
      {banners.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
          {banners.map((_, i) => (
            <button key={i} onClick={() => setActive(i)}
              className={`w-2.5 h-2.5 rounded-full transition-colors ${i === active ? 'bg-white' : 'bg-white/40'}`} />
          ))}
        </div>
      )}
    </section>
  );
}
