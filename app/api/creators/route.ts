import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ExaResult = { title?: string; url?: string; highlights?: string[]; text?: string };
const clean = (value: string) => value.replace(/\s+/g, " ").trim();

export async function POST(request: Request) {
  const apiKey = process.env.EXA_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "EXA_API_KEY is not configured in Vercel yet." }, { status: 503 });
  const body = await request.json().catch(() => ({}));
  const niche = clean(String(body.niche || "digital products")).slice(0, 160);
  const queries = [
    `site:instagram.com ${niche} creator`,
    `site:tiktok.com ${niche} creator`,
    `site:youtube.com ${niche} creator channel`,
    `${niche} Instagram creator audience`,
    `${niche} TikTok educator creator`,
  ];
  const results = await Promise.allSettled(queries.map(async (query) => {
    const response = await fetch("https://api.exa.ai/search", { method: "POST", headers: { "Content-Type": "application/json", "x-api-key": apiKey }, body: JSON.stringify({ query, type: "auto", numResults: 12, contents: { highlights: { maxCharacters: 300 } } }), cache: "no-store" });
    if (!response.ok) throw new Error(`Exa returned ${response.status}`);
    const data = await response.json() as { results?: ExaResult[] };
    return data.results ?? [];
  }));
  const seen = new Set<string>();
  const creators = results.flatMap((result) => result.status === "fulfilled" ? result.value : [])
    .filter((result) => result.url && !seen.has(result.url) && Boolean(seen.add(result.url!)))
    .map((result, index) => {
      const url = result.url!;
      const platform = /instagram\.com/i.test(url) ? "Instagram" : /tiktok\.com/i.test(url) ? "TikTok" : /youtube\.com/i.test(url) ? "YouTube" : "Web";
      const title = clean(result.title || "Creator profile");
      const handle = extractHandle(url, title, index);
      return { id: `creator-${index + 1}`, name: title.replace(/\s*[-|–].*$/, "") || "Creator profile", handle, platform, url, audience: "Follower count to verify", fit: Math.max(58, 86 - index), evidence: clean(result.highlights?.[0] || result.text?.slice(0, 260) || `Found through live ${platform} creator research.`) };
    }).slice(0, 30);
  return NextResponse.json({ niche, creators, sourceCount: creators.length, generatedAt: new Date().toISOString() });
}

function extractHandle(url: string, fallback: string, index: number) {
  const path = new URL(url).pathname.split("/").filter(Boolean)[0];
  if (path && !["channel", "c", "@"].includes(path)) return `@${path.replace(/^@/, "")}`;
  return `@${fallback.toLowerCase().replace(/[^a-z0-9]+/g, "").slice(0, 20) || `creator${index + 1}`}`;
}
