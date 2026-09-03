// National Pokédex count as of Gen 9 + Indigo Disk DLC. New releases just
// won't appear in the random pool until this is bumped.
export const POKEMON_MAX_ID = 1025;

function pickSpriteUrl(sprites) {
  return sprites?.other?.["official-artwork"]?.front_default ?? sprites?.front_default ?? null;
}

export async function fetchRandomPokemon() {
  const id = 1 + Math.floor(Math.random() * POKEMON_MAX_ID);
  const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`);
  if (!res.ok) throw new Error(`PokeAPI request failed: ${res.status}`);
  const data = await res.json();
  return {
    pokemonId: data.id,
    name: data.name,
    spriteUrl: pickSpriteUrl(data.sprites),
  };
}
