/** Auth card tabs: URL pairing (/login <-> /register) and W3C APG tablist keyboard handling. */
export type AuthTab = "signin" | "signup";

const PAIRED = new Set(["/login", "/register"]);

/** The address for `tab` when the card lives on /login or /register; null on every other route. */
export function authTabPath(pathname: string, tab: AuthTab): string | null {
  const clean = pathname.replace(/\/+$/, "") || "/";
  if (!PAIRED.has(clean)) return null;
  return tab === "signup" ? "/register" : "/login";
}

/**
 * Swaps /login and /register in place with history.replaceState, keeping query, hash and the
 * router's history state, so switching tabs never remounts the card or adds a back-button step.
 */
export function syncAuthTabUrl(
  tab: AuthTab,
  loc: Pick<Location, "pathname" | "search" | "hash"> = window.location,
  history: Pick<History, "replaceState" | "state"> = window.history,
): boolean {
  const next = authTabPath(loc.pathname, tab);
  if (!next || next === loc.pathname) return false;
  history.replaceState(history.state, "", `${next}${loc.search}${loc.hash}`);
  return true;
}

/** Arrow keys wrap between the two tabs; Home/End jump to the first/last tab. */
export function authTabFromKey(key: string, current: AuthTab): AuthTab | null {
  switch (key) {
    case "ArrowLeft":
    case "ArrowRight":
    case "ArrowUp":
    case "ArrowDown":
      return current === "signin" ? "signup" : "signin";
    case "Home":
      return "signin";
    case "End":
      return "signup";
    default:
      return null;
  }
}
