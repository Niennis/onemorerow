import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import PokemonLayer from "./PokemonLayer";

const pokemons = [
  { id: "p1", pokemonId: 25, name: "pikachu", spriteUrl: "pikachu.png", x: 0.2, y: 0.3 },
  { id: "p2", pokemonId: 1, name: "bulbasaur", spriteUrl: "bulbasaur.png", x: 0.6, y: 0.7 },
];

describe("PokemonLayer", () => {
  it("renders nothing when there are no pokemons", () => {
    const { container } = render(<PokemonLayer pokemons={[]} onDragEnd={vi.fn()} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders one sprite per pokemon", () => {
    render(<PokemonLayer pokemons={pokemons} onDragEnd={vi.fn()} />);
    expect(screen.getByRole("img", { name: "pikachu" })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "bulbasaur" })).toBeInTheDocument();
  });
});
