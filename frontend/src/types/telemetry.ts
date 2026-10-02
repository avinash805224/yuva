// ============================================================================
// EcoPulse 360 — Shared Type Definitions (Single Source of Truth)
// Schneider Electric Yuva Yodha Hackathon 2026 — Smart Buildings
// EXTENDED: AI Engine, Forecasting, Equipment Health, Anomalies, What-If
// ============================================================================

/** Physical zone identifiers in the simulated commercial building */
export type ZoneId = 'workstations' | 'boardroom' | 'cafeteria' | 'server_room';

/** Severity levels for FDD alerts */
export type AlertSeverity = 'critical' | 'warning' | 'info';

/** Demand response event states */
export type DREventStatus = 'idle' | 'pre_cooling' | 'peak_active' | 'recovery';

/** Occupant thermal vote */
export type OccupantVote = 'too_cold' | 'comfortable' | 'too_warm';

/** ASHRAE 55 thermal sensation scale (-3 to +3) */
export type ThermalSensation = 'Cold' | 'Cool' | 'Slightly Cool' | 'Neutral' | 'Slightly Warm' | 'Warm' | 'Hot';

/** Navigation page keys */
export type PageId =
  | 'about'            // 1. Description / About Eco 360
  | 'overview'         // 2. Dashboard Upgrade (Building->Floor->Zone->Room->Equipment)
  | 'predictor'        // 3. Predictor Page
  | 'recommendations'  // 4. Recommendation Model
  | 'smart-load'       // 5. Smart Load Manager
  | 'load-shedding'    // 6. Load Shedding / Power Roster
  | 'storage'          // 7. Storage Manager
  | 'public-portal'    // 8. Public Portal
  | 'co-ordination'    // 9. Co-ordination Center
  | 'misuse-alarm'     // 10. Misuse Alarm Center
  | 'ml-model'         // 11. Technical ML Model Section
  | 'digital-twin'     // Preserved
  | 'equipment'        // Preserved
  | 'renewables'       // Preserved
  | 'optimization'     // Preserved
  | 'occupant'         // Preserved
  | 'ai-insights'      // Preserved alias for recommendations
  | 'forecast'         // Preserved alias for predictor
  | 'energy';          // Preserved alias


/** HVAC control modes */
export type HVACMode = 'auto' | 'comfort' | 'energy_saver' | 'peak_reduction';

/** Equipment health status */
export type EquipmentStatus = 'healthy' | 'attention' | 'warning' | 'critical';

/** Anomaly severity */
export type AnomalySeverity = 'normal' | 'warning' | 'critical';

/** Comfort status label */
export type ComfortStatus = 'Excellent' | 'Good' | 'Needs Attention';

// ---------------------------------------------------------------------------
// Core Telemetry Payloads (PRESERVED from original)
// ---------------------------------------------------------------------------

export interface ZoneTelemetry {
  zoneId: ZoneId;
  zoneName: string;
  timestamp: number;
  temperature: number;
  humidity: number;
  co2: number;
  pm25: number;
  lux: number;
  occupancy: number;
  maxOccupancy: number;
  hvacPower: number;
  lightingPower: number;
  plugPower: number;
  setpoint: number;
}

export interface ComfortMetrics {
  zoneId: ZoneId;
  pmv: number;
  ppd: number;
  sensation: ThermalSensation;
  recommendedSetpoint: number;
  ieqScore: number;
}

export interface FDDAlert {
  id: string;
  timestamp: number;
  severity: AlertSeverity;
  equipment: string;
  title: string;
  description: string;
  energyBleed: number;
  costBleed: number;
  action: string;
  acknowledged: boolean;
}

export interface DemandResponseState {
  status: DREventStatus;
  currentGridDraw: number;
  targetGridDraw: number;
  batterySoC: number;
  solarOutput: number;
  nextPeakEvent: string | null;
  currentTariffRate: number;
  tariffPeriod: 'off_peak' | 'normal' | 'peak';
  eventSavings: number;
  curtailmentKW: number;
}

export interface BuildingOverview {
  totalPower: number;
  todayEnergy: number;
  todayCost: number;
  carbonRate: number;
  beeStarRating: number;
  epi: number;
  hvacTotal: number;
  lightingTotal: number;
  plugTotal: number;
  solarPV: number;
  gridImport: number;
}

