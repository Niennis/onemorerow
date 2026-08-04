import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import AuthPanel from "./AuthPanel";

function makeAuth(overrides = {}) {
  return {
    user: null,
    isSupabaseConfigured: true,
    signIn: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
    ...overrides,
  };
}

async function openForm() {
  const user = userEvent.setup();
  render(<AuthPanel auth={makeAuth()} />);
  await user.click(screen.getByRole("button", { name: /iniciar sesión \/ crear cuenta/i }));
  return user;
}

describe("AuthPanel sync error indicator", () => {
  it("shows a warning icon when syncError is set for a logged-in user", () => {
    const auth = makeAuth({ user: { email: "a@b.com" } });
    render(<AuthPanel auth={auth} syncError="column user_settings.player_url does not exist" />);
    expect(
      screen.getByTitle(/no se pudo guardar\/cargar tu configuración/i),
    ).toBeInTheDocument();
  });

  it("shows no warning icon when there is no syncError", () => {
    const auth = makeAuth({ user: { email: "a@b.com" } });
    render(<AuthPanel auth={auth} syncError={null} />);
    expect(screen.queryByTitle(/no se pudo guardar\/cargar/i)).not.toBeInTheDocument();
  });
});

describe("AuthPanel password visibility toggle", () => {
  it("hides the password by default", async () => {
    await openForm();
    expect(screen.getByPlaceholderText("Contraseña")).toHaveAttribute("type", "password");
  });

  it("reveals the password as plain text when toggled, and hides it again on a second click", async () => {
    const user = await openForm();
    const toggle = screen.getByRole("button", { name: /mostrar contraseña/i });

    await user.click(toggle);
    expect(screen.getByPlaceholderText("Contraseña")).toHaveAttribute("type", "text");
    expect(screen.getByRole("button", { name: /ocultar contraseña/i })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /ocultar contraseña/i }));
    expect(screen.getByPlaceholderText("Contraseña")).toHaveAttribute("type", "password");
  });

  it("does not submit the form when the toggle button is clicked", async () => {
    const auth = makeAuth();
    const user = userEvent.setup();
    render(<AuthPanel auth={auth} />);
    await user.click(screen.getByRole("button", { name: /iniciar sesión \/ crear cuenta/i }));

    fireEvent.change(screen.getByPlaceholderText("Correo"), { target: { value: "a@b.com" } });
    fireEvent.change(screen.getByPlaceholderText("Contraseña"), { target: { value: "secret123" } });
    await user.click(screen.getByRole("button", { name: /mostrar contraseña/i }));

    expect(auth.signIn).not.toHaveBeenCalled();
    expect(screen.getByPlaceholderText("Contraseña")).toHaveValue("secret123");
  });
});

function deferred() {
  let resolve;
  const promise = new Promise((res) => {
    resolve = res;
  });
  return { promise, resolve };
}

describe("AuthPanel loading state", () => {
  it("shows a spinner and disables re-submission while creating an account", async () => {
    const user = userEvent.setup();
    const { promise, resolve } = deferred();
    const auth = makeAuth({ signUp: vi.fn(() => promise) });
    render(<AuthPanel auth={auth} />);

    await user.click(screen.getByRole("button", { name: /iniciar sesión \/ crear cuenta/i }));
    await user.click(screen.getByRole("button", { name: "Crear cuenta" })); // switch tab, unambiguous: mode is still signIn here
    fireEvent.change(screen.getByPlaceholderText("Correo"), { target: { value: "a@b.com" } });
    fireEvent.change(screen.getByPlaceholderText("Contraseña"), { target: { value: "secret123" } });

    const submitBtn = document.querySelector('button[type="submit"]');
    await user.click(submitBtn);

    expect(submitBtn).toHaveAttribute("aria-busy", "true");
    expect(submitBtn).toHaveTextContent("Creando cuenta");

    // A second click while still pending must not fire signUp again.
    await user.click(submitBtn);
    expect(auth.signUp).toHaveBeenCalledTimes(1);

    resolve();
    await waitFor(() => expect(submitBtn).toHaveAttribute("aria-busy", "false"));
    expect(await screen.findByText(/cuenta creada/i)).toBeInTheDocument();
  });

  it("shows a spinner while signing in", async () => {
    const user = userEvent.setup();
    const { promise, resolve } = deferred();
    const auth = makeAuth({ signIn: vi.fn(() => promise) });
    render(<AuthPanel auth={auth} />);

    await user.click(screen.getByRole("button", { name: /iniciar sesión \/ crear cuenta/i }));
    fireEvent.change(screen.getByPlaceholderText("Correo"), { target: { value: "a@b.com" } });
    fireEvent.change(screen.getByPlaceholderText("Contraseña"), { target: { value: "secret123" } });

    const submitBtn = document.querySelector('button[type="submit"]');
    await user.click(submitBtn);

    expect(submitBtn).toHaveAttribute("aria-busy", "true");
    expect(submitBtn).toHaveTextContent("Entrando");

    resolve();
    // A successful sign-in closes the dropdown entirely (form unmounts).
    await waitFor(() =>
      expect(screen.queryByPlaceholderText("Contraseña")).not.toBeInTheDocument(),
    );
  });
});
