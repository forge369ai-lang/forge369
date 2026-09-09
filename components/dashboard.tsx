"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  BarChart3,
  Box,
  Check,
  ChevronRight,
  CircleDot,
  Compass,
  Copy,
  Download,
  Eye,
  FileAudio,
  FileText,
  Flame,
  FolderLock,
  Handshake,
  LayoutDashboard,
  LockKeyhole,
  Mail,
  Play,
  Plus,
  Search,
  Settings,
  Sparkles,
  Target,
  Users,
  Zap,
} from "lucide-react";
import { opportunities } from "@/lib/demo-data";
import { scoreOpportunity } from "@/lib/scoring";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import type { Opportunity } from "@/lib/types";

const nav = [
  ["Command Center", LayoutDashboard],
  ["Discover", Compass],
  ["Opportunities", Target],
  ["Creator Network", Users],
  ["Outreach Studio", Mail],
  ["Partnership Projects", Handshake],
  ["Product Studio", Box],
  ["Product Assets", FolderLock],
  ["Launch Packs", FileText],
  ["Analytics", BarChart3],
] as const;
type View = (typeof nav)[number][0];

export default function Dashboard() {
  const [manualOpportunities, setManualOpportunities] = useState<Opportunity[]>(
    [],
  );
  const ranked = useMemo<Opportunity[]>(
    () =>
      [...opportunities, ...manualOpportunities].sort(
        (a, b) => scoreOpportunity(b) - scoreOpportunity(a),
      ),
    [manualOpportunities],
  );
  const [selected, setSelected] = useState(ranked[0].id);
  const [view, setView] = useState<View>("Command Center");
  const [scanState, setScanState] = useState<"idle" | "running" | "complete">(
    "idle",
  );
  const [charters, setCharters] = useState<Record<string, boolean>>({});
  const [launchPacks, setLaunchPacks] = useState<Record<string, boolean>>({});
  const [email, setEmail] = useState("");
  const [databaseState, setDatabaseState] = useState<
    "checking" | "not-configured" | "signed-out" | "ready" | "saving"
  >("checking");
  const [databaseMessage, setDatabaseMessage] = useState("");
  const [profitSearch, setProfitSearch] = useState("");
  const active = ranked.find((item) => item.id === selected)!;
  const runScan = () => {
    setView("Discover");
    setScanState("running");
    window.setTimeout(() => setScanState("complete"), 1200);
  };

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setDatabaseState("not-configured");
      return;
    }
    supabase.auth.getUser().then(({ data }) => {
      setDatabaseState(data.user ? "ready" : "signed-out");
      if (data.user)
        setDatabaseMessage(
          `Connected as ${data.user.email ?? "Forge369 user"}`,
        );
    });
  }, []);

  useEffect(() => {
    const saved = window.localStorage.getItem("forge369-manual-opportunities");
    if (saved) setManualOpportunities(JSON.parse(saved) as Opportunity[]);
  }, []);

  function addManualOpportunity(
    input: Pick<Opportunity, "title" | "audience" | "problem" | "format"> & {
      source?: string;
    },
  ) {
    const existing = ranked.find(
      (item) =>
        item.title.toLowerCase() === input.title.toLowerCase() &&
        item.source === (input.source ?? "Founder input"),
    );
    if (existing) {
      setSelected(existing.id);
      return;
    }
    const item: Opportunity = {
      id: `manual-${Date.now()}`,
      title: input.title,
      audience: input.audience,
      problem: input.problem,
      format: input.format,
      source: input.source ?? "Founder input",
      urgency: 7,
      demand: 7,
      willingness: 7,
      transformation: 8,
      competition: 6,
      reach: 7,
      feasibility: 8,
      expansion: 7,
      trend: input.source ? "Rising" : "Emerging",
    };
    const next = [...manualOpportunities, item];
    setManualOpportunities(next);
    window.localStorage.setItem(
      "forge369-manual-opportunities",
      JSON.stringify(next),
    );
    setSelected(item.id);
  }

  async function sendMagicLink() {
    const supabase = getSupabaseBrowserClient();
    if (!supabase || !email.trim()) {
      setDatabaseMessage(
        "Enter your email address to receive a secure sign-in link.",
      );
      return;
    }
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: window.location.origin },
    });
    setDatabaseMessage(
      error
        ? error.message
        : "Check your email for the secure Forge369 sign-in link.",
    );
  }

  async function saveWorkspace() {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) {
      setDatabaseState("signed-out");
      return;
    }
    setDatabaseState("saving");
    const displayName = auth.user.email?.split("@")[0] ?? "Forge369 user";
    const { error: profileError } = await supabase
      .from("profiles")
      .upsert({ id: auth.user.id, display_name: displayName });
    if (profileError) {
      setDatabaseState("ready");
      setDatabaseMessage(profileError.message);
      return;
    }
    const { count, error: countError } = await supabase
      .from("opportunities")
      .select("id", { count: "exact", head: true });
    if (countError) {
      setDatabaseState("ready");
      setDatabaseMessage(countError.message);
      return;
    }
    if (!count) {
      const { error } = await supabase
        .from("opportunities")
        .insert(
          ranked.map((item) => ({
            owner_id: auth.user.id,
            title: item.title,
            audience: item.audience,
            problem: item.problem,
            recommended_format: item.format,
            source_label: item.source,
            status: "shortlisted",
            scores: {
              urgency: item.urgency,
              demand: item.demand,
              willingness: item.willingness,
              transformation: item.transformation,
              competition: item.competition,
              reach: item.reach,
              feasibility: item.feasibility,
              expansion: item.expansion,
            },
            total_score: scoreOpportunity(item),
          })),
        );
      if (error) {
        setDatabaseState("ready");
        setDatabaseMessage(error.message);
        return;
      }
    }
    setDatabaseState("ready");
    setDatabaseMessage(
      count
        ? "Your workspace is already saved in Supabase."
        : "Saved your first three scored opportunities to Supabase.",
    );
  }

  return (
    <main className="shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">
            <Flame size={19} />
          </span>
          <span>
            FORGE<span>369</span>
          </span>
        </div>
        <p className="eyebrow">DIGITAL PRODUCT FOUNDRY</p>
        <nav>
          {nav.map(([label, Icon]) => (
            <button
              onClick={() => setView(label)}
              className={view === label ? "nav-item active" : "nav-item"}
              key={label}
            >
              <Icon size={17} /> {label}
              {label === "Opportunities" && (
                <span className="count">{ranked.length}</span>
              )}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <button className="nav-item">
            <Settings size={17} /> Settings
          </button>
          <div className="profile">
            <div className="avatar">JS</div>
            <div>
              <strong>Jay Steenkamp</strong>
              <span>Founder workspace</span>
            </div>
          </div>
        </div>
      </aside>
      <section className="workspace">
        <header>
          <div>
            <p className="eyebrow">FORGE369 MVP · DEMO MODE</p>
            <h1>{view}</h1>
            <p>Find demand. Forge value. Ship products.</p>
          </div>
          <button className="primary" onClick={runScan}>
            <Sparkles size={17} /> Run discovery scan
          </button>
        </header>
        <DatabasePanel
          state={databaseState}
          message={databaseMessage}
          email={email}
          setEmail={setEmail}
          onSignIn={sendMagicLink}
          onSave={saveWorkspace}
        />
        {view === "Command Center" && (
          <CommandCenter
            ranked={ranked}
            selected={selected}
            setSelected={setSelected}
            active={active}
            setView={setView}
            runScan={runScan}
            charterCount={Object.keys(charters).length}
            launchCount={Object.keys(launchPacks).length}
            profitSearch={profitSearch}
            setProfitSearch={setProfitSearch}
          />
        )}
        {view === "Discover" && (
          <Discover
            scanState={scanState}
            runScan={runScan}
            onReview={() => setView("Opportunities")}
            onAdd={addManualOpportunity}
          />
        )}
        {view === "Opportunities" && (
          <Opportunities
            ranked={ranked}
            selected={selected}
            setSelected={setSelected}
            onBuild={() => setView("Product Studio")}
          />
        )}
        {view === "Creator Network" && <CreatorNetwork />}
        {view === "Outreach Studio" && <OutreachStudio active={active} />}
        {view === "Partnership Projects" && <PartnershipProjects active={active} onBuild={() => setView("Product Studio")} onLaunch={() => setView("Launch Packs")} />}
        {view === "Product Studio" && (
          <ProductStudio
            active={active}
            charterReady={Boolean(charters[active.id])}
            setCharterReady={() =>
              setCharters((current) => ({ ...current, [active.id]: true }))
            }
            onPackage={() => setView("Launch Packs")}
            onAssets={() => setView("Product Assets")}
          />
        )}
        {view === "Product Assets" && (
          <ProductAssets active={active} databaseState={databaseState} />
        )}
        {view === "Launch Packs" && (
          <LaunchPacks
            active={active}
            launchReady={Boolean(launchPacks[active.id])}
            setLaunchReady={() =>
              setLaunchPacks((current) => ({ ...current, [active.id]: true }))
            }
          />
        )}
        {view === "Analytics" && <Analytics />}
      </section>
    </main>
  );
}

function CommandCenter({
  ranked,
  selected,
  setSelected,
  active,
  setView,
  runScan,
  charterCount,
  launchCount,
  profitSearch,
  setProfitSearch,
}: {
  ranked: Opportunity[];
  selected: string;
  setSelected: (id: string) => void;
  active: Opportunity;
  setView: (view: View) => void;
  runScan: () => void;
  charterCount: number;
  launchCount: number;
  profitSearch: string;
  setProfitSearch: (value: string) => void;
}) {
  const query = profitSearch.trim().toLowerCase();
  const filtered = query
    ? ranked.filter((item) =>
        [item.title, item.audience, item.problem, item.format, item.source]
          .join(" ")
          .toLowerCase()
          .includes(query),
      )
    : ranked;
  return (
    <>
      <div className="signal-bar">
        <div>
          <span className="live-dot" /> DISCOVERY ENGINE READY
        </div>
        <p>Use the scanner to collect and score market signals.</p>
        <button onClick={runScan}>
          Run scan <ArrowRight size={15} />
        </button>
      </div>
      <div className="metrics">
        <Metric
          label="Opportunities"
          value={String(ranked.length)}
          note="Ranked by Forge Score"
          icon={<Target />}
        />
        <Metric
          label="Average score"
          value="76"
          note="Strong potential"
          icon={<BarChart3 />}
        />
        <Metric
          label="In production"
          value={String(charterCount)}
          note={charterCount ? "Product charters created" : "No charter yet"}
          icon={<Zap />}
        />
        <Metric
          label="Launch packs"
          value={String(launchCount)}
          note={launchCount ? "Ready to refine" : "None generated yet"}
          icon={<Check />}
        />
      </div>
      <div className="section-head shortlist-head">
        <div>
          <p className="eyebrow">TODAY'S SHORTLIST</p>
          <h2>Top profit pockets</h2>
        </div>
        <div className="profit-search">
          <Search size={15} />
          <input
            value={profitSearch}
            onChange={(event) => setProfitSearch(event.target.value)}
            placeholder="Search pockets, audiences, problems…"
          />
          {profitSearch && (
            <button onClick={() => setProfitSearch("")}>Clear</button>
          )}
        </div>
        <button
          onClick={() => setView("Opportunities")}
          className="text-button"
        >
          View all opportunities <ChevronRight size={15} />
        </button>
      </div>
      <div className="content-grid">
        <div className="opportunity-list">
          {filtered.length ? (
            filtered.map((item, index) => (
              <OpportunityCard
                key={item.id}
                item={item}
                index={index}
                selected={selected === item.id}
                onClick={() => setSelected(item.id)}
              />
            ))
          ) : (
            <div className="empty-search">
              No profit pockets match “{profitSearch}”.
            </div>
          )}
        </div>
        <OpportunityBrief
          active={active}
          onBuild={() => setView("Product Studio")}
        />
      </div>
      <section className="pipeline">
        <div className="section-head">
          <div>
            <p className="eyebrow">SELECTED BUILD</p>
            <h2>{active.title}</h2>
          </div>
          <span className="status">
            <CircleDot size={14} />{" "}
            {charterCount ? "In progress" : "Ready to architect"}
          </span>
        </div>
        <div className="steps">
          {[
            "Validate",
            "Architect",
            "Research",
            "Create",
            "Polish",
            "Package",
          ].map((step, index) => (
            <div
              className={
                index === 0 || (index === 1 && charterCount)
                  ? "step complete"
                  : "step"
              }
              key={step}
            >
              <span>
                {index === 0 || (index === 1 && charterCount) ? (
                  <Check size={14} />
                ) : (
                  index + 1
                )}
              </span>
              <p>{step}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
function CreatorNetwork() {
  const [creators, setCreators] = useState([
    {
      name: "Sample creator",
      handle: "@samplecreator",
      niche: "Parenting",
      audience: "42k followers",
      fit: 88,
      stage: "Qualified",
    },
  ]);
  const [name, setName] = useState("");
  const [handle, setHandle] = useState("");
  const [niche, setNiche] = useState("");
  useEffect(() => { const saved = window.localStorage.getItem("forge369-creators"); if (!saved) return; try { setCreators(JSON.parse(saved)); } catch { window.localStorage.removeItem("forge369-creators"); } }, []);
  useEffect(() => { window.localStorage.setItem("forge369-creators", JSON.stringify(creators)); }, [creators]);
  function addCreator(event: React.FormEvent) {
    event.preventDefault();
    if (!name.trim() || !handle.trim()) return;
    setCreators((current) => [
      {
        name: name.trim(),
        handle: handle.trim(),
        niche: niche.trim() || "Unassigned",
        audience: "Audience to verify",
        fit: 0,
        stage: "Prospect",
      },
      ...current,
    ]);
    setName("");
    setHandle("");
    setNiche("");
  }
  return (
    <section className="creator-network">
      <div className="creator-hero">
        <div>
          <p className="eyebrow">CREATOR PARTNERSHIPS</p>
          <h2>Build with audiences that already exist.</h2>
          <p>
            Track qualified micro-creators, launch conversations, and move
            partnerships from prospect to product launch.
          </p>
        </div>
        <div className="creator-stat">
          <Users size={20} />
          <strong>{creators.length}</strong>
          <span>creator records</span>
        </div>
      </div>
      <div className="creator-columns">
        <div className="creator-panel">
          <div className="form-head">
            <div>
              <p className="eyebrow">PARTNERSHIP PIPELINE</p>
              <h3>Creator network</h3>
            </div>
            <span className="status">
              <Handshake size={14} /> Profit-share ready
            </span>
          </div>
          {creators.map((creator) => (
            <div
              className="creator-row"
              key={`${creator.handle}-${creator.name}`}
            >
              <div className="creator-avatar">{creator.name.slice(0, 1)}</div>
              <div>
                <strong>{creator.name}</strong>
                <span>
                  {creator.handle} · {creator.niche}
                </span>
                <small>{creator.audience}</small>
              </div>
              <div className="creator-fit">
                <b>{creator.fit || "—"}</b>
                <span>fit</span>
              </div>
              <span className="creator-stage">{creator.stage}</span>
            </div>
          ))}
        </div>
        <form className="creator-form" onSubmit={addCreator}>
          <p className="eyebrow">MANUAL CREATOR INTAKE</p>
          <h3>Add a creator prospect</h3>
          <p>
            Add a creator from Listkit, Instagram, referrals, or direct
            research. The Listkit connector comes later; this keeps your
            pipeline moving now.
          </p>
          <label>
            Creator name
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="e.g. Sarah Adams"
            />
          </label>
          <label>
            Handle
            <input
              value={handle}
              onChange={(event) => setHandle(event.target.value)}
              placeholder="@sarahadams"
            />
          </label>
          <label>
            Niche
            <input
              value={niche}
              onChange={(event) => setNiche(event.target.value)}
              placeholder="e.g. Parenting"
            />
          </label>
          <button className="primary" type="submit">
            <Plus size={16} /> Add to creator network
          </button>
          <div className="creator-next">
            <Mail size={15} />
            <span>
              Next: qualify audience fit, then generate a compliant partnership
              proposal and outreach sequence.
            </span>
          </div>
        </form>
      </div>
    </section>
  );
}
function OutreachStudio({ active }: { active: Opportunity }) {
  const [creator, setCreator] = useState("Creator name");
  const [handle, setHandle] = useState("@creatorhandle");
  const [split, setSplit] = useState("50 / 50");
  const [copied, setCopied] = useState("");
  const firstName = creator.trim().split(" ")[0] || "there";
  const messages = [
    `Hi ${firstName},\n\nI came across ${handle} and like the way you help ${active.audience.toLowerCase()}. I’ve been researching the problems your audience repeatedly runs into, and I think there is an opportunity to build a genuinely useful digital product around ${active.title}.\n\nRather than sell you an agency service, I’d like to explore a simple profit-share partnership: we build and launch the product around your audience, and you share in the revenue.\n\nWould you be open to a short conversation so I can show you the product angle?`,
    `Hi ${firstName},\n\nQuick follow-up in case my note got buried. The idea is a product that helps your audience solve a specific recurring problem, with you as the trusted voice and Forge369 handling product creation, launch assets, and delivery.\n\nThe proposed split is ${split}, with terms agreed in writing before anything is built. No pressure at all, but would a 15-minute call next week be useful?`,
    `Hi ${firstName},\n\nLast note from me. I believe ${active.title} could become a useful offer for your audience because it addresses: ${active.problem}\n\nIf a partnership is not a fit right now, no need to reply. If it is interesting, I can send over a one-page concept and revenue-share outline.`,
  ];
  function copy(text: string, label: string) {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(label);
      window.setTimeout(() => setCopied(""), 1800);
    });
  }
  function downloadOnePager() {
    const content = `# Forge369 Partnership Concept

## Creator
${creator} (${handle})

## Product opportunity
**${active.title}**

${active.problem}

## Collaboration
${creator} brings audience trust, insight and promotion. Forge369 handles product strategy, creation, launch assets and delivery operations.

## Suggested revenue split
${split}

Final scope, ownership, promotion commitments, refund handling and payment timing must be agreed in writing before production begins.

## Next step
A short discovery call to verify audience need, product angle and launch fit.`;
    const url = URL.createObjectURL(new Blob([content], { type: "text/markdown" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${active.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-partnership-concept.md`;
    anchor.click();
    URL.revokeObjectURL(url);
  }
  return (
    <section className="outreach-studio">
      <div className="outreach-hero">
        <div>
          <p className="eyebrow">PARTNERSHIP OUTREACH</p>
          <h2>Start the right creator conversation.</h2>
          <p>
            Build an honest, personalized proposal around a validated profit
            pocket. Forge369 drafts the sequence; you approve and send it
            through your chosen, compliant sending platform.
          </p>
        </div>
        <Handshake size={34} />
      </div>
      <div className="outreach-layout">
        <aside className="outreach-brief">
          <p className="eyebrow">PARTNERSHIP BRIEF</p>
          <label>
            Creator name
            <input
              value={creator}
              onChange={(event) => setCreator(event.target.value)}
              placeholder="Creator name"
            />
          </label>
          <label>
            Creator handle
            <input
              value={handle}
              onChange={(event) => setHandle(event.target.value)}
              placeholder="@creatorhandle"
            />
          </label>
          <label>
            Suggested revenue split
            <select
              value={split}
              onChange={(event) => setSplit(event.target.value)}
            >
              <option>50 / 50</option>
              <option>60 creator / 40 Forge369</option>
              <option>70 creator / 30 Forge369</option>
            </select>
          </label>
          <div className="outreach-pocket">
            <span>Profit pocket</span>
            <strong>{active.title}</strong>
            <p>{active.problem}</p>
          </div>
          <div className="outreach-note">
            <LockKeyhole size={15} /> This creates a draft only. Obtain consent,
            honor opt-outs, and agree all terms in writing before sending or
            building.
          </div>
        </aside>
        <div className="sequence-panel">
          <div className="form-head">
            <div>
              <p className="eyebrow">5-TOUCH SEQUENCE</p>
              <h3>Copy-ready, personalized outreach</h3>
            </div>
            <span className="status">
              <Mail size={14} /> Draft only
            </span>
          </div>
          {messages.map((message, index) => (
            <article key={index}>
              <div>
                <span>EMAIL {index + 1}</span>
                <strong>
                  {index === 0
                    ? "Initial partnership invitation"
                    : index === 1
                      ? "Value-led follow-up"
                      : "Respectful final follow-up"}
                </strong>
              </div>
              <pre>{message}</pre>
              <button
                className="secondary"
                onClick={() => copy(message, `Email ${index + 1}`)}
              >
                <Copy size={14} />{" "}
                {copied === `Email ${index + 1}` ? "Copied" : "Copy message"}
              </button>
            </article>
          ))}
          <button className="primary full-width" onClick={downloadOnePager}>
            <Download size={16} /> Download partnership one-pager
          </button>
        </div>
      </div>
    </section>
  );
}
type PartnershipProjectRecord = { id: string; creator: string; handle: string; followers: string; split: string; status: "Prospect" | "Negotiating" | "Approved" | "Live"; opportunityId: string; opportunityTitle: string; whopUrl: string; price: number; sales: number; refunds: number; notes: string };

function PartnershipProjects({ active, onBuild, onLaunch }: { active: Opportunity; onBuild: () => void; onLaunch: () => void }) {
  const [projects, setProjects] = useState<PartnershipProjectRecord[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [creator, setCreator] = useState("");
  const [handle, setHandle] = useState("");
  const [followers, setFollowers] = useState("10k–100k");
  const [split, setSplit] = useState("50 / 50");
  useEffect(() => { const saved = window.localStorage.getItem("forge369-partnership-projects"); if (!saved) return; try { const parsed = JSON.parse(saved) as PartnershipProjectRecord[]; setProjects(parsed); if (parsed[0]) setSelectedId(parsed[0].id); } catch { window.localStorage.removeItem("forge369-partnership-projects"); } }, []);
  const selected = projects.find((project) => project.id === selectedId);
  function persist(next: PartnershipProjectRecord[]) { setProjects(next); window.localStorage.setItem("forge369-partnership-projects", JSON.stringify(next)); }
  function createProject(event: React.FormEvent) { event.preventDefault(); if (!creator.trim() || !handle.trim()) return; const record: PartnershipProjectRecord = { id: `partner-${Date.now()}`, creator: creator.trim(), handle: handle.trim(), followers, split, status: "Prospect", opportunityId: active.id, opportunityTitle: active.title, whopUrl: "", price: 37, sales: 0, refunds: 0, notes: "" }; const next = [record, ...projects]; persist(next); setSelectedId(record.id); setCreator(""); setHandle(""); }
  function update(patch: Partial<PartnershipProjectRecord>) { if (!selected) return; const next = projects.map((project) => project.id === selected.id ? { ...project, ...patch } : project); persist(next); }
  function buildProject() { if (selected) window.localStorage.setItem("forge369-active-partnership", JSON.stringify(selected)); onBuild(); }
  const share = selected ? (selected.split.startsWith("60") ? 0.6 : selected.split.startsWith("70") ? 0.7 : 0.5) : 0.5;
  const gross = selected ? selected.sales * selected.price : 0;
  const net = selected ? Math.max(0, gross - selected.refunds * selected.price) : 0;
  return <section className="partnership-projects"><div className="partner-hero"><div><p className="eyebrow">PARTNERSHIP OPERATING SYSTEM</p><h2>Turn creator interest into a shared launch.</h2><p>Each project links one creator to one profit pocket, then carries the work through terms, product creation, Whop publishing and revenue accounting.</p></div><div className="partner-hero-stat"><Handshake size={21} /><strong>{projects.length}</strong><span>active projects</span></div></div><div className="project-layout"><aside className="project-rail"><div className="form-head"><div><p className="eyebrow">PROJECTS</p><h3>Partnership pipeline</h3></div><span className="status"><CircleDot size={14} /> Local alpha</span></div>{projects.length ? projects.map((project) => <button key={project.id} onClick={() => setSelectedId(project.id)} className={project.id === selectedId ? "project-card selected" : "project-card"}><span>{project.status}</span><strong>{project.creator}</strong><small>{project.opportunityTitle}</small></button>) : <p className="project-empty">Create your first creator partnership project below.</p>}<button className="secondary full-width" onClick={() => setSelectedId("")}><Plus size={14} /> New project</button></aside><div className="project-workbench">{!selected ? <form className="project-create" onSubmit={createProject}><p className="eyebrow">NEW PARTNERSHIP PROJECT</p><h3>Link a creator to this profit pocket</h3><p>Create a real operating record first. You can add creators manually from Listkit, Instagram or referrals while integrations are still pending.</p><div className="project-form-grid"><label>Creator name<input value={creator} onChange={(event) => setCreator(event.target.value)} placeholder="e.g. Sarah Adams" /></label><label>Creator handle<input value={handle} onChange={(event) => setHandle(event.target.value)} placeholder="@sarahadams" /></label><label>Audience size<select value={followers} onChange={(event) => setFollowers(event.target.value)}><option>10k–25k</option><option>25k–50k</option><option>50k–100k</option><option>100k+</option></select></label><label>Initial revenue split<select value={split} onChange={(event) => setSplit(event.target.value)}><option>50 / 50</option><option>60 creator / 40 Forge369</option><option>70 creator / 30 Forge369</option></select></label></div><div className="linked-pocket"><span>LINKED PROFIT POCKET</span><strong>{active.title}</strong><p>{active.problem}</p></div><button className="primary" type="submit"><Handshake size={16} /> Create partnership project</button></form> : <><div className="project-top"><div><p className="eyebrow">{selected.status.toUpperCase()} PARTNERSHIP</p><h3>{selected.creator} <span>{selected.handle}</span></h3><p>Linked to <strong>{selected.opportunityTitle}</strong> · {selected.followers} audience</p></div><div className="project-top-actions"><button className="secondary" onClick={buildProject}><Box size={15} /> Build product</button><button className="primary" onClick={onLaunch}><ArrowRight size={15} /> Launch pack</button></div></div><div className="partner-metrics"><div><span>Deal split</span><strong>{selected.split}</strong><small>Creator / Forge369</small></div><div><span>Gross sales</span><strong>${gross.toFixed(0)}</strong><small>{selected.sales} customer sales</small></div><div><span>Creator share</span><strong>${(net * share).toFixed(0)}</strong><small>Based on net revenue</small></div><div><span>Forge369 share</span><strong>${(net * (1 - share)).toFixed(0)}</strong><small>Before platform costs</small></div></div><div className="deal-launch-grid"><section><p className="eyebrow">DEAL ROOM</p><h4>Terms and commitments</h4><label>Partnership status<select value={selected.status} onChange={(event) => update({ status: event.target.value as PartnershipProjectRecord["status"] })}><option>Prospect</option><option>Negotiating</option><option>Approved</option><option>Live</option></select></label><label>Revenue split<select value={selected.split} onChange={(event) => update({ split: event.target.value })}><option>50 / 50</option><option>60 creator / 40 Forge369</option><option>70 creator / 30 Forge369</option></select></label><label>Creator promotion commitment<textarea value={selected.notes} onChange={(event) => update({ notes: event.target.value })} placeholder="e.g. Two reels, three stories and a launch email." /></label><p className="terms-note"><LockKeyhole size={14} /> Record intent here, then put ownership, permissions, payment timing and refunds into a signed agreement.</p></section><section><p className="eyebrow">LAUNCH CONTROL</p><h4>Whop and creator campaign</h4><label>Whop product URL<input value={selected.whopUrl} onChange={(event) => update({ whopUrl: event.target.value })} placeholder="https://whop.com/..." /></label><label>Customer price (USD)<input type="number" min="0" value={selected.price} onChange={(event) => update({ price: Number(event.target.value) || 0 })} /></label><label>Recorded customer sales<input type="number" min="0" value={selected.sales} onChange={(event) => update({ sales: Number(event.target.value) || 0 })} /></label><label>Refunded sales<input type="number" min="0" value={selected.refunds} onChange={(event) => update({ refunds: Number(event.target.value) || 0 })} /></label><button className="secondary" onClick={() => update({ sales: selected.sales + 1 })}><Check size={14} /> Record a sale</button></section></div><div className="project-next"><Check size={16} /><span>{selected.status === "Prospect" ? "Next: qualify the audience and use Outreach Studio to open the conversation." : selected.status === "Negotiating" ? "Next: finalise the written deal and lock the creator’s promotion commitments." : selected.status === "Approved" ? "Next: build the creator-specific product, then prepare the Whop launch." : "Live project: keep revenue and refund counts accurate while collecting customer feedback."}</span></div></>}</div></div></section>;
}

function Discover({
  scanState,
  runScan,
  onReview,
  onAdd,
}: {
  scanState: "idle" | "running" | "complete";
  runScan: () => void;
  onReview: () => void;
  onAdd: (
    input: Pick<Opportunity, "title" | "audience" | "problem" | "format"> & {
      source?: string;
    },
  ) => void;
}) {
  return (
    <section className="workflow-card discovery-card">
      <p className="eyebrow">STEP 01 · LIVE MARKET DISCOVERY</p>
      <h2>Investigate demand, then choose what to forge</h2>
      <p>
        Run a live Exa research pass. Forge369 issues six buyer-intent query
        angles, reviews up to 150 returned source pages, preserves the evidence,
        and proposes candidates for your approval.
      </p>
      <LiveDiscovery onAdd={onAdd} onReview={onReview} />
      <div className="discovery-divider">
        <span>or add your own conviction</span>
      </div>
      <ManualIntake onAdd={onAdd} />
    </section>
  );
}

type LiveSource = {
  id: string;
  title: string;
  url: string;
  excerpt: string;
  query: string;
};
type LiveCandidate = {
  title: string;
  audience: string;
  problem: string;
  format: string;
  source: string;
};
function LiveDiscovery({
  onAdd,
  onReview,
}: {
  onAdd: (input: LiveCandidate) => void;
  onReview: () => void;
}) {
  const [niche, setNiche] = useState("");
  const [state, setState] = useState<"idle" | "running" | "complete" | "error">(
    "idle",
  );
  const [message, setMessage] = useState("");
  const [sources, setSources] = useState<LiveSource[]>([]);
  const [candidates, setCandidates] = useState<LiveCandidate[]>([]);
  const [added, setAdded] = useState<string[]>([]);
  useEffect(() => {
    const saved = window.localStorage.getItem("forge369-live-discovery");
    if (!saved) return;
    try {
      const data = JSON.parse(saved);
      setNiche(data.niche ?? "");
      setState(data.state === "complete" ? "complete" : "idle");
      setMessage(data.message ?? "");
      setSources(data.sources ?? []);
      setCandidates(data.candidates ?? []);
      setAdded(data.added ?? []);
    } catch {
      window.localStorage.removeItem("forge369-live-discovery");
    }
  }, []);
  function persist(data: {
    niche: string;
    state: "complete";
    message: string;
    sources: LiveSource[];
    candidates: LiveCandidate[];
    added: string[];
  }) {
    window.localStorage.setItem(
      "forge369-live-discovery",
      JSON.stringify(data),
    );
  }
  async function run() {
    setState("running");
    setMessage("");
    try {
      const response = await fetch("/api/discovery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ niche }),
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || "Discovery request failed.");
      const nextSources = data.sources || [];
      const nextCandidates = data.candidates || [];
      const nextMessage = `${data.sourceCount} unique sources returned across ${data.successfulQueries} research angles. Target: ${data.sourceTarget}.`;
      setSources(nextSources);
      setCandidates(nextCandidates);
      setAdded([]);
      setMessage(nextMessage);
      setState("complete");
      persist({
        niche,
        state: "complete",
        message: nextMessage,
        sources: nextSources,
        candidates: nextCandidates,
        added: [],
      });
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Discovery request failed.",
      );
      setState("error");
    }
  }
  function addCandidate(candidate: LiveCandidate) {
    if (added.includes(candidate.title)) return;
    onAdd(candidate);
    const nextAdded = [...added, candidate.title];
    setAdded(nextAdded);
    persist({
      niche,
      state: "complete",
      message,
      sources,
      candidates,
      added: nextAdded,
    });
  }
  return (
    <div className="live-discovery">
      <div className="live-controls">
        <label>
          Research niche or market
          <input
            value={niche}
            onChange={(event) => setNiche(event.target.value)}
            placeholder="e.g. sleep improvement for busy parents"
          />
        </label>
        <button
          className="primary"
          onClick={run}
          disabled={state === "running"}
        >
          {state === "running"
            ? "Investigating sources…"
            : "Run 150-source scan"}
        </button>
      </div>
      {state !== "idle" && (
        <div
          className={state === "error" ? "scan-status error" : "scan-status"}
        >
          <Search size={17} />
          <span>{message || "Building research brief…"}</span>
        </div>
      )}
      {state === "complete" && (
        <>
          <div className="candidate-grid">
            {candidates.map((candidate) => {
              const wasAdded = added.includes(candidate.title);
              return (
                <article key={candidate.title}>
                  <span className="status">
                    <CircleDot size={14} /> Candidate
                  </span>
                  <h3>{candidate.title}</h3>
                  <p>{candidate.problem}</p>
                  <small>For {candidate.audience}</small>
                  <button
                    className={
                      wasAdded ? "secondary candidate-added" : "secondary"
                    }
                    disabled={wasAdded}
                    onClick={() => addCandidate(candidate)}
                  >
                    {wasAdded ? (
                      <>
                        <Check size={14} /> Added to opportunities
                      </>
                    ) : (
                      <>
                        Add to scored opportunities <ArrowRight size={14} />
                      </>
                    )}
                  </button>
                </article>
              );
            })}
          </div>
          <div className="source-ledger">
            <div className="form-head">
              <div>
                <p className="eyebrow">EVIDENCE LEDGER</p>
                <h3>Live source review</h3>
              </div>
              <span className="status">
                <Check size={14} /> {sources.length} unique sources
              </span>
            </div>
            {sources.slice(0, 12).map((source) => (
              <a
                href={source.url}
                target="_blank"
                rel="noreferrer"
                key={source.id}
              >
                <strong>{source.title}</strong>
                <span>{source.excerpt}</span>
                <small>{source.query}</small>
              </a>
            ))}
            {sources.length > 12 && (
              <p className="ledger-note">
                Showing the first 12 evidence records. Your scan is retained in
                this browser, so you can return to it from any Forge369 section.
              </p>
            )}
            <button className="primary" onClick={onReview}>
              Review ranked opportunities <ArrowRight size={16} />
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function EvidenceCapture() {
  const [source, setSource] = useState("");
  const [insight, setInsight] = useState("");
  const [items, setItems] = useState<{ source: string; insight: string }[]>([]);
  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!source.trim() || !insight.trim()) return;
    setItems((current) => [
      { source: source.trim(), insight: insight.trim() },
      ...current,
    ]);
    setSource("");
    setInsight("");
  }
  return (
    <form className="evidence-form" onSubmit={submit}>
      <div className="form-head">
        <div>
          <p className="eyebrow">EVIDENCE INTAKE</p>
          <h3>Capture a buyer signal</h3>
        </div>
        <span className="status">
          <CircleDot size={14} /> {items.length} signals logged
        </span>
      </div>
      <label>
        Source URL or platform
        <input
          value={source}
          onChange={(event) => setSource(event.target.value)}
          placeholder="e.g. Reddit, YouTube comments, Google search result"
        />
      </label>
      <label>
        What is the buyer actually saying?
        <input
          value={insight}
          onChange={(event) => setInsight(event.target.value)}
          placeholder="Quote the pain point, objection, or desired outcome."
        />
      </label>
      <button className="secondary" type="submit">
        <Check size={15} /> Log evidence
      </button>
      {items.length > 0 && (
        <div className="evidence-log">
          {items.map((item, index) => (
            <div key={`${item.source}-${index}`}>
              <strong>{item.source}</strong>
              <span>{item.insight}</span>
            </div>
          ))}
        </div>
      )}
    </form>
  );
}
function Opportunities({
  ranked,
  selected,
  setSelected,
  onBuild,
}: {
  ranked: Opportunity[];
  selected: string;
  setSelected: (id: string) => void;
  onBuild: () => void;
}) {
  const active = ranked.find((item) => item.id === selected)!;
  return (
    <>
      <div className="section-head">
        <div>
          <p className="eyebrow">STEP 02 · DECIDE</p>
          <h2>Ranked opportunities</h2>
        </div>
        <span className="status">
          <CircleDot size={14} /> Evidence review
        </span>
      </div>
      <div className="content-grid">
        <div className="opportunity-list">
          {ranked.map((item, index) => (
            <OpportunityCard
              key={item.id}
              item={item}
              index={index}
              selected={selected === item.id}
              onClick={() => setSelected(item.id)}
            />
          ))}
        </div>
        <OpportunityBrief active={active} onBuild={onBuild} />
      </div>
    </>
  );
}
function ProductStudio({
  active,
  charterReady,
  setCharterReady,
  onPackage,
  onAssets,
}: {
  active: Opportunity;
  charterReady: boolean;
  setCharterReady: (value: boolean) => void;
  onPackage: () => void;
  onAssets: () => void;
}) {
  const [format, setFormat] = useState(active.format);
  const [stage, setStage] = useState<"charter" | "outline" | "manuscript" | "brand" | "ready">(charterReady ? "outline" : "charter");
  const [copied, setCopied] = useState(false);
  const [partnership, setPartnership] = useState<{ creator: string; handle: string; opportunityId: string; split: string } | null>(null);
  useEffect(() => { const saved = window.localStorage.getItem("forge369-active-partnership"); if (!saved) return setPartnership(null); try { const project = JSON.parse(saved); setPartnership(project.opportunityId === active.id ? project : null); } catch { setPartnership(null); } }, [active.id]);
  const formats = ["Guide + templates", "eBook", "Workbook + tracker", "Mini-course + community"];
  const isLucid = /lucid dream/i.test(active.title);
  const chapters = isLucid ? ["Begin at the threshold", "Build dream recall", "Train reality awareness", "Set your intention", "The 28-night practice", "Your first lucid moment", "Stabilise and explore", "Continue with care"] : ["The real problem", "The simple foundation", "The first quick win", "Build the repeatable system", "Troubleshoot common obstacles", "Make progress visible", "Keep the result going"];
  const brandDirection = isLucid ? "Celestial, immersive and refined. Deep midnight blues, soft moonlight, feather textures and restrained gold accents." : "Modern, calm and premium. Clear hierarchy, generous white space and an intentional visual system that makes the result feel achievable.";
  function copyBlueprint() {
    const text = `# ${active.title}\n\nFormat: ${format}\nAudience: ${active.audience}\nProblem: ${active.problem}\n\n## Product structure\n${chapters.map((chapter, index) => `${index + 1}. ${chapter}`).join("\n")}\n\n## Visual direction\n${brandDirection}`;
    navigator.clipboard.writeText(text).then(() => { setCopied(true); window.setTimeout(() => setCopied(false), 1800); });
  }
  return (
    <section className="workflow-card product-builder">
      <p className="eyebrow">STEP 03 · PRODUCT STUDIO</p>
      <h2>{active.title}</h2>
      <p>
        Turn a validated profit pocket into a product your creator can proudly put in front of their audience.
      </p>
      {partnership && <div className="partner-build-banner"><Handshake size={17} /><span>Building for <strong>{partnership.creator}</strong> ({partnership.handle}) under the proposed <strong>{partnership.split}</strong> partnership.</span></div>}
      <div className="charter-grid">
        <div>
          <span>Audience</span>
          <strong>{active.audience}</strong>
        </div>
        <div>
          <span>Core problem</span>
          <strong>{active.problem}</strong>
        </div>
        <div>
          <span>Recommended format</span>
          <strong>{active.format}</strong>
        </div>
        <div>
          <span>Target transformation</span>
          <strong>From uncertainty to a clear, usable result.</strong>
        </div>
      </div>
      <div className="builder-progress">
        {["Charter", "Outline", "Manuscript", "Brand", "Ready"].map((label, index) => <div className={["charter", "outline", "manuscript", "brand", "ready"].indexOf(stage) >= index ? "complete" : ""} key={label}><span>{["charter", "outline", "manuscript", "brand", "ready"].indexOf(stage) > index ? <Check size={13} /> : index + 1}</span><small>{label}</small></div>)}
      </div>
      {stage === "charter" && <div className="builder-panel"><div className="form-head"><div><p className="eyebrow">FORMAT DECISION</p><h3>Choose the product vehicle</h3></div><span className="status"><CircleDot size={14} /> Creator-led product</span></div><div className="format-grid">{formats.map((option) => <button key={option} className={format === option ? "format-option selected" : "format-option"} onClick={() => setFormat(option)}><strong>{option}</strong><span>{option === "eBook" ? "A polished, authority-building read." : option === "Mini-course + community" ? "A guided learning experience with ongoing support." : option === "Workbook + tracker" ? "Implementation-led tools and repeatable action." : "A clear transformation with practical support assets."}</span></button>)}</div><button className="primary" onClick={() => { setCharterReady(true); setStage("outline"); }}><Sparkles size={17} /> Create product charter</button></div>}
      {stage === "outline" && <div className="builder-panel"><div className="form-head"><div><p className="eyebrow">TABLE OF CONTENTS</p><h3>A reader journey with a purpose</h3></div><button className="secondary" onClick={copyBlueprint}><Copy size={14} /> {copied ? "Copied" : "Copy blueprint"}</button></div><div className="chapter-list">{chapters.map((chapter, index) => <div key={chapter}><span>{String(index + 1).padStart(2, "0")}</span><strong>{chapter}</strong><small>{index === 0 ? "Set expectation and establish the reader’s starting point." : index === chapters.length - 1 ? "A clear next-step plan beyond the first result." : "Teach one practical idea, then make it actionable."}</small></div>)}</div><button className="primary" onClick={() => setStage("manuscript")}><FileText size={16} /> Generate manuscript plan</button></div>}
      {stage === "manuscript" && <div className="builder-panel"><div className="form-head"><div><p className="eyebrow">MANUSCRIPT SYSTEM</p><h3>Build depth without overwhelming the buyer</h3></div><span className="status"><Check size={14} /> Structured for completion</span></div><div className="manuscript-grid"><div><strong>Core lesson</strong><span>Explain the concept in plain language and answer the reader’s predictable doubts.</span></div><div><strong>Real-world example</strong><span>Use a relatable scenario that proves the lesson has a place in normal life.</span></div><div><strong>Action step</strong><span>End each section with one useful action, template or prompt.</span></div></div><div className="builder-note"><Sparkles size={17} /><span>AI-assisted creation will draft section by section, with founder and creator review before anything is published.</span></div><button className="primary" onClick={() => setStage("brand")}>Set visual direction <ArrowRight size={16} /></button></div>}
      {stage === "brand" && <div className="builder-panel"><div className="form-head"><div><p className="eyebrow">BRAND + CREATIVE DIRECTION</p><h3>Make the product feel worth keeping</h3></div><span className="status"><Sparkles size={14} /> Creative brief ready</span></div><div className="brand-brief"><div><span>Visual direction</span><strong>{brandDirection}</strong></div><div><span>Creative deliverables</span><strong>Cover, product thumbnails, chapter imagery, social launch assets and Whop store visuals.</strong></div></div><div className="builder-note"><Eye size={17} /><span>Higgsfield can become the production layer for these images once its account and API access are connected.</span></div><button className="primary" onClick={() => setStage("ready")}><Check size={16} /> Mark product blueprint ready</button></div>}
      {stage === "ready" && <div className="success-panel"><Check size={19} /><div><strong>Product blueprint ready for production</strong><span>Your product format, reader journey, manuscript system and brand direction are now defined. Next, create customer assets and the Whop launch pack.</span></div><div className="studio-actions"><button className="secondary" onClick={onAssets}>Open product assets</button><button className="primary" onClick={onPackage}>Create launch pack <ArrowRight size={16} /></button></div></div>}
    </section>
  );
}
const lucidAssets = [
  ["00_START_HERE.pdf", "Start here guide", "PDF · 4.5 KB"],
  [
    "01_The_Lucid_Threshold_Complete_Guide.pdf",
    "Complete celestial guide",
    "PDF · 584 KB",
  ],
  [
    "02_The_28_Night_Guided_Journey.pdf",
    "28-night guided journey",
    "PDF · 7.2 KB",
  ],
  ["03_Printable_Dream_Journal.pdf", "Printable dream journal", "PDF · 41 KB"],
  [
    "03B_Fillable_Digital_Dream_Journal.pdf",
    "Fillable digital journal",
    "PDF · 202 KB",
  ],
  [
    "04_Reality_Check_and_Dream_Sign_Tracker.pdf",
    "Reality-check tracker",
    "PDF · 7.2 KB",
  ],
  ["05_Bedside_Reference_Cards.pdf", "Bedside reference cards", "PDF · 3.3 KB"],
  [
    "07_Five_Minute_Relaxation_Audio.mp3",
    "Five-minute relaxation audio",
    "Audio · 6.9 MB",
  ],
  [
    "08_First_Lucidity_Preparation_Audio.mp3",
    "First-lucidity preparation audio",
    "Audio · 5.5 MB",
  ],
  [
    "09_Technique_Selection_Guide.pdf",
    "Technique selection guide",
    "PDF · 7.1 KB",
  ],
  [
    "10_Difficult_Dream_and_False_Awakening_Guide.pdf",
    "Difficult-dream guidance",
    "PDF · 6 KB",
  ],
] as const;

function ProductAssets({
  active,
  databaseState,
}: {
  active: Opportunity;
  databaseState:
    "checking" | "not-configured" | "signed-out" | "ready" | "saving";
}) {
  const [selectedAsset, setSelectedAsset] = useState(1);
  useEffect(() => setSelectedAsset(0), [active.id]);
  const isLucid = /lucid dream/i.test(active.title);
  const assets = isLucid ? lucidAssets : createDraftAssets(active);
  const asset = assets[Math.min(selectedAsset, assets.length - 1)];
  const secure = databaseState === "ready";
  return (
    <section className="asset-vault">
      <div className="asset-hero">
        <div>
          <p className="eyebrow">
            PRODUCT ASSETS · {isLucid ? "COMPLETE PACKAGE" : "DRAFT MANIFEST"}
          </p>
          <h2>{isLucid ? "Your complete customer package" : active.title}</h2>
          <p>
            {isLucid
              ? "One polished offer, eleven customer-facing assets, and a single delivery bundle prepared for release."
              : `Forge369 has created a product-specific asset manifest for ${active.audience.toLowerCase()}. Generate the files from this brief; it is not the Lucid Threshold package.`}
          </p>
          <div className="asset-stats">
            <span>
              <strong>{assets.length}</strong> assets
            </span>
            <span>
              <strong>{isLucid ? "13.2 MB" : "Draft"}</strong> package
            </span>
            <span>
              <strong>{isLucid ? "v1.0" : "v0.1"}</strong> release
            </span>
          </div>
        </div>
        <div className="vault-mark">
          <FolderLock size={27} />
          <span>Private vault</span>
        </div>
      </div>
      <div className="secure-notice">
        <FolderLock size={18} />
        <div>
          <strong>
            {secure
              ? "Private asset vault connected"
              : isLucid
                ? "Assets staged for secure storage"
                : "This product does not have files yet"}
          </strong>
          <span>
            {secure
              ? "Files can now be uploaded to your private Supabase bucket and delivered with controlled access."
              : isLucid
                ? "Your package is intentionally not published to this public repository or a public Vercel URL. Sign in when your email access is restored to upload it privately."
                : "The manifest is specific to this opportunity. Forge369 will generate and store the actual files after the product-creation engine is connected."}
          </span>
        </div>
      </div>
      <div className="asset-layout">
        <div className="asset-list">
          <div className="asset-list-head">
            <span>
              {isLucid ? "Customer deliverables" : "Proposed deliverables"}
            </span>
            <small>{assets.length} files</small>
          </div>
          {assets.map(([name, label, meta], index) => (
            <button
              className={
                selectedAsset === index ? "asset-row selected" : "asset-row"
              }
              onClick={() => setSelectedAsset(index)}
              key={name}
            >
              {name.endsWith(".mp3") ? (
                <FileAudio size={18} />
              ) : (
                <FileText size={18} />
              )}
              <div>
                <strong>{label}</strong>
                <span>{meta}</span>
              </div>
              {isLucid ? <Check size={15} /> : <CircleDot size={15} />}
            </button>
          ))}
        </div>
        <aside className="asset-preview">
          <p className="eyebrow">ASSET PREVIEW</p>
          {asset[0].endsWith(".mp3") ? (
            <FileAudio size={38} />
          ) : (
            <FileText size={38} />
          )}
          <h3>{asset[1]}</h3>
          <p>{asset[0]}</p>
          <span className="asset-ready">
            {isLucid ? (
              <>
                <Check size={14} /> Staged and quality-checked
              </>
            ) : (
              <>
                <CircleDot size={14} /> Awaiting product generation
              </>
            )}
          </span>
          <button className="secondary full-width" disabled={!isLucid}>
            <Eye size={15} />{" "}
            {isLucid ? "Preview after secure upload" : "No file to preview yet"}
          </button>
          <button className="primary full-width" disabled={!secure || !isLucid}>
            <Download size={15} />{" "}
            {isLucid && secure
              ? "Download secure asset"
              : "Secure download unavailable"}
          </button>
        </aside>
      </div>
    </section>
  );
}

function createDraftAssets(active: Opportunity) {
  const slug = active.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  return [
    [`${slug}-core-guide.pdf`, "Core implementation guide", "PDF · queued"],
    [`${slug}-quick-start.pdf`, "Quick-start checklist", "PDF · queued"],
    [`${slug}-workbook.pdf`, "Action workbook", "PDF · queued"],
    [`${slug}-tracker.pdf`, "Progress tracker", "PDF · queued"],
    [`${slug}-customer-onboarding.pdf`, "Customer onboarding", "PDF · queued"],
  ] as const;
}

function LaunchPacks({
  active,
  launchReady,
  setLaunchReady,
}: {
  active: Opportunity;
  launchReady: boolean;
  setLaunchReady: (value: boolean) => void;
}) {
  const [copied, setCopied] = useState(false);
  const pack = useMemo(() => createLaunchPack(active), [active]);
  function copyPack() {
    navigator.clipboard.writeText(pack.markdown).then(() => {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    });
  }
  function downloadPack() {
    const blob = new Blob([pack.markdown], {
      type: "text/markdown;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${active.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")}-launch-pack.md`;
    link.click();
    URL.revokeObjectURL(url);
  }
  return (
    <section className="workflow-card">
      <p className="eyebrow">STEP 04 · LAUNCH PACK</p>
      <h2>Prepare a product for Whop</h2>
      <p>
        Build delivery, sales copy and onboarding assets from the approved
        product charter.
      </p>
      {!launchReady ? (
        <button className="primary" onClick={() => setLaunchReady(true)}>
          <Play size={16} /> Build launch pack
        </button>
      ) : (
        <>
          <div className="pack-actions">
            <div>
              <span className="status">
                <Check size={14} /> Launch pack generated
              </span>
              <small>
                Ready to refine, copy into Whop, or download as an editable
                Markdown file.
              </small>
            </div>
            <div>
              <button className="secondary" onClick={copyPack}>
                <Copy size={15} /> {copied ? "Copied" : "Copy pack"}
              </button>
              <button className="primary" onClick={downloadPack}>
                <Download size={15} /> Download .md
              </button>
            </div>
          </div>
          <div className="launch-output">
            <article>
              <p className="eyebrow">PRODUCT POSITIONING</p>
              <h3>{pack.productName}</h3>
              <p className="launch-subtitle">{pack.promise}</p>
              <dl>
                <dt>For</dt>
                <dd>{active.audience}</dd>
                <dt>Format</dt>
                <dd>{active.format}</dd>
                <dt>Outcome</dt>
                <dd>{pack.outcome}</dd>
              </dl>
            </article>
            <article>
              <p className="eyebrow">WHOP LISTING COPY</p>
              <h3>{pack.headline}</h3>
              <p>{pack.description}</p>
              <h4>What they receive</h4>
              <ul>
                {pack.deliverables.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>
            <article>
              <p className="eyebrow">OFFER + DELIVERY</p>
              <h3>Suggested offer</h3>
              <p>
                <strong>Starter price:</strong> {pack.price}
              </p>
              <p>{pack.offer}</p>
              <h4>Customer onboarding</h4>
              <ol>
                {pack.onboarding.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ol>
            </article>
            <article>
              <p className="eyebrow">LAUNCH CHECKLIST</p>
              <h3>Before you publish</h3>
              <ul className="checklist">
                {pack.checklist.map((item) => (
                  <li key={item}>
                    <Check size={15} /> {item}
                  </li>
                ))}
              </ul>
            </article>
          </div>
        </>
      )}
    </section>
  );
}

function createLaunchPack(active: Opportunity) {
  const productName =
    active.title === "From Zero to Lucid Dreaming" ||
    /lucid dream/i.test(active.title)
      ? "The Lucid Threshold"
      : active.title;
  const isLucid = /lucid dream/i.test(active.title);
  const promise = isLucid
    ? "A guided 28-night system to build dream recall, recognize dream signs, and practise lucid dreaming with care."
    : `A focused system that helps ${active.audience.toLowerCase()} move from a recurring problem to a clear, usable result.`;
  const outcome = isLucid
    ? "A calmer, repeatable lucid-dream practice built around consistency, not guarantees."
    : "A practical outcome the customer can apply immediately.";
  const headline = isLucid
    ? "Learn to recognize the moment you are dreaming."
    : `A practical path beyond ${active.problem.toLowerCase()}`;
  const description = isLucid
    ? "The Lucid Threshold is an immersive beginner guide for people who want to explore lucid dreaming without hype. It combines a 28-night guided journey, dream-journaling tools, reality-check training, pre-sleep relaxation, and first-lucidity support in one clear practice."
    : `${productName} turns a specific pain point into a guided, practical system. It is designed to be simple to start, useful from day one, and easy to follow through to a measurable outcome.`;
  const deliverables = isLucid
    ? [
        "Complete Lucid Threshold guide",
        "28-night guided journey",
        "Printable and fillable dream journal",
        "Reality-check and dream-sign tracker",
        "Bedside reference cards",
        "Five-minute relaxation and first-lucidity audio",
        "Difficult-dream and false-awakening guidance",
      ]
    : [
        "Core implementation guide",
        "Action workbook or templates",
        "Quick-start checklist",
        "Progress tracker",
        "Customer onboarding instructions",
      ];
  const price = isLucid
    ? "$37 introductory price, with a $57 anchor price after validation"
    : "$27–$47 introductory price, then raise after validated customer feedback";
  const offer = isLucid
    ? "A polished, self-guided digital experience for newcomers who want structure, practical tools, and a grounded approach to lucid dreaming."
    : `A complete ${active.format.toLowerCase()} designed to solve one clear problem without unnecessary complexity.`;
  const onboarding = isLucid
    ? [
        "Welcome the customer and set the expectation: consistency matters more than forcing results.",
        "Start Night 1 and set up the dream journal beside the bed.",
        "Use the daily reality-check tracker and five-minute wind-down routine.",
        "Follow the 28-night journey, then review dream signs and choose the next technique.",
      ]
    : [
        "Welcome the customer and explain the desired result.",
        "Direct them to the quick-start step.",
        "Set the first small action for day one.",
        "Invite feedback after their first result.",
      ];
  const checklist = [
    "Proofread the final guide and all downloadable assets",
    "Create a clean cover image and product thumbnail",
    "Upload files to the private delivery folder",
    "Paste the listing copy into Whop",
    "Set price, refund policy and customer-support email",
    "Run a test purchase and delivery check",
  ];
  const markdown = `# ${productName} — Launch Pack\n\n## Positioning\n**For:** ${active.audience}\n\n**Format:** ${active.format}\n\n**Promise:** ${promise}\n\n**Outcome:** ${outcome}\n\n## Whop listing\n### ${headline}\n${description}\n\n### What customers receive\n${deliverables.map((item) => `- ${item}`).join("\n")}\n\n## Offer\n**Suggested price:** ${price}\n\n${offer}\n\n## Customer onboarding\n${onboarding.map((item, index) => `${index + 1}. ${item}`).join("\n")}\n\n## Before publishing\n${checklist.map((item) => `- [ ] ${item}`).join("\n")}\n`;
  return {
    productName,
    promise,
    outcome,
    headline,
    description,
    deliverables,
    price,
    offer,
    onboarding,
    checklist,
    markdown,
  };
}
function ManualIntake({
  onAdd,
}: {
  onAdd: (
    input: Pick<Opportunity, "title" | "audience" | "problem" | "format">,
  ) => void;
}) {
  const [title, setTitle] = useState("");
  const [audience, setAudience] = useState("");
  const [problem, setProblem] = useState("");
  const [format, setFormat] = useState("Guide + templates");
  const [saved, setSaved] = useState(false);
  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!title.trim() || !audience.trim() || !problem.trim()) return;
    onAdd({
      title: title.trim(),
      audience: audience.trim(),
      problem: problem.trim(),
      format,
    });
    setTitle("");
    setAudience("");
    setProblem("");
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2500);
  }
  return (
    <form className="intake-form" onSubmit={submit}>
      <div className="form-head">
        <div>
          <p className="eyebrow">FOUNDER INPUT</p>
          <h3>Add a profit pocket manually</h3>
        </div>
        {saved && (
          <span className="status">
            <Check size={14} /> Added and scored
          </span>
        )}
      </div>
      <label>
        Product idea
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="e.g. The Quiet Home Office System"
        />
      </label>
      <label>
        Who needs it?
        <input
          value={audience}
          onChange={(event) => setAudience(event.target.value)}
          placeholder="e.g. Remote workers in noisy households"
        />
      </label>
      <label>
        What painful problem does it solve?
        <textarea
          value={problem}
          onChange={(event) => setProblem(event.target.value)}
          placeholder="Describe the recurring frustration or desired outcome."
        />
      </label>
      <label>
        Recommended format
        <select
          value={format}
          onChange={(event) => setFormat(event.target.value)}
        >
          <option>Guide + templates</option>
          <option>Workbook + tracker</option>
          <option>Course + community</option>
          <option>Toolkit + launch pack</option>
        </select>
      </label>
      <button className="primary" type="submit">
        Add and score opportunity <ArrowRight size={16} />
      </button>
    </form>
  );
}
function Analytics() {
  return (
    <section className="workflow-card">
      <p className="eyebrow">MEASURE WHAT WORKS</p>
      <h2>Analytics will unlock after launch</h2>
      <p>
        Once Whop and product analytics are connected, Forge369 will track
        conversion, refunds, completion, feedback and update opportunities.
      </p>
    </section>
  );
}
function OpportunityCard({
  item,
  index,
  selected,
  onClick,
}: {
  item: Opportunity;
  index: number;
  selected: boolean;
  onClick: () => void;
}) {
  const score = scoreOpportunity(item);
  return (
    <button
      onClick={onClick}
      className={selected ? "opportunity selected" : "opportunity"}
    >
      <div className="rank">0{index + 1}</div>
      <div className="opportunity-copy">
        <div className="tag-row">
          <span>{item.trend}</span>
          <span>{item.source}</span>
        </div>
        <h3>{item.title}</h3>
        <p>{item.problem}</p>
        <small>{item.format}</small>
      </div>
      <div className="score">
        <strong>{score}</strong>
        <span>/100</span>
      </div>
    </button>
  );
}
function OpportunityBrief({
  active,
  onBuild,
}: {
  active: Opportunity;
  onBuild: () => void;
}) {
  return (
    <aside className="detail-card">
      <p className="eyebrow">OPPORTUNITY BRIEF</p>
      <h2>{active.title}</h2>
      <div className="detail-block">
        <span>Ideal customer</span>
        <p>{active.audience}</p>
      </div>
      <div className="detail-block">
        <span>Problem worth solving</span>
        <p>{active.problem}</p>
      </div>
      <div className="score-ring">
        <div>
          <strong>{scoreOpportunity(active)}</strong>
          <span>Forge Score</span>
        </div>
      </div>
      <div className="mini-scores">
        <Mini label="Demand" value={active.demand} />
        <Mini label="Urgency" value={active.urgency} />
        <Mini label="Transformation" value={active.transformation} />
        <Mini label="Reach" value={active.reach} />
      </div>
      <button className="primary full" onClick={onBuild}>
        Open in Product Studio <ArrowRight size={16} />
      </button>
    </aside>
  );
}
function Metric({
  label,
  value,
  note,
  icon,
}: {
  label: string;
  value: string;
  note: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="metric">
      <div className="metric-icon">{icon}</div>
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
        <small>{note}</small>
      </div>
    </div>
  );
}
function Mini({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <span>{label}</span>
      <div className="bar">
        <i style={{ width: `${value * 10}%` }} />
      </div>
      <strong>{value}/10</strong>
    </div>
  );
}
function DatabasePanel({
  state,
  message,
  email,
  setEmail,
  onSignIn,
  onSave,
}: {
  state: "checking" | "not-configured" | "signed-out" | "ready" | "saving";
  message: string;
  email: string;
  setEmail: (email: string) => void;
  onSignIn: () => void;
  onSave: () => void;
}) {
  if (state === "checking")
    return (
      <div className="database-panel">
        <span className="live-dot" /> Checking Forge369 database connection…
      </div>
    );
  if (state === "not-configured")
    return (
      <div className="database-panel warning">
        Database variables are not available to this deployment yet. Redeploy
        after adding them in Vercel.
      </div>
    );
  if (state === "signed-out")
    return (
      <div className="database-panel">
        <div>
          <strong>Connect your Forge369 workspace</strong>
          <span>
            Sign in securely to save opportunities and build products in
            Supabase.
          </span>
        </div>
        <input
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@example.com"
          type="email"
        />
        <button className="primary" onClick={onSignIn}>
          Send sign-in link
        </button>
        {message && <small>{message}</small>}
      </div>
    );
  return (
    <div className="database-panel ready">
      <div>
        <span className="live-dot" />
        <strong> Supabase connected</strong>
        <small>
          {message || "Your private Forge369 workspace is ready to save."}
        </small>
      </div>
      <button
        className="primary"
        onClick={onSave}
        disabled={state === "saving"}
      >
        {state === "saving" ? "Saving…" : "Save workspace"}
      </button>
    </div>
  );
}
