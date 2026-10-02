// ============================================================================
// EcoPulse 360 — AI Intelligence Engine
// Generates AI insights, energy forecasts, anomaly detection, predictive
// maintenance, occupancy intelligence, what-if analysis, and recommendations.
// All computations use correlated physics-based simulation data.
// ============================================================================

import type {
  ZoneId, ZoneTelemetry, ComfortMetrics, BuildingOverview,
  AIInsight, ForecastPoint, ForecastSummary, OccupancyIntelligence,
  SmartHVACZone, EquipmentHealth, EnergyAnomaly, RenewableState,
  GridFlexibility, WhatIfScenario, WhatIfResult, AIRecommendation,
  OccupantExperienceZone, BuildingHealthScore, CarbonIntelligence,
  Notification, DemandResponseState, HVACMode, ComfortStatus,
} from '../types/telemetry';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function clamp(v: number, min: number, max: number) { return Math.max(min, Math.min(max, v)); }
function rnd(min: number, max: number) { return min + Math.random() * (max - min); }
function round1(v: number) { return Math.round(v * 10) / 10; }
function round0(v: number) { return Math.round(v); }
let insightIdCounter = 0;

const CEA_FACTOR = 0.716; // kg CO₂/kWh
const BASE_TARIFF = 8.5;

// ============================================================================
// 1. AI ENERGY BRAIN — Insight Generation
// ============================================================================

