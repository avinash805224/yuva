// ============================================================================
// MisuseAlarmCenter.tsx — Real-Time Energy Misuse Alarm & Alert Engine
// Detects unoccupied space heating/cooling, over-cooling, lighting waste, equipment spikes
// Features: Audio/Visual Alerting, Auto-Rectification, Sensitivity Controls, Test Trigger
// ============================================================================

import { useState } from 'react';
import {
  AlertCircle, ShieldAlert, CheckCircle2, Volume2, VolumeX
} from 'lucide-react';
import { DataBadge } from './DataTransparencyModal';

export interface MisuseAlarm {
  id: string;
  zone_id: string;
  zoneName: string;
  type: 'UNOCCUPIED_HVAC_MISUSE' | 'OVER_COOLING_MISUSE' | 'AFTER_HOURS_LIGHTING' | 'EQUIPMENT_BLEED_SPIKE';
  title: string;
  description: string;
  severity: 'CRITICAL' | 'WARNING';
  wastedKWhPerDay: number;
  costBleedPerDay: number;
  detectedTimestamp: string;
  status: 'ACTIVE_ALARM' | 'RECTIFIED' | 'SILENCED';
}

const INITIAL_MISUSE_ALARMS: MisuseAlarm[] = [
  {
    id: 'alarm-01',
    zone_id: 'cafeteria',
    zoneName: 'Zone 3C — Cafeteria & Lounge',
    type: 'UNOCCUPIED_HVAC_MISUSE',
    title: '🚨 CRITICAL MISUSE: High HVAC Output in Zero Occupancy Zone',
    description: 'Cafeteria VRF cooling running at 85% capacity (16.4 kW) with 0 occupants detected.',
    severity: 'CRITICAL',
    wastedKWhPerDay: 42.5,
    costBleedPerDay: 361.25,
    detectedTimestamp: new Date().toISOString(),
    status: 'ACTIVE_ALARM',
  },
  {
    id: 'alarm-02',
    zone_id: 'workstations',
    zoneName: 'Zone 3A — Workstations',
    type: 'OVER_COOLING_MISUSE',
    title: '⚠️ MISUSE WARNING: Over-Cooling Below Standard (19.5°C)',
    description: 'Workstation thermostat manually set to 19.5°C (BEE standard recommends 24.0°C). PMV: -1.2 (Cold complaint risk).',
    severity: 'WARNING',
    wastedKWhPerDay: 28.0,
    costBleedPerDay: 238.00,
    detectedTimestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    status: 'ACTIVE_ALARM',
  },
];

export function MisuseAlarmBanner({ alarms, onRectify }: { alarms: MisuseAlarm[]; onRectify: (id: string) => void }) {
  const activeAlarms = alarms.filter(a => a.status === 'ACTIVE_ALARM');
  if (activeAlarms.length === 0) return null;

  const primary = activeAlarms[0];

  return (
    <div className="rounded-xl border border-red-500/50 bg-red-950/40 p-4 backdrop-blur-md shadow-xl animate-pulse">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-500/20 text-red-400 flex items-center justify-center flex-shrink-0 animate-bounce">
            <ShieldAlert size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-red-500 text-white uppercase tracking-wider">
                ENERGY MISUSE ALARM DETECTED
              </span>
              <span className="text-xs text-red-300 font-bold font-mono">{primary.zoneName}</span>
            </div>
            <h4 className="text-sm font-extrabold text-white mt-1">{primary.title}</h4>
            <p className="text-xs text-slate-300 mt-0.5">{primary.description}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-xs font-bold text-amber-400 bg-amber-500/10 px-3 py-1.5 rounded-lg border border-amber-500/30">
            Bleed: ₹{primary.costBleedPerDay.toFixed(0)}/day
          </span>
          <button
            onClick={() => onRectify(primary.id)}
            className="px-4 py-2 rounded-lg bg-green-500 hover:bg-green-600 text-slate-950 font-extrabold text-xs flex items-center gap-1.5 shadow-lg shadow-green-500/20 transition-all"
          >
            <CheckCircle2 size={14} /> Auto-Rectify Misuse & Silence
          </button>
        </div>
      </div>
    </div>
  );
}

