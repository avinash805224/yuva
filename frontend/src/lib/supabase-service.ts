// ============================================================================
// EcoPulse 360 — Supabase Data Service
// Full CRUD + Realtime subscriptions for all domain entities.
// This module is the ONLY touchpoint between the app and Supabase's REST/
// Realtime APIs. It never imports the simulator — that separation is enforced
// by the DataProvider layer above.
// ============================================================================

import { supabase, isSupabaseConfigured } from './supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';
import type { Database } from './database.types';

// ── Row type aliases ─────────────────────────────────────────────────────────

type TelemetryRow = Database['public']['Tables']['telemetry']['Row'];
type TelemetryInsert = Database['public']['Tables']['telemetry']['Insert'];
type AlertRow = Database['public']['Tables']['alerts']['Row'];
type AlertInsert = Database['public']['Tables']['alerts']['Insert'];
type VoteInsert = Database['public']['Tables']['occupant_votes']['Insert'];
type SnapshotInsert = Database['public']['Tables']['building_snapshots']['Insert'];
type EquipmentRow = Database['public']['Tables']['equipment']['Row'];
type HVACModeRow = Database['public']['Tables']['hvac_modes']['Row'];
type DREventRow = Database['public']['Tables']['dr_events']['Row'];
type DREventInsert = Database['public']['Tables']['dr_events']['Insert'];
type RecommendationRow = Database['public']['Tables']['recommendations']['Row'];
type RecommendationInsert = Database['public']['Tables']['recommendations']['Insert'];
type ForecastInsert = Database['public']['Tables']['energy_forecasts']['Insert'];
type AuditInsert = Database['public']['Tables']['audit_log']['Insert'];

// ── Result wrapper ───────────────────────────────────────────────────────────

interface ServiceResult<T> {
  data: T | null;
  error: string | null;
}

// ── Telemetry ────────────────────────────────────────────────────────────────

/**
 * Insert a batch of telemetry readings (one per zone).
 * Called by the DataProvider on each simulator tick to persist data.
 */
export async function insertTelemetryBatch(
  readings: TelemetryInsert[]
): Promise<ServiceResult<null>> {
  if (!isSupabaseConfigured()) return { data: null, error: 'offline' };
  const { error } = await supabase.from('telemetry').insert(readings);
  return { data: null, error: error?.message ?? null };
}

/**
 * Fetch recent telemetry for a specific zone.
 * @param zoneId  Zone identifier
 * @param limit   Number of recent rows (default 100)
 */
export async function fetchRecentTelemetry(
  zoneId: string,
  limit = 100
): Promise<ServiceResult<TelemetryRow[]>> {
  if (!isSupabaseConfigured()) return { data: null, error: 'offline' };
  const { data, error } = await supabase
    .from('telemetry')
    .select('*')
    .eq('zone_id', zoneId)
    .order('timestamp', { ascending: false })
    .limit(limit);
  return { data: data ?? null, error: error?.message ?? null };
}

/**
 * Fetch telemetry across all zones for a time window.
 */
export async function fetchTelemetryWindow(
  sinceMinutes = 60,
  limit = 500
): Promise<ServiceResult<TelemetryRow[]>> {
  if (!isSupabaseConfigured()) return { data: null, error: 'offline' };
  const since = new Date(Date.now() - sinceMinutes * 60_000).toISOString();
  const { data, error } = await supabase
    .from('telemetry')
    .select('*')
    .gte('timestamp', since)
    .order('timestamp', { ascending: true })
    .limit(limit);
  return { data: data ?? null, error: error?.message ?? null };
}

// ── Building Snapshots ───────────────────────────────────────────────────────

export async function insertBuildingSnapshot(
  snapshot: SnapshotInsert
): Promise<ServiceResult<null>> {
  if (!isSupabaseConfigured()) return { data: null, error: 'offline' };
  const { error } = await supabase.from('building_snapshots').insert(snapshot);
  return { data: null, error: error?.message ?? null };
}

export async function fetchLatestSnapshot(): Promise<
  ServiceResult<Database['public']['Tables']['building_snapshots']['Row'] | null>
> {
  if (!isSupabaseConfigured()) return { data: null, error: 'offline' };
  const { data, error } = await supabase
    .from('building_snapshots')
    .select('*')
    .order('timestamp', { ascending: false })
    .limit(1)
    .single();
  return { data: data ?? null, error: error?.message ?? null };
}