export function generateAIInsights(
  zones: ZoneTelemetry[],
  comfort: ComfortMetrics[],
  overview: BuildingOverview,
): AIInsight[] {
  const insights: AIInsight[] = [];
  const now = Date.now();

  // --- HVAC Analysis ---
  const totalOccupancy = zones.reduce((s, z) => s + z.occupancy, 0);
  const totalCapacity = zones.reduce((s, z) => s + z.maxOccupancy, 0);
  const occRate = totalOccupancy / totalCapacity;
  // Expected HVAC = baseline * occupancy factor
  const expectedHVAC = overview.hvacTotal * (0.4 + 0.6 * occRate);
  if (overview.hvacTotal > expectedHVAC * 1.12) {
    const excess = overview.hvacTotal - expectedHVAC;
    insights.push({
      id: `ai-${++insightIdCounter}`,
      title: 'High HVAC Consumption',
      problem: `Current HVAC consumption is ${overview.hvacTotal} kW. Expected for current occupancy (${round0(occRate * 100)}%): ${round1(expectedHVAC)} kW.`,
      reason: `HVAC is running at full capacity despite ${round0(occRate * 100)}% building occupancy. Likely cause: fixed cooling schedules or setpoints not adjusted for actual load.`,
      action: 'Reduce HVAC setpoint by 1°C in low-occupancy zones. Enable occupancy-based scheduling.',
      energySaving: round1(excess * 24 * 0.35),
      costSaving: round0(excess * 24 * 0.35 * BASE_TARIFF),
      co2Reduction: round1(excess * 24 * 0.35 * CEA_FACTOR),
      confidence: clamp(round0(78 + rnd(0, 15)), 75, 96),
      severity: excess > 10 ? 'warning' : 'info',
      category: 'hvac',
      timestamp: now,
    });
  }

  // --- Per-zone analysis ---
  for (const zone of zones) {
    const c = comfort.find(x => x.zoneId === zone.zoneId);
    if (c && Math.abs(c.pmv) > 0.8) {
      insights.push({
        id: `ai-${++insightIdCounter}`,
        title: `Thermal Discomfort in ${zone.zoneName}`,
        problem: `PMV is ${c.pmv > 0 ? '+' : ''}${round1(c.pmv)} (PPD: ${round0(c.ppd)}%), outside ASHRAE 55 band.`,
        reason: c.pmv > 0 ? 'Zone temperature exceeds thermal comfort setpoint.' : 'Zone is overcooled.',
        action: c.pmv > 0 ? 'Increase airflow or optimize setpoint.' : 'Raise cooling setpoint by 1°C.',
        energySaving: c.pmv < 0 ? round1(zone.hvacPower * 0.08 * 8) : 0,
        costSaving: c.pmv < 0 ? round0(zone.hvacPower * 0.08 * 8 * BASE_TARIFF) : 0,
        co2Reduction: c.pmv < 0 ? round1(zone.hvacPower * 0.08 * 8 * CEA_FACTOR) : 0,
        confidence: 91,
        severity: Math.abs(c.pmv) > 1.2 ? 'warning' : 'info',
        category: 'hvac',
        timestamp: now,
      });
    }
    const occPct = zone.occupancy / zone.maxOccupancy;

    // Server room high power + low occupancy
    if (zone.zoneId === 'server_room' && zone.plugPower > 35) {
      insights.push({
        id: `ai-${++insightIdCounter}`,
        title: `Server Room High Power Draw`,
        problem: `Server/IT Room consuming ${round1(zone.plugPower + zone.hvacPower)} kW with occupancy ${zone.occupancy}/${zone.maxOccupancy}.`,
        reason: 'Server equipment runs continuously at near-peak load. Hot/cold aisle containment or cooling optimization may be possible.',
        action: 'Implement hot-aisle containment and raise server room setpoint from 20°C to 22°C (within ASHRAE A1 limits).',
        energySaving: round1(zone.hvacPower * 0.15 * 24),
        costSaving: round0(zone.hvacPower * 0.15 * 24 * BASE_TARIFF),
        co2Reduction: round1(zone.hvacPower * 0.15 * 24 * CEA_FACTOR),
        confidence: clamp(round0(82 + rnd(0, 10)), 80, 95),
        severity: 'info',
        category: 'equipment',
        timestamp: now,
      });
    }

    // Under-occupied zone
    if (occPct < 0.15 && zone.hvacPower > 5 && zone.zoneId !== 'server_room') {
      insights.push({
        id: `ai-${++insightIdCounter}`,
        title: `${zone.zoneName} Under-Occupied`,
        problem: `${zone.zoneName} is at ${round0(occPct * 100)}% occupancy (${zone.occupancy}/${zone.maxOccupancy}) but HVAC is drawing ${round1(zone.hvacPower)} kW.`,
        reason: 'HVAC and lighting are active for a near-empty zone. Fixed schedules are not responding to real occupancy.',
        action: `Reduce HVAC output and dim lighting in ${zone.zoneName}. Enable occupancy-based zone control.`,
        energySaving: round1(zone.hvacPower * 0.4 * 8),
        costSaving: round0(zone.hvacPower * 0.4 * 8 * BASE_TARIFF),
        co2Reduction: round1(zone.hvacPower * 0.4 * 8 * CEA_FACTOR),
        confidence: clamp(round0(85 + rnd(0, 10)), 83, 97),
        severity: 'warning',
        category: 'occupancy',
        timestamp: now,
      });
    }

    // High CO₂
    if (zone.co2 > 900) {
      insights.push({
        id: `ai-${++insightIdCounter}`,
        title: `Elevated CO₂ in ${zone.zoneName}`,
        problem: `CO₂ level at ${zone.co2} ppm (target: <800 ppm).`,
        reason: 'Insufficient fresh air ventilation relative to occupancy density.',
        action: 'Increase fresh air damper opening via Demand-Controlled Ventilation (DCV).',
        energySaving: 0,
        costSaving: 0,
        co2Reduction: 0,
        confidence: clamp(round0(90 + rnd(0, 8)), 88, 99),
        severity: zone.co2 > 1200 ? 'critical' : 'warning',
        category: 'occupancy',
        timestamp: now,
      });
    }
  }

  // --- Lighting baseline ---
  const lightBaseline = 13.3; // kW historical baseline during working hours
  if (overview.lightingTotal > lightBaseline * 1.15) {
    insights.push({
      id: `ai-${++insightIdCounter}`,
      title: 'Lighting Above Historical Baseline',
      problem: `Current lighting consumption ${round1(overview.lightingTotal)} kW exceeds baseline ${lightBaseline} kW by ${round0(((overview.lightingTotal / lightBaseline) - 1) * 100)}%.`,
      reason: 'Non-occupied areas may have lights on, or daylight harvesting is not engaged.',
      action: 'Enable daylight dimming and occupancy-based lighting control in perimeter zones.',
      energySaving: round1((overview.lightingTotal - lightBaseline) * 10),
      costSaving: round0((overview.lightingTotal - lightBaseline) * 10 * BASE_TARIFF),
      co2Reduction: round1((overview.lightingTotal - lightBaseline) * 10 * CEA_FACTOR),
      confidence: clamp(round0(80 + rnd(0, 12)), 78, 94),
      severity: 'info',
      category: 'lighting',
      timestamp: now,
    });
  }

  // --- Peak demand prediction ---
  const hour = new Date().getHours();
  if (hour < 14) {
    insights.push({
      id: `ai-${++insightIdCounter}`,
      title: 'Peak Demand Forecast',
      problem: `Peak demand expected between 14:00–17:00 based on historical patterns and today's occupancy trajectory.`,
      reason: 'Afternoon cooling load peaks due to solar heat gain on west-facing facades and post-lunch occupancy return.',
      action: 'Pre-cool building to 23°C during 12:00–13:30 (low-tariff solar window), then allow setpoint rise to 25.5°C during peak.',
      energySaving: round1(overview.totalPower * 0.12 * 3),
      costSaving: round0(overview.totalPower * 0.12 * 3 * BASE_TARIFF * 1.45),
      co2Reduction: round1(overview.totalPower * 0.12 * 3 * CEA_FACTOR),
      confidence: clamp(round0(75 + rnd(0, 15)), 72, 92),
      severity: 'info',
      category: 'grid',
      timestamp: now,
    });
  }

  return insights.slice(0, 8); // Cap at 8 insights
}

// ============================================================================
// 2. ENERGY FORECASTING
// ============================================================================