export function MisuseAlarmCenter() {
  const [alarms, setAlarms] = useState<MisuseAlarm[]>(INITIAL_MISUSE_ALARMS);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [autoRectifyEnabled, setAutoRectifyEnabled] = useState<boolean>(false);
  const [sensitivity, setSensitivity] = useState<'LOW' | 'MEDIUM' | 'HIGH'>('HIGH');

  const handleRectify = (id: string) => {
    setAlarms(prev => prev.map(a => a.id === id ? { ...a, status: 'RECTIFIED' } : a));
  };

  const handleTriggerTestAlarm = () => {
    const newAlarm: MisuseAlarm = {
      id: `alarm-${Date.now()}`,
      zone_id: 'boardroom',
      zoneName: 'Zone 3B — Executive Boardroom',
      type: 'AFTER_HOURS_LIGHTING',
      title: '🚨 TEST MISUSE ALARM: Unoccupied Boardroom Lights at 100%',
      description: 'High-intensity 500 Lux lighting active with 0 occupants detected.',
      severity: 'CRITICAL',
      wastedKWhPerDay: 18.2,
      costBleedPerDay: 154.70,
      detectedTimestamp: new Date().toISOString(),
      status: 'ACTIVE_ALARM',
    };
    setAlarms(prev => [newAlarm, ...prev]);
  };

  const activeCount = alarms.filter(a => a.status === 'ACTIVE_ALARM').length;

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-5 rounded-2xl border bg-slate-900/80 border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ShieldAlert className="text-red-400" size={20} />
            <h1 className="text-xl font-bold text-white">Real-Time Energy Misuse Alarm Center</h1>
          </div>
          <p className="text-xs text-slate-400">
            Autonomous Alert Engine monitoring un-occupied heating/cooling, over-cooling setpoint breaches & lighting waste.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`px-3 py-1.5 rounded-lg border text-xs font-bold flex items-center gap-1.5 transition-all ${
              soundEnabled ? 'bg-green-500/15 text-green-400 border-green-500/30' : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}
          >
            {soundEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
            <span>{soundEnabled ? 'Audio Alert ON' : 'Muted'}</span>
          </button>

          <button
            onClick={handleTriggerTestAlarm}
            className="px-3.5 py-1.5 rounded-lg bg-red-500 hover:bg-red-600 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-lg shadow-red-500/25 transition-all"
          >
            <AlertCircle size={14} /> Trigger Test Misuse Alarm
          </button>
        </div>
      </div>

      {/* Alarm Banner if active */}
      <MisuseAlarmBanner alarms={alarms} onRectify={handleRectify} />

      {/* Control & Sensitivity Configuration */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-xl border bg-slate-900/60 border-slate-800">
        <div>
          <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">1. Misuse Detection Sensitivity</label>
          <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800">
            {(['LOW', 'MEDIUM', 'HIGH'] as const).map(s => (
              <button
                key={s}
                onClick={() => setSensitivity(s)}
                className={`flex-1 py-1.5 text-xs font-semibold rounded transition-all ${
                  sensitivity === s ? 'bg-red-500 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">2. Auto-Rectification Mode</label>
          <button
            onClick={() => setAutoRectifyEnabled(!autoRectifyEnabled)}
            className={`w-full py-2 rounded-lg text-xs font-extrabold border transition-all ${
              autoRectifyEnabled
                ? 'bg-green-500/20 text-green-400 border-green-500/40'
                : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
            }`}
          >
            {autoRectifyEnabled ? '⚡ Auto-Rectify Enabled (BMS Signal)' : 'Manual Confirmation Required'}
          </button>
        </div>

        <div>
          <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">3. Active Alarm Counter</label>
          <div className="p-2 bg-slate-950 border border-slate-800 rounded-lg flex items-center justify-between text-xs">
            <span className="text-slate-400 font-medium">Unresolved Misuses:</span>
            <span className={`px-2.5 py-0.5 rounded font-extrabold ${activeCount > 0 ? 'bg-red-500 text-white' : 'bg-green-500/20 text-green-400'}`}>
              {activeCount} ALARMS
            </span>
          </div>
        </div>
      </div>

      {/* Misuse Alarm Log Table */}
      <div className="p-5 rounded-2xl border bg-slate-900/80 border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <ShieldAlert className="text-red-400" size={16} />
            Detected Energy Misuse Alarm History
          </h3>
          <DataBadge source="Eco 360 Anomaly & Misuse Detector" type="ml" />
        </div>

        <div className="space-y-3">
          {alarms.map(alarm => (
            <div
              key={alarm.id}
              className={`p-4 rounded-xl border space-y-3 transition-all ${
                alarm.status === 'ACTIVE_ALARM'
                  ? 'bg-red-950/20 border-red-500/40'
                  : 'bg-slate-950/60 border-slate-800 opacity-75'
              }`}
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-red-400">{alarm.zoneName}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold border ${
                      alarm.severity === 'CRITICAL' ? 'bg-red-500/20 text-red-400 border-red-500/40' : 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                    }`}>
                      {alarm.severity}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-white">{alarm.title}</h4>
                  <p className="text-xs text-slate-300">{alarm.description}</p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right text-xs font-mono">
                    <span className="text-amber-400 font-bold block">-₹{alarm.costBleedPerDay}/day</span>
                    <span className="text-slate-500 text-[10px]">Wasted: {alarm.wastedKWhPerDay} kWh</span>
                  </div>

                  {alarm.status === 'RECTIFIED' ? (
                    <span className="px-3 py-1 rounded bg-green-500/20 text-green-400 border border-green-500/40 text-xs font-extrabold flex items-center gap-1">
                      <CheckCircle2 size={13} /> RECTIFIED
                    </span>
                  ) : (
                    <button
                      onClick={() => handleRectify(alarm.id)}
                      className="px-3.5 py-1.5 rounded bg-green-500 hover:bg-green-600 text-slate-950 text-xs font-extrabold transition-all"
                    >
                      Rectify & Silence
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
