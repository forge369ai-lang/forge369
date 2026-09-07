"use client";

import { useMemo, useState } from "react";
import { ArrowRight, BarChart3, Box, Check, ChevronRight, CircleDot, Compass, FileText, Flame, LayoutDashboard, Search, Settings, Sparkles, Target, Zap } from "lucide-react";
import { opportunities } from "@/lib/demo-data";
import { scoreOpportunity } from "@/lib/scoring";

const nav = [
  ["Command Center", LayoutDashboard],
  ["Discover", Compass],
  ["Opportunities", Target],
  ["Product Studio", Box],
  ["Launch Packs", FileText],
  ["Analytics", BarChart3],
];

export default function Dashboard() {
  const ranked = useMemo(() => [...opportunities].sort((a, b) => scoreOpportunity(b) - scoreOpportunity(a)), []);
  const [selected, setSelected] = useState(ranked[0].id);
  const active = ranked.find((item) => item.id === selected)!;

  return (
    <main className="shell">
      <aside className="sidebar">
        <div className="brand"><span className="brand-mark"><Flame size={19} /></span><span>FORGE<span>369</span></span></div>
        <p className="eyebrow">DIGITAL PRODUCT FOUNDRY</p>
        <nav>
          {nav.map(([label, Icon], index) => (
            <button className={index === 0 ? "nav-item active" : "nav-item"} key={label as string}>
              <Icon size={17} /> {label as string}
              {index === 2 && <span className="count">12</span>}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <button className="nav-item"><Settings size={17} /> Settings</button>
          <div className="profile"><div className="avatar">JS</div><div><strong>Jay Steenkamp</strong><span>Founder workspace</span></div></div>
        </div>
      </aside>

      <section className="workspace">
        <header>
          <div><p className="eyebrow">MONDAY, 7 SEPTEMBER</p><h1>Command Center</h1><p>Find demand. Forge value. Ship products.</p></div>
          <button className="primary"><Sparkles size={17} /> Run discovery scan</button>
        </header>

        <div className="signal-bar">
          <div><span className="live-dot" /> MARKET SCANNER ACTIVE</div>
          <p>Last scan found <strong>12 opportunity signals</strong> across 6 sources.</p>
          <button>View scan <ArrowRight size={15} /></button>
        </div>

        <div className="metrics">
          <Metric label="Opportunities" value="12" note="+5 this week" icon={<Target />} />
          <Metric label="Average score" value="76" note="Strong potential" icon={<BarChart3 />} />
          <Metric label="In production" value="1" note="The Lucid Threshold" icon={<Zap />} />
          <Metric label="Ready to launch" value="1" note="Customer package" icon={<Check />} />
        </div>

        <div className="section-head"><div><p className="eyebrow">TODAY'S SHORTLIST</p><h2>Top profit pockets</h2></div><button className="text-button">View all opportunities <ChevronRight size={15} /></button></div>

        <div className="content-grid">
          <div className="opportunity-list">
            {ranked.map((item, index) => {
              const score = scoreOpportunity(item);
              return (
                <button key={item.id} onClick={() => setSelected(item.id)} className={item.id === selected ? "opportunity selected" : "opportunity"}>
                  <div className="rank">0{index + 1}</div>
                  <div className="opportunity-copy"><div className="tag-row"><span>{item.trend}</span><span>{item.source}</span></div><h3>{item.title}</h3><p>{item.problem}</p><small>{item.format}</small></div>
                  <div className="score"><strong>{score}</strong><span>/100</span></div>
                </button>
              );
            })}
          </div>

          <aside className="detail-card">
            <p className="eyebrow">OPPORTUNITY BRIEF</p><h2>{active.title}</h2>
            <div className="detail-block"><span>Ideal customer</span><p>{active.audience}</p></div>
            <div className="detail-block"><span>Problem worth solving</span><p>{active.problem}</p></div>
            <div className="score-ring"><div><strong>{scoreOpportunity(active)}</strong><span>Forge Score</span></div></div>
            <div className="mini-scores">
              <Mini label="Demand" value={active.demand} /><Mini label="Urgency" value={active.urgency} />
              <Mini label="Transformation" value={active.transformation} /><Mini label="Reach" value={active.reach} />
            </div>
            <button className="primary full">Open in Product Studio <ArrowRight size={16} /></button>
          </aside>
        </div>

        <section className="pipeline">
          <div className="section-head"><div><p className="eyebrow">ACTIVE BUILD</p><h2>The Lucid Threshold</h2></div><span className="status"><CircleDot size={14} /> Quality review</span></div>
          <div className="steps">
            {["Validate", "Architect", "Research", "Create", "Polish", "Package"].map((step, index) => <div className={index < 5 ? "step complete" : "step"} key={step}><span>{index < 5 ? <Check size={14} /> : index + 1}</span><p>{step}</p></div>)}
          </div>
        </section>
      </section>
    </main>
  );
}

function Metric({ label, value, note, icon }: { label: string; value: string; note: string; icon: React.ReactNode }) {
  return <div className="metric"><div className="metric-icon">{icon}</div><div><span>{label}</span><strong>{value}</strong><small>{note}</small></div></div>;
}

function Mini({ label, value }: { label: string; value: number }) {
  return <div><span>{label}</span><div className="bar"><i style={{ width: `${value * 10}%` }} /></div><strong>{value}/10</strong></div>;
}
