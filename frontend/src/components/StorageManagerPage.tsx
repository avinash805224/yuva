// ============================================================================
// StorageManagerPage.tsx — BESS Energy Storage Manager Module
// Battery Capacity, State of Charge, ML Advice: CHARGE | HOLD | DISCHARGE
// ============================================================================

import { useState } from 'react';
import { BatteryCharging, Brain } from 'lucide-react';
import { DataBadge } from './DataTransparencyModal';

export function StorageManagerPage() {
  const [soc] = useState<number>(78);
  const [batteryState, setBatteryState] = useState<'DISCHARGE' | 'CHARGE' | 'HOLD'>('DISCHARGE');

  const capacityKWh = 150;
  const currentKWh = Math.round((soc / 100) * capacityKWh);
  const backupHours = (currentKWh / 35.0).toFixed(1); // 35 kW average essential load

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-5 rounded-2xl border bg-slate-900/80 border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <BatteryCharging className="text-green-400" size={20} />
            <h1 className="text-xl font-bold text-white">Battery Energy Storage System (BESS) Manager</h1>
          </div>
          <p className="text-xs text-slate-400">
            Intelligent Battery Storage Optimization & Grid Time-of-Day Peak Shaving
          </p>
        </div>

        <div className="flex items-center gap-2">
          <DataBadge source="APC / Schneider BESS Gateway" type="sensor" />
        </div>
      </div>

      {/* Battery Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border bg-slate-900/70 border-slate-800">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block">State of Charge (SoC)</span>
          <p className="text-2xl font-extrabold text-green-400 mt-1">{soc}%</p>
          <span className="text-[10px] text-slate-400 font-mono mt-1 block">{currentKWh} / {capacityKWh} kWh</span>
        </div>

        <div className="p-4 rounded-xl border bg-slate-900/70 border-slate-800">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Current Operating Rate</span>
          <p className="text-2xl font-extrabold text-amber-400 mt-1">-25.0 <span className="text-xs text-slate-400">kW</span></p>
          <span className="text-[10px] text-amber-400 font-mono mt-1 block">Active Discharging to Grid</span>
        </div>

        <div className="p-4 rounded-xl border bg-slate-900/70 border-slate-800">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Backup Reserve Duration</span>
          <p className="text-2xl font-extrabold text-cyan-400 mt-1">{backupHours} <span className="text-xs text-slate-400">Hours</span></p>
          <span className="text-[10px] text-slate-500 font-mono mt-1 block">Essential Servers Protected</span>
        </div>

        <div className="p-4 rounded-xl border bg-slate-900/70 border-slate-800">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Grid Tariff Rate</span>
          <p className="text-2xl font-extrabold text-white mt-1">₹12.80 <span className="text-xs text-slate-400">/kWh</span></p>
          <span className="text-[10px] text-red-400 font-mono mt-1 block">Peak ToD Period Active</span>
        </div>
      </div>

      {/* ML Advice & Interactive Control Box */}
      <div className="p-6 rounded-2xl border bg-slate-900/85 border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Brain className="text-purple-400" size={18} />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              ML BESS Dispatch Recommendation Engine
            </h3>
          </div>
          <span className="text-xs font-mono text-slate-400">Model Decision: Real-time</span>
        </div>

        {/* Current ML Advisory Banner */}
        <div className="p-4 rounded-xl bg-purple-950/20 border border-purple-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[10px] font-extrabold text-purple-400 uppercase tracking-wider block">RECOMMENDED DECISION</span>
            <h4 className="text-lg font-bold text-white flex items-center gap-2">
              <span>DISCHARGE BATTERY (25 kW)</span>
              <span className="text-xs px-2.5 py-0.5 rounded bg-green-500/20 text-green-400 font-bold">SAVING ₹320/hr</span>
            </h4>
            <p className="text-xs text-slate-300">
              DISCOM grid rate is currently at evening peak (₹12.80/kWh). Discharging battery saves peak demand charges while preserving essential backup reserve.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {(['CHARGE', 'HOLD', 'DISCHARGE'] as const).map(mode => (
              <button
                key={mode}
                onClick={() => setBatteryState(mode)}
                className={`px-3.5 py-2 rounded-lg text-xs font-extrabold transition-all ${
                  batteryState === mode
                    ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/25'
                    : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}
