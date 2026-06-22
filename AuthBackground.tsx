"use client";

import { useEffect, useState } from "react";

const PHOTOS = [
  "/campus-1.jpg",
  "/campus-2.jpg",
  "/campus-3.jpg",
  "/campus-4.jpg",
  "/campus-5.jpg",
];

// Cinematic cross-fading campus background for the auth screens.
export default function AuthBackground() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((p) => (p + 1) % PHOTOS.length), 5000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-slate-950">
      {PHOTOS.map((src, idx) => (
        <div
          key={src}
          className="absolute inset-0 bg-cover bg-center transition-opacity duration-[1500ms]"
          style={{ backgroundImage: `url(${src})`, opacity: idx === i ? 1 : 0 }}
        />
      ))}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950/85 via-slate-950/75 to-slate-950/95" />
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(720px 520px at 80% 0%, rgba(139,92,246,0.28), transparent 60%)",
        }}
      />
    </div>
  );
}
