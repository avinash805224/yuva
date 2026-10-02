// ============================================================================
// EcoPulse 360 — Hybrid Data Provider
// Bridges the local BuildingSimulator with Supabase persistence + realtime.
//
// Strategy:
//   • On each tick the simulator produces a BuildingState snapshot (always).
//   • If Supabase is configured & reachable, the provider persists key data
//     (telemetry, snapshots, alerts, equipment) in the background and
//     subscribes to realtime channels so multiple browser tabs / users stay
//     in sync.
//   • If Supabase is NOT configured, everything runs 100 % offline with the
//     simulator as the sole data source — zero user-facing errors.
//
// This module is the single import that App.tsx needs. It exposes:
//   1. A React hook `useDataProvider()` that returns the full BuildingState
//      plus action handlers (vote, ack, DR toggle, etc.).
//   2. A connection status indicator.
// ============================================================================

import { useState, useEffect, useCallback, useRef } from 'react';
import { BuildingSimulator } from '../engine/simulator';
import { calculateWhatIf } from '../engine/ai-engine';
import { isSupabaseConfigured } from './supabase';
import {
  insertTelemetryBatch,
  insertBuildingSnapshot,
  insertAlertsBatch,
  acknowledgeAlertInDB,
  insertOccupantVote,
  updateHVACMode,
  insertDREvent,
  updateDREvent,
  applyRecommendation,
  logAuditEvent,
  pingSupabase,
  subscribeToTelemetry,
  subscribeToAlerts,
  subscribeToVotes,
  subscribeToHVACModes,
  subscribeToDREvents,
  unsubscribeChannel,
} from './supabase-service';
import type { RealtimeChannel } from '@supabase/supabase-js';
import type {
  BuildingState, ZoneId, OccupantVote, HVACMode, DemoOverrides,
  WhatIfScenario, WhatIfResult,
} from '../types/telemetry';

// ── Connection status enum ───────────────────────────────────────────────────

export type ConnectionStatus = 'online' | 'offline' | 'connecting' | 'error';

// ── Provider state shape ─────────────────────────────────────────────────────

export interface DataProviderState {
  /** Full building state snapshot (from simulator, enriched with Supabase) */
  state: BuildingState;
  /** Supabase connectivity status */
  connection: ConnectionStatus;
  /** Last Supabase round-trip latency (ms), or -1 if offline */
  latencyMs: number;
  /** Whether Supabase credentials are configured in .env */
  isConfigured: boolean;
  /** Count of records persisted to Supabase since session start */
  persistedCount: number;

  // ── Actions (always work: simulator first, then async Supabase persist) ──
  handleVote: (zoneId: ZoneId, vote: OccupantVote) => void;
  handleAck: (alertId: string) => void;
  handleDR: () => void;
  handleHVACMode: (zoneId: ZoneId, mode: HVACMode) => void;
  handleToggleRec: (recId: string) => void;
  handleForecastPeriod: (period: 'today' | 'tomorrow' | '7days') => void;
  handleDemoChange: (key: keyof DemoOverrides, val: number) => void;
  calculateWhatIfResult: (scenario: WhatIfScenario) => WhatIfResult;
}

// ── Throttle helper (persist at most once per N ms) ──────────────────────────

function createThrottle(intervalMs: number) {
  let lastRun = 0;
  return (fn: () => void) => {
    const now = Date.now();
    if (now - lastRun >= intervalMs) {
      lastRun = now;
      fn();
    }
  };
}

// ── Singleton simulator ──────────────────────────────────────────────────────

const simulator = new BuildingSimulator();

// ── The Hook ─────────────────────────────────────────────────────────────────