// ── Alerts ───────────────────────────────────────────────────────────────────

export async function insertAlert(
  alert: AlertInsert
): Promise<ServiceResult<AlertRow | null>> {
  if (!isSupabaseConfigured()) return { data: null, error: 'offline' };
  const { data, error } = await supabase
    .from('alerts')
    .insert(alert)
    .select()
    .single();
  return { data: data ?? null, error: error?.message ?? null };
}

export async function insertAlertsBatch(
  alerts: AlertInsert[]
): Promise<ServiceResult<null>> {
  if (!isSupabaseConfigured()) return { data: null, error: 'offline' };
  if (alerts.length === 0) return { data: null, error: null };
  const { error } = await supabase.from('alerts').insert(alerts);
  return { data: null, error: error?.message ?? null };
}

export async function fetchActiveAlerts(
  limit = 50
): Promise<ServiceResult<AlertRow[]>> {
  if (!isSupabaseConfigured()) return { data: null, error: 'offline' };
  const { data, error } = await supabase
    .from('alerts')
    .select('*')
    .eq('resolved', false)
    .order('timestamp', { ascending: false })
    .limit(limit);
  return { data: data ?? null, error: error?.message ?? null };
}

export async function acknowledgeAlertInDB(
  alertId: string,
  userId?: string
): Promise<ServiceResult<null>> {
  if (!isSupabaseConfigured()) return { data: null, error: 'offline' };
  const { error } = await supabase
    .from('alerts')
    .update({
      acknowledged: true,
      acknowledged_by: userId ?? null,
      acknowledged_at: new Date().toISOString(),
    })
    .eq('id', alertId);
  return { data: null, error: error?.message ?? null };
}

export async function resolveAlertInDB(
  alertId: string
): Promise<ServiceResult<null>> {
  if (!isSupabaseConfigured()) return { data: null, error: 'offline' };
  const { error } = await supabase
    .from('alerts')
    .update({ resolved: true })
    .eq('id', alertId);
  return { data: null, error: error?.message ?? null };
}

// ── Occupant Votes ───────────────────────────────────────────────────────────

export async function insertOccupantVote(
  vote: VoteInsert
): Promise<ServiceResult<null>> {
  if (!isSupabaseConfigured()) return { data: null, error: 'offline' };
  const { error } = await supabase.from('occupant_votes').insert(vote);
  return { data: null, error: error?.message ?? null };
}

export async function fetchVoteSummary(
  zoneId: string,
  sinceMinutes = 60
): Promise<ServiceResult<{ too_cold: number; comfortable: number; too_warm: number }>> {
  if (!isSupabaseConfigured()) return { data: null, error: 'offline' };
  const since = new Date(Date.now() - sinceMinutes * 60_000).toISOString();
  const { data, error } = await supabase
    .from('occupant_votes')
    .select('vote')
    .eq('zone_id', zoneId)
    .gte('timestamp', since);
  if (error) return { data: null, error: error.message };
  const summary = { too_cold: 0, comfortable: 0, too_warm: 0 };
  for (const row of data ?? []) {
    const v = row.vote as keyof typeof summary;
    if (v in summary) summary[v]++;
  }
  return { data: summary, error: null };
}

// ── Equipment Health ─────────────────────────────────────────────────────────

export async function fetchEquipmentHealth(): Promise<
  ServiceResult<EquipmentRow[]>
> {
  if (!isSupabaseConfigured()) return { data: null, error: 'offline' };
  const { data, error } = await supabase
    .from('equipment')
    .select('*')
    .order('health_score', { ascending: true });
  return { data: data ?? null, error: error?.message ?? null };
}

export async function updateEquipmentHealth(
  equipmentId: string,
  updates: Partial<EquipmentRow>
): Promise<ServiceResult<null>> {
  if (!isSupabaseConfigured()) return { data: null, error: 'offline' };
  const { error } = await supabase
    .from('equipment')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', equipmentId);
  return { data: null, error: error?.message ?? null };
}

// ── HVAC Modes ───────────────────────────────────────────────────────────────

export async function fetchHVACModes(): Promise<ServiceResult<HVACModeRow[]>> {
  if (!isSupabaseConfigured()) return { data: null, error: 'offline' };
  const { data, error } = await supabase.from('hvac_modes').select('*');
  return { data: data ?? null, error: error?.message ?? null };
}