export function generateForecast(_overview: BuildingOverview, period: 'today' | 'tomorrow' | '7days'): {
  points: ForecastPoint[];
  summary: ForecastSummary;
} {
  const now = new Date();
  const currentHour = now.getHours() + now.getMinutes() / 60;
  const points: ForecastPoint[] = [];

  const hoursToGenerate = period === '7days' ? 168 : 24;
  const startHour = period === 'tomorrow' ? 0 : (period === 'today' ? 0 : 0);

  for (let i = 0; i < hoursToGenerate; i++) {
    const h = (startHour + i) % 24;
    const dayOffset = Math.floor((startHour + i) / 24);

    // Base load curve: office diurnal pattern
    const baseLoad = 45 + 75 * Math.max(0, Math.sin(((h - 6) / 16) * Math.PI)) * (h >= 6 && h <= 22 ? 1 : 0.15);
    const noise = rnd(-3, 3);
    const predicted = round1(Math.max(20, baseLoad + noise));

    // Optimized = 15-22% less during working hours
    const optimizedFactor = (h >= 8 && h <= 20) ? 0.82 : 0.95;
    const optimized = round1(predicted * optimizedFactor);

    // Peak threshold
    const peak = 130; // kW peak threshold

    // Actual only for past hours on today
    const isActual = period === 'today' && i <= currentHour;

    const timeLabel = period === '7days'
      ? `D${dayOffset + 1} ${String(h).padStart(2, '0')}:00`
      : `${String(h).padStart(2, '0')}:00`;

    points.push({
      time: timeLabel,
      hour: h,
      actual: isActual ? round1(predicted + rnd(-5, 5)) : null,
      predicted,
      optimized,
      peak,
    });
  }

  // Summary
  const dailyPoints = points.slice(0, 24);
  const peakPoint = dailyPoints.reduce((max, p) => p.predicted > max.predicted ? p : max, dailyPoints[0]);
  const totalPredicted = dailyPoints.reduce((s, p) => s + p.predicted, 0);
  const totalOptimized = dailyPoints.reduce((s, p) => s + p.optimized, 0);

  return {
    points,
    summary: {
      predictedPeak: peakPoint.predicted,
      peakTime: `${String(peakPoint.hour).padStart(2, '0')}:00`,
      expectedDaily: round0(totalPredicted),
      expectedCost: round0(totalPredicted * BASE_TARIFF),
      optimizedDaily: round0(totalOptimized),
      optimizedCost: round0(totalOptimized * BASE_TARIFF),
    },
  };
}

// ============================================================================
// 3. OCCUPANCY INTELLIGENCE
// ============================================================================

export function generateOccupancyIntelligence(zones: ZoneTelemetry[]): OccupancyIntelligence[] {
  const hour = new Date().getHours();
  return zones.map(z => {
    const pct = round1((z.occupancy / z.maxOccupancy) * 100);
    // Predict occupancy based on typical office patterns
    const predictedAt14Pct = z.zoneId === 'server_room' ? 0.05 :
      z.zoneId === 'cafeteria' ? 0.3 :
      z.zoneId === 'boardroom' ? 0.55 : 0.82;
    const predictedNextHourPct = z.zoneId === 'server_room' ? 0.05 :
      hour < 9 ? 0.6 : hour < 13 ? 0.85 : hour < 14 ? 0.4 : hour < 18 ? 0.78 : 0.1;

    let recommendation = '';
    if (pct < 15 && z.zoneId !== 'server_room') {
      recommendation = `Zone occupancy is low. HVAC and lighting can be reduced by 40% without comfort impact.`;
    } else if (predictedNextHourPct > (z.occupancy / z.maxOccupancy) + 0.3) {
      recommendation = `Expected occupancy increase in next hour. Pre-conditioning recommended to maintain comfort.`;
    } else if (pct > 80) {
      recommendation = `Zone near capacity. Monitor CO₂ levels and ensure adequate fresh air ventilation.`;
    } else {
      recommendation = `Occupancy within normal range. Continue current HVAC scheduling.`;
    }

    return {
      zoneId: z.zoneId,
      zoneName: z.zoneName,
      current: z.occupancy,
      capacity: z.maxOccupancy,
      percentage: pct,
      predictedAt14: round0(predictedAt14Pct * z.maxOccupancy),
      predictedNextHour: round0(predictedNextHourPct * z.maxOccupancy),
      hvacLoad: z.hvacPower,
      lightingLoad: z.lightingPower,
      recommendation,
    };
  });
}

// ============================================================================
// 4. SMART HVAC OPTIMIZATION
// ============================================================================

