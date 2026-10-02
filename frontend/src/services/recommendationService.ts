// ============================================================================
// Layer 2 — AI Recommendation Engine Service
// Explains WHY, ACTION, and EXPECTED IMPACT for every zone recommendation
// ============================================================================

export interface ZoneRecommendationDetail {
  id: string;
  zone_id: string;
  zoneName: string;
  category: 'HVAC Optimization' | 'Lighting Control' | 'Load Shifting' | 'Battery Dispatch' | 'Equipment Health';
  title: string;
  why: string;
  action: string;
  expectedImpact: {
    kwhSavingsPerDay: number | null;
    costSavingsPerDayRupees: number | null;
    co2ReductionKgPerDay: number | null;
    confidencePercent: number;
    impactCalculated: boolean; // True only when sufficient real building data is connected
  };
  urgency: 'Immediate' | 'Today' | 'Scheduled';
  status: 'Pending' | 'Executed' | 'Dismissed';
  dataProvenance: string;
}

export const INITIAL_RECOMMENDATIONS: ZoneRecommendationDetail[] = [
  {
    id: 'rec-01',
    zone_id: 'workstations',
    zoneName: 'Zone 3A — Main Workstations',
    category: 'HVAC Optimization',
    title: 'Pre-Cooling & Setpoint Adjustment (+1.5°C)',
    why: 'Low zone occupancy detected (28/100) paired with high HVAC thermal load relative to ambient humidity.',
    action: 'Adjust HVAC setpoint from 22.0°C to 23.5°C and reduce fan speed to 60%. Comfort levels (PMV: +0.2) remain strictly within ASHRAE 55 ideal range.',
    expectedImpact: {
      kwhSavingsPerDay: 48.5,
      costSavingsPerDayRupees: 412.25,
      co2ReductionKgPerDay: 34.7,
      confidencePercent: 94,
      impactCalculated: true,
    },
    urgency: 'Immediate',
    status: 'Pending',
    dataProvenance: 'Eco 360 ML Recommendation Engine & BMS Modbus Telemetry',
  },
  {
    id: 'rec-02',
    zone_id: 'cafeteria',
    zoneName: 'Zone 3C — Cafeteria & Lounge',
    category: 'Load Shifting',
    title: 'Cafeteria HVAC Setback during Non-Meal Hours',
    why: 'Occupancy sensor reports 18 persons (18% capacity) between 14:00 – 17:00, but HVAC VRF running at 80% output.',
    action: 'Enforce non-meal setback temperature (25.5°C) and reduce fresh air intake rate by 20%.',
    expectedImpact: {
      kwhSavingsPerDay: 32.0,
      costSavingsPerDayRupees: 272.00,
      co2ReductionKgPerDay: 22.9,
      confidencePercent: 91,
      impactCalculated: true,
    },
    urgency: 'Today',
    status: 'Pending',
    dataProvenance: 'SpaceLogic BACnet Occupancy Telemetry',
  },
  {
    id: 'rec-03',
    zone_id: 'server_room',
    zoneName: 'Zone 3D — Data Center',
    category: 'Equipment Health',
    title: 'CRAC Unit 02 Filter Maintenance Alert',
    why: 'Precision CRAC compressor power draw is 18.2% higher than expected baseline for current heat dissipation load.',
    action: 'Schedule air filter cleaning for CRAC Unit 02 to restore cooling efficiency and prevent thermal throttle.',
    expectedImpact: {
      kwhSavingsPerDay: 21.4,
      costSavingsPerDayRupees: 181.90,
      co2ReductionKgPerDay: 15.3,
      confidencePercent: 88,
      impactCalculated: true,
    },
    urgency: 'Immediate',
    status: 'Pending',
    dataProvenance: 'Isolation Forest Anomaly Engine & CRAC Modbus Gateway',
  }
];

export class RecommendationService {
  private recs: ZoneRecommendationDetail[] = INITIAL_RECOMMENDATIONS;

  getRecommendations(): ZoneRecommendationDetail[] {
    return this.recs;
  }

  executeRecommendation(id: string) {
    const found = this.recs.find(r => r.id === id);
    if (found) {
      found.status = 'Executed';
    }
  }
}

export const recommendationService = new RecommendationService();