export function useDataProvider(): DataProviderState {
  const [state, setState] = useState<BuildingState>(() => simulator.tick());
  const [connection, setConnection] = useState<ConnectionStatus>(
    isSupabaseConfigured() ? 'connecting' : 'offline'
  );
  const [latencyMs, setLatencyMs] = useState(-1);
  const [persistedCount, setPersistedCount] = useState(0);
  const [demo, setDemo] = useState<DemoOverrides>({
    occupancyMultiplier: 1,
    temperatureOffset: 0,
    solarMultiplier: 1,
    gridLoadMultiplier: 1,
    hvacLoadMultiplier: 1,
  });

  // Refs for realtime channel handles
  const channels = useRef<RealtimeChannel[]>([]);
  // Ref to track the current DR event ID in Supabase
  const currentDREventId = useRef<string | null>(null);
  // Persist throttles: telemetry every 10 s, snapshots every 30 s, alerts every 15 s
  const telemetryThrottle = useRef(createThrottle(10_000));
  const snapshotThrottle = useRef(createThrottle(30_000));
  const alertThrottle = useRef(createThrottle(15_000));
  // Track which alert IDs we've already persisted to avoid duplicates
  const persistedAlertIds = useRef(new Set<string>());

  // ── Supabase connection probe ──────────────────────────────────────────────

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setConnection('offline');
      return;
    }
    let cancelled = false;

    async function probe() {
      const { ok, latencyMs: ms } = await pingSupabase();
      if (cancelled) return;
      setConnection(ok ? 'online' : 'error');
      setLatencyMs(ms);
    }

    probe();
    // Re-probe every 60 s
    const timer = setInterval(probe, 60_000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, []);

  // ── Realtime subscriptions ─────────────────────────────────────────────────

  useEffect(() => {
    if (connection !== 'online') return;

    const ch1 = subscribeToTelemetry((payload) => {
      if (payload.eventType === 'INSERT') {
        // Could merge into state, but simulator is the primary driver;
        // realtime is more useful when multiple clients write.
        console.debug('[RT] telemetry insert:', payload.new.zone_id);
      }
    });

    const ch2 = subscribeToAlerts((payload) => {
      if (payload.eventType === 'INSERT') {
        console.debug('[RT] new alert:', payload.new.title);
      }
    });

    const ch3 = subscribeToVotes((payload) => {
      console.debug('[RT] vote:', payload.new.zone_id, payload.new.vote);
    });

    const ch4 = subscribeToHVACModes((payload) => {
      console.debug('[RT] HVAC mode change:', payload.new.zone_id, payload.new.mode);
    });

    const ch5 = subscribeToDREvents((payload) => {
      console.debug('[RT] DR event:', payload.new.status);
    });

    channels.current = [ch1, ch2, ch3, ch4, ch5].filter(
      (c): c is RealtimeChannel => c !== null
    );

    return () => {
      channels.current.forEach(unsubscribeChannel);
      channels.current = [];
    };
  }, [connection]);

  // ── Simulator tick loop ────────────────────────────────────────────────────

  useEffect(() => {
    const interval = setInterval(() => {
      const snapshot = simulator.tick();
      setState(snapshot);

      // Background persistence (fire-and-forget, non-blocking)
      if (connection === 'online') {
        // Telemetry batch
        telemetryThrottle.current(() => {
          const rows = snapshot.zones.map((z) => ({
            zone_id: z.zoneId,
            timestamp: new Date(z.timestamp).toISOString(),
            temperature: z.temperature,
            humidity: z.humidity,
            co2: z.co2,
            pm25: z.pm25,
            lux: z.lux,
            occupancy: z.occupancy,
            hvac_power: z.hvacPower,
            lighting_power: z.lightingPower,
            plug_power: z.plugPower,
            setpoint: z.setpoint,
            pmv: snapshot.comfort.find((c) => c.zoneId === z.zoneId)?.pmv ?? null,
            ppd: snapshot.comfort.find((c) => c.zoneId === z.zoneId)?.ppd ?? null,
            ieq_score:
              snapshot.comfort.find((c) => c.zoneId === z.zoneId)?.ieqScore ?? null,
          }));
          insertTelemetryBatch(rows).then((r) => {
            if (!r.error) setPersistedCount((c) => c + rows.length);
          });
        });

        // Building snapshot
        snapshotThrottle.current(() => {
          const o = snapshot.overview;
          insertBuildingSnapshot({
            timestamp: new Date().toISOString(),
            total_power: o.totalPower,
            today_energy: o.todayEnergy,
            today_cost: o.todayCost,
            carbon_rate: o.carbonRate,
            bee_star_rating: o.beeStarRating,
            epi: o.epi,
            hvac_total: o.hvacTotal,
            lighting_total: o.lightingTotal,
            plug_total: o.plugTotal,
            solar_pv: o.solarPV,
            grid_import: o.gridImport,
            battery_soc: snapshot.demandResponse.batterySoC,
            building_score: snapshot.buildingScore.overall,
          }).then((r) => {
            if (!r.error) setPersistedCount((c) => c + 1);
          });
        });

        // New alerts
        alertThrottle.current(() => {
          const newAlerts = snapshot.alerts.filter(
            (a) => !persistedAlertIds.current.has(a.id)
          );
          if (newAlerts.length === 0) return;
          const rows = newAlerts.map((a) => ({
            severity: a.severity as 'critical' | 'warning' | 'info',
            type: 'fdd' as const,
            equipment: a.equipment,
            title: a.title,
            description: a.description,
            energy_bleed: a.energyBleed,
            cost_bleed: a.costBleed,
            zone_id: null,
            acknowledged: a.acknowledged,
            acknowledged_by: null,
            acknowledged_at: null,
            resolved: false,
          }));
          insertAlertsBatch(rows).then((r) => {
            if (!r.error) {
              newAlerts.forEach((a) => persistedAlertIds.current.add(a.id));
              setPersistedCount((c) => c + rows.length);
            }
          });
        });
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [connection]);

  // ── Action handlers ────────────────────────────────────────────────────────

  const handleVote = useCallback(
    (zoneId: ZoneId, vote: OccupantVote) => {
      // Immediate simulator update
      simulator.submitVote(zoneId, vote);
      setState(simulator.tick());

      // Persist to Supabase
      if (connection === 'online') {
        insertOccupantVote({ zone_id: zoneId, vote, user_id: null });
        logAuditEvent({
          action: 'occupant_vote',
          entity_type: 'occupant_votes',
          entity_id: zoneId,
          details: { vote },
          user_id: null,
          ip_address: null,
        });
      }
    },
    [connection]
  );

  const handleAck = useCallback(
    (alertId: string) => {
      simulator.acknowledgeAlert(alertId);
      setState(simulator.tick());

      if (connection === 'online') {
        acknowledgeAlertInDB(alertId);
        logAuditEvent({
          action: 'acknowledge_alert',
          entity_type: 'alerts',
          entity_id: alertId,
          details: null,
          user_id: null,
          ip_address: null,
        });
      }
    },
    [connection]
  );

  const handleDR = useCallback(() => {
    const activate = state.demandResponse.status === 'idle';
    simulator.triggerDR(activate);
    const snap = simulator.tick();
    setState(snap);

    if (connection === 'online') {
      if (activate) {
        insertDREvent({
          status: 'pre_cooling',
          triggered_at: new Date().toISOString(),
          triggered_by: null,
          target_grid_draw: 60,
          curtailment_kw: 0,
          savings_rupees: 0,
          ended_at: null,
          notes: 'Triggered via EcoPulse 360 dashboard',
        }).then((r) => {
          if (r.data) currentDREventId.current = r.data.id;
        });
      } else if (currentDREventId.current) {
        updateDREvent(currentDREventId.current, {
          status: 'idle',
          ended_at: new Date().toISOString(),
          savings_rupees: snap.demandResponse.eventSavings,
          curtailment_kw: snap.demandResponse.curtailmentKW,
        });
        currentDREventId.current = null;
      }
      logAuditEvent({
        action: activate ? 'dr_activate' : 'dr_deactivate',
        entity_type: 'dr_events',
        entity_id: currentDREventId.current,
        details: { status: activate ? 'pre_cooling' : 'idle' },
        user_id: null,
        ip_address: null,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connection, state.demandResponse.status]);

  const handleHVACMode = useCallback(
    (zoneId: ZoneId, mode: HVACMode) => {
      simulator.setHVACMode(zoneId, mode);
      setState(simulator.tick());

      if (connection === 'online') {
        updateHVACMode(zoneId, mode);
        logAuditEvent({
          action: 'hvac_mode_change',
          entity_type: 'hvac_modes',
          entity_id: zoneId,
          details: { mode },
          user_id: null,
          ip_address: null,
        });
      }
    },
    [connection]
  );

  const handleToggleRec = useCallback(
    (recId: string) => {
      simulator.toggleRecommendation(recId);
      setState(simulator.tick());

      if (connection === 'online') {
        applyRecommendation(recId);
        logAuditEvent({
          action: 'apply_recommendation',
          entity_type: 'recommendations',
          entity_id: recId,
          details: null,
          user_id: null,
          ip_address: null,
        });
      }
    },
    [connection]
  );

  const handleForecastPeriod = useCallback(
    (period: 'today' | 'tomorrow' | '7days') => {
      simulator.setForecastPeriod(period);
      setState(simulator.tick());
    },
    []
  );

  const handleDemoChange = useCallback(
    (key: keyof DemoOverrides, val: number) => {
      const next = { ...demo, [key]: val };
      setDemo(next);
      simulator.setDemoOverrides(next);
    },
    [demo]
  );

  const calculateWhatIfResult = useCallback(
    (scenario: WhatIfScenario): WhatIfResult => {
      return calculateWhatIf(state.overview, scenario);
    },
    [state.overview]
  );

  return {
    state,
    connection,
    latencyMs,
    isConfigured: isSupabaseConfigured(),
    persistedCount,
    handleVote,
    handleAck,
    handleDR,
    handleHVACMode,
    handleToggleRec,
    handleForecastPeriod,
    handleDemoChange,
    calculateWhatIfResult,
  };
}
