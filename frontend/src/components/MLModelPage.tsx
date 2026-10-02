// ============================================================================
// MLModelPage.tsx — Machine Learning Model & Technical Specification Module
// Schneider Electric Yuva Yodha Hackathon 2026 — Smart Buildings
// ============================================================================

import { Brain, CheckCircle2, Layers } from 'lucide-react';
import { mlService } from '../services/mlService';

export function MLModelPage() {
  const specs = mlService.getSpecs();

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-5 rounded-2xl border bg-slate-900/80 border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Brain className="text-purple-400" size={20} />
            <h1 className="text-xl font-bold text-white">ML Pipeline Technical Architecture</h1>
          </div>
          <p className="text-xs text-slate-400">
            Technical evaluation details for Zone Demand Forecasting & Isolation Forest Anomaly Detection
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-400 text-xs font-bold flex items-center gap-1.5">
            <CheckCircle2 size={14} /> Model Status: {specs.status}
          </span>
        </div>
      </div>

      {/* Model Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border bg-slate-900/70 border-slate-800 space-y-1">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Model Algorithm</span>
          <p className="text-base font-bold text-white">{specs.algorithm}</p>
          <span className="text-[10px] text-purple-400 font-mono">v{specs.version}</span>
        </div>

        <div className="p-4 rounded-xl border bg-slate-900/70 border-slate-800 space-y-1">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block">R² Accuracy Score</span>
          <p className="text-base font-bold text-green-400">{(specs.metrics.r2Score * 100).toFixed(1)}%</p>
          <span className="text-[10px] text-slate-500 font-mono">Validation Split: 80/20</span>
        </div>

        <div className="p-4 rounded-xl border bg-slate-900/70 border-slate-800 space-y-1">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Mean Absolute Error (MAE)</span>
          <p className="text-base font-bold text-cyan-400">±{specs.metrics.mae} kW</p>
          <span className="text-[10px] text-slate-500 font-mono">RMSE: {specs.metrics.rmse} kW</span>
        </div>

        <div className="p-4 rounded-xl border bg-slate-900/70 border-slate-800 space-y-1">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Training Dataset Size</span>
          <p className="text-base font-bold text-amber-400">{specs.datasetRecordCount.toLocaleString()} Records</p>
          <span className="text-[10px] text-slate-500 font-mono">Last Trained: {specs.lastTrainedTimestamp}</span>
        </div>
      </div>

      {/* Feature Specification Matrix */}
      <div className="p-6 rounded-2xl border bg-slate-900/85 border-slate-800 space-y-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <Layers className="text-purple-400" size={16} />
          Input Features & Target Output Pipeline
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Left: Input Features */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-2">
              Input Features (X)
            </span>
            <div className="space-y-1.5 text-xs text-slate-300 font-mono">
              {specs.features.map((feat, i) => (
                <div key={i} className="flex items-center gap-2 p-2 rounded bg-slate-900 border border-slate-800/80">
                  <span className="w-4 h-4 rounded-full bg-purple-500/20 text-purple-400 text-[10px] font-bold flex items-center justify-center">
                    {i + 1}
                  </span>
                  <span>{feat}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Target Output & Anomaly Model */}
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <span className="text-xs font-bold text-green-400 uppercase tracking-wider block mb-1">
                Target Regression Output (Y)
              </span>
              <p className="text-xs text-slate-300 leading-relaxed">
                Predicted Zone-Level Energy Consumption (kW), Peak Demand Warnings, and Confidence Intervals (15m, 30m, 60m, Daily, Weekly horizons).
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block mb-1">
                Anomaly Detection Model: Isolation Forest
              </span>
              <p className="text-xs text-slate-300 leading-relaxed">
                Unsupervised Isolation Forest algorithm evaluating deviations between actual smart meter power draw and expected regression baselines to flag unexpected energy spikes or unscheduled equipment operation.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1 text-xs">
              <span className="font-bold text-slate-400 uppercase text-[10px]">Training Dataset Provenance</span>
              <p className="text-slate-300 font-mono">{specs.trainingDatasetName}</p>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}
