// ============================================================================
// CoordinationCenterPage.tsx — Central Coordination Center Module
// Aggregates: Building Alerts, Zone Anomalies, Predicted Peaks, Load Actions,
// BESS Storage, Grid Events, Recommendations, System Health & Data Source Status
// ============================================================================

import {
  Activity, ShieldAlert, AlertTriangle, TrendingUp, BatteryCharging,
  CheckCircle2, Clock
} from 'lucide-react';
import { DataBadge } from './DataTransparencyModal';

export function CoordinationCenterPage() {
  return (
    <div className="space-y-6 pb-12">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-5 rounded-2xl border bg-slate-900/80 border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Activity className="text-green-400" size={20} />
            <h1 className="text-xl font-bold text-white">Central Co-ordination Center</h1>
          </div>
          <p className="text-xs text-slate-400">
            Unified Energy Command Console — Aggregating Alerts, Predictions, Storage, & Grid Signals
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-lg bg-green-500/15 border border-green-500/30 text-green-400 text-xs font-bold">
            System Operational • 100% Health
          </span>
        </div>
      </div>

      {/* Aggregate Command Matrix Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Building Alerts */}
        <div className="p-4 rounded-xl border bg-slate-900/70 border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldAlert size={14} className="text-red-400" /> Active FDD Alerts
            </span>
            <span className="px-2 py-0.5 rounded bg-red-500/20 text-red-400 font-bold text-[10px]">1 Critical</span>
          </div>
          <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 space-y-1 text-xs">
            <span className="text-white font-semibold block">CRAC-02 Filter Pressure Bleed</span>
            <span className="text-[10px] text-slate-400 block">Zone 3D Server Room • +2.4 kW bleed</span>
          </div>
          <DataBadge source="SpaceLogic FDD Engine" type="sensor" />
        </div>

        {/* Card 2: Zone Anomalies */}
        <div className="p-4 rounded-xl border bg-slate-900/70 border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <AlertTriangle size={14} className="text-amber-400" /> Zone Anomalies
            </span>
            <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 font-bold text-[10px]">1 Warning</span>
          </div>
          <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 space-y-1 text-xs">
            <span className="text-white font-semibold block">Zone 3A Workstation HVAC Spike</span>
            <span className="text-[10px] text-slate-400 block">Actual 24.5 kW vs Expected 18.2 kW</span>
          </div>
          <DataBadge source="Isolation Forest Anomaly ML" type="ml" />
        </div>

        {/* Card 3: Predicted Peaks */}
        <div className="p-4 rounded-xl border bg-slate-900/70 border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <TrendingUp size={14} className="text-purple-400" /> Predicted Grid Peak
            </span>
            <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-400 font-bold text-[10px]">18:00 IST</span>
          </div>
          <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 space-y-1 text-xs">
            <span className="text-white font-semibold block">Evening ToD Peak 112 kW</span>
            <span className="text-[10px] text-slate-400 block">BESCOM Tariff Surge Active</span>
          </div>
          <DataBadge source="Eco 360 Predictor Model" type="ml" />
        </div>

        {/* Card 4: BESS Storage */}
        <div className="p-4 rounded-xl border bg-slate-900/70 border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <BatteryCharging size={14} className="text-green-400" /> BESS Storage Dispatch
            </span>
            <span className="px-2 py-0.5 rounded bg-green-500/20 text-green-400 font-bold text-[10px]">SoC 78%</span>
          </div>
          <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 space-y-1 text-xs">
            <span className="text-white font-semibold block">Discharging 25.0 kW to Grid</span>
            <span className="text-[10px] text-slate-400 block">Shaving Peak Demand</span>
          </div>
          <DataBadge source="APC / Schneider BESS" type="sensor" />
        </div>

      </div>

      {/* Unified Multi-Module System Feed */}
      <div className="p-5 rounded-2xl border bg-slate-900/80 border-slate-800 space-y-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <Clock className="text-green-400" size={16} />
          Real-Time Event Stream & System Coordination Feed
        </h3>

        <div className="space-y-2.5 text-xs">
          {[
            { time: '22:36:12', tag: 'BESS', msg: 'Battery Storage initiated 25 kW discharge to mitigate DISCOM evening peak demand.', type: 'green' },
            { time: '22:30:00', tag: 'LOAD MGR', msg: 'Zone 3C Cafeteria FCU setback enforced (-3.2 kW non-critical load shift).', type: 'cyan' },
            { time: '22:15:45', tag: 'ANOMALY', msg: 'Zone 3A Workstation unexpected power draw detected by Isolation Forest.', type: 'amber' },
            { time: '22:00:10', tag: 'PREDICTOR', msg: 'Next 60m peak forecast updated: 108.4 kW (Confidence: 96.2%).', type: 'purple' },
          ].map((item, idx) => (
            <div key={idx} className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-4 font-mono">
              <div className="flex items-center gap-3">
                <span className="text-slate-500 text-[10px]">{item.time}</span>
                <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                  item.type === 'green' ? 'bg-green-500/20 text-green-400' :
                  item.type === 'amber' ? 'bg-amber-500/20 text-amber-400' :
                  item.type === 'purple' ? 'bg-purple-500/20 text-purple-400' : 'bg-cyan-500/20 text-cyan-400'
                }`}>
                  [{item.tag}]
                </span>
                <span className="text-slate-200 text-xs font-sans">{item.msg}</span>
              </div>
              <CheckCircle2 size={14} className="text-green-400 flex-shrink-0" />
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
