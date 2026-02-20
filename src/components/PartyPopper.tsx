import React, { useEffect, useState } from 'react';

interface PartyPopperProps {
  trigger: boolean;
}

const CONFETTI_COUNT = 80;

const PartyPopper: React.FC<PartyPopperProps> = ({ trigger }) => {
  const [pieces, setPieces] = useState<number[]>([]);

  useEffect(() => {
    if (trigger) {
      setPieces(Array.from({ length: CONFETTI_COUNT }, (_, i) => i));
      const timer = setTimeout(() => setPieces([]), 4000);
      return () => clearTimeout(timer);
    }
  }, [trigger]);

  if (!pieces.length) return null;

  return (
    <div className="confetti-overlay" aria-hidden="true">
      {pieces.map((i) => (
        <span
          key={i}
          className="confetti-piece"
          style={{ '--i': i } as React.CSSProperties}
        />
      ))}
    </div>
  );
};

export default PartyPopper;

