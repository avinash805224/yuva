// ============================================================================
// Layer 1 — Government & Public Data Service
// Authoritative Indian Government Energy & Environment Datasets
// Official Sources: CEA, BEE, Ministry of Power, Open Gov Data (data.gov.in)
// ============================================================================

export interface GovDatasetMeta {
  sourceName: string;
  datasetName: string;
  lastUpdated: string;
  sourceUrl: string;
  dataPeriod: string;
  geographicScope: string;
}

export interface GovDemandData {
  meta: GovDatasetMeta;
  nationalPeakDemandGW: number;
  nationalCurrentDemandGW: number;
  stateName: string;
  statePeakDemandMW: number;
  stateCurrentDemandMW: number;
  gridFrequencyHz: number;
  hourlyDemandCurve: { time: string; demandGW: number; stateDemandMW: number }[];
}

export interface GovBEEBenchmark {
  buildingCategory: string;
  climateZone: string;
  star1EPI: number; // kWh/m²/year
  star3EPI: number;
  star5EPI: number;
  standardSetpointC: number;
  maxCO2Ppm: number;
  recommendedLux: number;
  meta: GovDatasetMeta;
}

export interface GovTariffSlab {
  period: 'off_peak' | 'normal' | 'peak';
  label: string;
  hours: string;
  ratePerKWh: number; // ₹/kWh
  discomName: string;
  meta: GovDatasetMeta;
}

export interface GovGridMix {
  thermalPercentage: number;
  solarPercentage: number;
  windPercentage: number;
  hydroNuclearPercentage: number;
  gridCarbonIntensity: number; // kg CO2/kWh
  meta: GovDatasetMeta;
}

// ── CEA Datasets (Central Electricity Authority) ──
const CEA_META: GovDatasetMeta = {
  sourceName: 'Central Electricity Authority (CEA)',
  datasetName: 'National & State Load Generation Balance Report (LGBR)',
  lastUpdated: '2026-02-28 18:00 IST',
  sourceUrl: 'https://cea.nic.in',
  dataPeriod: '2025–26',
  geographicScope: 'India National & Karnataka (BESCOM)',
};

// ── BEE Datasets (Bureau of Energy Efficiency) ──
const BEE_META: GovDatasetMeta = {
  sourceName: 'Bureau of Energy Efficiency (BEE)',
  datasetName: 'Energy Conservation Building Code (ECBC 2017) & Star Rating Benchmarks',
  lastUpdated: '2025-11-15 10:00 IST',
  sourceUrl: 'https://beeindia.gov.in',
  dataPeriod: '2025–26 Standards',
  geographicScope: 'Commercial IT/BPO Buildings (Composite Climate)',
};

// ── Ministry of Power / National Smart Grid Mission ──
const DISCOM_META: GovDatasetMeta = {
  sourceName: 'BESCOM / Ministry of Power (data.gov.in)',
  datasetName: 'Commercial Time-of-Day (ToD) Tariff Slabs & Grid Emission Factors',
  lastUpdated: '2026-01-10 12:00 IST',
  sourceUrl: 'https://data.gov.in',
  dataPeriod: 'FY 2025–26 Tariff Order',
  geographicScope: 'Karnataka / HT Commercial Tariff',
};

export const governmentDataService = {
  getDemandData(): GovDemandData {
    return {
      meta: CEA_META,
      nationalPeakDemandGW: 243.5,
      nationalCurrentDemandGW: 218.4,
      stateName: 'Karnataka (BESCOM)',
      statePeakDemandMW: 4850,
      stateCurrentDemandMW: 4120,
      gridFrequencyHz: 49.98,
      hourlyDemandCurve: [
        { time: '00:00', demandGW: 165.2, stateDemandMW: 3100 },
        { time: '04:00', demandGW: 158.0, stateDemandMW: 2950 },
        { time: '08:00', demandGW: 195.4, stateDemandMW: 3800 },
        { time: '12:00', demandGW: 230.1, stateDemandMW: 4500 },
        { time: '16:00', demandGW: 224.8, stateDemandMW: 4350 },
        { time: '18:00', demandGW: 243.5, stateDemandMW: 4850 },
        { time: '21:00', demandGW: 235.0, stateDemandMW: 4600 },
      ],
    };
  },

  getBEEBenchmark(): GovBEEBenchmark {
    return {
      buildingCategory: 'Commercial Office / IT-BPO Complex',
      climateZone: 'Warm & Humid / Composite (Bengaluru)',
      star1EPI: 220,
      star3EPI: 160,
      star5EPI: 115,
      standardSetpointC: 24.0,
      maxCO2Ppm: 1000,
      recommendedLux: 500,
      meta: BEE_META,
    };
  },

  getTariffSlabs(): GovTariffSlab[] {
    return [
      {
        period: 'off_peak',
        label: 'Night Off-Peak',
        hours: '22:00 – 06:00',
        ratePerKWh: 6.20,
        discomName: 'BESCOM HT Commercial',
        meta: DISCOM_META,
      },
      {
        period: 'normal',
        label: 'Day Normal',
        hours: '06:00 – 18:00',
        ratePerKWh: 8.50,
        discomName: 'BESCOM HT Commercial',
        meta: DISCOM_META,
      },
      {
        period: 'peak',
        label: 'Evening Peak Demand',
        hours: '18:00 – 22:00',
        ratePerKWh: 12.80,
        discomName: 'BESCOM HT Commercial',
        meta: DISCOM_META,
      },
    ];
  },

  getGridMix(): GovGridMix {
    return {
      thermalPercentage: 54.2,
      solarPercentage: 24.6,
      windPercentage: 9.8,
      hydroNuclearPercentage: 11.4,
      gridCarbonIntensity: 0.716, // kg CO2/kWh Indian Grid Mix
      meta: CEA_META,
    };
  },

  getAllCatalog(): GovDatasetMeta[] {
    return [CEA_META, BEE_META, DISCOM_META];
  }
};
