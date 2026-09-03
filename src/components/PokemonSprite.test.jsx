import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import PokemonSprite from "./PokemonSprite";

const pokemon = { id: "p1", pokemonId: 25, name: "pikachu", spriteUrl: "pikachu.png", x: 0.5, y: 0.5 };

describe("PokemonSprite", () => {
  it("renders the sprite image at its stored position", () => {
    render(<PokemonSprite pokemon={pokemon} onDragEnd={vi.fn()} />);
    const img = screen.getByRole("img", { name: "pikachu" });
    expect(img).toHaveAttribute("src", "pikachu.png");
    expect(img.style.left).toBe("50%");
    expect(img.style.top).toBe("50%");
  });

  it("calls onDragEnd with the pointer's final position on pointer up", () => {
    const onDragEnd = vi.fn();
    render(<PokemonSprite pokemon={pokemon} onDragEnd={onDragEnd} />);
    const img = screen.getByRole("img", { name: "pikachu" });

    fireEvent.pointerDown(img, { pointerId: 1, clientX: 100, clientY: 100 });
    fireEvent.pointerUp(img, { pointerId: 1, clientX: 200, clientY: 300 });

    expect(onDragEnd).toHaveBeenCalledTimes(1);
    const [id, x, y] = onDragEnd.mock.calls[0];
    expect(id).toBe("p1");
    expect(x).toBeCloseTo(200 / window.innerWidth);
    expect(y).toBeCloseTo(300 / window.innerHeight);
  });

  it("ignores pointer up when no drag was in progress", () => {
    const onDragEnd = vi.fn();
    render(<PokemonSprite pokemon={pokemon} onDragEnd={onDragEnd} />);
    fireEvent.pointerUp(screen.getByRole("img", { name: "pikachu" }), { pointerId: 1 });
    expect(onDragEnd).not.toHaveBeenCalled();
  });
});
