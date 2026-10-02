// ============================================================================
// LoadSheddingPage.tsx — Peak Demand Management & Power Roster Module
// Clear distinction between RECOMMENDED ACTION vs EXECUTED ACTION
// ============================================================================

import { useState } from 'react';
import { Flame, Clock, CheckCircle2 } from 'lucide-react';
import { DataBadge } from './DataTransparencyModal';

export interface RosterItem {
  id: string;
  timeSlot: string;
  targetZone: string;
  loadType: string;
  curtailmentKW: number;
  recommendedAction: string;
  executedStatus: 'RECOMMENDED ACTION' | 'EXECUTED ACTION' | 'SKIPPED';
}

const INITIAL_ROSTER: RosterItem[] = [
  {
    id: 'ros-01',
    timeSlot: '18:00 – 19:00 (Evening Peak)',
    targetZone: 'Zone 3C — Cafeteria & Zone 3A Workstations',
    loadType: 'HVAC Setback (+1.5°C) & Lighting 20% Dimming',
    curtailmentKW: 18.5,
    recommendedAction: 'Pre-cool workstations prior to 18:00, then set setback to 24.5°C during BESCOM ToD peak surge rate (₹12.80/kWh).',
    executedStatus: 'EXECUTED ACTION',
  },
  {
    id: 'ros-02',
    timeSlot: '19:00 – 20:00 (Evening Peak)',
    targetZone: 'Zone 3B — Executive Boardroom',
    loadType: 'Non-Occupied VAV Setback',
    curtailmentKW: 8.2,
    recommendedAction: 'Set Boardroom VAV fan speed to minimum during unscheduled evening hour.',
    executedStatus: 'RECOMMENDED ACTION',
  },
  {
    id: 'ros-03',
    timeSlot: '20:00 – 21:00 (Peak Window)',
    targetZone: 'Building Perimeter Lighting & Signage',
    loadType: 'Non-Critical Lighting Shift',
    curtailmentKW: 6.0,
    recommendedAction: 'Turn off architectural facade accent lights.',
    executedStatus: 'RECOMMENDED ACTION',
  },
];

export function LoadSheddingPage() {
  const [roster, setRoster] = useState<RosterItem[]>(INITIAL_ROSTER);

  const confirmExecution = (id: string) => {
    setRoster(prev => prev.map(item => item.id === id ? { ...item, executedStatus: 'EXECUTED ACTION' } : item));
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-5 rounded-2xl border bg-slate-900/80 border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Flame className="text-amber-400" size={20} />
            <h1 className="text-xl font-bold text-white">Load Shedding & Power Roster Center</h1>
          </div>
          <p className="text-xs text-slate-400">
            DISCOM Time-of-Day (ToD) Peak Demand Shedding & Flexible Load Rostering
          </p>
        </div>

        <div className="flex items-center gap-2">
          <DataBadge source="CEA Grid Load & BESCOM Tariff Slabs" type="gov" />
        </div>
      </div>

      {/* Grid Load & Peak Threshold Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border bg-slate-900/70 border-slate-800">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Current Building Demand</span>
          <p className="text-xl font-bold text-white mt-1">104.8 <span className="text-xs text-slate-400">kW</span></p>
          <span className="text-[10px] text-green-400 font-mono mt-1 block">Normal Range</span>
        </div>

        <div className="p-4 rounded-xl border bg-slate-900/70 border-slate-800">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Peak Demand Threshold</span>
          <p className="text-xl font-bold text-red-400 mt-1">115.0 <span className="text-xs text-slate-400">kW</span></p>
          <span className="text-[10px] text-slate-500 font-mono mt-1 block">Contracted Maximum</span>
        </div>

        <div className="p-4 rounded-xl border bg-slate-900/70 border-slate-800">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Flexible Loads Available</span>
          <p className="text-xl font-bold text-cyan-400 mt-1">32.7 <span className="text-xs text-slate-400">kW</span></p>
          <span className="text-[10px] text-slate-500 font-mono mt-1 block">HVAC & Lighting</span>
        </div>

        <div className="p-4 rounded-xl border bg-slate-900/70 border-slate-800">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Current Tariff Window</span>
          <p className="text-xl font-bold text-amber-400 mt-1">₹12.80 <span className="text-xs text-slate-400">/kWh</span></p>
          <span className="text-[10px] text-amber-400 font-mono mt-1 block">ToD Peak (18:00 – 22:00)</span>
        </div>
      </div>

      {/* Roster Schedule Table */}
      <div className="p-5 rounded-2xl border bg-slate-900/80 border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Clock className="text-amber-400" size={16} />
            Automated Power Roster Schedule
          </h3>
          <span className="text-xs text-slate-400 font-mono">Status Distinction Enforced</span>
        </div>

        <div className="space-y-3">
          {roster.map(item => (
            <div
              key={item.id}
              className={`p-4 rounded-xl border space-y-3 transition-all ${
                item.executedStatus === 'EXECUTED ACTION'
                  ? 'bg-slate-950/70 border-green-500/30'
                  : 'bg-slate-900/90 border-slate-800 hover:border-amber-500/40'
              }`}
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <span className="text-xs font-bold text-amber-400 font-mono">{item.timeSlot}</span>
                  <h4 className="text-sm font-bold text-white mt-0.5">{item.targetZone} — {item.loadType}</h4>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded border border-emerald-500/20">
                    -{item.curtailmentKW} kW Shift
                  </span>

                  {item.executedStatus === 'EXECUTED ACTION' ? (
                    <span className="px-3 py-1 rounded bg-green-500/20 text-green-400 border border-green-500/40 text-xs font-extrabold flex items-center gap-1">
                      <CheckCircle2 size={13} /> EXECUTED ACTION
                    </span>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 rounded bg-amber-500/15 text-amber-400 border border-amber-500/30 text-xs font-semibold">
                        RECOMMENDED ACTION
                      </span>
                      <button
                        onClick={() => confirmExecution(item.id)}
                        className="px-3 py-1 rounded bg-green-500 hover:bg-green-600 text-slate-950 text-xs font-bold transition-all"
                      >
                        Confirm Dispatch
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800/60 text-xs text-slate-300">
                <span className="font-bold text-slate-400 block text-[10px] uppercase mb-0.5">Roster Rationale</span>
                {item.recommendedAction}
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