export interface EnergyHistoryPoint {
  time: string;
  hvac: number;
  lighting: number;
  servers: number;
  solar: number;
  total: number;
}

export interface OccupantFeedback {
  zoneId: ZoneId;
  vote: OccupantVote;
  timestamp: number;
}

// ---------------------------------------------------------------------------
// NEW: AI Energy Brain Types
// ---------------------------------------------------------------------------

export interface AIInsight {
  id: string;
  title: string;
  problem: string;
  reason: string;
  action: string;
  energySaving: number;       // kWh/day
  costSaving: number;         // ₹/day
  co2Reduction: number;       // kg/day
  confidence: number;         // 0–100%
  severity: 'info' | 'warning' | 'critical';
  category: 'hvac' | 'lighting' | 'occupancy' | 'equipment' | 'grid' | 'solar';
  timestamp: number;
}

// ---------------------------------------------------------------------------
// NEW: Energy Forecasting Types
// ---------------------------------------------------------------------------

export interface ForecastPoint {
  time: string;
  hour: number;
  actual: number | null;
  predicted: number;
  optimized: number;
  peak: number;
}

export interface ForecastSummary {
  predictedPeak: number;      // kW
  peakTime: string;
  expectedDaily: number;      // kWh
  expectedCost: number;       // ₹
  optimizedDaily: number;     // kWh
  optimizedCost: number;      // ₹
}

// ---------------------------------------------------------------------------
// NEW: Occupancy Intelligence Types
// ---------------------------------------------------------------------------

export interface OccupancyIntelligence {
  zoneId: ZoneId;
  zoneName: string;
  current: number;
  capacity: number;
  percentage: number;
  predictedAt14: number;      // predicted occupancy at 14:00
  predictedNextHour: number;  // predicted occupancy in 1 hour
  hvacLoad: number;
  lightingLoad: number;
  recommendation: string;
}

// ---------------------------------------------------------------------------
// NEW: Smart HVAC Types
// ---------------------------------------------------------------------------

export interface SmartHVACZone {
  zoneId: ZoneId;
  zoneName: string;
  temperature: number;
  setpoint: number;
  occupancy: number;
  maxOccupancy: number;
  hvacPower: number;
  comfortStatus: ComfortStatus;
  pmv: number;
  mode: HVACMode;
  savings: {
    kwhSaved: number;
    costSaved: number;
    co2Avoided: number;
  };
  comfortProtection: boolean;
}

// ---------------------------------------------------------------------------
// NEW: Predictive Maintenance Types
// ---------------------------------------------------------------------------

export interface EquipmentHealth {
  id: string;
  name: string;
  type: 'ahu' | 'chiller' | 'pump' | 'fan' | 'lighting' | 'server' | 'vrf';
  healthScore: number;        // 0–100
  status: EquipmentStatus;
  currentPower: number;       // kW
  expectedPower: number;      // kW
  predictedIssue: string;
  recommendation: string;
  daysToAction: number;
  lastInspection: string;
}

// ---------------------------------------------------------------------------
// NEW: Anomaly Detection Types
// ---------------------------------------------------------------------------

export interface EnergyAnomaly {
  id: string;
  severity: AnomalySeverity;
  detectedTime: string;
  affectedZone: string;
  metric: string;
  expectedValue: number;
  actualValue: number;
  deviationPercent: number;
  possibleCause: string;
  recommendedAction: string;
}

// ---------------------------------------------------------------------------
// NEW: Renewable Energy Optimization Types
// ---------------------------------------------------------------------------

export interface RenewableState {
  solarGeneration: number;
  buildingConsumption: number;
  batterySoC: number;
  batteryCapacity: number;
  gridImport: number;
  gridExport: number;
  solarSelfConsumption: number;  // %
  solarUtilization: number;      // %
  gridDependency: number;        // %
  renewableContribution: number; // %
  recommendation: string;
}

// ---------------------------------------------------------------------------
// NEW: Grid Flexibility Types
// ---------------------------------------------------------------------------

export interface GridFlexibility {
  currentGridLoad: number;
  peakLoad: number;
  peakWindow: string;
  flexibleLoadAvailable: number;
  flexibleLoads: { name: string; power: number; shiftable: boolean }[];
  shiftedLoad: number;
  peakReduction: number;       // %
  costSaving: number;
}

