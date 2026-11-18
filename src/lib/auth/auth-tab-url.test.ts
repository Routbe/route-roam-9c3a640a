import { describe, expect, it, vi } from "vitest";
import { authTabFromKey, authTabPath, syncAuthTabUrl } from "./auth-tab-url";

describe("auth card tabs", () => {
  it("pairs /login with the sign-in tab and /register with the sign-up tab", () => {
    expect(authTabPath("/login", "signup")).toBe("/register");
    expect(authTabPath("/register", "signin")).toBe("/login");
    expect(authTabPath("/auth/sign-in", "signup")).toBeNull();
  });

  it("swaps the address with replaceState, keeping query, hash and router state", () => {
    const state = { __TSR_key: "k1" };
    const history = { state, replaceState: vi.fn() };
    expect(syncAuthTabUrl("signup", { pathname: "/login", search: "?redirect=/studio", hash: "#x" }, history)).toBe(true);
    expect(history.replaceState).toHaveBeenCalledWith(state, "", "/register?redirect=/studio#x");
  });

  it("leaves the address alone on other routes or when already right", () => {
    const history = { state: null, replaceState: vi.fn() };
    expect(syncAuthTabUrl("signup", { pathname: "/auth/sign-in", search: "", hash: "" }, history)).toBe(false);
    expect(syncAuthTabUrl("signup", { pathname: "/register", search: "", hash: "" }, history)).toBe(false);
    expect(history.replaceState).not.toHaveBeenCalled();
  });

  it("arrow keys switch tabs (wrapping); Home and End jump to the first and last tab", () => {
    expect(authTabFromKey("ArrowRight", "signin")).toBe("signup");
    expect(authTabFromKey("ArrowRight", "signup")).toBe("signin");
    expect(authTabFromKey("ArrowLeft", "signin")).toBe("signup");
    expect(authTabFromKey("Home", "signup")).toBe("signin");
    expect(authTabFromKey("End", "signin")).toBe("signup");
    expect(authTabFromKey("Enter", "signin")).toBeNull();
  });
});
