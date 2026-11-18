/**
 * DNSSEC status of partner/supplier domains, asked from a validating resolver over DNS-over-HTTPS
 * (Quad9, Swiss foundation; JSON API). "valid" means the resolver validated the chain and set AD;
 * "unsigned" means the zone has no DNSSEC; "unknown" means the lookup failed. Results are cached
 * per isolate for an hour. The resolver is trusted for this check; the page says so.
 */
export type DnssecState = "valid" | "unsigned" | "unknown";

const TTL_MS = 60 * 60 * 1000;
const cache = new Map<string, { state: DnssecState; at: number }>();
const DOMAIN_RE = /^(?=.{1,253}$)([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/;

export function dnssecFromDoh(json: unknown): DnssecState {
  const j = json as { Status?: number; AD?: boolean } | null;
  if (!j || typeof j.Status !== "number") return "unknown";
  if (j.Status !== 0) return "unknown";
  return j.AD === true ? "valid" : "unsigned";
}

export async function dnssecStatus(domain: string, fetcher: typeof fetch = fetch): Promise<DnssecState> {
  const d = domain.trim().toLowerCase();
  if (!DOMAIN_RE.test(d)) return "unknown";
  const hit = cache.get(d);
  if (hit && Date.now() - hit.at < TTL_MS) return hit.state;
  let state: DnssecState = "unknown";
  try {
    const res = await fetcher(`https://dns.quad9.net:5053/dns-query?name=${encodeURIComponent(d)}&type=SOA&do=1`, {
      headers: { accept: "application/dns-json" },
      signal: AbortSignal.timeout(3000),
    });
    if (res.ok) state = dnssecFromDoh(await res.json());
  } catch {
    state = "unknown";
  }
  cache.set(d, { state, at: Date.now() });
  return state;
}