// ---------------------------------------------------------------------------
// NEW: What-If Simulator Types
// ---------------------------------------------------------------------------

export interface WhatIfScenario {
  hvacOptimization: number;    // 0–30%
  lightingOptimization: number;
  occupancyControl: number;
  loadShifting: number;
  solarUtilization: number;
  batteryUsage: number;
}

export interface WhatIfResult {
  currentEnergy: number;       // kWh/day
  projectedEnergy: number;
  energyReduction: number;     // %
  currentCost: number;         // ₹/day
  projectedCost: number;
  costSaving: number;
  co2Reduction: number;        // kg/day
}

// ---------------------------------------------------------------------------
// NEW: AI Recommendation Types
// ---------------------------------------------------------------------------

export interface AIRecommendation {
  id: string;
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  urgency: 'immediate' | 'today' | 'this_week';
  savingKwh: number;
  savingCost: number;
  savingCO2: number;
  category: string;
  applied: boolean;
}

// ---------------------------------------------------------------------------
// NEW: Occupant Experience Types
// ---------------------------------------------------------------------------

export interface OccupantExperienceZone {
  zoneId: ZoneId;
  zoneName: string;
  thermalComfort: number;      // 0–100
  airQuality: number;          // 0–100
  lightingQuality: number;     // 0–100
  overallScore: number;        // 0–100
  status: ComfortStatus;
  recommendations: string[];
}

// ---------------------------------------------------------------------------
// NEW: Building Health Score Types
// ---------------------------------------------------------------------------

export interface BuildingHealthScore {
  overall: number;             // 0–100
  energyEfficiency: number;
  occupantComfort: number;
  airQuality: number;
  equipmentHealth: number;
  renewableEnergy: number;
  gridResponsiveness: number;
}

// ---------------------------------------------------------------------------
// NEW: Carbon Intelligence Types
// ---------------------------------------------------------------------------

export interface CarbonIntelligence {
  currentRate: number;         // kg CO₂/h
  dailyCO2: number;            // kg
  monthlyCO2: number;          // kg
  avoidedCO2: number;          // kg (from solar + optimization)
  annualReductionEstimate: number;
  trend: { time: string; emissions: number; avoided: number }[];
}

// ---------------------------------------------------------------------------
// NEW: Notification Types
// ---------------------------------------------------------------------------

export interface Notification {
  id: string;
  type: 'critical' | 'warning' | 'optimization' | 'info';
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
  category: 'alert' | 'anomaly' | 'equipment' | 'comfort' | 'peak' | 'ai';
}

// ---------------------------------------------------------------------------
// NEW: Demo Mode Types
// ---------------------------------------------------------------------------

export interface DemoOverrides {
  occupancyMultiplier: number;   // 0–2x
  temperatureOffset: number;     // -5 to +5 °C
  solarMultiplier: number;       // 0–2x
  gridLoadMultiplier: number;    // 0.5–1.5x
  hvacLoadMultiplier: number;    // 0.5–1.5x
}

// ---------------------------------------------------------------------------
// EXTENDED: Full Building State (includes new AI layer)
// ---------------------------------------------------------------------------

export interface BuildingState {
  timestamp: number;
  overview: BuildingOverview;
  zones: ZoneTelemetry[];
  comfort: ComfortMetrics[];
  alerts: FDDAlert[];
  demandResponse: DemandResponseState;
  energyHistory: EnergyHistoryPoint[];
  occupantVotes: Record<ZoneId, { too_cold: number; comfortable: number; too_warm: number }>;
  // NEW AI-powered fields
  aiInsights: AIInsight[];
  forecast: ForecastPoint[];
  forecastSummary: ForecastSummary;
  occupancyIntelligence: OccupancyIntelligence[];
  smartHVAC: SmartHVACZone[];
  equipmentHealth: EquipmentHealth[];
  anomalies: EnergyAnomaly[];
  renewables: RenewableState;
  gridFlexibility: GridFlexibility;
  recommendations: AIRecommendation[];
  occupantExperience: OccupantExperienceZone[];
  buildingScore: BuildingHealthScore;
  carbon: CarbonIntelligence;
  notifications: Notification[];
}
