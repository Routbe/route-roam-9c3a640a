import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import nl from "@/locales/auth/nl.json";
import en from "@/locales/auth/en.json";
import fr from "@/locales/auth/fr.json";
import de from "@/locales/auth/de.json";

vi.mock("@/lib/auth-client", () => ({ authClient: { signIn: { social: vi.fn() } } }));
vi.mock("react-i18next", () => ({ useTranslation: () => ({ t: (k: string, o?: { name?: string }) => (o?.name ? `${k}:${o.name}` : k) }) }));
vi.mock("sonner", () => ({ toast: { error: vi.fn() } }));
import { PublicProviderSignIn } from "./PublicProviderSignIn";

afterEach(cleanup);
const READY = { ready: true } as never;

describe("2027 auth card", () => {
  it("compact provider row has no passkey tile and one button per provider", () => {
    render(<PublicProviderSignIn compact configured={["google", "github", "gitlab"]} readiness={READY} disabled={false} />);
    expect(screen.queryByRole("button", { name: /passkey/i })).toBeNull();
    expect(screen.getAllByRole("button", { name: "auth.provider.continue:Google" })).toHaveLength(1);
  });

  it("new card texts exist in NL, EN, FR and DE", () => {
    const keys = ["auth.card.tabSignin", "auth.card.welcomeBack", "auth.card.passkeyHero", "auth.card.orAccount", "auth.card.continueEmail", "auth.card.lostEmail", "auth.card.registerTitle"];
    for (const dict of [nl, en, fr, de] as Record<string, string>[]) for (const k of keys) expect(dict[k], k).toBeTruthy();
    expect((nl as Record<string, string>)["auth.card.welcomeBack"]).toBe("Welkom terug");
    expect((nl as Record<string, string>)["auth.card.lostEmail"]).toBe("Geen toegang meer tot je e-mail?");
  });
});
