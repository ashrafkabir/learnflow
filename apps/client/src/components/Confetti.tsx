import React, { useEffect, useState } from 'react';

const COLORS = ['#2563eb', '#7c3aed', '#f59e0b', '#10b981', '#ef4444', '#ec4899'];

export function Confetti({ trigger }: { trigger: boolean }) {
  const [pieces, setPieces] = useState<{ id: number; left: string; color: string; delay: string; size: number }[]>([]);

  useEffect(() => {
    if (!trigger) return;
    const newPieces = Array.from({ length: 40 }, (_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      delay: `${Math.random() * 0.8}s`,
      size: 6 + Math.random() * 8,
    }));
    setPieces(newPieces);
    const t = setTimeout(() => setPieces([]), 3000);
    return () => clearTimeout(t);
  }, [trigger]);

  if (!pieces.length) return null;

  return (
    <>
      {pieces.map(p => (
        <div
          key={p.id}
          className="confetti-piece"
          style={{
            left: p.left,
            backgroundColor: p.color,
            animationDelay: p.delay,
            width: p.size,
            height: p.size,
          }}
        />
      ))}
    </>
  );
}