export function generateSmartHVAC(
  zones: ZoneTelemetry[],
  comfort: ComfortMetrics[],
  hvacModes: Record<ZoneId, HVACMode>,
): SmartHVACZone[] {
  return zones.map(z => {
    const c = comfort.find(x => x.zoneId === z.zoneId);
    const mode = hvacModes[z.zoneId] || 'auto';
    const pmv = c?.pmv ?? 0;

    let comfortStatus: ComfortStatus = 'Good';
    if (Math.abs(pmv) <= 0.3) comfortStatus = 'Excellent';
    else if (Math.abs(pmv) > 0.7) comfortStatus = 'Needs Attention';

    // Calculate savings based on mode
    const savingsFactor = mode === 'energy_saver' ? 0.18 : mode === 'peak_reduction' ? 0.25 : mode === 'comfort' ? 0.05 : 0.12;
    const kwhSaved = round1(z.hvacPower * savingsFactor * 10); // per day estimate
    const costSaved = round0(kwhSaved * BASE_TARIFF);
    const co2Avoided = round1(kwhSaved * CEA_FACTOR);

    // Comfort protection: if PMV outside range, flag it
    const comfortProtection = Math.abs(pmv) <= 1.0;

    return {
      zoneId: z.zoneId,
      zoneName: z.zoneName,
      temperature: z.temperature,
      setpoint: z.setpoint,
      occupancy: z.occupancy,
      maxOccupancy: z.maxOccupancy,
      hvacPower: z.hvacPower,
      comfortStatus,
      pmv,
      mode,
      savings: { kwhSaved, costSaved, co2Avoided },
      comfortProtection,
    };
  });
}

// ============================================================================
// 5. PREDICTIVE MAINTENANCE
// ============================================================================

export function generateEquipmentHealth(): EquipmentHealth[] {
  return [
    {
      id: 'ahu-01', name: 'AHU-01 (Workstations)', type: 'ahu',
      healthScore: clamp(round0(88 + rnd(-3, 3)), 80, 98),
      status: 'healthy', currentPower: round1(12.4 + rnd(-1, 1)),
      expectedPower: 11.8, predictedIssue: 'None detected',
      recommendation: 'Continue regular maintenance schedule.',
      daysToAction: 45, lastInspection: '2026-09-15',
    },
    {
      id: 'ahu-02', name: 'AHU-02 (Boardroom)', type: 'ahu',
      healthScore: clamp(round0(74 + rnd(-2, 2)), 65, 80),
      status: 'attention', currentPower: round1(5.8 + rnd(-0.5, 0.5)),
      expectedPower: 4.9, predictedIssue: 'Fan belt wear detected via vibration pattern.',
      recommendation: 'Schedule belt inspection within 14 days.',
      daysToAction: 14, lastInspection: '2026-08-20',
    },
    {
      id: 'ahu-03', name: 'AHU-03 (Cafeteria)', type: 'ahu',
      healthScore: clamp(round0(68 + rnd(-3, 3)), 58, 75),
      status: 'warning', currentPower: round1(14.8 + rnd(-0.8, 0.8)),
      expectedPower: 11.9, predictedIssue: 'Possible filter clogging or coil fouling. Efficiency degradation ~24%.',
      recommendation: 'Schedule inspection within 7 days. Check filter pressure drop and coil ΔT.',
      daysToAction: 7, lastInspection: '2026-07-25',
    },
    {
      id: 'chiller-01', name: 'Chiller Plant (Central)', type: 'chiller',
      healthScore: clamp(round0(91 + rnd(-2, 2)), 85, 98),
      status: 'healthy', currentPower: round1(38 + rnd(-2, 2)),
      expectedPower: 36, predictedIssue: 'None detected. COP within expected range.',
      recommendation: 'Condenser water treatment on schedule.',
      daysToAction: 60, lastInspection: '2026-09-01',
    },
    {
      id: 'pump-chw', name: 'CHW Pump (Primary)', type: 'pump',
      healthScore: clamp(round0(82 + rnd(-3, 3)), 75, 92),
      status: 'healthy', currentPower: round1(4.2 + rnd(-0.3, 0.3)),
      expectedPower: 4.0, predictedIssue: 'Minor seal wear detected.',
      recommendation: 'Monitor for next 30 days.',
      daysToAction: 30, lastInspection: '2026-09-10',
    },
    {
      id: 'vrf-server', name: 'VRF Unit (Server Room)', type: 'vrf',
      healthScore: clamp(round0(85 + rnd(-2, 2)), 80, 95),
      status: 'healthy', currentPower: round1(8.5 + rnd(-0.5, 0.5)),
      expectedPower: 8.0, predictedIssue: 'Refrigerant charge slightly below optimal.',
      recommendation: 'Check refrigerant level at next scheduled maintenance.',
      daysToAction: 21, lastInspection: '2026-09-05',
    },
    {
      id: 'light-ctrl', name: 'Lighting Control Panel', type: 'lighting',
      healthScore: clamp(round0(94 + rnd(-2, 2)), 88, 99),
      status: 'healthy', currentPower: round1(overview_lightingTotal_placeholder()),
      expectedPower: 13.0, predictedIssue: 'None detected.',
      recommendation: 'All circuits operating normally.',
      daysToAction: 90, lastInspection: '2026-09-20',
    },
    {
      id: 'ups-server', name: 'UPS & Server Rack', type: 'server',
      healthScore: clamp(round0(56 + rnd(-3, 3)), 45, 65),
      status: 'critical', currentPower: round1(42 + rnd(-1.5, 1.5)),
      expectedPower: 38, predictedIssue: 'UPS battery capacity degradation. Estimated 72% of rated capacity remaining.',
      recommendation: 'Replace UPS battery bank within 5 days to prevent risk of unprotected shutdown.',
      daysToAction: 5, lastInspection: '2026-08-01',
    },
  ];
}

