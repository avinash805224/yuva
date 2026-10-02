// ============================================================================
// EcoPulse 360 — High-Fidelity Physics-Based Building Simulator
// Generates realistic multi-zone telemetry: thermal dynamics, occupancy,
// energy sub-metering, solar PV, and IAQ for an Indian commercial building.
// EXTENDED: Integrates AI engine for insights, forecasting, and optimization.
// ============================================================================

import type {
  ZoneId, ZoneTelemetry, ComfortMetrics, FDDAlert, DemandResponseState,
  BuildingOverview, BuildingState, EnergyHistoryPoint, ThermalSensation,
  DREventStatus, OccupantVote, HVACMode, DemoOverrides,
} from '../types/telemetry';
import {
  generateAIInsights, generateForecast, generateOccupancyIntelligence,
  generateSmartHVAC, generateEquipmentHealth, generateAnomalies,
  generateRenewableState, generateGridFlexibility, generateRecommendations,
  generateOccupantExperience, generateBuildingScore, generateCarbonIntelligence,
  generateNotifications,
} from './ai-engine';

// ---------------------------------------------------------------------------
// Constants & Building Parameters
// ---------------------------------------------------------------------------

const ZONES: { id: ZoneId; name: string; area: number; maxOcc: number; basePlugKW: number; baseLightKW: number }[] = [
  { id: 'workstations', name: 'Open Workstations', area: 800, maxOcc: 120, basePlugKW: 18, baseLightKW: 6.5 },
  { id: 'boardroom',    name: 'Executive Boardroom', area: 120, maxOcc: 20, basePlugKW: 3.2, baseLightKW: 1.8 },
  { id: 'cafeteria',    name: 'Cafeteria & Atrium', area: 300, maxOcc: 80, basePlugKW: 8.0, baseLightKW: 4.2 },
  { id: 'server_room',  name: 'Server / IT Room', area: 60, maxOcc: 4, basePlugKW: 42, baseLightKW: 0.8 },
];

const BUILDING_AREA_M2 = 1280; // total conditioned area
const CEA_EMISSION_FACTOR = 0.716; // kg CO₂ / kWh (India CEA baseline)
const BASE_TARIFF = 8.5; // ₹/kWh normal rate
const PEAK_MULTIPLIER = 1.45;
const OFFPEAK_MULTIPLIER = 0.72;
const SOLAR_PEAK_KW = 35; // rooftop PV rated capacity
const BATTERY_CAPACITY_KWH = 50;

// ---------------------------------------------------------------------------
// Utility Helpers
// ---------------------------------------------------------------------------

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

