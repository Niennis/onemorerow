import PokemonSprite from "./PokemonSprite";

export default function PokemonLayer({ pokemons, onDragEnd }) {
  if (pokemons.length === 0) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-10">
      {pokemons.map((pokemon) => (
        <PokemonSprite key={pokemon.id} pokemon={pokemon} onDragEnd={onDragEnd} />
      ))}
    </div>
  );
}