// placeholder since we can't reference overview here
function overview_lightingTotal_placeholder(): number {
  return 13.5 + rnd(-1, 1);
}

// ============================================================================
// 6. ANOMALY DETECTION
// ============================================================================

export function generateAnomalies(zones: ZoneTelemetry[], overview: BuildingOverview): EnergyAnomaly[] {
  const anomalies: EnergyAnomaly[] = [];
  const now = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

  // Lighting anomaly
  const lightBaseline = 13.3;
  if (overview.lightingTotal > lightBaseline * 1.2) {
    anomalies.push({
      id: 'anom-1',
      severity: 'warning',
      detectedTime: now,
      affectedZone: 'Building-wide',
      metric: 'Lighting Power',
      expectedValue: lightBaseline,
      actualValue: round1(overview.lightingTotal),
      deviationPercent: round0(((overview.lightingTotal / lightBaseline) - 1) * 100),
      possibleCause: 'Non-occupied areas with lights on. Daylight harvesting sensors may be miscalibrated.',
      recommendedAction: 'Check occupancy sensors and daylight dimming controls in perimeter zones.',
    });
  }

  // Server room power anomaly
  const serverZone = zones.find(z => z.zoneId === 'server_room');
  if (serverZone && (serverZone.plugPower + serverZone.hvacPower) > 48) {
    anomalies.push({
      id: 'anom-2',
      severity: 'warning',
      detectedTime: now,
      affectedZone: 'Server / IT Room',
      metric: 'Total Power',
      expectedValue: 46,
      actualValue: round1(serverZone.plugPower + serverZone.hvacPower),
      deviationPercent: round0((((serverZone.plugPower + serverZone.hvacPower) / 46) - 1) * 100),
      possibleCause: 'Increased compute workload or cooling inefficiency.',
      recommendedAction: 'Check server utilization metrics and VRF operating efficiency.',
    });
  }

  // HVAC vs occupancy anomaly
  const workZone = zones.find(z => z.zoneId === 'workstations');
  if (workZone && workZone.occupancy < 20 && workZone.hvacPower > 20) {
    anomalies.push({
      id: 'anom-3',
      severity: 'critical',
      detectedTime: now,
      affectedZone: 'Open Workstations',
      metric: 'HVAC Power vs Occupancy',
      expectedValue: round1(workZone.hvacPower * 0.4),
      actualValue: round1(workZone.hvacPower),
      deviationPercent: round0(((workZone.hvacPower / (workZone.hvacPower * 0.4)) - 1) * 100),
      possibleCause: 'HVAC running at full capacity despite low occupancy. Occupancy sensors not integrated.',
      recommendedAction: 'Enable occupancy-based HVAC scheduling. Reduce airflow to minimum ventilation rate.',
    });
  }

  // Cafeteria humidity anomaly
  const cafeZone = zones.find(z => z.zoneId === 'cafeteria');
  if (cafeZone && cafeZone.humidity > 65) {
    anomalies.push({
      id: 'anom-4',
      severity: 'warning',
      detectedTime: now,
      affectedZone: 'Cafeteria & Atrium',
      metric: 'Relative Humidity',
      expectedValue: 55,
      actualValue: round1(cafeZone.humidity),
      deviationPercent: round0(((cafeZone.humidity / 55) - 1) * 100),
      possibleCause: 'Steam from kitchen operations or inadequate dehumidification.',
      recommendedAction: 'Increase exhaust ventilation rate and check dehumidification coil.',
    });
  }

  return anomalies;
}

// ============================================================================
// 7. RENEWABLE ENERGY OPTIMIZATION
// ============================================================================