export async function updateHVACMode(
  zoneId: string,
  mode: HVACModeRow['mode'],
  userId?: string
): Promise<ServiceResult<null>> {
  if (!isSupabaseConfigured()) return { data: null, error: 'offline' };
  const { error } = await supabase
    .from('hvac_modes')
    .update({
      mode,
      set_by: userId ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq('zone_id', zoneId);
  return { data: null, error: error?.message ?? null };
}

// ── Demand Response Events ───────────────────────────────────────────────────

export async function fetchLatestDREvent(): Promise<
  ServiceResult<DREventRow | null>
> {
  if (!isSupabaseConfigured()) return { data: null, error: 'offline' };
  const { data, error } = await supabase
    .from('dr_events')
    .select('*')
    .order('triggered_at', { ascending: false })
    .limit(1)
    .single();
  return { data: data ?? null, error: error?.message ?? null };
}

export async function insertDREvent(
  event: DREventInsert
): Promise<ServiceResult<DREventRow | null>> {
  if (!isSupabaseConfigured()) return { data: null, error: 'offline' };
  const { data, error } = await supabase
    .from('dr_events')
    .insert(event)
    .select()
    .single();
  return { data: data ?? null, error: error?.message ?? null };
}

export async function updateDREvent(
  eventId: string,
  updates: Partial<Omit<DREventRow, 'id'>>
): Promise<ServiceResult<null>> {
  if (!isSupabaseConfigured()) return { data: null, error: 'offline' };
  const { error } = await supabase
    .from('dr_events')
    .update(updates)
    .eq('id', eventId);
  return { data: null, error: error?.message ?? null };
}

// ── Recommendations ──────────────────────────────────────────────────────────

export async function insertRecommendationsBatch(
  recs: RecommendationInsert[]
): Promise<ServiceResult<null>> {
  if (!isSupabaseConfigured()) return { data: null, error: 'offline' };
  if (recs.length === 0) return { data: null, error: null };
  const { error } = await supabase.from('recommendations').insert(recs);
  return { data: null, error: error?.message ?? null };
}

export async function fetchActiveRecommendations(
  limit = 20
): Promise<ServiceResult<RecommendationRow[]>> {
  if (!isSupabaseConfigured()) return { data: null, error: 'offline' };
  const { data, error } = await supabase
    .from('recommendations')
    .select('*')
    .eq('applied', false)
    .order('timestamp', { ascending: false })
    .limit(limit);
  return { data: data ?? null, error: error?.message ?? null };
}

export async function applyRecommendation(
  recId: string,
  userId?: string
): Promise<ServiceResult<null>> {
  if (!isSupabaseConfigured()) return { data: null, error: 'offline' };
  const { error } = await supabase
    .from('recommendations')
    .update({
      applied: true,
      applied_by: userId ?? null,
      applied_at: new Date().toISOString(),
    })
    .eq('id', recId);
  return { data: null, error: error?.message ?? null };
}

// ── Energy Forecasts ─────────────────────────────────────────────────────────

export async function insertForecastBatch(
  forecasts: ForecastInsert[]
): Promise<ServiceResult<null>> {
  if (!isSupabaseConfigured()) return { data: null, error: 'offline' };
  if (forecasts.length === 0) return { data: null, error: null };
  const { error } = await supabase.from('energy_forecasts').insert(forecasts);
  return { data: null, error: error?.message ?? null };
}

// ── Audit Log ────────────────────────────────────────────────────────────────

export async function logAuditEvent(
  entry: AuditInsert
): Promise<ServiceResult<null>> {
  if (!isSupabaseConfigured()) return { data: null, error: 'offline' };
  const { error } = await supabase.from('audit_log').insert(entry);
  return { data: null, error: error?.message ?? null };
}

// ── Zones ────────────────────────────────────────────────────────────────────

export async function fetchZones(): Promise<
  ServiceResult<Database['public']['Tables']['zones']['Row'][]>
> {
  if (!isSupabaseConfigured()) return { data: null, error: 'offline' };
  const { data, error } = await supabase.from('zones').select('*');
  return { data: data ?? null, error: error?.message ?? null };
}

// ── Connection Health ────────────────────────────────────────────────────────

/**
 * Ping Supabase with a lightweight query to verify connectivity.
 * Returns latency in ms, or -1 if unreachable.
 */
export async function pingSupabase(): Promise<{
  ok: boolean;
  latencyMs: number;
}> {
  if (!isSupabaseConfigured()) return { ok: false, latencyMs: -1 };
  const start = performance.now();
  try {
    const { error } = await supabase.from('zones').select('id').limit(1);
    const latencyMs = Math.round(performance.now() - start);
    return { ok: !error, latencyMs };
  } catch {
    return { ok: false, latencyMs: -1 };
  }
}

// ============================================================================
// REALTIME SUBSCRIPTIONS
// ============================================================================

export type RealtimeCallback<T> = (payload: {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  new: T;
  old: Partial<T>;
}) => void;

/**
 * Subscribe to realtime changes on the telemetry table.
 * Returns a channel handle that can be used to unsubscribe.
 */
export function subscribeToTelemetry(
  callback: RealtimeCallback<TelemetryRow>
): RealtimeChannel | null {
  if (!isSupabaseConfigured()) return null;
  const channel = supabase
    .channel('telemetry-realtime')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'telemetry' },
      (payload) => {
        callback({
          eventType: payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE',
          new: payload.new as TelemetryRow,
          old: payload.old as Partial<TelemetryRow>,
        });
      }
    )
    .subscribe();
  return channel;
}

