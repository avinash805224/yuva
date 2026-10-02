// ============================================================================
// DataTransparencyModal.tsx & DataBadge
// Shows data source attribution (CEA, BEE, Smart Meter) and allows connecting live sources
// ============================================================================

import { useState } from 'react';
import { Database, ExternalLink, ShieldCheck, Wifi, WifiOff, X, Layers } from 'lucide-react';
import { governmentDataService } from '../services/governmentDataService';
import { sensorDataService } from '../services/sensorDataService';
import { buildingDataService } from '../services/buildingDataService';

export function DataBadge({ source, type = 'gov' }: { source: string; type?: 'gov' | 'sensor' | 'ml' | 'pending' }) {
  const styles = {
    gov: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    sensor: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
    ml: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
    pending: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
  };

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono border ${styles[type]}`}>
      <Database size={10} />
      <span>SOURCE: {source}</span>
    </span>
  );
}

export function DataConnectorModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [selectedProtocol] = useState<'BACnet/IP' | 'MQTT' | 'Modbus RTU' | 'CSV Stream'>('BACnet/IP');
  const [connected, setConnected] = useState(sensorDataService.getState().isConnected);
  const catalog = governmentDataService.getAllCatalog();

  if (!isOpen) return null;

  const handleToggleConnection = () => {
    const nextState = !connected;
    setConnected(nextState);
    sensorDataService.setConnected(nextState, selectedProtocol);
    buildingDataService.setLiveSensorsConnected(nextState);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-2xl bg-[#0B1120] border border-slate-700/80 rounded-2xl p-6 shadow-2xl space-y-5 text-slate-200">
        
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-green-500/15 text-green-400 flex items-center justify-center">
              <Database size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Data Integration & Transparency Manager</h2>
              <p className="text-xs text-slate-400">Two-Layer Architecture: Layer 1 (Govt Data) & Layer 2 (Building Sensors)</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800">
            <X size={18} />
          </button>
        </div>

        {/* Layer 1: Govt Data Status */}
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck size={14} /> Layer 1 — Official Government & Public Datasets
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-semibold">VERIFIED PUBLIC DATA</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 text-xs">
            {catalog.map((cat, i) => (
              <div key={i} className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
                <span className="font-bold text-white block truncate">{cat.sourceName}</span>
                <span className="text-[10px] text-slate-400 block truncate">{cat.datasetName}</span>
                <div className="flex items-center justify-between text-[9px] text-slate-500 pt-1 border-t border-slate-800">
                  <span>Period: {cat.dataPeriod}</span>
                  <a href={cat.sourceUrl} target="_blank" rel="noreferrer" className="text-green-400 hover:underline inline-flex items-center gap-0.5">
                    URL <ExternalLink size={8} />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Layer 2: Building Sensor Feed Status */}
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
              <Layers size={14} /> Layer 2 — Building Smart Meters & IoT Sensors
            </span>
            <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${connected ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' : 'bg-amber-500/20 text-amber-400 border-amber-500/30'}`}>
              {connected ? 'LIVE FEED CONNECTED' : 'AWAITING SENSOR CONNECTION'}
            </span>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-3 rounded-lg bg-slate-950 border border-slate-800">
            <div className="space-y-1 text-xs">
              <p className="text-slate-300">Protocol: <strong className="text-white">{selectedProtocol}</strong></p>
              <p className="text-slate-400 text-[11px]">Endpoint: <span className="font-mono text-slate-300">bacnet://192.168.10.50:47808 (Schneider AS-P)</span></p>
              <p className="text-[10px] text-slate-500">Status: {connected ? 'Streaming live packets' : 'Pending live sensor stream'}</p>
            </div>

            <button
              onClick={handleToggleConnection}
              className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all ${
                connected
                  ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border border-amber-500/40'
                  : 'bg-green-500 hover:bg-green-600 text-slate-950 font-extrabold shadow-lg shadow-green-500/20'
              }`}
            >
              {connected ? <WifiOff size={14} /> : <Wifi size={14} />}
              <span>{connected ? 'Disconnect Live Telemetry' : 'Connect Live Sensors & BMS'}</span>
            </button>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button onClick={onClose} className="px-5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white">
            Close Panel
          </button>
        </div>

      </div>
    </div>
  );
}