export function generateRenewableState(overview: BuildingOverview, dr: DemandResponseState): RenewableState {
  const solar = overview.solarPV;
  const consumption = overview.totalPower;
  const solarSelf = solar > 0 ? Math.min(solar, consumption) : 0;
  const gridExport = Math.max(0, solar - consumption);
  const gridImport = overview.gridImport;

  const solarUtil = solar > 0 ? round0((solarSelf / solar) * 100) : 0;
  const gridDep = consumption > 0 ? round0((gridImport / consumption) * 100) : 100;
  const renewableContrib = consumption > 0 ? round0((solarSelf / consumption) * 100) : 0;

  const hour = new Date().getHours();
  let recommendation = '';
  if (hour >= 10 && hour <= 14 && solar > consumption * 0.5) {
    recommendation = `Solar generation expected to exceed 50% of demand. Charge battery and shift flexible loads to this period.`;
  } else if (hour >= 16 && dr.batterySoC > 40) {
    recommendation = `Discharge battery during upcoming peak tariff window (18:00–22:00) to reduce grid import costs.`;
  } else if (solar < 5) {
    recommendation = `Solar generation is low. Minimize grid import by deferring non-critical loads until next solar window.`;
  } else {
    recommendation = `Solar + battery operating normally. Continue current dispatch strategy.`;
  }

  return {
    solarGeneration: solar,
    buildingConsumption: consumption,
    batterySoC: dr.batterySoC,
    batteryCapacity: 50,
    gridImport,
    gridExport: round1(gridExport),
    solarSelfConsumption: round1(solarSelf),
    solarUtilization: solarUtil,
    gridDependency: gridDep,
    renewableContribution: renewableContrib,
    recommendation,
  };
}

// ============================================================================
// 8. GRID FLEXIBILITY
// ============================================================================

export function generateGridFlexibility(overview: BuildingOverview): GridFlexibility {
  const hour = new Date().getHours();
  const peakWindow = (hour >= 18 && hour <= 22) ? '18:00–22:00 (Active)' :
                     (hour >= 6 && hour <= 10) ? '06:00–10:00 (Active)' : '18:00–22:00 (Upcoming)';

  const flexibleLoads = [
    { name: 'HVAC Non-Critical Zones', power: round1(overview.hvacTotal * 0.25), shiftable: true },
    { name: 'EV Charging Station', power: round1(7.4 + rnd(-1, 1)), shiftable: true },
    { name: 'Water Heating System', power: round1(4.5 + rnd(-0.5, 0.5)), shiftable: true },
    { name: 'Decorative Lighting', power: round1(overview.lightingTotal * 0.3), shiftable: true },
    { name: 'Battery Charging', power: round1(5 + rnd(-1, 1)), shiftable: true },
  ];
  const flexibleTotal = round1(flexibleLoads.reduce((s, l) => s + l.power, 0));
  const shiftedLoad = round1(flexibleTotal * 0.65);
  const peakReduction = round1((shiftedLoad / overview.totalPower) * 100);

  return {
    currentGridLoad: overview.gridImport,
    peakLoad: round1(overview.totalPower * 1.15),
    peakWindow,
    flexibleLoadAvailable: flexibleTotal,
    flexibleLoads,
    shiftedLoad,
    peakReduction,
    costSaving: round0(shiftedLoad * 3 * BASE_TARIFF * 0.45), // 3 hours peak, 45% tariff premium avoided
  };
}

// ============================================================================
// 9. WHAT-IF SIMULATOR
// ============================================================================

export function calculateWhatIf(overview: BuildingOverview, scenario: WhatIfScenario): WhatIfResult {
  const currentEnergy = round0(overview.totalPower * 24 * 0.75); // daily estimate from current rate
  const currentCost = round0(currentEnergy * BASE_TARIFF);

  const hvacSaving = overview.hvacTotal * (scenario.hvacOptimization / 100) * 24;
  const lightSaving = overview.lightingTotal * (scenario.lightingOptimization / 100) * 24;
  const occSaving = (overview.hvacTotal + overview.lightingTotal) * (scenario.occupancyControl / 100) * 0.5 * 24;
  const shiftSaving = overview.totalPower * (scenario.loadShifting / 100) * 3 * 0.45; // 3 peak hours, tariff diff
  const solarGain = overview.solarPV * (scenario.solarUtilization / 100) * 6; // 6 solar hours
  const battGain = 50 * (scenario.batteryUsage / 100) * 0.8; // battery dispatch kWh

  const totalSaving = hvacSaving + lightSaving + occSaving + solarGain + battGain;
  const projectedEnergy = round0(Math.max(currentEnergy * 0.5, currentEnergy - totalSaving));
  const costSaving = round0(totalSaving * BASE_TARIFF + shiftSaving * BASE_TARIFF);
  const projectedCost = round0(Math.max(currentCost * 0.5, currentCost - costSaving));
  const energyReduction = round1(((currentEnergy - projectedEnergy) / currentEnergy) * 100);
  const co2Reduction = round1(totalSaving * CEA_FACTOR);

  return {
    currentEnergy,
    projectedEnergy,
    energyReduction,
    currentCost,
    projectedCost,
    costSaving,
    co2Reduction,
  };
}

// ============================================================================
// 10. AI RECOMMENDATION CENTER
// ============================================================================

