import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { usePokemonCollection } from "./usePokemonCollection";

vi.mock("../lib/supabaseClient", () => ({
  supabase: { from: vi.fn() },
}));
vi.mock("../lib/pokeapi", () => ({
  fetchRandomPokemon: vi.fn(),
}));
import { supabase } from "../lib/supabaseClient";
import { fetchRandomPokemon } from "../lib/pokeapi";

const STORAGE_KEY = "onemorerow-pokemons";
const user = { id: "user-123" };

const PICKED = { pokemonId: 25, name: "pikachu", spriteUrl: "pikachu.png" };

beforeEach(() => {
  localStorage.clear();
  supabase.from.mockReset();
  fetchRandomPokemon.mockReset();
  vi.spyOn(Math, "random").mockReturnValue(0.5);
});

describe("usePokemonCollection (guest)", () => {
  it("starts empty when nothing is stored", () => {
    const { result } = renderHook(() => usePokemonCollection(null));
    expect(result.current.pokemons).toEqual([]);
  });

  it("adds a random pokemon and persists it to localStorage", async () => {
    fetchRandomPokemon.mockResolvedValue(PICKED);
    const { result } = renderHook(() => usePokemonCollection(null));

    await act(async () => {
      await result.current.addRandom();
    });

    expect(result.current.pokemons).toHaveLength(1);
    expect(result.current.pokemons[0]).toMatchObject(PICKED);
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
    expect(stored).toHaveLength(1);
    expect(stored[0]).toMatchObject(PICKED);
  });

  it("does not add anything when the fetch fails", async () => {
    fetchRandomPokemon.mockRejectedValue(new Error("network down"));
    const { result } = renderHook(() => usePokemonCollection(null));

    await act(async () => {
      await result.current.addRandom();
    });

    expect(result.current.pokemons).toEqual([]);
  });

  it("updates and persists a pokemon's position after a drag", async () => {
    fetchRandomPokemon.mockResolvedValue(PICKED);
    const { result } = renderHook(() => usePokemonCollection(null));
    await act(async () => {
      await result.current.addRandom();
    });
    const id = result.current.pokemons[0].id;

    act(() => {
      result.current.updatePosition(id, 0.3, 0.4);
    });

    expect(result.current.pokemons[0]).toMatchObject({ x: 0.3, y: 0.4 });
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
    expect(stored[0]).toMatchObject({ x: 0.3, y: 0.4 });
  });

  it("clears all pokemons and empties localStorage on reset", async () => {
    fetchRandomPokemon.mockResolvedValue(PICKED);
    const { result } = renderHook(() => usePokemonCollection(null));
    await act(async () => {
      await result.current.addRandom();
    });
    expect(result.current.pokemons).toHaveLength(1);

    act(() => {
      result.current.resetAll();
    });

    expect(result.current.pokemons).toEqual([]);
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY))).toEqual([]);
  });
});

function mockSupabaseFrom({ selectResult, insertResult, updateResult = { error: null }, deleteResult = { error: null } }) {
  supabase.from.mockReturnValue({
    select: () => ({
      eq: () => ({
        order: () => Promise.resolve(selectResult),
      }),
    }),
    insert: () => ({
      select: () => (insertResult.single ? { single: () => Promise.resolve(insertResult.single) } : Promise.resolve(insertResult)),
    }),
    update: () => ({
      eq: () => Promise.resolve(updateResult),
    }),
    delete: () => ({
      eq: () => Promise.resolve(deleteResult),
    }),
  });
}

describe("usePokemonCollection (logged in)", () => {
  it("loads the account's saved pokemons", async () => {
    mockSupabaseFrom({
      selectResult: {
        data: [
          { id: "row-1", pokemon_id: 25, name: "pikachu", sprite_url: "pikachu.png", pos_x: 0.5, pos_y: 0.5 },
        ],
        error: null,
      },
      insertResult: {},
    });
    const { result } = renderHook(() => usePokemonCollection(user));

    await waitFor(() => expect(result.current.pokemons).toHaveLength(1));
    expect(result.current.pokemons[0]).toMatchObject({ id: "row-1", pokemonId: 25, name: "pikachu" });
  });

  it("migrates local guest pokemons into a fresh account with none saved yet", async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([{ id: "local-1", ...PICKED, x: 0.5, y: 0.5 }]));
    mockSupabaseFrom({
      selectResult: { data: [], error: null },
      insertResult: {
        data: [{ id: "row-1", pokemon_id: 25, name: "pikachu", sprite_url: "pikachu.png", pos_x: 0.5, pos_y: 0.5 }],
        error: null,
      },
    });
    const { result } = renderHook(() => usePokemonCollection(user));

    await waitFor(() => expect(result.current.pokemons).toHaveLength(1));
    expect(result.current.pokemons[0]).toMatchObject({ id: "row-1", pokemonId: 25 });
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it("inserts a new pokemon in Supabase and appends the returned row", async () => {
    fetchRandomPokemon.mockResolvedValue(PICKED);
    mockSupabaseFrom({
      selectResult: { data: [], error: null },
      insertResult: {
        single: {
          data: { id: "row-2", pokemon_id: 25, name: "pikachu", sprite_url: "pikachu.png", pos_x: 0.5, pos_y: 0.5 },
          error: null,
        },
      },
    });
    const { result } = renderHook(() => usePokemonCollection(user));
    await waitFor(() => expect(result.current.pokemons).toEqual([]));

    await act(async () => {
      await result.current.addRandom();
    });

    expect(result.current.pokemons).toHaveLength(1);
    expect(result.current.pokemons[0]).toMatchObject({ id: "row-2", pokemonId: 25 });
  });

  it("clears all pokemons and deletes them from Supabase on reset", async () => {
    mockSupabaseFrom({
      selectResult: {
        data: [
          { id: "row-1", pokemon_id: 25, name: "pikachu", sprite_url: "pikachu.png", pos_x: 0.5, pos_y: 0.5 },
        ],
        error: null,
      },
      insertResult: {},
    });
    const { result } = renderHook(() => usePokemonCollection(user));
    await waitFor(() => expect(result.current.pokemons).toHaveLength(1));

    act(() => {
      result.current.resetAll();
    });

    expect(result.current.pokemons).toEqual([]);
    expect(supabase.from).toHaveBeenCalledWith("user_pokemon");
  });
});
