// ============================================================================
// EcoPulse 360 — AI-Powered Smart Building Energy Operating System
// Schneider Electric Yuva Yodha Hackathon 2026 — Challenge 02
// SENSE → ANALYZE → PREDICT → OPTIMIZE → RECOMMEND → CONTROL → MEASURE
// ============================================================================

import { useState, useEffect, useCallback } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line, BarChart, Bar,
} from 'recharts';
import {
  Zap, BarChart3, IndianRupee, Leaf, Star, Thermometer, Droplets, Wind,
  Users, Sun, AlertTriangle, AlertCircle, Info, Shield, TrendingDown,
  TrendingUp, Activity, Building2, Bell, Clock, Snowflake, Smile, MapPin,
  BatteryCharging, CheckCircle2, Lightbulb, Server, Brain, Eye, Gauge,
  Settings, ChevronRight, ChevronDown, X, Wrench, Cpu, Fan, Plug,
  ArrowRight, ArrowDown, Target, Sliders, Radio, Hash, Sparkles,
  HeartPulse, Award, Factory, Menu,
} from 'lucide-react';
import { BuildingSimulator } from './engine/simulator';
import { calculateWhatIf } from './engine/ai-engine';
import type {
  BuildingState, ZoneId, OccupantVote, HVACMode, PageId,
  WhatIfScenario, DemoOverrides,
} from './types/telemetry';

// Singleton simulator
const simulator = new BuildingSimulator();

// ── Helpers ──────────────────────────────────────────────────────────────────

function GlowDot() { return <span className="status-dot-live mr-2" />; }

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map(i => (
        <Star key={i} size={14} className={i <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-slate-600'} />
      ))}
    </div>
  );
}

function Badge({ text, color }: { text: string; color: string }) {
  const colors: Record<string, string> = {
    red: 'bg-red-500/15 text-red-400 border-red-500/30',
    amber: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    blue: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    green: 'bg-green-500/15 text-green-400 border-green-500/30',
    purple: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
    slate: 'bg-slate-500/15 text-slate-400 border-slate-500/30',
  };
  return <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${colors[color] || colors.slate}`}>{text}</span>;
}

function ProgressBar({ value, max = 100, color = '#00A300', height = 'h-1.5' }: { value: number; max?: number; color?: string; height?: string }) {
  return (
    <div className={`w-full bg-slate-700 rounded-full overflow-hidden ${height}`}>
      <div className="h-full rounded-full transition-all duration-700" style={{ width: `${Math.min((value / max) * 100, 100)}%`, background: color }} />
    </div>
  );
}

function CircularGauge({ value, max, label, size = 120 }: { value: number; max: number; label: string; size?: number }) {
  const pct = Math.min(value / max, 1);
  const r = size * 0.4;
  const circ = 2 * Math.PI * r;
  const color = pct > 0.8 ? '#F87171' : pct > 0.6 ? '#FBBF24' : '#4ADE80';
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth="8"
        strokeDasharray={circ} strokeDashoffset={circ * (1 - pct)}
        strokeLinecap="round" transform={`rotate(-90 ${size/2} ${size/2})`} className="transition-all duration-1000" />
      <text x={size/2} y={size/2 - 4} textAnchor="middle" fill="white" fontSize="18" fontWeight="700">{Math.round(pct * 100)}%</text>
      <text x={size/2} y={size/2 + 14} textAnchor="middle" fill="#94A3B8" fontSize="9">{label}</text>
    </svg>
  );
}

function ScoreRing({ score, label, size = 100 }: { score: number; label: string; size?: number }) {
  const pct = score / 100;
  const r = size * 0.38;
  const circ = 2 * Math.PI * r;
  const color = score >= 80 ? '#4ADE80' : score >= 60 ? '#FBBF24' : '#F87171';
  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth="6"
          strokeDasharray={circ} strokeDashoffset={circ * (1 - pct)}
          strokeLinecap="round" transform={`rotate(-90 ${size/2} ${size/2})`} className="transition-all duration-1000" />
        <text x={size/2} y={size/2 + 5} textAnchor="middle" fill="white" fontSize="20" fontWeight="800">{score}</text>
      </svg>
      <span className="text-[10px] text-slate-400 -mt-1">{label}</span>
    </div>
  );
}

function PMVBar({ pmv }: { pmv: number }) {
  const pct = ((pmv + 3) / 6) * 100;
  return (
    <div className="relative w-full">
      <div className="h-1.5 w-full rounded-full opacity-60" style={{ background: 'linear-gradient(90deg, #3B82F6, #22D3EE, #4ADE80, #FBBF24, #F87171)' }} />
      <div className="absolute -top-1 w-3 h-3 rounded-full bg-white border-2 border-slate-700 shadow-lg transition-all duration-700"
        style={{ left: `calc(${pct}% - 6px)` }} />
    </div>
  );
}

function SectionHeader({ icon: Icon, title, badge }: { icon: any; title: string; badge?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-green-500/10 text-green-400"><Icon size={18} /></div>
      <h2 className="text-lg font-bold text-white">{title}</h2>
      {badge && <span className="ml-auto">{badge}</span>}
    </div>
  );
}

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-xl border backdrop-blur-md p-5 ${className}`} style={{ background: 'rgba(15,23,42,0.75)', borderColor: 'rgba(255,255,255,0.08)' }}>{children}</div>;
}