export function generateRecommendations(
  _zones: ZoneTelemetry[],
  _overview: BuildingOverview,
  _equipment: EquipmentHealth[],
): AIRecommendation[] {
  const recs: AIRecommendation[] = [
    {
      id: 'rec-1', title: 'Optimize Server Room Cooling',
      description: 'Raise server room setpoint from 20°C to 22°C and implement hot-aisle containment.',
      impact: 'high', urgency: 'this_week',
      savingKwh: 32, savingCost: 272, savingCO2: 22.9,
      category: 'HVAC', applied: false,
    },
    {
      id: 'rec-2', title: 'Reduce Lighting in Low-Occupancy Zones',
      description: 'Enable occupancy-based dimming in workstations and corridors during off-hours.',
      impact: 'medium', urgency: 'today',
      savingKwh: 18, savingCost: 153, savingCO2: 12.9,
      category: 'Lighting', applied: false,
    },
    {
      id: 'rec-3', title: 'Shift Flexible Loads from Peak Period',
      description: 'Defer EV charging and water heating from 18:00–22:00 to overnight off-peak window.',
      impact: 'high', urgency: 'today',
      savingKwh: 26, savingCost: 320, savingCO2: 18.6,
      category: 'Grid', applied: false,
    },
    {
      id: 'rec-4', title: 'Pre-Cool Before Peak Tariff Window',
      description: 'Lower setpoint to 23°C during 12:00–14:00 solar window, then allow 25.5°C rise during peak.',
      impact: 'high', urgency: 'today',
      savingKwh: 22, savingCost: 280, savingCO2: 15.8,
      category: 'Demand Response', applied: false,
    },
    {
      id: 'rec-5', title: 'Schedule AHU-03 Maintenance',
      description: 'Filter pressure drop 24% above baseline. Schedule cleaning to restore efficiency.',
      impact: 'medium', urgency: 'this_week',
      savingKwh: 14, savingCost: 119, savingCO2: 10.0,
      category: 'Maintenance', applied: false,
    },
    {
      id: 'rec-6', title: 'Replace UPS Battery Bank',
      description: 'UPS operating at 72% capacity. Replace to prevent unprotected server shutdown risk.',
      impact: 'high', urgency: 'immediate',
      savingKwh: 5, savingCost: 43, savingCO2: 3.6,
      category: 'Equipment', applied: false,
    },
    {
      id: 'rec-7', title: 'Maximize Solar Self-Consumption',
      description: 'Shift battery charging to 10:00–14:00 solar peak to maximize rooftop PV utilization.',
      impact: 'medium', urgency: 'today',
      savingKwh: 15, savingCost: 128, savingCO2: 10.7,
      category: 'Renewables', applied: false,
    },
  ];

  // Sort by impact (high first) then urgency
  const impactOrder = { high: 0, medium: 1, low: 2 };
  const urgencyOrder = { immediate: 0, today: 1, this_week: 2 };
  recs.sort((a, b) => impactOrder[a.impact] - impactOrder[b.impact] || urgencyOrder[a.urgency] - urgencyOrder[b.urgency]);

  return recs;
}

// ============================================================================
// 11. OCCUPANT EXPERIENCE
// ============================================================================

export function generateOccupantExperience(
  zones: ZoneTelemetry[],
  comfort: ComfortMetrics[],
): OccupantExperienceZone[] {
  return zones.map(z => {
    const c = comfort.find(x => x.zoneId === z.zoneId);
    const thermalComfort = c ? clamp(round0(100 - Math.abs(c.pmv) * 25), 30, 100) : 70;
    const airQuality = z.co2 <= 600 ? 95 : z.co2 <= 800 ? 82 : z.co2 <= 1000 ? 60 : z.co2 <= 1200 ? 40 : 20;
    const lightingQuality = (z.lux >= 300 && z.lux <= 500) ? 92 : (z.lux >= 200 && z.lux <= 600) ? 72 : 45;
    const overallScore = round0(thermalComfort * 0.4 + airQuality * 0.35 + lightingQuality * 0.25);

    let status: ComfortStatus = 'Good';
    if (overallScore >= 85) status = 'Excellent';
    else if (overallScore < 65) status = 'Needs Attention';

    const recommendations: string[] = [];
    if (thermalComfort < 70) recommendations.push(`Temperature is outside preferred comfort range.`);
    if (airQuality < 60) recommendations.push(`CO₂ level elevated. Increase ventilation.`);
    if (lightingQuality < 60) recommendations.push(`Lighting level outside optimal 300–500 lux range.`);
    if (recommendations.length === 0) recommendations.push(`All parameters within comfortable range.`);

    return {
      zoneId: z.zoneId,
      zoneName: z.zoneName,
      thermalComfort,
      airQuality,
      lightingQuality,
      overallScore,
      status,
      recommendations,
    };
  });
}

// ============================================================================
// 12. BUILDING HEALTH SCORE
// ============================================================================