/**
 * Subscribe to realtime changes on the alerts table.
 */
export function subscribeToAlerts(
  callback: RealtimeCallback<AlertRow>
): RealtimeChannel | null {
  if (!isSupabaseConfigured()) return null;
  const channel = supabase
    .channel('alerts-realtime')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'alerts' },
      (payload) => {
        callback({
          eventType: payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE',
          new: payload.new as AlertRow,
          old: payload.old as Partial<AlertRow>,
        });
      }
    )
    .subscribe();
  return channel;
}

/**
 * Subscribe to realtime changes on occupant_votes.
 */
export function subscribeToVotes(
  callback: RealtimeCallback<Database['public']['Tables']['occupant_votes']['Row']>
): RealtimeChannel | null {
  if (!isSupabaseConfigured()) return null;
  const channel = supabase
    .channel('votes-realtime')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'occupant_votes' },
      (payload) => {
        callback({
          eventType: 'INSERT',
          new: payload.new as Database['public']['Tables']['occupant_votes']['Row'],
          old: {},
        });
      }
    )
    .subscribe();
  return channel;
}

/**
 * Subscribe to realtime changes on building_snapshots.
 */
export function subscribeToSnapshots(
  callback: RealtimeCallback<Database['public']['Tables']['building_snapshots']['Row']>
): RealtimeChannel | null {
  if (!isSupabaseConfigured()) return null;
  const channel = supabase
    .channel('snapshots-realtime')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'building_snapshots' },
      (payload) => {
        callback({
          eventType: 'INSERT',
          new: payload.new as Database['public']['Tables']['building_snapshots']['Row'],
          old: {},
        });
      }
    )
    .subscribe();
  return channel;
}

/**
 * Subscribe to realtime changes on HVAC modes.
 */
export function subscribeToHVACModes(
  callback: RealtimeCallback<HVACModeRow>
): RealtimeChannel | null {
  if (!isSupabaseConfigured()) return null;
  const channel = supabase
    .channel('hvac-modes-realtime')
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'hvac_modes' },
      (payload) => {
        callback({
          eventType: 'UPDATE',
          new: payload.new as HVACModeRow,
          old: payload.old as Partial<HVACModeRow>,
        });
      }
    )
    .subscribe();
  return channel;
}

/**
 * Subscribe to realtime changes on DR events.
 */
export function subscribeToDREvents(
  callback: RealtimeCallback<DREventRow>
): RealtimeChannel | null {
  if (!isSupabaseConfigured()) return null;
  const channel = supabase
    .channel('dr-events-realtime')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'dr_events' },
      (payload) => {
        callback({
          eventType: payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE',
          new: payload.new as DREventRow,
          old: payload.old as Partial<DREventRow>,
        });
      }
    )
    .subscribe();
  return channel;
}

/**
 * Unsubscribe and remove a realtime channel.
 */
export function unsubscribeChannel(
  channel: RealtimeChannel | null
): void {
  if (channel) {
    supabase.removeChannel(channel);
  }
}
