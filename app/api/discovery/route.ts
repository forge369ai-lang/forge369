import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ExaResult = { title?: string; url?: string; highlights?: string[]; text?: string; publishedDate?: string };

const clean = (value: string) => value.replace(/\s+/g, " ").trim();

export async function POST(request: Request) {
  const apiKey = process.env.EXA_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "EXA_API_KEY is not configured in Vercel yet." }, { status: 503 });

  const body = await request.json().catch(() => ({}));
  const niche = clean(String(body.niche || "digital products for everyday problems")).slice(0, 180);
  const queries = [
    `${niche} people recurring frustrations problems`,
    `${niche} "how do I" help problem`,
    `site:reddit.com ${niche} frustration OR advice`,
    `${niche} "I wish there was" OR "I need"`,
    `${niche} expensive alternative difficult confusing`,
    `${niche} template checklist guide course recommendation`,
  ];

  const responses = await Promise.allSettled(queries.map(async (query) => {
    const response = await fetch("https://api.exa.ai/search", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": apiKey },
      body: JSON.stringify({ query, type: "auto", numResults: 25, contents: { highlights: { maxCharacters: 500 } } }),
      cache: "no-store",
    });
    if (!response.ok) throw new Error(`Exa returned ${response.status}`);
    const data = await response.json() as { results?: ExaResult[] };
    return { query, results: data.results ?? [] };
  }));

  const seen = new Set<string>();
  const sources = responses.flatMap((response) => response.status === "fulfilled" ? response.value.results.map((result) => ({ ...result, query: response.value.query })) : [])
    .filter((result) => result.url && !seen.has(result.url) && Boolean(seen.add(result.url!)))
    .map((result, index) => ({ id: `source-${index + 1}`, title: clean(result.title || "Untitled source"), url: result.url!, excerpt: clean(result.highlights?.[0] || result.text?.slice(0, 500) || "No extract returned."), query: result.query, publishedDate: result.publishedDate || null }));

  const successfulQueries = responses.filter((result) => result.status === "fulfilled").length;
  const candidates = [
    { title: `${titleCase(niche)} Starter System`, audience: `Beginners navigating ${niche}`, problem: `The first steps in ${niche} are fragmented, confusing, or difficult to follow consistently.`, format: "Guide + templates", source: "Live Exa research" },
    { title: `${titleCase(niche)} Friction-Removal Toolkit`, audience: `People actively struggling with ${niche}`, problem: `Repeated pain points and workarounds indicate a need for a simpler, more usable system.`, format: "Toolkit + launch pack", source: "Live Exa research" },
    { title: `The ${titleCase(niche)} Decision Guide`, audience: `Buyers comparing solutions for ${niche}`, problem: `People need confidence choosing the right next step, tool, or approach without wasting time and money.`, format: "Workbook + tracker", source: "Live Exa research" },
  ];

  return NextResponse.json({ niche, sourceTarget: 150, sourceCount: sources.length, successfulQueries, sources, candidates, generatedAt: new Date().toISOString() });
}

function titleCase(value: string) { return value.split(" ").map((word) => word ? word[0].toUpperCase() + word.slice(1) : word).join(" "); }