function MetricCard({ label, value, unit, icon: Icon, color }: { label: string; value: string | number; unit?: string; icon: any; color: string }) {
  return (
    <Card className="relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-0.5 opacity-60" style={{ background: `linear-gradient(90deg, transparent, ${color}, transparent)` }} />
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">{label}</span>
        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${color}15` }}><Icon size={14} style={{ color }} /></div>
      </div>
      <p className="text-xl font-bold text-white">{value}</p>
      {unit && <p className="text-[10px] text-slate-500 mt-0.5">{unit}</p>}
    </Card>
  );
}

const PIE_COLORS = ['#00A300', '#FBBF24', '#A855F7', '#3B82F6'];
const ZONE_COLORS: Record<ZoneId, { accent: string; border: string; bg: string }> = {
  workstations: { accent: 'text-cyan-400', border: 'border-cyan-500/30', bg: 'from-cyan-500/10 to-teal-500/5' },
  boardroom: { accent: 'text-amber-400', border: 'border-amber-500/30', bg: 'from-amber-500/10 to-orange-500/5' },
  cafeteria: { accent: 'text-emerald-400', border: 'border-emerald-500/30', bg: 'from-emerald-500/10 to-green-500/5' },
  server_room: { accent: 'text-purple-400', border: 'border-purple-500/30', bg: 'from-purple-500/10 to-indigo-500/5' },
};

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload) return null;
  return (
    <div className="rounded-lg border p-2 text-xs shadow-xl" style={{ background: 'rgba(15,23,42,0.95)', borderColor: 'rgba(255,255,255,0.1)' }}>
      <p className="text-slate-400 mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color || p.stroke }} className="font-semibold">{p.name}: {typeof p.value === 'number' ? p.value.toFixed(1) : p.value}</p>
      ))}
    </div>
  );
}

// ── Navigation Items ─────────────────────────────────────────────────────────

const NAV_ITEMS: { id: PageId; label: string; icon: any }[] = [
  { id: 'overview', label: 'Overview', icon: Activity },
  { id: 'ai-insights', label: 'AI Insights', icon: Brain },
  { id: 'forecast', label: 'Forecast', icon: TrendingUp },
  { id: 'energy', label: 'Energy', icon: Zap },
  { id: 'digital-twin', label: 'Digital Twin', icon: Building2 },
  { id: 'equipment', label: 'Equipment', icon: Wrench },
  { id: 'renewables', label: 'Renewables', icon: Sun },
  { id: 'optimization', label: 'Optimization', icon: Sliders },
  { id: 'occupant', label: 'Occupant', icon: Users },
];

// ╔═══════════════════════════════════════════════════════════════════════════╗
// ║  MAIN APPLICATION                                                       ║
// ╚═══════════════════════════════════════════════════════════════════════════╝

export default function App() {
  const [state, setState] = useState<BuildingState>(() => simulator.tick());
  const [page, setPage] = useState<PageId>('overview');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [notifOpen, setNotifOpen] = useState(false);
  const [selectedZone, setSelectedZone] = useState<ZoneId | null>(null);
  const [voteFlash, setVoteFlash] = useState<string | null>(null);
  const [demoOpen, setDemoOpen] = useState(false);
  const [whatIf, setWhatIf] = useState<WhatIfScenario>({ hvacOptimization: 15, lightingOptimization: 20, occupancyControl: 10, loadShifting: 10, solarUtilization: 80, batteryUsage: 60 });
  const [shiftApplied, setShiftApplied] = useState(false);
  const [forecastPeriod, setForecastPeriod] = useState<'today' | 'tomorrow' | '7days'>('today');

  // Demo overrides
  const [demo, setDemo] = useState<DemoOverrides>({ occupancyMultiplier: 1, temperatureOffset: 0, solarMultiplier: 1, gridLoadMultiplier: 1, hvacLoadMultiplier: 1 });

  useEffect(() => {
    const interval = setInterval(() => setState(simulator.tick()), 3000);
    return () => clearInterval(interval);
  }, []);

  const handleVote = useCallback((zoneId: ZoneId, vote: OccupantVote) => {
    simulator.submitVote(zoneId, vote);
    setVoteFlash(`${zoneId}-${vote}`);
    setTimeout(() => setVoteFlash(null), 1200);
    setState(simulator.tick());
  }, []);

  const handleAck = useCallback((id: string) => { simulator.acknowledgeAlert(id); setState(simulator.tick()); }, []);
  const handleDR = useCallback(() => { simulator.triggerDR(state.demandResponse.status === 'idle'); setState(simulator.tick()); }, [state.demandResponse.status]);
  const handleHVACMode = useCallback((zoneId: ZoneId, mode: HVACMode) => { simulator.setHVACMode(zoneId, mode); setState(simulator.tick()); }, []);
  const handleToggleRec = useCallback((id: string) => { simulator.toggleRecommendation(id); setState(simulator.tick()); }, []);
  const handleForecastPeriod = useCallback((p: 'today' | 'tomorrow' | '7days') => { setForecastPeriod(p); simulator.setForecastPeriod(p); setState(simulator.tick()); }, []);
  const handleDemoChange = useCallback((key: keyof DemoOverrides, val: number) => {
    const next = { ...demo, [key]: val };
    setDemo(next);
    simulator.setDemoOverrides(next);
  }, [demo]);

  const { overview, zones, comfort, alerts, demandResponse, energyHistory, occupantVotes,
    aiInsights, forecast, forecastSummary, occupancyIntelligence, smartHVAC,
    equipmentHealth, anomalies, renewables, gridFlexibility, recommendations,
    occupantExperience, buildingScore, carbon, notifications } = state;

  const whatIfResult = calculateWhatIf(overview, whatIf);
  const time = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
  const unreadNotifs = notifications.filter(n => !n.read).length;

  // ── Render ──

  return (
    <div className="flex h-screen bg-[#060A15] overflow-hidden">

      {/* ═══ SIDEBAR ═══ */}
      <aside className={`${sidebarOpen ? 'w-52' : 'w-16'} flex-shrink-0 border-r flex flex-col transition-all duration-300`}
        style={{ background: 'rgba(11,17,32,0.95)', borderColor: 'rgba(255,255,255,0.06)' }}>
        <div className="h-14 flex items-center px-3 gap-2 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center flex-shrink-0">
            <Zap size={16} className="text-white" />
          </div>
          {sidebarOpen && <span className="text-sm font-bold text-white whitespace-nowrap">EcoPulse <span className="text-green-400">360</span></span>}
        </div>

        <nav className="flex-1 py-3 space-y-0.5 overflow-y-auto">
          {NAV_ITEMS.map(item => (
            <button key={item.id} onClick={() => setPage(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm transition-all ${page === item.id ? 'text-green-400 bg-green-500/10 border-r-2 border-green-400' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>
              <item.icon size={18} className="flex-shrink-0" />
              {sidebarOpen && <span className="truncate">{item.label}</span>}
            </button>
          ))}
        </nav>

        <div className="p-3 border-t space-y-1" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <button onClick={() => setDemoOpen(!demoOpen)}
            className="w-full flex items-center gap-3 px-3 py-2 text-sm text-amber-400 hover:bg-amber-500/10 rounded-lg transition-all">
            <Radio size={18} className="flex-shrink-0" />
            {sidebarOpen && <span>Demo Mode</span>}
          </button>
          <button onClick={() => setSidebarOpen(!sidebarOpen)}
            className="w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-500 hover:text-white rounded-lg transition-all">
            <Menu size={18} className="flex-shrink-0" />
            {sidebarOpen && <span>Collapse</span>}
          </button>
        </div>
      </aside>

      {/* ═══ MAIN CONTENT ═══ */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-14 flex items-center justify-between px-5 border-b flex-shrink-0" style={{ background: 'rgba(6,10,21,0.9)', borderColor: 'rgba(255,255,255,0.06)' }}>
          <div className="flex items-center gap-4">
            <h1 className="text-sm font-semibold text-white">{NAV_ITEMS.find(n => n.id === page)?.label || 'Overview'}</h1>
            <div className="flex items-center gap-1.5 text-xs text-slate-400"><GlowDot /><span className="text-green-400 font-medium">Live</span></div>
            <div className="hidden md:flex items-center gap-1.5 text-xs text-slate-500"><MapPin size={12} />Schneider Tower — Bengaluru</div>
          </div>
          <div className="flex items-center gap-3">
            {/* Building Score mini */}
            <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-lg bg-white/5 border border-white/10">
              <Award size={14} className="text-green-400" />
              <span className="text-xs font-bold text-white">{buildingScore.overall}</span>
              <span className="text-[10px] text-slate-500">/100</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-400"><Clock size={12} /><span className="font-mono">{time}</span></div>
            {/* Demo indicator */}
            {(demo.occupancyMultiplier !== 1 || demo.temperatureOffset !== 0 || demo.solarMultiplier !== 1) && (
              <Badge text="⚡ DEMO" color="amber" />
            )}
            {/* Notifications */}
            <button onClick={() => setNotifOpen(!notifOpen)} className="relative p-1.5 rounded-lg hover:bg-white/5">
              <Bell size={16} className="text-slate-400" />
              {unreadNotifs > 0 && <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-red-500 text-[8px] font-bold text-white flex items-center justify-center">{unreadNotifs}</span>}
            </button>
          </div>
        </header>

        {/* Content area */}
        <main className="flex-1 overflow-y-auto p-5 space-y-5">

          {/* ═══════════════════════════════════════════════════════════════════ */}
          {/* NOTIFICATION PANEL (overlay) */}
          {/* ═══════════════════════════════════════════════════════════════════ */}
          {notifOpen && (
            <div className="fixed top-14 right-4 w-96 max-h-[70vh] overflow-y-auto z-50 rounded-xl border shadow-2xl" style={{ background: 'rgba(11,17,32,0.98)', borderColor: 'rgba(255,255,255,0.1)' }}>
              <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                <h3 className="text-sm font-bold text-white">Notifications</h3>
                <button onClick={() => setNotifOpen(false)}><X size={16} className="text-slate-500" /></button>
              </div>
              <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
                {notifications.map(n => (
                  <div key={n.id} className="p-3 hover:bg-white/3">
                    <div className="flex items-start gap-2">
                      {n.type === 'critical' ? <AlertCircle size={14} className="text-red-400 mt-0.5 flex-shrink-0" /> :
                       n.type === 'warning' ? <AlertTriangle size={14} className="text-amber-400 mt-0.5 flex-shrink-0" /> :
                       n.type === 'optimization' ? <Sparkles size={14} className="text-green-400 mt-0.5 flex-shrink-0" /> :
                       <Info size={14} className="text-blue-400 mt-0.5 flex-shrink-0" />}
                      <div>
                        <p className="text-xs font-semibold text-white">{n.title}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">{n.message}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════════ */}
          {/* DEMO MODE PANEL */}
          {/* ═══════════════════════════════════════════════════════════════════ */}
          {demoOpen && (
            <Card className="border-amber-500/30 bg-gradient-to-r from-amber-500/5 to-transparent">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Radio size={16} className="text-amber-400" />
                  <h3 className="text-sm font-bold text-amber-400">Demo Simulation Mode</h3>
                  <Badge text="SIMULATED DATA" color="amber" />
                </div>
                <button onClick={() => setDemoOpen(false)}><X size={14} className="text-slate-500" /></button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {([
                  { key: 'occupancyMultiplier', label: 'Occupancy', min: 0, max: 2, step: 0.1 },
                  { key: 'temperatureOffset', label: 'Temp Offset (°C)', min: -5, max: 5, step: 0.5 },
                  { key: 'solarMultiplier', label: 'Solar Output', min: 0, max: 2, step: 0.1 },
                  { key: 'gridLoadMultiplier', label: 'Grid Load', min: 0.5, max: 1.5, step: 0.1 },
                  { key: 'hvacLoadMultiplier', label: 'HVAC Load', min: 0.5, max: 1.5, step: 0.1 },
                ] as const).map(s => (
                  <div key={s.key}>
                    <label className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">{s.label}</label>
                    <input type="range" min={s.min} max={s.max} step={s.step} value={demo[s.key]}
                      onChange={e => handleDemoChange(s.key, parseFloat(e.target.value))}
                      className="w-full h-1 accent-amber-400" />
                    <span className="text-xs font-mono text-amber-400">{demo[s.key].toFixed(1)}×</span>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* ╔══════════════════════════════════════════════════════════════════╗ */}
          {/* ║  PAGE: OVERVIEW                                                 ║ */}
          {/* ╚══════════════════════════════════════════════════════════════════╝ */}
          {page === 'overview' && (<>
            {/* Building Score + Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              <Card className="flex flex-col items-center justify-center">
                <ScoreRing score={buildingScore.overall} label="Building Score" size={90} />
              </Card>
              <MetricCard label="Total Power" value={overview.totalPower} unit="kW" icon={Zap} color="#4ADE80" />
              <MetricCard label="Today Energy" value={overview.todayEnergy.toLocaleString()} unit="kWh" icon={BarChart3} color="#60A5FA" />
              <MetricCard label="Today Cost" value={`₹${overview.todayCost.toLocaleString()}`} unit="current tariff" icon={IndianRupee} color="#FBBF24" />
              <MetricCard label="Carbon Rate" value={overview.carbonRate} unit="kg CO₂/h" icon={Leaf} color="#34D399" />
              <Card>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">BEE Rating</span>
                  <Star size={14} className="text-yellow-400" />
                </div>
                <StarRating rating={overview.beeStarRating} />
                <p className="text-[10px] text-slate-500 mt-1">EPI: {overview.epi} kWh/m²/yr</p>
              </Card>
            </div>

            {/* Digital Twin + Power Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2">
                <Card>
                  <SectionHeader icon={Building2} title="Digital Twin — Zone Overview" badge={<Badge text="4 Zones Active" color="green" />} />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {zones.map(zone => {
                      const zs = ZONE_COLORS[zone.zoneId];
                      const c = comfort.find(x => x.zoneId === zone.zoneId);
                      return (
                        <div key={zone.zoneId} onClick={() => setSelectedZone(selectedZone === zone.zoneId ? null : zone.zoneId)}
                          className={`rounded-lg border p-3 cursor-pointer transition-all hover:scale-[1.01] bg-gradient-to-br ${zs.bg} ${zs.border} ${selectedZone === zone.zoneId ? 'ring-1 ring-green-500/30' : ''}`}>
                          <div className="flex items-center justify-between mb-2">
                            <h4 className={`text-xs font-semibold ${zs.accent}`}>{zone.zoneName}</h4>
                            <span className="text-[10px] text-slate-500"><Users size={10} className="inline mr-0.5" />{zone.occupancy}/{zone.maxOccupancy}</span>
                          </div>
                          <div className="grid grid-cols-3 gap-2 text-center">
                            <div><p className="text-sm font-bold text-white">{zone.temperature}°C</p><p className="text-[9px] text-slate-500">Temp</p></div>
                            <div><p className="text-sm font-bold text-white">{zone.humidity}%</p><p className="text-[9px] text-slate-500">RH</p></div>
                            <div><p className="text-sm font-bold text-white">{zone.co2}</p><p className="text-[9px] text-slate-500">CO₂</p></div>
                          </div>
                          <div className="mt-2 pt-2 border-t border-white/5 flex justify-between text-[10px]">
                            <span className={Math.abs(c?.pmv ?? 0) <= 0.5 ? 'text-green-400' : 'text-yellow-400'}>PMV {c?.pmv.toFixed(2)}</span>
                            <span className="text-slate-500"><Zap size={10} className="inline" />{(zone.hvacPower + zone.lightingPower + zone.plugPower).toFixed(1)} kW</span>
                          </div>
                          {selectedZone === zone.zoneId && c && (
                            <div className="mt-2 pt-2 border-t border-white/5 space-y-1 text-[10px] animate-fade-in">
                              <div className="flex justify-between"><span className="text-slate-400">PM2.5</span><span className="text-white">{zone.pm25} µg/m³</span></div>
                              <div className="flex justify-between"><span className="text-slate-400">Lux</span><span className="text-white">{zone.lux}</span></div>
                              <div className="flex justify-between"><span className="text-slate-400">IEQ Score</span><span className={c.ieqScore >= 75 ? 'text-green-400' : 'text-yellow-400'}>{c.ieqScore}/100</span></div>
                              <div className="flex justify-between"><span className="text-slate-400">PPD</span><span className="text-white">{c.ppd}%</span></div>
                              <div className="flex justify-between"><span className="text-slate-400">Optimal SP</span><span className="text-green-400">{c.recommendedSetpoint.toFixed(1)}°C</span></div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </Card>
              </div>

              {/* Power Breakdown */}
              <Card>
                <SectionHeader icon={Activity} title="Power Breakdown" />
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={[
                      { name: 'HVAC', value: overview.hvacTotal },
                      { name: 'Lighting', value: overview.lightingTotal },
                      { name: 'Servers', value: overview.plugTotal },
                      { name: 'Solar', value: overview.solarPV },
                    ]} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                      {PIE_COLORS.map((c, i) => <Cell key={i} fill={c} stroke="transparent" />)}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-1.5 mt-2">
                  {[{ l: 'HVAC', v: overview.hvacTotal, c: '#00A300' }, { l: 'Lighting', v: overview.lightingTotal, c: '#FBBF24' },
                    { l: 'Servers', v: overview.plugTotal, c: '#A855F7' }, { l: 'Solar PV', v: overview.solarPV, c: '#3B82F6' }].map(x => (
                    <div key={x.l} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full" style={{ background: x.c }} /><span className="text-slate-300">{x.l}</span></div>
                      <span className="font-mono font-semibold text-white">{x.v} kW</span>
                    </div>
                  ))}
                  <div className="pt-1.5 border-t border-white/5 flex justify-between text-xs">
                    <span className="text-slate-400">Grid Import</span><span className="font-bold text-green-400 font-mono">{overview.gridImport} kW</span>
                  </div>
                </div>
              </Card>
            </div>

            {/* AI Insights Preview + Building Score Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2">
                <Card>
                  <SectionHeader icon={Brain} title="AI Energy Brain" badge={<button onClick={() => setPage('ai-insights')} className="text-[10px] text-green-400 hover:underline flex items-center gap-1">View All <ChevronRight size={12} /></button>} />
                  <div className="space-y-2">
                    {aiInsights.slice(0, 3).map(ins => (
                      <div key={ins.id} className="rounded-lg border p-3 flex gap-3 items-start" style={{ borderColor: 'rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
                        <Brain size={16} className={ins.severity === 'critical' ? 'text-red-400' : ins.severity === 'warning' ? 'text-amber-400' : 'text-green-400'} />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-white">{ins.title}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">{ins.problem}</p>
                          <div className="flex gap-3 mt-1.5 text-[10px]">
                            <span className="text-green-400">💡 {ins.energySaving} kWh/day</span>
                            <span className="text-amber-400">₹{ins.costSaving}/day</span>
                            <span className="text-blue-400">{ins.confidence}% conf</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
              <Card>
                <SectionHeader icon={Award} title="Building Health" />
                <div className="flex justify-center mb-3">
                  <ScoreRing score={buildingScore.overall} label="Overall" size={110} />
                </div>
                <div className="space-y-2">
                  {[
                    { l: 'Energy Efficiency', v: buildingScore.energyEfficiency, c: '#4ADE80' },
                    { l: 'Occupant Comfort', v: buildingScore.occupantComfort, c: '#22D3EE' },
                    { l: 'Air Quality', v: buildingScore.airQuality, c: '#60A5FA' },
                    { l: 'Equipment Health', v: buildingScore.equipmentHealth, c: '#FBBF24' },
                    { l: 'Renewables', v: buildingScore.renewableEnergy, c: '#F472B6' },
                    { l: 'Grid Response', v: buildingScore.gridResponsiveness, c: '#A78BFA' },
                  ].map(x => (
                    <div key={x.l}>
                      <div className="flex justify-between text-[10px] mb-0.5"><span className="text-slate-400">{x.l}</span><span className="text-white font-semibold">{x.v}</span></div>
                      <ProgressBar value={x.v} color={x.c} />
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            {/* Energy Chart */}
            <Card>
              <SectionHeader icon={TrendingDown} title="Energy Analytics — 24h Load Profile" />
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={energyHistory} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <defs>
                    {['#00A300','#FBBF24','#A855F7','#3B82F6'].map((c, i) => (
                      <linearGradient key={i} id={`g${i}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={c} stopOpacity={0.3} /><stop offset="95%" stopColor={c} stopOpacity={0} />
                      </linearGradient>
                    ))}
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" tick={{ fontSize: 9 }} interval="preserveStartEnd" />
                  <YAxis tick={{ fontSize: 9 }} width={40} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '10px' }} />
                  <Area type="monotone" dataKey="hvac" name="HVAC" stackId="1" stroke="#00A300" fill="url(#g0)" strokeWidth={1.5} />
                  <Area type="monotone" dataKey="lighting" name="Lighting" stackId="1" stroke="#FBBF24" fill="url(#g1)" strokeWidth={1.5} />
                  <Area type="monotone" dataKey="servers" name="Servers" stackId="1" stroke="#A855F7" fill="url(#g2)" strokeWidth={1.5} />
                  <Area type="monotone" dataKey="solar" name="Solar" stroke="#3B82F6" fill="url(#g3)" strokeWidth={1.5} />
                </AreaChart>
              </ResponsiveContainer>
            </Card>

            {/* Quick access: FDD + DR + Occupant Voting */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* FDD Alerts */}
              <Card>
                <SectionHeader icon={AlertTriangle} title="FDD Alerts" badge={<Badge text={`${alerts.length} active`} color={alerts.length > 3 ? 'red' : 'amber'} />} />
                {alerts.length === 0 ? (
                  <div className="text-center py-8"><CheckCircle2 size={32} className="text-green-500/30 mx-auto mb-2" /><p className="text-xs text-slate-500">All systems nominal</p></div>
                ) : (
                  <div className="space-y-2 max-h-[300px] overflow-y-auto">
                    {alerts.slice(0, 5).map(a => (
                      <div key={a.id} className={`rounded-lg border-l-2 p-2 text-xs ${a.severity === 'critical' ? 'border-l-red-500 bg-red-500/5' : a.severity === 'warning' ? 'border-l-amber-500 bg-amber-500/5' : 'border-l-blue-500 bg-blue-500/5'}`}>
                        <p className="font-semibold text-white text-[11px]">{a.title}</p>
                        {a.costBleed > 0 && <p className="text-red-400 text-[10px]">₹{a.costBleed}/day waste</p>}
                        <button onClick={() => handleAck(a.id)} className="mt-1 text-[9px] text-slate-500 hover:text-white">Acknowledge</button>
                      </div>
                    ))}
                  </div>
                )}
              </Card>

              {/* Demand Response */}
              <Card>
                <SectionHeader icon={Shield} title="Demand Response" />
                <div className="flex justify-center mb-3">
                  <CircularGauge value={demandResponse.currentGridDraw} max={demandResponse.targetGridDraw * 1.8} label="Grid Load" />
                </div>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between"><span className="text-slate-400">Status</span>
                    <span className={demandResponse.status === 'idle' ? 'text-slate-300' : demandResponse.status === 'peak_active' ? 'text-red-400' : 'text-blue-400'}>
                      {demandResponse.status === 'idle' ? '● Standby' : demandResponse.status === 'pre_cooling' ? '❄ Pre-Cool' : demandResponse.status === 'peak_active' ? '🔴 Peak' : '🔄 Recovery'}
                    </span>
                  </div>
                  <div className="flex justify-between"><span className="text-slate-400">Tariff</span><span className={`font-mono ${demandResponse.tariffPeriod === 'peak' ? 'text-red-400' : 'text-green-400'}`}>₹{demandResponse.currentTariffRate}/kWh</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Next Peak</span><span className="text-white">{demandResponse.nextPeakEvent}</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Battery</span><span className="text-white font-mono">{demandResponse.batterySoC}%</span></div>
                </div>
                <button onClick={handleDR} className={`w-full mt-3 py-2 rounded-lg text-xs font-semibold transition-all ${demandResponse.status !== 'idle' ? 'bg-red-500/15 text-red-400 border border-red-500/30' : 'bg-green-500/15 text-green-400 border border-green-500/30'}`}>
                  {demandResponse.status !== 'idle' ? 'Cancel DR' : 'Trigger DR Event'}
                </button>
              </Card>

              {/* Occupant Voting quick */}
              <Card>
                <SectionHeader icon={Smile} title="Occupant Voting" />
                <div className="space-y-3">
                  {zones.filter(z => z.zoneId !== 'server_room').map(z => {
                    const votes = occupantVotes[z.zoneId];
                    const total = votes.too_cold + votes.comfortable + votes.too_warm;
                    return (
                      <div key={z.zoneId}>
                        <p className={`text-[10px] font-semibold mb-1 ${ZONE_COLORS[z.zoneId].accent}`}>{z.zoneName}</p>
                        <div className="flex gap-1">
                          {(['too_cold','comfortable','too_warm'] as OccupantVote[]).map(v => (
                            <button key={v} onClick={() => handleVote(z.zoneId, v)}
                              className={`flex-1 py-1.5 rounded text-[10px] font-medium border transition-all ${voteFlash === `${z.zoneId}-${v}` ? 'ring-1 ring-green-400 bg-green-500/20' : 'bg-white/3 border-white/5 hover:bg-white/8'}`}>
                              {v === 'too_cold' ? '❄️' : v === 'comfortable' ? '😊' : '☀️'}
                            </button>
                          ))}
                        </div>
                        {total > 0 && (
                          <div className="flex h-1 rounded-full overflow-hidden mt-1">
                            <div className="bg-blue-400" style={{ width: `${(votes.too_cold/total)*100}%` }} />
                            <div className="bg-green-400" style={{ width: `${(votes.comfortable/total)*100}%` }} />
                            <div className="bg-orange-400" style={{ width: `${(votes.too_warm/total)*100}%` }} />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </Card>
            </div>
          </>)}

          {/* ╔══════════════════════════════════════════════════════════════════╗ */}
          {/* ║  PAGE: AI INSIGHTS                                             ║ */}
          {/* ╚══════════════════════════════════════════════════════════════════╝ */}
          {page === 'ai-insights' && (<>
            {/* AI Energy Brain */}
            <Card>
              <SectionHeader icon={Brain} title="AI Energy Brain" badge={<Badge text={`${aiInsights.length} insights`} color="green" />} />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {aiInsights.map(ins => (
                  <div key={ins.id} className={`rounded-xl border p-4 ${ins.severity === 'critical' ? 'border-red-500/30 bg-red-500/5' : ins.severity === 'warning' ? 'border-amber-500/30 bg-amber-500/5' : 'border-green-500/20 bg-green-500/5'}`}>
                    <div className="flex items-start gap-2 mb-2">
                      <Brain size={16} className={ins.severity === 'critical' ? 'text-red-400' : ins.severity === 'warning' ? 'text-amber-400' : 'text-green-400'} />
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-white">{ins.title}</h4>
                          <Badge text={`${ins.confidence}% conf`} color="blue" />
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-slate-300 mb-2">{ins.problem}</p>
                    <p className="text-[10px] text-slate-400 mb-2"><strong>Reason:</strong> {ins.reason}</p>
                    <div className="bg-green-500/10 rounded-lg p-2 mb-2">
                      <p className="text-[10px] text-green-400 font-semibold">💡 Recommended Action</p>
                      <p className="text-[10px] text-slate-300">{ins.action}</p>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="bg-white/3 rounded p-1.5"><p className="text-green-400 text-sm font-bold">{ins.energySaving}</p><p className="text-[8px] text-slate-500">kWh/day saved</p></div>
                      <div className="bg-white/3 rounded p-1.5"><p className="text-amber-400 text-sm font-bold">₹{ins.costSaving}</p><p className="text-[8px] text-slate-500">₹/day saved</p></div>
                      <div className="bg-white/3 rounded p-1.5"><p className="text-blue-400 text-sm font-bold">{ins.co2Reduction}</p><p className="text-[8px] text-slate-500">kg CO₂/day</p></div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Recommendations */}
            <Card>
              <SectionHeader icon={Target} title="Recommended Actions" badge={<Badge text="Ranked by Impact" color="green" />} />
              <div className="space-y-2">
                {recommendations.map((rec, i) => (
                  <div key={rec.id} className="flex items-center gap-3 rounded-lg border p-3" style={{ borderColor: 'rgba(255,255,255,0.06)', background: rec.applied ? 'rgba(0,163,0,0.08)' : 'rgba(255,255,255,0.02)' }}>
                    <span className="text-lg font-bold text-slate-600 w-6 text-center">{i + 1}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-semibold text-white">{rec.title}</p>
                        <Badge text={rec.impact} color={rec.impact === 'high' ? 'red' : rec.impact === 'medium' ? 'amber' : 'slate'} />
                        <Badge text={rec.urgency.replace('_', ' ')} color={rec.urgency === 'immediate' ? 'red' : rec.urgency === 'today' ? 'amber' : 'blue'} />
                      </div>
                      <p className="text-[10px] text-slate-400 mt-0.5">{rec.description}</p>
                      <div className="flex gap-3 mt-1 text-[10px]">
                        <span className="text-green-400">{rec.savingKwh} kWh/day</span>
                        <span className="text-amber-400">₹{rec.savingCost}/day</span>
                        <span className="text-blue-400">{rec.savingCO2} kg CO₂</span>
                      </div>
                    </div>
                    <div className="flex gap-1.5">
                      <button onClick={() => setPage('optimization')} className="px-2 py-1 text-[9px] rounded bg-white/5 text-slate-400 hover:text-white border border-white/10">Simulate</button>
                      <button onClick={() => handleToggleRec(rec.id)} className={`px-2 py-1 text-[9px] rounded border ${rec.applied ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-white/5 text-slate-400 border-white/10 hover:text-white'}`}>
                        {rec.applied ? '✓ Applied' : 'Apply'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Anomalies */}
            <Card>
              <SectionHeader icon={Eye} title="Energy Anomalies" badge={<Badge text={`${anomalies.length} detected`} color={anomalies.some(a => a.severity === 'critical') ? 'red' : 'amber'} />} />
              <div className="space-y-2">
                {anomalies.map(a => (
                  <div key={a.id} className={`rounded-lg border-l-2 p-3 ${a.severity === 'critical' ? 'border-l-red-500 bg-red-500/5' : a.severity === 'warning' ? 'border-l-amber-500 bg-amber-500/5' : 'bg-white/2'}`}>
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2"><p className="text-xs font-semibold text-white">{a.metric} — {a.affectedZone}</p><Badge text={a.severity} color={a.severity === 'critical' ? 'red' : 'amber'} /></div>
                        <p className="text-[10px] text-slate-400 mt-0.5">{a.possibleCause}</p>
                      </div>
                      <div className="text-right text-[10px]">
                        <p className="text-slate-500">Expected: <span className="text-green-400">{a.expectedValue} kW</span></p>
                        <p className="text-slate-500">Actual: <span className="text-red-400">{a.actualValue} kW</span></p>
                        <p className="text-red-400 font-semibold">+{a.deviationPercent}% deviation</p>
                      </div>
                    </div>
                    <p className="text-[10px] text-emerald-400/80 mt-1">💡 {a.recommendedAction}</p>
                  </div>
                ))}
              </div>
            </Card>
          </>)}

          {/* ╔══════════════════════════════════════════════════════════════════╗ */}
          {/* ║  PAGE: FORECAST                                                ║ */}
          {/* ╚══════════════════════════════════════════════════════════════════╝ */}
          {page === 'forecast' && (<>
            <Card>
              <div className="flex items-center justify-between mb-4">
                <SectionHeader icon={TrendingUp} title="Energy Forecast" />
                <div className="flex gap-1">
                  {(['today','tomorrow','7days'] as const).map(p => (
                    <button key={p} onClick={() => handleForecastPeriod(p)}
                      className={`px-3 py-1 text-xs rounded-lg transition-all ${forecastPeriod === p ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'text-slate-400 hover:bg-white/5'}`}>
                      {p === '7days' ? '7 Days' : p.charAt(0).toUpperCase() + p.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={forecast.slice(0, forecastPeriod === '7days' ? 168 : 24)} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" tick={{ fontSize: 9 }} interval={forecastPeriod === '7days' ? 23 : 'preserveStartEnd'} />
                  <YAxis tick={{ fontSize: 9 }} width={40} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '10px' }} />
                  <Line type="monotone" dataKey="actual" name="Actual" stroke="#4ADE80" strokeWidth={2} dot={false} connectNulls={false} />
                  <Line type="monotone" dataKey="predicted" name="Predicted" stroke="#60A5FA" strokeWidth={2} dot={false} strokeDasharray="4 2" />
                  <Line type="monotone" dataKey="optimized" name="Optimized" stroke="#00A300" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="peak" name="Peak Threshold" stroke="#F87171" strokeWidth={1} dot={false} strokeDasharray="8 4" />
                </LineChart>
              </ResponsiveContainer>
            </Card>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              <MetricCard label="Predicted Peak" value={`${forecastSummary.predictedPeak} kW`} icon={TrendingUp} color="#F87171" />
              <MetricCard label="Peak Time" value={forecastSummary.peakTime} icon={Clock} color="#FBBF24" />
              <MetricCard label="Expected Daily" value={`${forecastSummary.expectedDaily} kWh`} icon={BarChart3} color="#60A5FA" />
              <MetricCard label="Expected Cost" value={`₹${forecastSummary.expectedCost}`} icon={IndianRupee} color="#FBBF24" />
              <MetricCard label="Optimized Daily" value={`${forecastSummary.optimizedDaily} kWh`} icon={TrendingDown} color="#4ADE80" />
              <MetricCard label="Optimized Cost" value={`₹${forecastSummary.optimizedCost}`} icon={IndianRupee} color="#4ADE80" />
            </div>
          </>)}

          {/* ╔══════════════════════════════════════════════════════════════════╗ */}
          {/* ║  PAGE: ENERGY (Analytics + Carbon)                             ║ */}
          {/* ╚══════════════════════════════════════════════════════════════════╝ */}
          {page === 'energy' && (<>
            <Card>
              <SectionHeader icon={TrendingDown} title="Energy Analytics — 24h Load Profile" />
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={energyHistory}>
                  <defs>
                    {['#00A300','#FBBF24','#A855F7','#3B82F6'].map((c, i) => (
                      <linearGradient key={i} id={`ge${i}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={c} stopOpacity={0.3} /><stop offset="95%" stopColor={c} stopOpacity={0} />
                      </linearGradient>
                    ))}
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="time" tick={{ fontSize: 9 }} interval="preserveStartEnd" /><YAxis tick={{ fontSize: 9 }} width={40} />
                  <Tooltip content={<CustomTooltip />} /><Legend iconType="circle" wrapperStyle={{ fontSize: '10px' }} />
                  <Area type="monotone" dataKey="hvac" name="HVAC" stackId="1" stroke="#00A300" fill="url(#ge0)" strokeWidth={1.5} />
                  <Area type="monotone" dataKey="lighting" name="Lighting" stackId="1" stroke="#FBBF24" fill="url(#ge1)" strokeWidth={1.5} />
                  <Area type="monotone" dataKey="servers" name="Servers" stackId="1" stroke="#A855F7" fill="url(#ge2)" strokeWidth={1.5} />
                  <Area type="monotone" dataKey="solar" name="Solar" stroke="#3B82F6" fill="url(#ge3)" strokeWidth={1.5} />
                </AreaChart>
              </ResponsiveContainer>
            </Card>

            {/* Carbon Intelligence */}
            <Card>
              <SectionHeader icon={Leaf} title="Carbon Intelligence" />
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
                <div className="text-center p-3 rounded-lg bg-white/3"><p className="text-xl font-bold text-white">{carbon.currentRate}</p><p className="text-[9px] text-slate-500">kg CO₂/h now</p></div>
                <div className="text-center p-3 rounded-lg bg-white/3"><p className="text-xl font-bold text-white">{carbon.dailyCO2}</p><p className="text-[9px] text-slate-500">kg CO₂ today</p></div>
                <div className="text-center p-3 rounded-lg bg-white/3"><p className="text-xl font-bold text-white">{carbon.monthlyCO2}</p><p className="text-[9px] text-slate-500">kg CO₂/month est</p></div>
                <div className="text-center p-3 rounded-lg bg-green-500/10"><p className="text-xl font-bold text-green-400">{carbon.avoidedCO2}</p><p className="text-[9px] text-green-500/60">kg CO₂ avoided</p></div>
                <div className="text-center p-3 rounded-lg bg-green-500/10"><p className="text-xl font-bold text-green-400">{carbon.annualReductionEstimate.toLocaleString()}</p><p className="text-[9px] text-green-500/60">kg/yr if AI applied</p></div>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={carbon.trend}>
                  <CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="time" tick={{ fontSize: 9 }} /><YAxis tick={{ fontSize: 9 }} width={40} /><Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="emissions" name="Emissions" stroke="#F87171" fill="rgba(248,113,113,0.1)" strokeWidth={1.5} />
                  <Area type="monotone" dataKey="avoided" name="Avoided" stroke="#4ADE80" fill="rgba(74,222,128,0.1)" strokeWidth={1.5} />
                </AreaChart>
              </ResponsiveContainer>
              <p className="text-[10px] text-slate-500 mt-2 italic">* Estimates based on CEA India emission factor: 0.716 kg CO₂/kWh. Avoided emissions from solar + AI optimization.</p>
            </Card>
          </>)}

          {/* ╔══════════════════════════════════════════════════════════════════╗ */}
          {/* ║  PAGE: DIGITAL TWIN (Detailed)                                 ║ */}
          {/* ╚══════════════════════════════════════════════════════════════════╝ */}
          {page === 'digital-twin' && (<>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {zones.map(zone => {
                const c = comfort.find(x => x.zoneId === zone.zoneId);
                const occ = occupancyIntelligence.find(x => x.zoneId === zone.zoneId);
                const exp = occupantExperience.find(x => x.zoneId === zone.zoneId);
                const zs = ZONE_COLORS[zone.zoneId];
                return (
                  <Card key={zone.zoneId} className={`${zs.border} bg-gradient-to-br ${zs.bg}`}>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className={`text-sm font-bold ${zs.accent}`}>{zone.zoneName}</h3>
                      <div className="flex items-center gap-2">
                        {exp && <Badge text={exp.status} color={exp.status === 'Excellent' ? 'green' : exp.status === 'Good' ? 'blue' : 'amber'} />}
                        <ScoreRing score={exp?.overallScore ?? 0} label="Comfort" size={55} />
                      </div>
                    </div>
                    <div className="grid grid-cols-3 md:grid-cols-6 gap-2 mb-3">
                      {[
                        { l: 'Temp', v: `${zone.temperature}°C`, ic: Thermometer },
                        { l: 'Humidity', v: `${zone.humidity}%`, ic: Droplets },
                        { l: 'CO₂', v: `${zone.co2} ppm`, ic: Wind },
                        { l: 'PMV', v: c?.pmv.toFixed(2) ?? '—', ic: HeartPulse },
                        { l: 'Occupancy', v: `${zone.occupancy}/${zone.maxOccupancy}`, ic: Users },
                        { l: 'Power', v: `${(zone.hvacPower+zone.lightingPower+zone.plugPower).toFixed(1)} kW`, ic: Zap },
                      ].map(m => (
                        <div key={m.l} className="text-center p-2 rounded bg-white/3">
                          <m.ic size={12} className="mx-auto text-slate-500 mb-0.5" />
                          <p className="text-xs font-bold text-white">{m.v}</p>
                          <p className="text-[8px] text-slate-500">{m.l}</p>
                        </div>
                      ))}
                    </div>
                    {c && <div className="mb-2"><div className="flex justify-between text-[9px] text-slate-500 mb-0.5"><span>Cold</span><span>Neutral</span><span>Hot</span></div><PMVBar pmv={c.pmv} /></div>}
                    <div className="grid grid-cols-3 gap-2 mb-2">
                      <div className="text-center p-1.5 rounded bg-white/3"><p className="text-[10px] text-slate-400">Setpoint</p><p className="text-xs font-bold text-white">{zone.setpoint}°C</p></div>
                      <div className="text-center p-1.5 rounded bg-white/3"><p className="text-[10px] text-slate-400">PM2.5</p><p className="text-xs font-bold text-white">{zone.pm25} µg</p></div>
                      <div className="text-center p-1.5 rounded bg-white/3"><p className="text-[10px] text-slate-400">Lux</p><p className="text-xs font-bold text-white">{zone.lux}</p></div>
                    </div>
                    {occ && <div className="rounded-lg bg-green-500/5 p-2 text-[10px]"><Sparkles size={10} className="inline text-green-400 mr-1" /><span className="text-green-400">AI:</span> <span className="text-slate-300">{occ.recommendation}</span></div>}
                  </Card>
                );
              })}
            </div>
          </>)}

          {/* ╔══════════════════════════════════════════════════════════════════╗ */}
          {/* ║  PAGE: EQUIPMENT (HVAC + Predictive Maintenance)               ║ */}
          {/* ╚══════════════════════════════════════════════════════════════════╝ */}
          {page === 'equipment' && (<>
            {/* Smart HVAC */}
            <Card>
              <SectionHeader icon={Snowflake} title="Smart HVAC Optimization" badge={<Badge text="Comfort Protection: ACTIVE" color="green" />} />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {smartHVAC.map(h => {
                  const zs = ZONE_COLORS[h.zoneId];
                  return (
                    <div key={h.zoneId} className={`rounded-lg border p-3 ${zs.border}`}>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className={`text-xs font-semibold ${zs.accent}`}>{h.zoneName}</h4>
                        <Badge text={h.comfortStatus} color={h.comfortStatus === 'Excellent' ? 'green' : h.comfortStatus === 'Good' ? 'blue' : 'amber'} />
                      </div>
                      <div className="grid grid-cols-4 gap-2 text-center text-[10px] mb-2">
                        <div><p className="text-white font-bold">{h.temperature}°C</p><p className="text-slate-500">Temp</p></div>
                        <div><p className="text-white font-bold">{h.setpoint}°C</p><p className="text-slate-500">Setpoint</p></div>
                        <div><p className="text-white font-bold">{h.occupancy}</p><p className="text-slate-500">Occ</p></div>
                        <div><p className="text-white font-bold">{h.hvacPower} kW</p><p className="text-slate-500">HVAC</p></div>
                      </div>
                      <div className="flex gap-1 mb-2">
                        {(['auto','comfort','energy_saver','peak_reduction'] as HVACMode[]).map(m => (
                          <button key={m} onClick={() => handleHVACMode(h.zoneId, m)}
                            className={`flex-1 py-1 text-[9px] rounded border transition-all ${h.mode === m ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-white/3 text-slate-500 border-white/5 hover:text-white'}`}>
                            {m === 'auto' ? 'Auto' : m === 'comfort' ? 'Comfort' : m === 'energy_saver' ? 'Eco' : 'Peak'}
                          </button>
                        ))}
                      </div>
                      {h.mode !== 'auto' && (
                        <div className="grid grid-cols-3 gap-1 text-center text-[9px] bg-green-500/5 rounded p-1.5">
                          <div><span className="text-green-400 font-bold">{h.savings.kwhSaved} kWh</span><br /><span className="text-slate-500">saved/day</span></div>
                          <div><span className="text-amber-400 font-bold">₹{h.savings.costSaved}</span><br /><span className="text-slate-500">saved/day</span></div>
                          <div><span className="text-blue-400 font-bold">{h.savings.co2Avoided} kg</span><br /><span className="text-slate-500">CO₂/day</span></div>
                        </div>
                      )}
                      {!h.comfortProtection && <p className="text-[9px] text-red-400 mt-1">⚠ PMV outside comfort range. Consider restoring HVAC settings.</p>}
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* Predictive Maintenance */}
            <Card>
              <SectionHeader icon={Wrench} title="Predictive Maintenance" />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                {equipmentHealth.map(eq => (
                  <div key={eq.id} className={`rounded-lg border p-3 ${eq.status === 'critical' ? 'border-red-500/30 bg-red-500/5' : eq.status === 'warning' ? 'border-amber-500/30 bg-amber-500/5' : eq.status === 'attention' ? 'border-yellow-500/20' : 'border-white/5'}`}>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-xs font-semibold text-white">{eq.name}</h4>
                      <Badge text={eq.status} color={eq.status === 'critical' ? 'red' : eq.status === 'warning' ? 'amber' : eq.status === 'attention' ? 'amber' : 'green'} />
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <ScoreRing score={eq.healthScore} label="Health" size={60} />
                      <div className="text-[10px] space-y-0.5">
                        <p className="text-slate-400">Current: <span className="text-white font-mono">{eq.currentPower} kW</span></p>
                        <p className="text-slate-400">Expected: <span className="text-green-400 font-mono">{eq.expectedPower} kW</span></p>
                        <p className="text-slate-400">Action in: <span className="text-amber-400">{eq.daysToAction} days</span></p>
                      </div>
                    </div>
                    <p className="text-[10px] text-slate-400 mb-1"><strong>AI:</strong> {eq.predictedIssue}</p>
                    <p className="text-[10px] text-emerald-400/80">💡 {eq.recommendation}</p>
                  </div>
                ))}
              </div>
            </Card>
          </>)}

          {/* ╔══════════════════════════════════════════════════════════════════╗ */}
          {/* ║  PAGE: RENEWABLES (Solar + Battery + Grid)                     ║ */}
          {/* ╚══════════════════════════════════════════════════════════════════╝ */}
          {page === 'renewables' && (<>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Energy Flow */}
              <Card>
                <SectionHeader icon={Sun} title="Renewable Energy Optimization" />
                <div className="flex flex-col items-center gap-3 py-4">
                  {/* Visual Flow: Solar → Building → Battery → Grid */}
                  <div className="grid grid-cols-4 gap-4 w-full text-center">
                    <div className="rounded-lg bg-yellow-500/10 p-3"><Sun size={24} className="mx-auto text-yellow-400 mb-1" /><p className="text-sm font-bold text-white">{renewables.solarGeneration} kW</p><p className="text-[9px] text-slate-500">Solar PV</p></div>
                    <div className="rounded-lg bg-green-500/10 p-3"><Building2 size={24} className="mx-auto text-green-400 mb-1" /><p className="text-sm font-bold text-white">{renewables.buildingConsumption} kW</p><p className="text-[9px] text-slate-500">Building</p></div>
                    <div className="rounded-lg bg-blue-500/10 p-3"><BatteryCharging size={24} className="mx-auto text-blue-400 mb-1" /><p className="text-sm font-bold text-white">{renewables.batterySoC}%</p><p className="text-[9px] text-slate-500">Battery</p></div>
                    <div className="rounded-lg bg-purple-500/10 p-3"><Plug size={24} className="mx-auto text-purple-400 mb-1" /><p className="text-sm font-bold text-white">{renewables.gridImport} kW</p><p className="text-[9px] text-slate-500">Grid</p></div>
                  </div>
                  <div className="flex gap-2 text-slate-500 text-xl">→ → →</div>
                  <div className="grid grid-cols-3 gap-3 w-full">
                    <div className="text-center p-2 rounded-lg bg-white/3"><p className="text-lg font-bold text-yellow-400">{renewables.solarUtilization}%</p><p className="text-[9px] text-slate-500">Solar Utilization</p></div>
                    <div className="text-center p-2 rounded-lg bg-white/3"><p className="text-lg font-bold text-blue-400">{renewables.gridDependency}%</p><p className="text-[9px] text-slate-500">Grid Dependency</p></div>
                    <div className="text-center p-2 rounded-lg bg-white/3"><p className="text-lg font-bold text-green-400">{renewables.renewableContribution}%</p><p className="text-[9px] text-slate-500">Renewable Share</p></div>
                  </div>
                </div>
                <div className="rounded-lg bg-green-500/5 p-3 mt-2"><Sparkles size={12} className="inline text-green-400 mr-1" /><span className="text-[10px] text-slate-300">{renewables.recommendation}</span></div>
              </Card>

              {/* Grid Flexibility */}
              <Card>
                <SectionHeader icon={Gauge} title="Grid Flexibility" />
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="p-3 rounded-lg bg-white/3 text-center"><p className="text-lg font-bold text-white">{gridFlexibility.currentGridLoad} kW</p><p className="text-[9px] text-slate-500">Current Load</p></div>
                  <div className="p-3 rounded-lg bg-white/3 text-center"><p className="text-lg font-bold text-red-400">{gridFlexibility.peakLoad} kW</p><p className="text-[9px] text-slate-500">Peak Load</p></div>
                </div>
                <div className="text-xs mb-3">
                  <p className="text-slate-400">Peak Window: <span className="text-amber-400">{gridFlexibility.peakWindow}</span></p>
                  <p className="text-slate-400 mt-1">Flexible Load: <span className="text-green-400">{gridFlexibility.flexibleLoadAvailable} kW</span></p>
                </div>
                <div className="space-y-1.5 mb-3">
                  {gridFlexibility.flexibleLoads.map(fl => (
                    <div key={fl.name} className="flex justify-between text-[10px] px-2 py-1 rounded bg-white/3">
                      <span className="text-slate-300">{fl.name}</span>
                      <span className="text-white font-mono">{fl.power} kW</span>
                    </div>
                  ))}
                </div>
                <button onClick={() => setShiftApplied(!shiftApplied)}
                  className={`w-full py-2.5 rounded-lg text-xs font-semibold transition-all ${shiftApplied ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-blue-500/15 text-blue-400 border border-blue-500/30 hover:bg-blue-500/25'}`}>
                  {shiftApplied ? '✓ Loads Shifted' : '⚡ Shift Flexible Loads'}
                </button>
                {shiftApplied && (
                  <div className="grid grid-cols-3 gap-2 mt-3 text-center animate-fade-in">
                    <div className="p-2 rounded bg-white/3"><p className="text-slate-400 text-[9px]">Before</p><p className="text-sm font-bold text-white">{overview.totalPower} kW</p></div>
                    <div className="p-2 rounded bg-green-500/10"><p className="text-green-500/60 text-[9px]">After</p><p className="text-sm font-bold text-green-400">{(overview.totalPower - gridFlexibility.shiftedLoad).toFixed(1)} kW</p></div>
                    <div className="p-2 rounded bg-green-500/10"><p className="text-green-500/60 text-[9px]">Saving</p><p className="text-sm font-bold text-green-400">₹{gridFlexibility.costSaving}</p></div>
                  </div>
                )}
                <p className="text-[9px] text-slate-600 mt-2 italic">* Simulated load-shifting scenario for demonstration purposes.</p>
              </Card>
            </div>
          </>)}

          {/* ╔══════════════════════════════════════════════════════════════════╗ */}
          {/* ║  PAGE: OPTIMIZATION (What-If Simulator)                        ║ */}
          {/* ╚══════════════════════════════════════════════════════════════════╝ */}
          {page === 'optimization' && (<>
            <Card>
              <SectionHeader icon={Sliders} title="AI What-If Simulator" badge={<Badge text="SIMULATED" color="amber" />} />
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Sliders */}
                <div className="space-y-4">
                  {([
                    { key: 'hvacOptimization', label: 'HVAC Optimization', icon: Snowflake, max: 30 },
                    { key: 'lightingOptimization', label: 'Lighting Optimization', icon: Lightbulb, max: 40 },
                    { key: 'occupancyControl', label: 'Occupancy-Based Control', icon: Users, max: 30 },
                    { key: 'loadShifting', label: 'Load Shifting', icon: ArrowRight, max: 25 },
                    { key: 'solarUtilization', label: 'Solar Utilization', icon: Sun, max: 100 },
                    { key: 'batteryUsage', label: 'Battery Usage', icon: BatteryCharging, max: 100 },
                  ] as const).map(s => (
                    <div key={s.key}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2"><s.icon size={14} className="text-slate-400" /><span className="text-xs text-slate-300">{s.label}</span></div>
                        <span className="text-xs font-mono text-green-400">{whatIf[s.key]}%</span>
                      </div>
                      <input type="range" min={0} max={s.max} step={1} value={whatIf[s.key]}
                        onChange={e => setWhatIf({ ...whatIf, [s.key]: parseInt(e.target.value) })}
                        className="w-full h-1.5 accent-green-500" />
                    </div>
                  ))}
                </div>

                {/* Results */}
                <div>
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="p-3 rounded-lg bg-white/3 text-center">
                      <p className="text-[9px] text-slate-500 uppercase mb-1">Current Energy</p>
                      <p className="text-xl font-bold text-white">{whatIfResult.currentEnergy} <span className="text-xs text-slate-400">kWh/day</span></p>
                    </div>
                    <div className="p-3 rounded-lg bg-green-500/10 text-center">
                      <p className="text-[9px] text-green-500/60 uppercase mb-1">Projected Energy</p>
                      <p className="text-xl font-bold text-green-400">{whatIfResult.projectedEnergy} <span className="text-xs text-green-500/60">kWh/day</span></p>
                    </div>
                    <div className="p-3 rounded-lg bg-white/3 text-center">
                      <p className="text-[9px] text-slate-500 uppercase mb-1">Current Cost</p>
                      <p className="text-xl font-bold text-white">₹{whatIfResult.currentCost}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-green-500/10 text-center">
                      <p className="text-[9px] text-green-500/60 uppercase mb-1">Projected Cost</p>
                      <p className="text-xl font-bold text-green-400">₹{whatIfResult.projectedCost}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="text-center p-2 rounded bg-green-500/10"><p className="text-lg font-bold text-green-400">{whatIfResult.energyReduction}%</p><p className="text-[8px] text-slate-500">Energy Reduction</p></div>
                    <div className="text-center p-2 rounded bg-amber-500/10"><p className="text-lg font-bold text-amber-400">₹{whatIfResult.costSaving}</p><p className="text-[8px] text-slate-500">Cost Saving/day</p></div>
                    <div className="text-center p-2 rounded bg-blue-500/10"><p className="text-lg font-bold text-blue-400">{whatIfResult.co2Reduction}</p><p className="text-[8px] text-slate-500">kg CO₂/day</p></div>
                  </div>
                  {/* Before/After Bar Chart */}
                  <div className="mt-4">
                    <ResponsiveContainer width="100%" height={150}>
                      <BarChart data={[
                        { name: 'Energy (kWh)', current: whatIfResult.currentEnergy, projected: whatIfResult.projectedEnergy },
                        { name: 'Cost (₹)', current: whatIfResult.currentCost, projected: whatIfResult.projectedCost },
                      ]}>
                        <CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" tick={{ fontSize: 10 }} /><YAxis tick={{ fontSize: 9 }} width={50} />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="current" name="Current" fill="#64748B" radius={[4,4,0,0]} />
                        <Bar dataKey="projected" name="Optimized" fill="#00A300" radius={[4,4,0,0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <p className="text-[9px] text-slate-600 mt-2 italic">* All savings are estimated projections based on simulated building model.</p>
                </div>
              </div>
            </Card>
          </>)}

          {/* ╔══════════════════════════════════════════════════════════════════╗ */}
          {/* ║  PAGE: OCCUPANT (Experience + Intelligence + Voting)           ║ */}
          {/* ╚══════════════════════════════════════════════════════════════════╝ */}
          {page === 'occupant' && (<>
            {/* Occupant Experience */}
            <Card>
              <SectionHeader icon={HeartPulse} title="Occupant Experience" badge={<Badge text={`Avg Score: ${Math.round(occupantExperience.reduce((s,x) => s + x.overallScore, 0) / occupantExperience.length)}/100`} color="green" />} />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                {occupantExperience.map(oe => {
                  const zs = ZONE_COLORS[oe.zoneId];
                  return (
                    <div key={oe.zoneId} className={`rounded-lg border p-3 ${zs.border}`}>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className={`text-xs font-semibold ${zs.accent}`}>{oe.zoneName}</h4>
                        <Badge text={oe.status} color={oe.status === 'Excellent' ? 'green' : oe.status === 'Good' ? 'blue' : 'amber'} />
                      </div>
                      <div className="flex justify-center mb-2"><ScoreRing score={oe.overallScore} label="Overall" size={70} /></div>
                      <div className="space-y-1.5">
                        <div><div className="flex justify-between text-[9px]"><span className="text-slate-400">Thermal</span><span className="text-white">{oe.thermalComfort}</span></div><ProgressBar value={oe.thermalComfort} color="#22D3EE" height="h-1" /></div>
                        <div><div className="flex justify-between text-[9px]"><span className="text-slate-400">Air Quality</span><span className="text-white">{oe.airQuality}</span></div><ProgressBar value={oe.airQuality} color="#4ADE80" height="h-1" /></div>
                        <div><div className="flex justify-between text-[9px]"><span className="text-slate-400">Lighting</span><span className="text-white">{oe.lightingQuality}</span></div><ProgressBar value={oe.lightingQuality} color="#FBBF24" height="h-1" /></div>
                      </div>
                      <div className="mt-2 pt-2 border-t border-white/5">
                        {oe.recommendations.map((r, i) => <p key={i} className="text-[9px] text-slate-400">• {r}</p>)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* Occupancy Intelligence */}
            <Card>
              <SectionHeader icon={Users} title="Occupancy Intelligence" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {occupancyIntelligence.map(oi => {
                  const zs = ZONE_COLORS[oi.zoneId];
                  return (
                    <div key={oi.zoneId} className={`rounded-lg border p-3 ${zs.border}`}>
                      <h4 className={`text-xs font-semibold mb-2 ${zs.accent}`}>{oi.zoneName}</h4>
                      <div className="grid grid-cols-3 gap-2 text-center text-[10px] mb-2">
                        <div className="p-1.5 rounded bg-white/3"><p className="font-bold text-white">{oi.current} / {oi.capacity}</p><p className="text-slate-500">Current</p></div>
                        <div className="p-1.5 rounded bg-white/3"><p className="font-bold text-white">{oi.percentage}%</p><p className="text-slate-500">Occupancy</p></div>
                        <div className="p-1.5 rounded bg-blue-500/10"><p className="font-bold text-blue-400">{oi.predictedAt14}</p><p className="text-slate-500">Pred @14:00</p></div>
                      </div>
                      <div className="flex gap-2 text-[10px] mb-2">
                        <span className="text-slate-400">HVAC: <span className="text-white">{oi.hvacLoad} kW</span></span>
                        <span className="text-slate-400">Lighting: <span className="text-white">{oi.lightingLoad} kW</span></span>
                      </div>
                      <div className="rounded bg-green-500/5 p-2"><Sparkles size={10} className="inline text-green-400 mr-1" /><span className="text-[10px] text-slate-300">{oi.recommendation}</span></div>
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* Occupant Voting */}
            <Card>
              <SectionHeader icon={Smile} title="Occupant Micro-Voting" badge={<Badge text="Anonymous" color="blue" />} />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                {zones.map(z => {
                  const votes = occupantVotes[z.zoneId]; const total = votes.too_cold + votes.comfortable + votes.too_warm; const zs = ZONE_COLORS[z.zoneId];
                  return (
                    <div key={z.zoneId} className={`rounded-lg border p-3 ${zs.border}`}>
                      <h4 className={`text-xs font-semibold mb-2 ${zs.accent}`}>{z.zoneName}</h4>
                      <div className="grid grid-cols-3 gap-2 text-center text-[10px] mb-2">
                        <div className="p-1.5 rounded bg-white/3"><p className="text-white font-bold">{z.temperature}°C</p><p className="text-slate-500">Temp</p></div>
                        <div className="p-1.5 rounded bg-white/3"><p className="text-white font-bold">{z.co2}</p><p className="text-slate-500">CO₂</p></div>
                        <div className="p-1.5 rounded bg-white/3"><p className={`font-bold ${comfort.find(c=>c.zoneId===z.zoneId)!.ieqScore >= 75 ? 'text-green-400' : 'text-yellow-400'}`}>{comfort.find(c=>c.zoneId===z.zoneId)!.ieqScore}</p><p className="text-slate-500">IEQ</p></div>
                      </div>
                      <p className="text-[9px] text-slate-500 text-center mb-1">How do you feel?</p>
                      <div className="flex gap-1">
                        {(['too_cold','comfortable','too_warm'] as OccupantVote[]).map(v => (
                          <button key={v} onClick={() => handleVote(z.zoneId, v)}
                            className={`flex-1 py-2 rounded text-xs font-medium border transition-all ${voteFlash === `${z.zoneId}-${v}` ? 'ring-1 ring-green-400 bg-green-500/20' : 'bg-white/3 border-white/5 hover:bg-white/8'}`}>
                            {v === 'too_cold' ? '❄️ Cold' : v === 'comfortable' ? '😊 Good' : '☀️ Warm'}
                          </button>
                        ))}
                      </div>
                      {total > 0 && (
                        <div className="mt-2">
                          <div className="flex h-1.5 rounded-full overflow-hidden">
                            <div className="bg-blue-400" style={{ width: `${(votes.too_cold/total)*100}%` }} />
                            <div className="bg-green-400" style={{ width: `${(votes.comfortable/total)*100}%` }} />
                            <div className="bg-orange-400" style={{ width: `${(votes.too_warm/total)*100}%` }} />
                          </div>
                          <div className="flex justify-between text-[9px] text-slate-500 mt-0.5">
                            <span>❄ {votes.too_cold}</span><span>😊 {votes.comfortable}</span><span>☀ {votes.too_warm}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </Card>
          </>)}

        </main>

        {/* Footer */}
        <footer className="h-8 flex items-center justify-center border-t flex-shrink-0 text-[9px] text-slate-600" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
          EcoPulse 360 — AI-Powered Smart Building Energy Operating System — Schneider Electric Yuva Yodha 2026
          {(demo.occupancyMultiplier !== 1 || demo.temperatureOffset !== 0 || demo.solarMultiplier !== 1) && <span className="ml-3 text-amber-500/60">⚡ Demo Simulation Active</span>}
        </footer>
      </div>
    </div>
  );
}
