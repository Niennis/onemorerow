import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fetchRandomPokemon } from "./pokeapi";

beforeEach(() => {
  vi.spyOn(Math, "random").mockReturnValue(0);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("fetchRandomPokemon", () => {
  it("prefers the official-artwork sprite when available", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          id: 1,
          name: "bulbasaur",
          sprites: {
            front_default: "front.png",
            other: { "official-artwork": { front_default: "artwork.png" } },
          },
        }),
    });

    const result = await fetchRandomPokemon();
    expect(result).toEqual({ pokemonId: 1, name: "bulbasaur", spriteUrl: "artwork.png" });
    expect(fetch).toHaveBeenCalledWith("https://pokeapi.co/api/v2/pokemon/1");
  });

  it("falls back to front_default when no official artwork exists", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({ id: 1, name: "bulbasaur", sprites: { front_default: "front.png" } }),
    });

    const result = await fetchRandomPokemon();
    expect(result.spriteUrl).toBe("front.png");
  });

  it("throws when the request fails", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: false, status: 404 });
    await expect(fetchRandomPokemon()).rejects.toThrow("PokeAPI request failed: 404");
  });
});
