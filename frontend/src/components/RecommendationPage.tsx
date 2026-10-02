// ============================================================================
// RecommendationPage.tsx — AI Recommendation Engine Module
// Explains WHY, ACTION, and EXPECTED IMPACT with verified data calculations
// ============================================================================

import { useState } from 'react';
import {
  Brain, Sparkles, CheckCircle2, Zap
} from 'lucide-react';
import { recommendationService, type ZoneRecommendationDetail } from '../services/recommendationService';
import { DataBadge } from './DataTransparencyModal';

export function RecommendationPage() {
  const [recs, setRecs] = useState<ZoneRecommendationDetail[]>(() => recommendationService.getRecommendations());
  const [filterCategory, setFilterCategory] = useState<string>('all');

  const handleExecute = (id: string) => {
    recommendationService.executeRecommendation(id);
    setRecs([...recommendationService.getRecommendations()]);
  };

  const filtered = filterCategory === 'all'
    ? recs
    : recs.filter(r => r.category.toLowerCase().includes(filterCategory.toLowerCase()));

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-5 rounded-2xl border bg-slate-900/80 border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Brain className="text-green-400" size={20} />
            <h1 className="text-xl font-bold text-white">AI Recommendation Engine</h1>
          </div>
          <p className="text-xs text-slate-400">
            Actionable zone optimization recommendations derived from occupancy density, indoor climate, & grid tariffs.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <DataBadge source="Eco 360 Recommendation Engine" type="ml" />
        </div>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <span className="text-slate-400 font-semibold uppercase text-[10px] mr-2">Filter:</span>
        {['all', 'HVAC', 'Load Shifting', 'Equipment'].map(cat => (
          <button
            key={cat}
            onClick={() => setFilterCategory(cat)}
            className={`px-3 py-1.5 rounded-lg border font-semibold capitalize transition-all ${
              filterCategory === cat
                ? 'bg-green-500 text-slate-950 border-green-500'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Recommendations Cards List */}
      <div className="space-y-4">
        {filtered.map(rec => (
          <div
            key={rec.id}
            className={`p-6 rounded-2xl border backdrop-blur-md space-y-4 transition-all ${
              rec.status === 'Executed'
                ? 'bg-slate-950/60 border-slate-800 opacity-75'
                : 'bg-slate-900/85 border-slate-700/80 hover:border-green-500/40'
            }`}
          >
            {/* Top Bar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-green-400">{rec.zoneName}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/30">
                    {rec.category}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                    rec.urgency === 'Immediate' ? 'bg-red-500/10 text-red-400 border-red-500/30' : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                  }`}>
                    Urgency: {rec.urgency}
                  </span>
                </div>
                <h3 className="text-base font-bold text-white">{rec.title}</h3>
              </div>

              {rec.status === 'Executed' ? (
                <span className="px-3 py-1 rounded-lg bg-green-500/20 text-green-400 border border-green-500/40 text-xs font-bold flex items-center gap-1.5">
                  <CheckCircle2 size={14} /> EXECUTED ON BMS
                </span>
              ) : (
                <button
                  onClick={() => handleExecute(rec.id)}
                  className="px-4 py-2 rounded-lg bg-green-500 hover:bg-green-600 text-slate-950 text-xs font-extrabold flex items-center gap-2 shadow-lg shadow-green-500/20 transition-all"
                >
                  <Zap size={14} /> Execute Recommendation
                </button>
              )}
            </div>

            {/* WHY & ACTION breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">WHY (Root Cause)</span>
                <p className="text-xs text-slate-300 leading-relaxed">{rec.why}</p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
                <span className="text-[10px] font-bold text-green-400 uppercase tracking-wider block">RECOMMENDED ACTION</span>
                <p className="text-xs text-slate-300 leading-relaxed">{rec.action}</p>
              </div>
            </div>

            {/* EXPECTED IMPACT */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles size={14} className="text-green-400" /> Expected Daily Savings Impact
                </span>
                <span className="text-[10px] text-slate-400 font-mono">Confidence: {rec.expectedImpact.confidencePercent}%</span>
              </div>

              {rec.expectedImpact.impactCalculated ? (
                <div className="grid grid-cols-3 gap-3 text-center pt-1">
                  <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                    <span className="text-[10px] text-slate-400 block">Energy Savings</span>
                    <span className="text-sm font-bold text-emerald-400">-{rec.expectedImpact.kwhSavingsPerDay} kWh/day</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
                    <span className="text-[10px] text-slate-400 block">Cost Avoidance</span>
                    <span className="text-sm font-bold text-amber-400">₹{rec.expectedImpact.costSavingsPerDayRupees}/day</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
                    <span className="text-[10px] text-slate-400 block">Carbon Avoidance</span>
                    <span className="text-sm font-bold text-cyan-400">-{rec.expectedImpact.co2ReductionKgPerDay} kg CO₂</span>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-amber-400 italic">Awaiting sufficient real building telemetry to calculate exact savings.</p>
              )}
            </div>

            <div className="text-[10px] text-slate-500 font-mono flex items-center justify-between pt-1">
              <span>{rec.dataProvenance}</span>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
