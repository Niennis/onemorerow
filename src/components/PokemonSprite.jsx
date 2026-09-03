import { useCallback, useRef } from "react";

function clamp01(n) {
  return Math.min(1, Math.max(0, n));
}

export default function PokemonSprite({ pokemon, onDragEnd }) {
  const elRef = useRef(null);
  const draggingRef = useRef(false);

  const handlePointerDown = useCallback((event) => {
    draggingRef.current = true;
    elRef.current?.setPointerCapture?.(event.pointerId);
  }, []);

  const handlePointerMove = useCallback((event) => {
    if (!draggingRef.current || !elRef.current) return;
    const x = clamp01(event.clientX / window.innerWidth);
    const y = clamp01(event.clientY / window.innerHeight);
    elRef.current.style.left = `${x * 100}%`;
    elRef.current.style.top = `${y * 100}%`;
  }, []);

  const handlePointerUp = useCallback(
    (event) => {
      if (!draggingRef.current) return;
      draggingRef.current = false;
      elRef.current?.releasePointerCapture?.(event.pointerId);
      const x = clamp01(event.clientX / window.innerWidth);
      const y = clamp01(event.clientY / window.innerHeight);
      onDragEnd(pokemon.id, x, y);
    },
    [onDragEnd, pokemon.id],
  );

  return (
    <img
      ref={elRef}
      src={pokemon.spriteUrl}
      alt={pokemon.name}
      draggable={false}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      className="pointer-events-auto absolute h-24 w-24 -translate-x-1/2 -translate-y-1/2 cursor-grab touch-none select-none drop-shadow-[0_8px_16px_rgba(0,0,0,0.35)] transition-transform active:scale-110 active:cursor-grabbing"
      style={{ left: `${pokemon.x * 100}%`, top: `${pokemon.y * 100}%` }}
    />
  );
}
