// ============================================================================
// PublicPortalPage.tsx — Occupant & Public Portal Module
// Simplified public view with energy status, zone comfort, voting & education
// No sensitive operational knobs
// ============================================================================

import { useState } from 'react';
import {
  Users, Smile, Flame, Thermometer,
  HeartPulse, Award, Lightbulb
} from 'lucide-react';

export function PublicPortalPage({ onVote }: { onVote?: (zoneId: string, vote: string) => void }) {
  const [selectedZone, setSelectedZone] = useState('workstations');
  const [voted, setVoted] = useState<string | null>(null);

  const handleVoteClick = (vote: string) => {
    setVoted(vote);
    if (onVote) onVote(selectedZone, vote);
    setTimeout(() => setVoted(null), 2000);
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-5 rounded-2xl border bg-slate-900/80 border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Users className="text-green-400" size={20} />
            <h1 className="text-xl font-bold text-white">Occupant & Public Energy Portal</h1>
          </div>
          <p className="text-xs text-slate-400">
            Real-time Zone Indoor Comfort, Eco-Score Milestones & Thermal Satisfaction Voting
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-bold flex items-center gap-1.5">
            <Award size={14} /> BEE 5-Star Certified Complex
          </span>
        </div>
      </div>

      {/* Building Eco Performance Badges */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl border bg-slate-900/70 border-slate-800 space-y-1">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Building Sustainability Score</span>
          <p className="text-2xl font-extrabold text-green-400">89 <span className="text-xs text-slate-400">/ 100</span></p>
          <span className="text-[10px] text-slate-400 block">Top 5% Eco-Performance in Electronics City</span>
        </div>

        <div className="p-4 rounded-xl border bg-slate-900/70 border-slate-800 space-y-1">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Today Carbon Saved</span>
          <p className="text-2xl font-extrabold text-cyan-400">412 <span className="text-xs text-slate-400">kg CO₂</span></p>
          <span className="text-[10px] text-slate-400 block">Equivalent to planting 18 trees</span>
        </div>

        <div className="p-4 rounded-xl border bg-slate-900/70 border-slate-800 space-y-1">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Indoor Air Quality (IAQ)</span>
          <p className="text-2xl font-extrabold text-emerald-400">Excellent</p>
          <span className="text-[10px] text-slate-400 block">CO₂: 680 ppm • Humidity: 48%</span>
        </div>
      </div>

      {/* Occupant Thermal Feedback Voting Box */}
      <div className="p-6 rounded-2xl border bg-slate-900/85 border-slate-800 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <HeartPulse className="text-green-400" size={16} />
            How is your thermal comfort right now?
          </h3>
          <select
            value={selectedZone}
            onChange={e => setSelectedZone(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-xs text-white"
          >
            <option value="workstations">Zone 3A Workstations</option>
            <option value="boardroom">Zone 3B Boardroom</option>
            <option value="cafeteria">Zone 3C Cafeteria</option>
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <button
            onClick={() => handleVoteClick('too_cold')}
            className={`p-4 rounded-xl border text-center font-bold text-xs transition-all ${
              voted === 'too_cold'
                ? 'bg-blue-500 text-slate-950 border-blue-400 shadow-lg'
                : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-blue-500/40'
            }`}
          >
            <Thermometer className="mx-auto mb-2 text-cyan-400" size={24} />
            <span>Too Cold ❄️</span>
          </button>

          <button
            onClick={() => handleVoteClick('comfortable')}
            className={`p-4 rounded-xl border text-center font-bold text-xs transition-all ${
              voted === 'comfortable'
                ? 'bg-green-500 text-slate-950 border-green-400 shadow-lg'
                : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-green-500/40'
            }`}
          >
            <Smile className="mx-auto mb-2 text-green-400" size={24} />
            <span>Just Right 😊</span>
          </button>

          <button
            onClick={() => handleVoteClick('too_warm')}
            className={`p-4 rounded-xl border text-center font-bold text-xs transition-all ${
              voted === 'too_warm'
                ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-lg'
                : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-amber-500/40'
            }`}
          >
            <Flame className="mx-auto mb-2 text-amber-400" size={24} />
            <span>Too Warm ☀️</span>
          </button>
        </div>

        {voted && (
          <p className="text-center text-xs text-green-400 font-bold animate-pulse">
            ✓ Thermal vote registered for {selectedZone}. Eco 360 AI is adjusting setpoints!
          </p>
        )}
      </div>

      {/* Educational Tips */}
      <div className="p-5 rounded-2xl border bg-slate-900/70 border-slate-800 space-y-3">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <Lightbulb className="text-amber-400" size={16} />
          Occupant Energy Tips
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-slate-300">
          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
            <strong className="text-white block mb-1">Optimal Setpoint standard</strong>
            Setting thermostats to 24°C saves up to 6% energy per degree compared to 20°C while complying with BEE recommendations.
          </div>
          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
            <strong className="text-white block mb-1">Natural Daylight Utilization</strong>
            Our automated DALI LED lighting dims when natural sunlight exceeds 500 Lux at your workstation.
          </div>
        </div>
      </div>

    </div>
  );
}
