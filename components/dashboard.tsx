"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowRight, BarChart3, Box, Check, ChevronRight, CircleDot, Compass, FileText, Flame, LayoutDashboard, Play, Search, Settings, Sparkles, Target, Zap } from "lucide-react";
import { opportunities } from "@/lib/demo-data";
import { scoreOpportunity } from "@/lib/scoring";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import type { Opportunity } from "@/lib/types";

const nav = [["Command Center", LayoutDashboard], ["Discover", Compass], ["Opportunities", Target], ["Product Studio", Box], ["Launch Packs", FileText], ["Analytics", BarChart3]] as const;
type View = (typeof nav)[number][0];

export default function Dashboard() {
  const [manualOpportunities, setManualOpportunities] = useState<Opportunity[]>([]);
  const ranked = useMemo<Opportunity[]>(() => [...opportunities, ...manualOpportunities].sort((a, b) => scoreOpportunity(b) - scoreOpportunity(a)), [manualOpportunities]);
  const [selected, setSelected] = useState(ranked[0].id);
  const [view, setView] = useState<View>("Command Center");
  const [scanState, setScanState] = useState<"idle" | "running" | "complete">("idle");
  const [charterReady, setCharterReady] = useState(false);
  const [launchReady, setLaunchReady] = useState(false);
  const [email, setEmail] = useState("");
  const [databaseState, setDatabaseState] = useState<"checking" | "not-configured" | "signed-out" | "ready" | "saving">("checking");
  const [databaseMessage, setDatabaseMessage] = useState("");
  const active = ranked.find((item) => item.id === selected)!;
  const runScan = () => { setView("Discover"); setScanState("running"); window.setTimeout(() => setScanState("complete"), 1200); };

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) { setDatabaseState("not-configured"); return; }
    supabase.auth.getUser().then(({ data }) => {
      setDatabaseState(data.user ? "ready" : "signed-out");
      if (data.user) setDatabaseMessage(`Connected as ${data.user.email ?? "Forge369 user"}`);
    });
  }, []);

  useEffect(() => {
    const saved = window.localStorage.getItem("forge369-manual-opportunities");
    if (saved) setManualOpportunities(JSON.parse(saved) as Opportunity[]);
  }, []);

  function addManualOpportunity(input: Pick<Opportunity, "title" | "audience" | "problem" | "format">) {
    const item: Opportunity = { id: `manual-${Date.now()}`, ...input, source: "Founder input", urgency: 7, demand: 7, willingness: 7, transformation: 8, competition: 6, reach: 7, feasibility: 8, expansion: 7, trend: "Emerging" };
    const next = [...manualOpportunities, item];
    setManualOpportunities(next);
    window.localStorage.setItem("forge369-manual-opportunities", JSON.stringify(next));
    setSelected(item.id);
  }

  async function sendMagicLink() {
    const supabase = getSupabaseBrowserClient();
    if (!supabase || !email.trim()) { setDatabaseMessage("Enter your email address to receive a secure sign-in link."); return; }
    const { error } = await supabase.auth.signInWithOtp({ email: email.trim(), options: { emailRedirectTo: window.location.origin } });
    setDatabaseMessage(error ? error.message : "Check your email for the secure Forge369 sign-in link.");
  }

  async function saveWorkspace() {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) { setDatabaseState("signed-out"); return; }
    setDatabaseState("saving");
    const displayName = auth.user.email?.split("@")[0] ?? "Forge369 user";
    const { error: profileError } = await supabase.from("profiles").upsert({ id: auth.user.id, display_name: displayName });
    if (profileError) { setDatabaseState("ready"); setDatabaseMessage(profileError.message); return; }
    const { count, error: countError } = await supabase.from("opportunities").select("id", { count: "exact", head: true });
    if (countError) { setDatabaseState("ready"); setDatabaseMessage(countError.message); return; }
    if (!count) {
      const { error } = await supabase.from("opportunities").insert(ranked.map((item) => ({ owner_id: auth.user.id, title: item.title, audience: item.audience, problem: item.problem, recommended_format: item.format, source_label: item.source, status: "shortlisted", scores: { urgency: item.urgency, demand: item.demand, willingness: item.willingness, transformation: item.transformation, competition: item.competition, reach: item.reach, feasibility: item.feasibility, expansion: item.expansion }, total_score: scoreOpportunity(item) })));
      if (error) { setDatabaseState("ready"); setDatabaseMessage(error.message); return; }
    }
    setDatabaseState("ready"); setDatabaseMessage(count ? "Your workspace is already saved in Supabase." : "Saved your first three scored opportunities to Supabase.");
  }

  return <main className="shell"><aside className="sidebar"><div className="brand"><span className="brand-mark"><Flame size={19} /></span><span>FORGE<span>369</span></span></div><p className="eyebrow">DIGITAL PRODUCT FOUNDRY</p><nav>{nav.map(([label, Icon]) => <button onClick={() => setView(label)} className={view === label ? "nav-item active" : "nav-item"} key={label}><Icon size={17} /> {label}{label === "Opportunities" && <span className="count">{ranked.length}</span>}</button>)}</nav><div className="sidebar-bottom"><button className="nav-item"><Settings size={17} /> Settings</button><div className="profile"><div className="avatar">JS</div><div><strong>Jay Steenkamp</strong><span>Founder workspace</span></div></div></div></aside>
    <section className="workspace"><header><div><p className="eyebrow">FORGE369 MVP · DEMO MODE</p><h1>{view}</h1><p>Find demand. Forge value. Ship products.</p></div><button className="primary" onClick={runScan}><Sparkles size={17} /> Run discovery scan</button></header>
      <DatabasePanel state={databaseState} message={databaseMessage} email={email} setEmail={setEmail} onSignIn={sendMagicLink} onSave={saveWorkspace} />
      {view === "Command Center" && <CommandCenter ranked={ranked} selected={selected} setSelected={setSelected} active={active} setView={setView} runScan={runScan} charterReady={charterReady} launchReady={launchReady} />}
      {view === "Discover" && <Discover scanState={scanState} runScan={runScan} onReview={() => setView("Opportunities")} onAdd={addManualOpportunity} />}
      {view === "Opportunities" && <Opportunities ranked={ranked} selected={selected} setSelected={setSelected} onBuild={() => setView("Product Studio")} />}
      {view === "Product Studio" && <ProductStudio active={active} charterReady={charterReady} setCharterReady={setCharterReady} onPackage={() => setView("Launch Packs")} />}
      {view === "Launch Packs" && <LaunchPacks active={active} launchReady={launchReady} setLaunchReady={setLaunchReady} />}
      {view === "Analytics" && <Analytics />}</section></main>;
}