function gaussianNoise(stddev: number): number {
  // Box-Muller transform
  const u1 = Math.random();
  const u2 = Math.random();
  return stddev * Math.sqrt(-2 * Math.log(u1 || 0.001)) * Math.cos(2 * Math.PI * u2);
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/** Get the simulated hour-of-day (0–24) from a Date */
function getHourDecimal(date: Date): number {
  return date.getHours() + date.getMinutes() / 60 + date.getSeconds() / 3600;
}

// ---------------------------------------------------------------------------
// Environmental & Occupancy Models
// ---------------------------------------------------------------------------

/** Indian composite climate outdoor temperature model (Delhi-like) */
function outdoorTemperature(hour: number): number {
  // Diurnal swing: min ~26°C at 05:00, peak ~37°C at 14:30
  const baseTemp = 31.5;
  const amplitude = 5.5;
  const phase = 14.5; // peak hour
  const temp = baseTemp + amplitude * Math.sin(((hour - phase + 6) / 24) * 2 * Math.PI);
  return temp + gaussianNoise(0.3);
}

/** Outdoor relative humidity (inversely correlated to temp) */
function outdoorHumidity(hour: number): number {
  const base = 55;
  const amplitude = 15;
  const phase = 5; // peak humidity at dawn
  return clamp(base + amplitude * Math.sin(((hour - phase + 6) / 24) * 2 * Math.PI) + gaussianNoise(2), 30, 90);
}

/** Solar irradiance curve (W/m²) — peaks at solar noon */
function solarIrradiance(hour: number): number {
  if (hour < 6 || hour > 18.5) return 0;
  const peak = 850; // W/m² at noon
  const x = (hour - 12.25) / 6.25;
  return Math.max(0, peak * (1 - x * x)) * (0.9 + 0.1 * Math.random());
}

/** Occupancy profile for each zone — realistic Indian office schedule */
function occupancyFraction(zoneId: ZoneId, hour: number): number {
  const profiles: Record<ZoneId, (h: number) => number> = {
    workstations: (h) => {
      if (h < 8) return 0.02;
      if (h < 9.5) return lerp(0.02, 0.85, (h - 8) / 1.5);  // morning ramp
      if (h < 13) return 0.85 + gaussianNoise(0.05);           // morning peak
      if (h < 14) return 0.45;                                  // lunch
      if (h < 17.5) return 0.80 + gaussianNoise(0.05);         // afternoon
      if (h < 19) return lerp(0.80, 0.05, (h - 17.5) / 1.5);  // evening departure
      return 0.03;
    },
    boardroom: (h) => {
      // Sporadic meeting clusters
      if (h < 9 || h > 18) return 0;
      const meetingProb = (h >= 10 && h <= 12) || (h >= 15 && h <= 17) ? 0.65 : 0.15;
      return Math.random() < meetingProb ? 0.6 + Math.random() * 0.3 : 0.05;
    },
    cafeteria: (h) => {
      if (h < 7 || h > 20) return 0.02;
      if (h >= 12.5 && h <= 14) return 0.85 + gaussianNoise(0.05); // lunch rush
      if (h >= 16 && h <= 17) return 0.35; // tea time
      return 0.12 + gaussianNoise(0.03);
    },
    server_room: () => {
      // Very low human presence, constant equipment load
      return Math.random() < 0.08 ? 0.5 : 0.0;
    },
  };
  return clamp(profiles[zoneId](hour), 0, 1);
}

// ---------------------------------------------------------------------------
// ASHRAE 55 PMV/PPD Calculator (ISO 7730 Fanger Model)
// ---------------------------------------------------------------------------

/**
 * Calculates PMV (Predicted Mean Vote) using the Fanger steady-state model.
 * Inputs:
 *   ta  - air temperature (°C)
 *   tr  - mean radiant temperature (°C) — approximated as ta + offset
 *   vel - relative air velocity (m/s)
 *   rh  - relative humidity (%)
 *   met - metabolic rate (met units, 1 met = 58.15 W/m²)
 *   clo - clothing insulation (clo units, 1 clo = 0.155 m²·K/W)
 */
function calculatePMV(ta: number, tr: number, vel: number, rh: number, met: number, clo: number): number {
  const M = met * 58.15; // W/m²
  const W = 0; // external work, assumed 0 for office
  const MW = M - W;
  const Icl = clo * 0.155; // m²·K/W
  const fcl = clo <= 0.078 ? 1.0 + 1.29 * Icl : 1.05 + 0.645 * Icl;

  // Water vapour partial pressure (Pa)
  const pa = (rh / 100) * 610.7 * Math.pow(10, (7.5 * ta) / (237.3 + ta));

  // Iterative solve for clothing surface temperature tcl
  let tcl = ta; // initial guess
  for (let i = 0; i < 50; i++) {
    const hc_forced = 12.1 * Math.sqrt(vel);
    const hc_natural = 2.38 * Math.pow(Math.abs(tcl - ta), 0.25);
    const hc = Math.max(hc_forced, hc_natural);
    const hr = 3.96e-8 * fcl * (Math.pow((tcl + 273), 2) + Math.pow((tr + 273), 2)) * ((tcl + 273) + (tr + 273));
    const tcl_new = 35.7 - 0.028 * MW - Icl * (
      fcl * hr * (tcl - tr) + fcl * hc * (tcl - ta)
    );
    if (Math.abs(tcl_new - tcl) < 0.001) break;
    tcl = tcl_new;
  }

  const hc_forced = 12.1 * Math.sqrt(vel);
  const hc_natural = 2.38 * Math.pow(Math.abs(tcl - ta), 0.25);
  const hc = Math.max(hc_forced, hc_natural);

  // PMV equation (ISO 7730)
  const HL1 = 3.05e-3 * (5733 - 6.99 * MW - pa);        // skin diffusion
  const HL2 = MW > 58.15 ? 0.42 * (MW - 58.15) : 0;      // sweating
  const HL3 = 1.7e-5 * M * (5867 - pa);                   // latent respiration
  const HL4 = 1.4e-3 * M * (34 - ta);                     // dry respiration
  const HL5 = fcl * hc * (tcl - ta);                       // convective
  const HL6 = 3.96e-8 * fcl * (Math.pow(tcl + 273, 4) - Math.pow(tr + 273, 4)); // radiative

  const TS = 0.303 * Math.exp(-0.036 * M) + 0.028;
  const pmv = TS * (MW - HL1 - HL2 - HL3 - HL4 - HL5 - HL6);

  return clamp(pmv, -3, 3);
}

function calculatePPD(pmv: number): number {
  return clamp(100 - 95 * Math.exp(-0.03353 * Math.pow(pmv, 4) - 0.2179 * Math.pow(pmv, 2)), 5, 100);
}

function getSensation(pmv: number): ThermalSensation {
  if (pmv <= -2.5) return 'Cold';
  if (pmv <= -1.5) return 'Cool';
  if (pmv <= -0.5) return 'Slightly Cool';
  if (pmv <= 0.5) return 'Neutral';
  if (pmv <= 1.5) return 'Slightly Warm';
  if (pmv <= 2.5) return 'Warm';
  return 'Hot';
}

function calculateIEQ(temp: number, humidity: number, co2: number, pm25: number, lux: number): number {
  // Composite 0–100 score based on multi-parameter weighting
  const thermalScore = Math.max(0, 100 - Math.abs(temp - 24.5) * 15);
  const humidityScore = Math.max(0, 100 - Math.abs(humidity - 50) * 2);
  const co2Score = co2 <= 600 ? 100 : co2 <= 800 ? 85 : co2 <= 1000 ? 60 : co2 <= 1200 ? 35 : 10;
  const pm25Score = pm25 <= 15 ? 100 : pm25 <= 30 ? 75 : pm25 <= 60 ? 45 : 15;
  const luxScore = (lux >= 300 && lux <= 500) ? 100 : (lux >= 200 && lux <= 600) ? 70 : 40;

  return Math.round(thermalScore * 0.3 + humidityScore * 0.15 + co2Score * 0.25 + pm25Score * 0.15 + luxScore * 0.15);
}

// ---------------------------------------------------------------------------
// FDD (Fault Detection & Diagnostics) Engine
// ---------------------------------------------------------------------------

let alertIdCounter = 0;
const activeAlertIds = new Set<string>();

function detectFaults(zones: ZoneTelemetry[], hour: number): FDDAlert[] {
  const alerts: FDDAlert[] = [];
  const now = Date.now();

  for (const z of zones) {
    // Fault 1: Unoccupied cooling waste
    if (z.occupancy === 0 && z.hvacPower > 2 && hour >= 7 && hour <= 22) {
      const faultKey = `unoccupied-${z.zoneId}`;
      if (!activeAlertIds.has(faultKey)) {
        activeAlertIds.add(faultKey);
        alerts.push({
          id: `fdd-${++alertIdCounter}`,
          timestamp: now,
          severity: 'warning',
          equipment: `AHU / VRF — ${z.zoneName}`,
          title: `Unoccupied Cooling Active — ${z.zoneName}`,
          description: `HVAC drawing ${z.hvacPower.toFixed(1)} kW with zero occupancy detected for this zone.`,
          energyBleed: z.hvacPower * 24 * 0.4,
          costBleed: z.hvacPower * 24 * 0.4 * BASE_TARIFF,
          action: 'Enable occupancy-based HVAC scheduling or increase setpoint to 28°C when unoccupied.',
          acknowledged: false,
        });
      }
    }

    // Fault 2: Overcooling (setpoint < 22°C when outdoor > 30°C)
    const outdoorTemp = outdoorTemperature(hour);
    if (z.setpoint < 22 && outdoorTemp > 30 && z.zoneId !== 'server_room') {
      const faultKey = `overcool-${z.zoneId}`;
      if (!activeAlertIds.has(faultKey)) {
        activeAlertIds.add(faultKey);
        alerts.push({
          id: `fdd-${++alertIdCounter}`,
          timestamp: now,
          severity: 'critical',
          equipment: `Chiller / VRF — ${z.zoneName}`,
          title: `Aggressive Overcooling — ${z.zoneName} (${z.setpoint.toFixed(1)}°C)`,
          description: `Setpoint at ${z.setpoint.toFixed(1)}°C with outdoor temp ${outdoorTemp.toFixed(1)}°C. This drives excessive compressor cycling and 25–30% extra energy consumption.`,
          energyBleed: z.hvacPower * 24 * 0.3,
          costBleed: z.hvacPower * 24 * 0.3 * BASE_TARIFF * 1.2,
          action: `Raise setpoint to BEE-recommended 24°C–26°C range. Each +1°C saves ~6% cooling energy.`,
          acknowledged: false,
        });
      }
    }

    // Fault 3: High CO₂ indicating poor ventilation
    if (z.co2 > 1100) {
      const faultKey = `co2-${z.zoneId}`;
      if (!activeAlertIds.has(faultKey)) {
        activeAlertIds.add(faultKey);
        alerts.push({
          id: `fdd-${++alertIdCounter}`,
          timestamp: now,
          severity: z.co2 > 1500 ? 'critical' : 'warning',
          equipment: `Fresh Air Damper — ${z.zoneName}`,
          title: `Elevated CO₂ — ${z.zoneName} (${z.co2.toFixed(0)} ppm)`,
          description: `CO₂ at ${z.co2.toFixed(0)} ppm exceeds safe threshold (800 ppm). Indicates insufficient fresh air ventilation.`,
          energyBleed: 0,
          costBleed: 0,
          action: 'Increase fresh air fraction via Demand-Controlled Ventilation (DCV). Check AHU outdoor air damper position.',
          acknowledged: false,
        });
      }
    }
  }

  // Fault 4: AHU valve hunting (synthetic periodic fault)
  if (Math.random() < 0.02) {
    alerts.push({
      id: `fdd-${++alertIdCounter}`,
      timestamp: now,
      severity: 'critical',
      equipment: 'AHU-2 Chilled Water Valve',
      title: 'AHU-2 Valve Hunting Detected',
      description: 'Chilled water control valve oscillating between 20%–80% open position. PID tuning degradation causing energy waste.',
      energyBleed: 38,
      costBleed: 1420,
      action: 'Retune PID controller parameters. Check actuator linkage and sensor calibration.',
      acknowledged: false,
    });
  }

  // Fault 5: Filter clogging
  if (Math.random() < 0.015) {
    alerts.push({
      id: `fdd-${++alertIdCounter}`,
      timestamp: now,
      severity: 'info',
      equipment: 'AHU-1 Air Filter Bank',
      title: 'Air Filter Pressure Drop Increasing',
      description: 'Static pressure differential across filter bank has risen 35% above baseline, indicating filter loading.',
      energyBleed: 12,
      costBleed: 102,
      action: 'Schedule filter replacement within 14 days to prevent fan motor overloading.',
      acknowledged: false,
    });
  }

  return alerts;
}

// ---------------------------------------------------------------------------
// Demand Response / ToD Tariff Controller
// ---------------------------------------------------------------------------

function getTariffPeriod(hour: number): { period: 'off_peak' | 'normal' | 'peak'; rate: number } {
  // Indian DISCOM Time-of-Day tariff schedule
  if ((hour >= 18 && hour <= 22) || (hour >= 6 && hour <= 10)) {
    return { period: 'peak', rate: BASE_TARIFF * PEAK_MULTIPLIER };
  }
  if (hour >= 10 && hour <= 16) {
    return { period: 'off_peak', rate: BASE_TARIFF * OFFPEAK_MULTIPLIER };
  }
  return { period: 'normal', rate: BASE_TARIFF };
}

// ---------------------------------------------------------------------------
// Main Simulator Class
// ---------------------------------------------------------------------------

export class BuildingSimulator {
  private zoneStates: Map<ZoneId, {
    indoorTemp: number;
    humidity: number;
    co2: number;
    pm25: number;
    setpoint: number;
  }>;
  private batterySoC = 75; // %
  private drStatus: DREventStatus = 'idle';
  private totalEnergyToday = 0;
  private totalCostToday = 0;
  private energyHistory: EnergyHistoryPoint[] = [];
  private cumulativeAlerts: FDDAlert[] = [];
  private occupantVotes: Record<ZoneId, { too_cold: number; comfortable: number; too_warm: number }>;
  private tickCount = 0;
  // NEW: AI layer state
  private hvacModes: Record<ZoneId, HVACMode> = {
    workstations: 'auto', boardroom: 'auto', cafeteria: 'auto', server_room: 'auto',
  };
  private demoOverrides: DemoOverrides = {
    occupancyMultiplier: 1, temperatureOffset: 0,
    solarMultiplier: 1, gridLoadMultiplier: 1, hvacLoadMultiplier: 1,
  };
  private appliedRecommendations: Set<string> = new Set();
  private forecastPeriod: 'today' | 'tomorrow' | '7days' = 'today';

  constructor() {
    this.zoneStates = new Map();
    // Initialize zone thermal states
    this.zoneStates.set('workstations', { indoorTemp: 24.5, humidity: 52, co2: 520, pm25: 22, setpoint: 24.0 });
    this.zoneStates.set('boardroom', { indoorTemp: 23.8, humidity: 50, co2: 480, pm25: 18, setpoint: 23.5 });
    this.zoneStates.set('cafeteria', { indoorTemp: 25.2, humidity: 55, co2: 580, pm25: 28, setpoint: 25.0 });
    this.zoneStates.set('server_room', { indoorTemp: 20.5, humidity: 42, co2: 410, pm25: 8, setpoint: 20.0 });

    this.occupantVotes = {
      workstations: { too_cold: 12, comfortable: 85, too_warm: 23 },
      boardroom: { too_cold: 3, comfortable: 14, too_warm: 3 },
      cafeteria: { too_cold: 5, comfortable: 48, too_warm: 27 },
      server_room: { too_cold: 0, comfortable: 2, too_warm: 0 },
    };

    // Seed energy history with last 24 hours
    this._seedEnergyHistory();
  }

  private _seedEnergyHistory(): void {
    const now = new Date();
    for (let i = 24; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 3600000);
      const h = getHourDecimal(d);
      const solar = solarIrradiance(h) / 850 * SOLAR_PEAK_KW;
      const hvac = 40 + 60 * Math.max(0, Math.sin(((h - 6) / 18) * Math.PI)) * (0.85 + 0.15 * Math.random());
      const lighting = (h >= 7 && h <= 19) ? 12 + 4 * Math.random() : 2 + Math.random();
      const servers = 42 + gaussianNoise(1.5);
      this.energyHistory.push({
        time: `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`,
        hvac: Math.round(hvac * 10) / 10,
        lighting: Math.round(lighting * 10) / 10,
        servers: Math.round(servers * 10) / 10,
        solar: Math.round(solar * 10) / 10,
        total: Math.round((hvac + lighting + servers) * 10) / 10,
      });
    }
  }

  /** Submit an occupant vote for a zone */
  submitVote(zoneId: ZoneId, vote: OccupantVote): void {
    this.occupantVotes[zoneId][vote]++;
    const state = this.zoneStates.get(zoneId);
    if (state) {
      if (vote === 'too_cold') state.setpoint = clamp(state.setpoint + 0.3, 22, 28);
      if (vote === 'too_warm') state.setpoint = clamp(state.setpoint - 0.3, 20, 26);
    }
  }

  /** Trigger or clear a demand response event */
  triggerDR(activate: boolean): void {
    this.drStatus = activate ? 'pre_cooling' : 'idle';
  }

  /** Acknowledge an FDD alert */
  acknowledgeAlert(alertId: string): void {
    const alert = this.cumulativeAlerts.find(a => a.id === alertId);
    if (alert) alert.acknowledged = true;
  }

  /** Set HVAC mode for a zone */
  setHVACMode(zoneId: ZoneId, mode: HVACMode): void {
    this.hvacModes[zoneId] = mode;
    const state = this.zoneStates.get(zoneId);
    if (state) {
      if (mode === 'energy_saver') state.setpoint = clamp(state.setpoint + 1.5, 24, 28);
      else if (mode === 'comfort') state.setpoint = clamp(state.setpoint - 0.5, 22, 25);
      else if (mode === 'peak_reduction') state.setpoint = clamp(state.setpoint + 2, 25, 28);
    }
  }

  /** Update demo mode overrides */
  setDemoOverrides(overrides: Partial<DemoOverrides>): void {
    this.demoOverrides = { ...this.demoOverrides, ...overrides };
  }

  /** Set forecast period */
  setForecastPeriod(period: 'today' | 'tomorrow' | '7days'): void {
    this.forecastPeriod = period;
  }

  /** Apply/unapply a recommendation */
  toggleRecommendation(recId: string): void {
    if (this.appliedRecommendations.has(recId)) {
      this.appliedRecommendations.delete(recId);
    } else {
      this.appliedRecommendations.add(recId);
    }
  }

  /** Get applied recommendation IDs */
  getAppliedRecommendations(): Set<string> {
    return this.appliedRecommendations;
  }

  /** Get HVAC modes */
  getHVACModes(): Record<ZoneId, HVACMode> {
    return { ...this.hvacModes };
  }

  /** Run one simulator tick and return the full building state snapshot */
  tick(): BuildingState {
    this.tickCount++;
    const now = new Date();
    const hour = getHourDecimal(now);
    const tariff = getTariffPeriod(hour);
    const solar = solarIrradiance(hour) / 850 * SOLAR_PEAK_KW;

    // === Update DR state machine ===
    if (this.drStatus === 'pre_cooling' && hour >= 17.75) {
      this.drStatus = 'peak_active';
    }
    if (this.drStatus === 'peak_active' && hour >= 22) {
      this.drStatus = 'recovery';
    }
    if (this.drStatus === 'recovery' && hour >= 23) {
      this.drStatus = 'idle';
    }

    // === Simulate each zone ===
    const zones: ZoneTelemetry[] = [];
    const comfort: ComfortMetrics[] = [];
    const outTemp = outdoorTemperature(hour);
    const outHumidity = outdoorHumidity(hour);

    for (const zoneDef of ZONES) {
      const state = this.zoneStates.get(zoneDef.id)!;
      const occFrac = occupancyFraction(zoneDef.id, hour);
      const occupancy = Math.round(occFrac * zoneDef.maxOcc);

      // Thermal dynamics: zone temp drifts toward a blend of outdoor and setpoint
      const solarGain = (zoneDef.id !== 'server_room') ? solarIrradiance(hour) * 0.0003 : 0;
      const occupantGain = occupancy * 0.08 * 0.015; // body heat
      const hvacCoolingRate = 0.15; // how fast HVAC pulls temp toward setpoint

      // Apply DR setpoint adjustments
      let effectiveSetpoint = state.setpoint;
      if (this.drStatus === 'peak_active' && zoneDef.id !== 'server_room') {
        effectiveSetpoint = state.setpoint + 1.5;
      }
      if (this.drStatus === 'pre_cooling' && zoneDef.id !== 'server_room') {
        effectiveSetpoint = state.setpoint - 1.0;
      }

      // Temperature update (simplified differential equation)
      const driftToOutdoor = (outTemp - state.indoorTemp) * 0.008;
      const driftToSetpoint = (effectiveSetpoint - state.indoorTemp) * hvacCoolingRate;
      state.indoorTemp += driftToOutdoor + driftToSetpoint + solarGain + occupantGain + gaussianNoise(0.08);
      state.indoorTemp = clamp(state.indoorTemp, 18, 35);

      // Humidity update
      state.humidity += (outHumidity - state.humidity) * 0.01 + occupancy * 0.003 + gaussianNoise(0.5);
      state.humidity = clamp(state.humidity, 30, 80);

      // CO₂ dynamics: rises with occupancy, decays with ventilation
      const co2Generation = occupancy * 0.8; // ppm per tick per occupant
      const co2Decay = (state.co2 - 400) * 0.02; // ventilation decay toward outdoor 400 ppm
      state.co2 += co2Generation - co2Decay + gaussianNoise(5);
      state.co2 = clamp(state.co2, 380, 2000);

      // PM2.5: slightly correlated to outdoor, plus indoor sources
      state.pm25 += (25 - state.pm25) * 0.05 + gaussianNoise(1.5);
      state.pm25 = clamp(state.pm25, 5, 80);

      // Lux: based on time of day and lighting load
      const baseLux = (hour >= 7 && hour <= 19) ? 380 + gaussianNoise(30) : 50 + gaussianNoise(10);

      // Power sub-metering
      const hvacLoadFactor = Math.abs(state.indoorTemp - effectiveSetpoint) * 0.3 + occFrac * 0.5 + 0.2;
      const hvacPower = clamp(zoneDef.area * 0.06 * hvacLoadFactor + gaussianNoise(0.5), 0.5, zoneDef.area * 0.15);
      const lightingPower = (hour >= 7 && hour <= 19) ? zoneDef.baseLightKW * (0.7 + occFrac * 0.3) : zoneDef.baseLightKW * 0.1;
      const plugPower = zoneDef.basePlugKW * (zoneDef.id === 'server_room' ? (0.95 + gaussianNoise(0.02)) : (0.3 + occFrac * 0.6));

      // Apply DR lighting dimming
      const effectiveLighting = this.drStatus === 'peak_active' ? lightingPower * 0.7 : lightingPower;

      zones.push({
        zoneId: zoneDef.id,
        zoneName: zoneDef.name,
        timestamp: now.getTime(),
        temperature: Math.round(state.indoorTemp * 10) / 10,
        humidity: Math.round(state.humidity * 10) / 10,
        co2: Math.round(state.co2),
        pm25: Math.round(state.pm25 * 10) / 10,
        lux: Math.round(baseLux),
        occupancy,
        maxOccupancy: zoneDef.maxOcc,
        hvacPower: Math.round(hvacPower * 10) / 10,
        lightingPower: Math.round(effectiveLighting * 10) / 10,
        plugPower: Math.round(plugPower * 10) / 10,
        setpoint: Math.round(effectiveSetpoint * 10) / 10,
      });

      // Comfort calculation
      const pmv = calculatePMV(
        state.indoorTemp,
        state.indoorTemp + 0.8, // MRT ≈ air temp + offset
        0.15, // typical office air speed
        state.humidity,
        1.1, // office metabolic rate
        0.57  // summer clothing in India
      );
      const ppd = calculatePPD(pmv);

      comfort.push({
        zoneId: zoneDef.id,
        pmv: Math.round(pmv * 100) / 100,
        ppd: Math.round(ppd * 10) / 10,
        sensation: getSensation(pmv),
        recommendedSetpoint: clamp(24 + pmv * 0.8, 22, 27),
        ieqScore: calculateIEQ(state.indoorTemp, state.humidity, state.co2, state.pm25, baseLux),
      });
    }

    // === Building totals ===
    const hvacTotal = zones.reduce((s, z) => s + z.hvacPower, 0);
    const lightingTotal = zones.reduce((s, z) => s + z.lightingPower, 0);
    const plugTotal = zones.reduce((s, z) => s + z.plugPower, 0);
    const totalPower = hvacTotal + lightingTotal + plugTotal;
    const gridImport = Math.max(0, totalPower - solar);

    // Battery dispatch during DR
    let effectiveGridDraw = gridImport;
    if (this.drStatus === 'peak_active' && this.batterySoC > 10) {
      const discharge = Math.min(15, this.batterySoC * BATTERY_CAPACITY_KWH / 100 * 0.2);
      effectiveGridDraw = Math.max(0, gridImport - discharge);
      this.batterySoC = clamp(this.batterySoC - 0.5, 5, 100);
    } else if (solar > totalPower * 0.3 && this.batterySoC < 95) {
      this.batterySoC = clamp(this.batterySoC + 0.1, 5, 100);
    }

    // Energy accumulation (per tick ≈ 3 seconds ≈ 0.000833 hours)
    const tickHours = 3 / 3600;
    this.totalEnergyToday += totalPower * tickHours;
    this.totalCostToday += effectiveGridDraw * tickHours * tariff.rate;

    // Energy history
    if (this.tickCount % 20 === 0) {
      this.energyHistory.push({
        time: `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`,
        hvac: Math.round(hvacTotal * 10) / 10,
        lighting: Math.round(lightingTotal * 10) / 10,
        servers: Math.round(plugTotal * 10) / 10,
        solar: Math.round(solar * 10) / 10,
        total: Math.round(totalPower * 10) / 10,
      });
      if (this.energyHistory.length > 100) this.energyHistory.shift();
    }

    // FDD detection
    const newAlerts = detectFaults(zones, hour);
    this.cumulativeAlerts.push(...newAlerts);
    // Keep only last 50 alerts
    if (this.cumulativeAlerts.length > 50) {
      this.cumulativeAlerts = this.cumulativeAlerts.slice(-50);
    }

    // BEE Star Rating estimation
    const annualizedEPI = (this.totalEnergyToday * 365) / BUILDING_AREA_M2;
    let beeStars = 1;
    if (annualizedEPI < 90) beeStars = 5;
    else if (annualizedEPI < 120) beeStars = 4;
    else if (annualizedEPI < 160) beeStars = 3;
    else if (annualizedEPI < 200) beeStars = 2;

    const overview: BuildingOverview = {
      totalPower: Math.round(totalPower * 10) / 10,
      todayEnergy: Math.round(this.totalEnergyToday * 10) / 10,
      todayCost: Math.round(this.totalCostToday),
      carbonRate: Math.round(effectiveGridDraw * CEA_EMISSION_FACTOR * 10) / 10,
      beeStarRating: beeStars,
      epi: Math.round(annualizedEPI),
      hvacTotal: Math.round(hvacTotal * 10) / 10,
      lightingTotal: Math.round(lightingTotal * 10) / 10,
      plugTotal: Math.round(plugTotal * 10) / 10,
      solarPV: Math.round(solar * 10) / 10,
      gridImport: Math.round(effectiveGridDraw * 10) / 10,
    };

    // Next peak event time
    let nextPeak: string | null = null;
    if (hour < 18) nextPeak = 'Today 18:00 IST';
    else if (hour < 22) nextPeak = 'Active Now';
    else nextPeak = 'Tomorrow 06:00 IST';

    const demandResponse: DemandResponseState = {
      status: this.drStatus,
      currentGridDraw: Math.round(effectiveGridDraw * 10) / 10,
      targetGridDraw: 60,
      batterySoC: Math.round(this.batterySoC),
      solarOutput: Math.round(solar * 10) / 10,
      nextPeakEvent: nextPeak,
      currentTariffRate: Math.round(tariff.rate * 100) / 100,
      tariffPeriod: tariff.period,
      eventSavings: this.drStatus !== 'idle' ? Math.round((gridImport - effectiveGridDraw) * tickHours * tariff.rate * this.tickCount * 0.1) : 0,
      curtailmentKW: this.drStatus === 'peak_active' ? Math.round((gridImport - effectiveGridDraw) * 10) / 10 : 0,
    };

    // ================================================================
    // AI ENGINE INTEGRATION — Generate all intelligence outputs
    // ================================================================
    const filteredAlerts = this.cumulativeAlerts.filter(a => !a.acknowledged).slice(-10);
    const aiInsights = generateAIInsights(zones, comfort, overview);
    const { points: forecastPoints, summary: forecastSummary } = generateForecast(overview, this.forecastPeriod);
    const occupancyIntelligence = generateOccupancyIntelligence(zones);
    const smartHVAC = generateSmartHVAC(zones, comfort, this.hvacModes);
    const equipmentHealth = generateEquipmentHealth();
    const anomalies = generateAnomalies(zones, overview);
    const renewables = generateRenewableState(overview, demandResponse);
    const gridFlexibility = generateGridFlexibility(overview);
    const recommendations = generateRecommendations(zones, overview, equipmentHealth).map(r => ({
      ...r, applied: this.appliedRecommendations.has(r.id),
    }));
    const occupantExperience = generateOccupantExperience(zones, comfort);
    const buildingScore = generateBuildingScore(overview, comfort, equipmentHealth, renewables, demandResponse);
    const carbon = generateCarbonIntelligence(overview);
    const notifications = generateNotifications(filteredAlerts, anomalies, equipmentHealth, aiInsights);

    return {
      timestamp: now.getTime(),
      overview,
      zones,
      comfort,
      alerts: filteredAlerts,
      demandResponse,
      energyHistory: this.energyHistory.slice(-48),
      occupantVotes: { ...this.occupantVotes },
      // AI-powered fields
      aiInsights,
      forecast: forecastPoints,
      forecastSummary,
      occupancyIntelligence,
      smartHVAC,
      equipmentHealth,
      anomalies,
      renewables,
      gridFlexibility,
      recommendations,
      occupantExperience,
      buildingScore,
      carbon,
      notifications,
    };
  }
}
