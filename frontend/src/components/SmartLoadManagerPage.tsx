// ============================================================================
// SmartLoadManagerPage.tsx — Zone-Level Smart Load Manager
// Priority Load Tiers: CRITICAL | IMPORTANT | FLEXIBLE | NON-CRITICAL
// ============================================================================

import { useState } from 'react';
import { Sliders, CheckCircle2, Lock } from 'lucide-react';
import { DataBadge } from './DataTransparencyModal';

export interface LoadItem {
  id: string;
  zoneName: string;
  name: string;
  type: string;
  powerKW: number;
  category: 'CRITICAL' | 'IMPORTANT' | 'FLEXIBLE' | 'NON-CRITICAL';
  status: 'active' | 'curtailed' | 'shed';
  isSafetyProtected: boolean;
}

const INITIAL_LOADS: LoadItem[] = [
  { id: 'l1', zoneName: 'Zone 3D — Data Center', name: 'Core Server UPS & Rack Cooling', type: 'Server & CRAC', powerKW: 30.4, category: 'CRITICAL', status: 'active', isSafetyProtected: true },
  { id: 'l2', zoneName: 'Building Common', name: 'Emergency Fire & Evacuation Signage', type: 'Safety Systems', powerKW: 4.5, category: 'CRITICAL', status: 'active', isSafetyProtected: true },
  { id: 'l3', zoneName: 'Zone 3B — Boardroom', name: 'Executive Dedicated VAV Unit', type: 'HVAC', powerKW: 12.8, category: 'IMPORTANT', status: 'active', isSafetyProtected: false },
  { id: 'l4', zoneName: 'Zone 3A — Main Workstations', name: 'Primary AHU Fan Array', type: 'AHU Fan', powerKW: 18.0, category: 'FLEXIBLE', status: 'active', isSafetyProtected: false },
  { id: 'l5', zoneName: 'Zone 3A — Workstations', name: 'Workstation DALI LED Grid East', type: 'Lighting', powerKW: 5.1, category: 'FLEXIBLE', status: 'active', isSafetyProtected: false },
  { id: 'l6', zoneName: 'Zone 3C — Cafeteria', name: 'Cafeteria Ambient FCU & Decorative LEDs', type: 'HVAC & Lighting', powerKW: 16.4, category: 'NON-CRITICAL', status: 'active', isSafetyProtected: false },
];

export function SmartLoadManagerPage() {
  const [loads, setLoads] = useState<LoadItem[]>(INITIAL_LOADS);

  const toggleLoad = (id: string) => {
    setLoads(prev => prev.map(item => {
      if (item.id === id) {
        if (item.isSafetyProtected) return item; // Safety protected
        const nextStatus = item.status === 'active' ? 'curtailed' : 'active';
        return { ...item, status: nextStatus };
      }
      return item;
    }));
  };

  const getCategoryBadge = (cat: LoadItem['category']) => {
    switch (cat) {
      case 'CRITICAL': return 'bg-red-500/15 text-red-400 border-red-500/30';
      case 'IMPORTANT': return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
      case 'FLEXIBLE': return 'bg-green-500/15 text-green-400 border-green-500/30';
      case 'NON-CRITICAL': return 'bg-slate-500/15 text-slate-400 border-slate-500/30';
    }
  };

  const totalKW = loads.reduce((acc, l) => acc + (l.status === 'active' ? l.powerKW : l.powerKW * 0.4), 0);

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-5 rounded-2xl border bg-slate-900/80 border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Sliders className="text-green-400" size={20} />
            <h1 className="text-xl font-bold text-white">Smart Load Manager</h1>
          </div>
          <p className="text-xs text-slate-400">
            Zone-Level Load Categorization & Safety-Guarded Power Prioritization
          </p>
        </div>

        <div className="flex items-center gap-2">
          <DataBadge source="BMS Modbus & SpaceLogic Load Controller" type="sensor" />
        </div>
      </div>

      {/* Category Overview Boxes */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { cat: 'CRITICAL', desc: 'Safety systems & IT servers. Protected from cutoffs.', color: 'border-red-500/40 text-red-400 bg-red-500/10' },
          { cat: 'IMPORTANT', desc: 'Executive spaces & core elevators. High priority.', color: 'border-amber-500/40 text-amber-400 bg-amber-500/10' },
          { cat: 'FLEXIBLE', desc: 'HVAC setpoint modulation & daylight dimming.', color: 'border-green-500/40 text-green-400 bg-green-500/10' },
          { cat: 'NON-CRITICAL', desc: 'Cafeteria, lounge AC, non-essential signages.', color: 'border-slate-700 text-slate-400 bg-slate-800/40' },
        ].map((c, i) => (
          <div key={i} className={`p-4 rounded-xl border ${c.color} space-y-1`}>
            <span className="text-xs font-extrabold uppercase tracking-wider block">{c.cat} LOADS</span>
            <p className="text-[11px] text-slate-300 leading-tight">{c.desc}</p>
          </div>
        ))}
      </div>

      {/* Table of Loads */}
      <div className="p-5 rounded-2xl border bg-slate-900/80 border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            Zone Equipment Load Matrix (Total Active: {totalKW.toFixed(1)} kW)
          </h3>
          <span className="text-xs text-green-400 font-mono">Safety Invariants Active</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 font-semibold uppercase text-[10px] border-b border-slate-800">
              <tr>
                <th className="p-3">Zone / Equipment</th>
                <th className="p-3">Type</th>
                <th className="p-3">Power Draw</th>
                <th className="p-3">Category Tier</th>
                <th className="p-3">Safety Status</th>
                <th className="p-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loads.map(load => (
                <tr key={load.id} className="hover:bg-slate-800/30">
                  <td className="p-3 font-medium text-white">
                    <div>{load.name}</div>
                    <span className="text-[10px] text-slate-500">{load.zoneName}</span>
                  </td>
                  <td className="p-3 text-slate-400">{load.type}</td>
                  <td className="p-3 font-bold text-white">{load.powerKW} kW</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getCategoryBadge(load.category)}`}>
                      {load.category}
                    </span>
                  </td>
                  <td className="p-3">
                    {load.isSafetyProtected ? (
                      <span className="text-red-400 text-[11px] font-semibold flex items-center gap-1">
                        <Lock size={12} /> PROTECTED
                      </span>
                    ) : (
                      <span className="text-green-400 text-[11px] flex items-center gap-1">
                        <CheckCircle2 size={12} /> Flexible
                      </span>
                    )}
                  </td>
                  <td className="p-3 text-right">
                    {load.isSafetyProtected ? (
                      <button disabled className="px-3 py-1 rounded bg-slate-800 text-slate-500 cursor-not-allowed text-[11px]">
                        Locked
                      </button>
                    ) : (
                      <button
                        onClick={() => toggleLoad(load.id)}
                        className={`px-3 py-1 rounded font-bold text-[11px] transition-all ${
                          load.status === 'active'
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30 hover:bg-amber-500/30'
                            : 'bg-green-500 text-slate-950 hover:bg-green-600'
                        }`}
                      >
                        {load.status === 'active' ? 'Curtail Load' : 'Restore Load'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