function CommandCenter({ ranked, selected, setSelected, active, setView, runScan, charterReady, launchReady }: { ranked: Opportunity[]; selected: string; setSelected: (id: string) => void; active: Opportunity; setView: (view: View) => void; runScan: () => void; charterReady: boolean; launchReady: boolean }) { return <><div className="signal-bar"><div><span className="live-dot" /> DISCOVERY ENGINE READY</div><p>Use the scanner to collect and score market signals.</p><button onClick={runScan}>Run scan <ArrowRight size={15} /></button></div><div className="metrics"><Metric label="Opportunities" value={String(ranked.length)} note="Ranked by Forge Score" icon={<Target />} /><Metric label="Average score" value="76" note="Strong potential" icon={<BarChart3 />} /><Metric label="In production" value={charterReady ? "2" : "1"} note={charterReady ? "Product charter created" : "The Lucid Threshold"} icon={<Zap />} /><Metric label="Launch packs" value={launchReady ? "2" : "1"} note={launchReady ? "New pack prepared" : "Customer package"} icon={<Check />} /></div><div className="section-head"><div><p className="eyebrow">TODAY'S SHORTLIST</p><h2>Top profit pockets</h2></div><button onClick={() => setView("Opportunities")} className="text-button">View all opportunities <ChevronRight size={15} /></button></div><div className="content-grid"><div className="opportunity-list">{ranked.map((item, index) => <OpportunityCard key={item.id} item={item} index={index} selected={selected === item.id} onClick={() => setSelected(item.id)} />)}</div><OpportunityBrief active={active} onBuild={() => setView("Product Studio")} /></div><section className="pipeline"><div className="section-head"><div><p className="eyebrow">ACTIVE BUILD</p><h2>The Lucid Threshold</h2></div><span className="status"><CircleDot size={14} /> Quality review</span></div><div className="steps">{["Validate", "Architect", "Research", "Create", "Polish", "Package"].map((step, index) => <div className={index < 5 ? "step complete" : "step"} key={step}><span>{index < 5 ? <Check size={14} /> : index + 1}</span><p>{step}</p></div>)}</div></section></>; }
function Discover({ scanState, runScan, onReview, onAdd }: { scanState: "idle" | "running" | "complete"; runScan: () => void; onReview: () => void; onAdd: (input: Pick<Opportunity, "title" | "audience" | "problem" | "format">) => void }) { const finished = scanState === "complete"; return <section className="workflow-card"><p className="eyebrow">STEP 01 · MARKET DISCOVERY</p><h2>Scan for real problems worth solving</h2><p>Use a scan when connected sources are available, or capture a high-conviction opportunity manually right now. Manual entries are stored in this browser until you sign in.</p><div className="scan-panel"><Search size={24} /><div><strong>{scanState === "running" ? "Scanning creator, search and community signals…" : finished ? "12 signals found and ranked" : "Ready to run your first discovery scan"}</strong><span>{finished ? "Each opportunity is scored before product creation begins." : "Live external data sources are connected in the next build."}</span></div>{scanState !== "running" && <button className="primary" onClick={runScan}>{finished ? "Run again" : "Start scan"}</button>}</div><ManualIntake onAdd={onAdd} />{finished && <div className="result-list"><div><Check size={16} /> High-intent beginner learning signal</div><div><Check size={16} /> Repeated remote-work pain point</div><div><Check size={16} /> Family time-saving demand cluster</div><button className="primary" onClick={onReview}>Review scored opportunities <ArrowRight size={16} /></button></div>}</section>; }
function Opportunities({ ranked, selected, setSelected, onBuild }: { ranked: Opportunity[]; selected: string; setSelected: (id: string) => void; onBuild: () => void }) { const active = ranked.find((item) => item.id === selected)!; return <><div className="section-head"><div><p className="eyebrow">STEP 02 · DECIDE</p><h2>Ranked opportunities</h2></div><span className="status"><CircleDot size={14} /> Evidence review</span></div><div className="content-grid"><div className="opportunity-list">{ranked.map((item, index) => <OpportunityCard key={item.id} item={item} index={index} selected={selected === item.id} onClick={() => setSelected(item.id)} />)}</div><OpportunityBrief active={active} onBuild={onBuild} /></div></>; }
function ProductStudio({ active, charterReady, setCharterReady, onPackage }: { active: Opportunity; charterReady: boolean; setCharterReady: (value: boolean) => void; onPackage: () => void }) { return <section className="workflow-card"><p className="eyebrow">STEP 03 · PRODUCT STUDIO</p><h2>{active.title}</h2><p>Turn a validated opportunity into a defined product before generating assets.</p><div className="charter-grid"><div><span>Audience</span><strong>{active.audience}</strong></div><div><span>Core problem</span><strong>{active.problem}</strong></div><div><span>Recommended format</span><strong>{active.format}</strong></div><div><span>Target transformation</span><strong>From uncertainty to a clear, usable result.</strong></div></div>{!charterReady ? <button className="primary" onClick={() => setCharterReady(true)}><Sparkles size={17} /> Generate product charter</button> : <div className="success-panel"><Check size={19} /><div><strong>Product charter created</strong><span>Audience, outcome, product format and asset list are ready for production.</span></div><button className="primary" onClick={onPackage}>Create launch pack <ArrowRight size={16} /></button></div>}</section>; }
function LaunchPacks({ active, launchReady, setLaunchReady }: { active: Opportunity; launchReady: boolean; setLaunchReady: (value: boolean) => void }) { return <section className="workflow-card"><p className="eyebrow">STEP 04 · LAUNCH PACK</p><h2>Prepare a product for Whop</h2><p>Build delivery, sales copy and onboarding assets from the approved product charter.</p>{!launchReady ? <button className="primary" onClick={() => setLaunchReady(true)}><Play size={16} /> Build launch pack</button> : <div className="pack-grid"><div><Check size={17} /><strong>Product overview</strong><span>{active.title}</span></div><div><Check size={17} /><strong>Offer copy</strong><span>Headline, description and FAQs</span></div><div><Check size={17} /><strong>Delivery checklist</strong><span>Files, onboarding and access</span></div><div><Check size={17} /><strong>Whop listing</strong><span>Ready for manual upload</span></div></div>}</section>; }
function ManualIntake({ onAdd }: { onAdd: (input: Pick<Opportunity, "title" | "audience" | "problem" | "format">) => void }) { const [title, setTitle] = useState(""); const [audience, setAudience] = useState(""); const [problem, setProblem] = useState(""); const [format, setFormat] = useState("Guide + templates"); const [saved, setSaved] = useState(false); function submit(event: React.FormEvent) { event.preventDefault(); if (!title.trim() || !audience.trim() || !problem.trim()) return; onAdd({ title: title.trim(), audience: audience.trim(), problem: problem.trim(), format }); setTitle(""); setAudience(""); setProblem(""); setSaved(true); window.setTimeout(() => setSaved(false), 2500); } return <form className="intake-form" onSubmit={submit}><div className="form-head"><div><p className="eyebrow">FOUNDER INPUT</p><h3>Add a profit pocket manually</h3></div>{saved && <span className="status"><Check size={14} /> Added and scored</span>}</div><label>Product idea<input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="e.g. The Quiet Home Office System" /></label><label>Who needs it?<input value={audience} onChange={(event) => setAudience(event.target.value)} placeholder="e.g. Remote workers in noisy households" /></label><label>What painful problem does it solve?<textarea value={problem} onChange={(event) => setProblem(event.target.value)} placeholder="Describe the recurring frustration or desired outcome." /></label><label>Recommended format<select value={format} onChange={(event) => setFormat(event.target.value)}><option>Guide + templates</option><option>Workbook + tracker</option><option>Course + community</option><option>Toolkit + launch pack</option></select></label><button className="primary" type="submit">Add and score opportunity <ArrowRight size={16} /></button></form>; }
function Analytics() { return <section className="workflow-card"><p className="eyebrow">MEASURE WHAT WORKS</p><h2>Analytics will unlock after launch</h2><p>Once Whop and product analytics are connected, Forge369 will track conversion, refunds, completion, feedback and update opportunities.</p></section>; }
function OpportunityCard({ item, index, selected, onClick }: { item: Opportunity; index: number; selected: boolean; onClick: () => void }) { const score = scoreOpportunity(item); return <button onClick={onClick} className={selected ? "opportunity selected" : "opportunity"}><div className="rank">0{index + 1}</div><div className="opportunity-copy"><div className="tag-row"><span>{item.trend}</span><span>{item.source}</span></div><h3>{item.title}</h3><p>{item.problem}</p><small>{item.format}</small></div><div className="score"><strong>{score}</strong><span>/100</span></div></button>; }
function OpportunityBrief({ active, onBuild }: { active: Opportunity; onBuild: () => void }) { return <aside className="detail-card"><p className="eyebrow">OPPORTUNITY BRIEF</p><h2>{active.title}</h2><div className="detail-block"><span>Ideal customer</span><p>{active.audience}</p></div><div className="detail-block"><span>Problem worth solving</span><p>{active.problem}</p></div><div className="score-ring"><div><strong>{scoreOpportunity(active)}</strong><span>Forge Score</span></div></div><div className="mini-scores"><Mini label="Demand" value={active.demand} /><Mini label="Urgency" value={active.urgency} /><Mini label="Transformation" value={active.transformation} /><Mini label="Reach" value={active.reach} /></div><button className="primary full" onClick={onBuild}>Open in Product Studio <ArrowRight size={16} /></button></aside>; }
function Metric({ label, value, note, icon }: { label: string; value: string; note: string; icon: React.ReactNode }) { return <div className="metric"><div className="metric-icon">{icon}</div><div><span>{label}</span><strong>{value}</strong><small>{note}</small></div></div>; }
function Mini({ label, value }: { label: string; value: number }) { return <div><span>{label}</span><div className="bar"><i style={{ width: `${value * 10}%` }} /></div><strong>{value}/10</strong></div>; }
function DatabasePanel({ state, message, email, setEmail, onSignIn, onSave }: { state: "checking" | "not-configured" | "signed-out" | "ready" | "saving"; message: string; email: string; setEmail: (email: string) => void; onSignIn: () => void; onSave: () => void }) {
  if (state === "checking") return <div className="database-panel"><span className="live-dot" /> Checking Forge369 database connection…</div>;
  if (state === "not-configured") return <div className="database-panel warning">Database variables are not available to this deployment yet. Redeploy after adding them in Vercel.</div>;
  if (state === "signed-out") return <div className="database-panel"><div><strong>Connect your Forge369 workspace</strong><span>Sign in securely to save opportunities and build products in Supabase.</span></div><input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" type="email" /><button className="primary" onClick={onSignIn}>Send sign-in link</button>{message && <small>{message}</small>}</div>;
  return <div className="database-panel ready"><div><span className="live-dot" /><strong> Supabase connected</strong><small>{message || "Your private Forge369 workspace is ready to save."}</small></div><button className="primary" onClick={onSave} disabled={state === "saving"}>{state === "saving" ? "Saving…" : "Save workspace"}</button></div>;
}
