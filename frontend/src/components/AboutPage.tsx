// ============================================================================
// AboutPage.tsx — Dedicated Description / Overview of Eco 360
// Schneider Electric Yuva Yodha Hackathon 2026 — Smart Buildings Challenge
// ============================================================================

import {
  Zap, Shield, Users, TrendingDown,
  CheckCircle2, ArrowRight, Compass, BarChart3, AlertCircle, RefreshCw
} from 'lucide-react';

export function AboutPage() {
  return (
    <div className="space-y-6 pb-12 text-slate-200">
      
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-2xl border p-8 backdrop-blur-md"
        style={{ background: 'linear-gradient(135deg, rgba(15,23,42,0.95) 0%, rgba(6,10,21,0.98) 100%)', borderColor: 'rgba(0,163,0,0.3)' }}>
        <div className="absolute top-0 right-0 w-96 h-96 bg-green-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-3 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/15 border border-green-500/30 text-green-400 text-xs font-semibold">
              <Zap size={14} />
              <span>Schneider Electric Yuva Yodha Tech Hackathon 2026 · Challenge 02</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
              Eco 360 <span className="text-green-400">— Zone-Level AI Smart Building Energy System</span>
            </h1>
            <p className="text-slate-300 text-sm md:text-base leading-relaxed">
              An intelligent energy management ecosystem designed to move beyond coarse, building-wide totals. 
              Eco 360 delivers granular <strong className="text-white">Zone-Level & Small-Area Intelligence</strong> down to the floor, zone, room, and individual equipment level — eliminating energy waste while preserving occupant comfort and grid stability.
            </p>
          </div>

          <div className="rounded-xl border p-4 bg-slate-900/80 border-slate-700/60 min-w-[240px] space-y-2">
            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">Hierarchy Scope</span>
            <div className="flex items-center gap-1.5 text-xs font-mono text-green-400 font-bold">
              <span>BUILDING</span>
              <ArrowRight size={10} className="text-slate-500" />
              <span>FLOOR</span>
              <ArrowRight size={10} className="text-slate-500" />
              <span>ZONE</span>
              <ArrowRight size={10} className="text-slate-500" />
              <span>ROOM</span>
              <ArrowRight size={10} className="text-slate-500" />
              <span>EQUIPMENT</span>
            </div>
            <span className="text-[11px] text-slate-400 block pt-1 border-t border-slate-800">
              Pinpoints exactly <span className="text-white font-medium">WHERE</span> and <span className="text-white font-medium">WHY</span> energy is consumed.
            </span>
          </div>
        </div>
      </div>

      {/* Core Ecosystem Workflow Banner */}
      <div className="rounded-xl border p-5 backdrop-blur-md" style={{ background: 'rgba(15,23,42,0.85)', borderColor: 'rgba(255,255,255,0.08)' }}>
        <div className="flex items-center gap-2 mb-4">
          <RefreshCw size={16} className="text-green-400 animate-spin-slow" />
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">End-to-End System Integration Workflow</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 lg:grid-cols-10 gap-2 text-center text-xs">
          {[
            { step: '1', title: 'REAL DATA', desc: 'Govt + IoT Layer' },
            { step: '2', title: 'MONITORING', desc: 'Zone Telemetry' },
            { step: '3', title: 'ML PREDICTION', desc: 'Gradient Boosting' },
            { step: '4', title: 'ANOMALY DETECT', desc: 'Isolation Forest' },
            { step: '5', title: 'AI RECOMMENDER', desc: 'Why + Action' },
            { step: '6', title: 'SMART LOAD MGR', desc: 'Priority Tiers' },
            { step: '7', title: 'LOAD SHEDDING', desc: 'Power Roster' },
            { step: '8', title: 'STORAGE OPTIM', desc: 'BESS Dispatch' },
            { step: '9', title: 'SAVINGS MEASURE', desc: 'kWh & ₹ Quantified' },
            { step: '10', title: 'ML FEEDBACK', desc: 'Continuous Tuning' },
          ].map((item, idx) => (
            <div key={idx} className="p-2.5 rounded-lg border bg-slate-900/60 border-slate-800 flex flex-col items-center justify-between hover:border-green-500/40 transition-all">
              <span className="w-5 h-5 rounded-full bg-green-500/20 text-green-400 font-bold text-[10px] flex items-center justify-center mb-1">{item.step}</span>
              <span className="font-bold text-[11px] text-white leading-tight mb-1">{item.title}</span>
              <span className="text-[9px] text-slate-400 leading-tight">{item.desc}</span>
            </div>
          ))}
        </div>
      </div>

      {/* The 4 Major Challenge Objectives */}
      <div className="space-y-3">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Compass className="text-green-400" size={20} />
          The Four Major Challenge Objectives
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-xl border bg-slate-900/70 border-slate-800 space-y-2 hover:border-green-500/30 transition-all">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-1">
              <TrendingDown size={20} />
            </div>
            <h3 className="text-base font-bold text-white">1. Cut Energy Waste</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Detect equipment energy bleed, HVAC over-cooling in empty zones, and lighting operating outside business schedules with live ML anomaly detection.
            </p>
          </div>

          <div className="p-5 rounded-xl border bg-slate-900/70 border-slate-800 space-y-2 hover:border-green-500/30 transition-all">
            <div className="w-9 h-9 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center mb-1">
              <Users size={20} />
            </div>
            <h3 className="text-base font-bold text-white">2. Improve Occupant Experience</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Maintain strict ASHRAE 55 PMV (-0.5 to +0.5) thermal comfort and indoor air quality (CO₂ &lt; 1000 ppm) so energy savings never compromise occupant wellbeing.
            </p>
          </div>

          <div className="p-5 rounded-xl border bg-slate-900/70 border-slate-800 space-y-2 hover:border-green-500/30 transition-all">
            <div className="w-9 h-9 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center mb-1">
              <BarChart3 size={20} />
            </div>
            <h3 className="text-base font-bold text-white">3. Data-Driven Management</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Full transparency combining authoritative Indian Government data (CEA, BEE) with building smart meters and IoT sensors down to individual equipment nodes.
            </p>
          </div>

          <div className="p-5 rounded-xl border bg-slate-900/70 border-slate-800 space-y-2 hover:border-green-500/30 transition-all">
            <div className="w-9 h-9 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center mb-1">
              <Zap size={20} />
            </div>
            <h3 className="text-base font-bold text-white">4. Grid Responsiveness</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Dynamic demand-response (DISCOM Time-of-Day ToD peak load shedding), power rostering, and battery storage dispatch during high grid stress.
            </p>
          </div>
        </div>
      </div>

      {/* Problem Statement vs Eco 360 Solution */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Industry Problems */}
        <div className="p-6 rounded-xl border bg-red-950/20 border-red-500/20 space-y-4">
          <div className="flex items-center gap-2 text-red-400 font-bold text-base">
            <AlertCircle size={20} />
            <h3>The Building Energy Problem</h3>
          </div>
          <ul className="space-y-2.5 text-xs text-slate-300">
            <li className="flex items-start gap-2">
              <span className="text-red-400 font-bold">•</span>
              <span><strong>Increasing Consumption:</strong> Commercial buildings consume up to 35% of total grid power, with 30-40% lost to operational inefficiencies.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-400 font-bold">•</span>
              <span><strong>Coarse Building Totals:</strong> Traditional BMS only reports total building kWh, hiding individual zone leaks and over-conditioned spaces.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-400 font-bold">•</span>
              <span><strong>Peak Hour Demand Penalties:</strong> High Time-of-Day (ToD) tariffs during evening grid peaks significantly inflate utility costs.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-400 font-bold">•</span>
              <span><strong>Ignoring Occupant Comfort:</strong> Blind energy cutbacks cause cold complaints, poor ventilation, and reduced workforce productivity.</span>
            </li>
          </ul>
        </div>

        {/* Eco 360 Solution */}
        <div className="p-6 rounded-xl border bg-green-950/20 border-green-500/20 space-y-4">
          <div className="flex items-center gap-2 text-green-400 font-bold text-base">
            <CheckCircle2 size={20} />
            <h3>The Eco 360 Solution</h3>
          </div>
          <ul className="space-y-2.5 text-xs text-slate-300">
            <li className="flex items-start gap-2">
              <span className="text-green-400 font-bold">✓</span>
              <span><strong>Zone-Level Intelligence:</strong> Drills down from Building → Floor → Zone → Room → Equipment to identify exact waste locations.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-400 font-bold">✓</span>
              <span><strong>Occupancy-Aware Setpoints:</strong> Dynamically aligns HVAC & lighting output with real occupant density and ASHRAE 55 PMV limits.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-400 font-bold">✓</span>
              <span><strong>Grid & Storage Co-ordination:</strong> Shifts flexible loads automatically and dispatches battery storage during DISCOM peak tariff hours.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-400 font-bold">✓</span>
              <span><strong>Verified Data Transparency:</strong> Explicitly attributes data sources (CEA, BEE, Smart Meters) with zero fabricated numbers.</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Non-Negotiable Core Principles */}
      <div className="rounded-xl border p-5 bg-slate-900/80 border-slate-700/80 space-y-3">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Shield className="text-green-400" size={16} />
          Guaranteed Protection Principles
        </h3>
        <p className="text-xs text-slate-300 leading-relaxed">
          Eco 360 aims to reduce energy waste <strong className="text-white">WITHOUT sacrificing</strong>:
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center text-xs">
          <div className="p-3 rounded-lg bg-white/5 border border-white/10 font-medium text-green-300">
            🌡️ Thermal Comfort
          </div>
          <div className="p-3 rounded-lg bg-white/5 border border-white/10 font-medium text-cyan-300">
            ⚡ Workforce Productivity
          </div>
          <div className="p-3 rounded-lg bg-white/5 border border-white/10 font-medium text-amber-300">
            🛡️ Safety Systems Protection
          </div>
          <div className="p-3 rounded-lg bg-white/5 border border-white/10 font-medium text-emerald-300">
            🍃 Indoor Air Quality (IEQ)
          </div>
        </div>
      </div>

    </div>
  );
}
