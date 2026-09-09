import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ExaResult = { title?: string; url?: string; highlights?: string[]; text?: string };
type Profile = { title: string; url: string; excerpt: string };
const clean = (value: string) => value.replace(/\s+/g, " ").trim();

export async function POST(request: Request) {
  const apiKey = process.env.EXA_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "EXA_API_KEY is not configured in Vercel yet." }, { status: 503 });
  const body = await request.json().catch(() => ({}));
  const niche = clean(String(body.niche || "digital products")).slice(0, 160);
  const queries = [`site:instagram.com ${niche} "followers"`, `site:instagram.com ${niche} coach creator`, `site:instagram.com ${niche} educator`, `site:instagram.com ${niche} community`];
  const responses = await Promise.allSettled(queries.map((query) => searchExa(query, apiKey)));
  const seen = new Set<string>();
  const profiles: Profile[] = responses.flatMap((response) => response.status === "fulfilled" ? response.value : [])
    .filter((result) => result.url && isInstagramProfile(result.url) && !seen.has(normalizeProfileUrl(result.url)) && Boolean(seen.add(normalizeProfileUrl(result.url))))
    .map((result) => ({ title: clean(result.title || "Instagram creator"), url: normalizeProfileUrl(result.url!), excerpt: clean(result.highlights?.[0] || result.text?.slice(0, 300) || "Public Instagram profile found through niche research.") }))
    .slice(0, 24);
  const enriched = await Promise.all(profiles.map(async (profile, index) => {
    const publicData = await inspectPublicProfile(profile.url);
    const combined = `${profile.title} ${profile.excerpt} ${publicData}`;
    const followers = parseFollowers(combined);
    const handle = new URL(profile.url).pathname.split("/").filter(Boolean)[0] || `creator${index + 1}`;
    return { id: `instagram-${index + 1}`, name: creatorName(profile.title, handle), handle: `@${handle.replace(/^@/, "")}`, platform: "Instagram", url: profile.url, followers, followerLabel: followers ? formatFollowers(followers) : "Public count unavailable", countSource: followers ? "Public profile metadata/search evidence" : "Needs profile verification", audience: followers ? `${formatFollowers(followers)} followers` : "Follower count unavailable", fit: Math.max(55, 91 - index), evidence: profile.excerpt, inMicroRange: Boolean(followers && followers >= 10_000 && followers <= 100_000) };
  }));
  const creators = enriched.sort((a, b) => Number(b.inMicroRange) - Number(a.inMicroRange) || b.fit - a.fit);
  return NextResponse.json({ niche, creators, sourceCount: creators.length, verifiedMicroCount: creators.filter((creator) => creator.inMicroRange).length, generatedAt: new Date().toISOString() });
}

async function searchExa(query: string, apiKey: string): Promise<ExaResult[]> { const response = await fetch("https://api.exa.ai/search", { method: "POST", headers: { "Content-Type": "application/json", "x-api-key": apiKey }, body: JSON.stringify({ query, type: "auto", numResults: 16, contents: { highlights: { maxCharacters: 350 }, text: { maxCharacters: 350 } } }), cache: "no-store" }); if (!response.ok) throw new Error(`Exa returned ${response.status}`); const data = await response.json() as { results?: ExaResult[] }; return data.results ?? []; }
function isInstagramProfile(url: string) { try { const parsed = new URL(url); const handle = parsed.pathname.split("/").filter(Boolean)[0]?.toLowerCase(); return /(^|\.)instagram\.com$/i.test(parsed.hostname) && Boolean(handle) && !["p", "reel", "reels", "tv", "stories", "explore", "accounts", "direct", "about", "developer"].includes(handle || ""); } catch { return false; } }
function normalizeProfileUrl(url: string) { const parsed = new URL(url); const handle = parsed.pathname.split("/").filter(Boolean)[0]; return `https://www.instagram.com/${handle}/`; }
async function inspectPublicProfile(url: string) { try { const response = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 (compatible; Forge369Research/1.0)" }, redirect: "follow", cache: "no-store", signal: AbortSignal.timeout(5000) }); if (!response.ok) return ""; const html = await response.text(); return html.slice(0, 180000); } catch { return ""; } }
function parseFollowers(value: string) { const match = value.match(/([\d,.]+)\s*([kmb])?\s+(?:followers?|follower)/i); if (!match) return null; const number = Number(match[1].replace(/,/g, "")); if (!Number.isFinite(number)) return null; const multiplier = match[2]?.toLowerCase() === "m" ? 1_000_000 : match[2]?.toLowerCase() === "b" ? 1_000_000_000 : match[2]?.toLowerCase() === "k" ? 1_000 : 1; return Math.round(number * multiplier); }
function formatFollowers(value: number) { return value >= 1_000_000 ? `${(value / 1_000_000).toFixed(value % 1_000_000 ? 1 : 0)}M` : value >= 1_000 ? `${(value / 1_000).toFixed(value % 1_000 ? 1 : 0)}K` : String(value); }
function creatorName(title: string, handle: string) { return clean(title.replace(/\s*(on Instagram|\| Instagram|• Instagram).*$/i, "").replace(new RegExp(`@?${handle}`, "ig"), "")) || handle; }