export function generateBuildingScore(
  overview: BuildingOverview,
  comfort: ComfortMetrics[],
  equipment: EquipmentHealth[],
  renewables: RenewableState,
  dr: DemandResponseState,
): BuildingHealthScore {
  // Energy efficiency: lower EPI = better
  const energyEfficiency = clamp(round0(100 - (overview.epi / 250) * 100), 40, 98);

  // Occupant comfort: average PMV closeness to 0
  const avgPMV = comfort.reduce((s, c) => s + Math.abs(c.pmv), 0) / comfort.length;
  const occupantComfort = clamp(round0(100 - avgPMV * 30), 40, 98);

  // Air quality: average IEQ
  const avgIEQ = comfort.reduce((s, c) => s + c.ieqScore, 0) / comfort.length;
  const airQuality = round0(avgIEQ);

  // Equipment health: average health score
  const avgEquipHealth = equipment.reduce((s, e) => s + e.healthScore, 0) / equipment.length;
  const equipmentHealth = round0(avgEquipHealth);

  // Renewable energy
  const renewableEnergy = clamp(renewables.renewableContribution + renewables.solarUtilization / 2, 20, 95);

  // Grid responsiveness
  const gridResponsiveness = dr.status !== 'idle' ? 90 : 70;

  const overall = round0(
    energyEfficiency * 0.25 +
    occupantComfort * 0.20 +
    airQuality * 0.15 +
    equipmentHealth * 0.15 +
    renewableEnergy * 0.15 +
    gridResponsiveness * 0.10
  );

  return { overall, energyEfficiency, occupantComfort, airQuality, equipmentHealth, renewableEnergy: round0(renewableEnergy), gridResponsiveness };
}

// ============================================================================
// 13. CARBON INTELLIGENCE
// ============================================================================

export function generateCarbonIntelligence(overview: BuildingOverview): CarbonIntelligence {
  const currentRate = round1(overview.gridImport * CEA_FACTOR);
  const dailyCO2 = round0(overview.todayEnergy * CEA_FACTOR);
  const monthlyCO2 = round0(dailyCO2 * 30);
  const avoidedCO2 = round0(overview.solarPV * 8 * CEA_FACTOR); // 8 solar hours average
  const annualReductionEstimate = round0((avoidedCO2 + dailyCO2 * 0.22) * 365); // solar + 22% optimization

  // Trend data (last 12 hours)
  const trend: { time: string; emissions: number; avoided: number }[] = [];
  for (let i = 12; i >= 0; i--) {
    const h = (new Date().getHours() - i + 24) % 24;
    const baseEmission = 20 + 60 * Math.max(0, Math.sin(((h - 6) / 16) * Math.PI)) * (h >= 6 && h <= 22 ? 1 : 0.2);
    trend.push({
      time: `${String(h).padStart(2, '0')}:00`,
      emissions: round1(baseEmission * CEA_FACTOR),
      avoided: round1(Math.max(0, 15 * Math.max(0, Math.sin(((h - 6) / 12) * Math.PI))) * CEA_FACTOR),
    });
  }

  return { currentRate, dailyCO2, monthlyCO2, avoidedCO2, annualReductionEstimate, trend };
}

// ============================================================================
// 14. NOTIFICATION CENTER
// ============================================================================

export function generateNotifications(
  alerts: { severity: string; title: string }[],
  anomalies: EnergyAnomaly[],
  equipment: EquipmentHealth[],
  insights: AIInsight[],
): Notification[] {
  const notifs: Notification[] = [];
  let nid = 0;
  const now = Date.now();

  // From FDD alerts
  for (const a of alerts.slice(0, 3)) {
    notifs.push({
      id: `notif-${++nid}`, type: a.severity === 'critical' ? 'critical' : 'warning',
      title: a.title, message: `Fault detected. Requires attention.`,
      timestamp: now - nid * 60000, read: false, category: 'alert',
    });
  }

  // From anomalies
  for (const a of anomalies.slice(0, 2)) {
    notifs.push({
      id: `notif-${++nid}`, type: a.severity === 'critical' ? 'critical' : 'warning',
      title: `Energy Anomaly: ${a.metric}`, message: a.possibleCause,
      timestamp: now - nid * 120000, read: false, category: 'anomaly',
    });
  }

  // Equipment warnings
  for (const e of equipment.filter(e => e.status === 'critical' || e.status === 'warning').slice(0, 2)) {
    notifs.push({
      id: `notif-${++nid}`, type: e.status === 'critical' ? 'critical' : 'warning',
      title: `${e.name}: ${e.status}`, message: e.predictedIssue,
      timestamp: now - nid * 180000, read: false, category: 'equipment',
    });
  }

  // AI optimization recommendations
  for (const i of insights.filter(x => x.category === 'grid' || x.category === 'solar').slice(0, 2)) {
    notifs.push({
      id: `notif-${++nid}`, type: 'optimization',
      title: i.title, message: i.action,
      timestamp: now - nid * 300000, read: false, category: 'ai',
    });
  }

  // Peak demand alert
  const hour = new Date().getHours();
  if (hour < 15) {
    notifs.push({
      id: `notif-${++nid}`, type: 'warning',
      title: 'Peak Demand Expected at 15:00', message: 'Automated pre-cooling recommended.',
      timestamp: now - 600000, read: false, category: 'peak',
    });
  }

  return notifs.sort((a, b) => {
    const priority = { critical: 0, warning: 1, optimization: 2, info: 3 };
    return priority[a.type] - priority[b.type];
  });
}
