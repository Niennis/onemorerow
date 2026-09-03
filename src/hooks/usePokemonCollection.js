import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { fetchRandomPokemon } from "../lib/pokeapi";

const STORAGE_KEY = "onemorerow-pokemons";

function readLocalPokemons() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeLocalPokemons(pokemons) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(pokemons));
}

function randomPosition() {
  // Keep sprites off the very edges so they never spawn half off-screen.
  return { x: 0.15 + Math.random() * 0.7, y: 0.2 + Math.random() * 0.6 };
}

function fromDbRow(row) {
  return {
    id: row.id,
    pokemonId: row.pokemon_id,
    name: row.name,
    spriteUrl: row.sprite_url,
    x: row.pos_x,
    y: row.pos_y,
  };
}

// Local-only when logged out; synced to Supabase (per user_id) when logged
// in — same split as useSettings. A fresh account with no saved pokemon yet
// adopts whatever was collected as a guest, so nothing is lost on signup.
export function usePokemonCollection(user) {
  const [pokemons, setPokemons] = useState(() => (user ? [] : readLocalPokemons()));
  const userRef = useRef(user);

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  useEffect(() => {
    if (!user) {
      setPokemons(readLocalPokemons());
      return;
    }

    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from("user_pokemon")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at");
      if (cancelled) return;

      if (error) {
        console.error("[usePokemonCollection] failed to load:", error);
        return;
      }

      const local = readLocalPokemons();
      if (data.length === 0 && local.length > 0) {
        const rows = local.map((p) => ({
          user_id: user.id,
          pokemon_id: p.pokemonId,
          name: p.name,
          sprite_url: p.spriteUrl,
          pos_x: p.x,
          pos_y: p.y,
        }));
        const { data: inserted, error: insertError } = await supabase
          .from("user_pokemon")
          .insert(rows)
          .select();
        if (cancelled) return;

        if (insertError) {
          console.error("[usePokemonCollection] failed to migrate local pokemons:", insertError);
          setPokemons([]);
          return;
        }
        localStorage.removeItem(STORAGE_KEY);
        setPokemons(inserted.map(fromDbRow));
        return;
      }

      setPokemons(data.map(fromDbRow));
    })();

    return () => {
      cancelled = true;
    };
  }, [user]);

  // Guests only: every change (add, drag) mirrors straight to localStorage.
  useEffect(() => {
    if (!user) writeLocalPokemons(pokemons);
  }, [pokemons, user]);

  const addRandom = useCallback(async () => {
    let picked;
    try {
      picked = await fetchRandomPokemon();
    } catch (error) {
      console.error("[usePokemonCollection] failed to fetch a pokemon:", error);
      return;
    }
    if (!picked.spriteUrl) return;

    const { x, y } = randomPosition();
    const currentUser = userRef.current;

    if (!currentUser) {
      setPokemons((prev) => [...prev, { id: crypto.randomUUID(), ...picked, x, y }]);
      return;
    }

    const { data, error } = await supabase
      .from("user_pokemon")
      .insert({
        user_id: currentUser.id,
        pokemon_id: picked.pokemonId,
        name: picked.name,
        sprite_url: picked.spriteUrl,
        pos_x: x,
        pos_y: y,
      })
      .select()
      .single();

    if (error) {
      console.error("[usePokemonCollection] failed to save a new pokemon:", error);
      return;
    }
    setPokemons((prev) => [...prev, fromDbRow(data)]);
  }, []);

  const updatePosition = useCallback((id, x, y) => {
    setPokemons((prev) => prev.map((p) => (p.id === id ? { ...p, x, y } : p)));

    const currentUser = userRef.current;
    if (!currentUser) return; // persisted by the localStorage-mirroring effect above

    supabase
      .from("user_pokemon")
      .update({ pos_x: x, pos_y: y })
      .eq("id", id)
      .then(({ error }) => {
        if (error) console.error("[usePokemonCollection] failed to save position:", error);
      });
  }, []);

  const resetAll = useCallback(() => {
    setPokemons([]);

    const currentUser = userRef.current;
    if (!currentUser) return; // cleared by the localStorage-mirroring effect above

    supabase
      .from("user_pokemon")
      .delete()
      .eq("user_id", currentUser.id)
      .then(({ error }) => {
        if (error) console.error("[usePokemonCollection] failed to reset:", error);
      });
  }, []);

  return { pokemons, addRandom, updatePosition, resetAll };
}
