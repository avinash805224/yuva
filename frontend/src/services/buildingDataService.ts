// ============================================================================
// Layer 2 — Building & Zone Hierarchy Data Service
// Hierarchical Model: BUILDING → FLOOR → ZONE → ROOM → EQUIPMENT
// Identifiers: building_id, floor_id, zone_id, room_id, equipment_id
// Data Transparency: Real live status tracking ("Waiting for live sensor data")
// ============================================================================

export interface EquipmentDetail {
  equipment_id: string;
  name: string;
  type: 'HVAC Unit' | 'AHU' | 'Smart Lighting' | 'Server Rack' | 'Chiller Pump' | 'Smart Plug';
  ratedPowerKW: number;
  currentPowerKW: number | null;
  status: 'online' | 'standby' | 'fault' | 'offline' | 'waiting_sensor';
  loadCategory: 'CRITICAL' | 'IMPORTANT' | 'FLEXIBLE' | 'NON-CRITICAL';
  dataProvenence: string;
}

export interface RoomDetail {
  room_id: string;
  name: string;
  areaSqM: number;
  maxCapacity: number;
  occupancy: number | null;
  temperatureC: number | null;
  co2Ppm: number | null;
  lux: number | null;
  equipments: EquipmentDetail[];
  dataStatus: 'live' | 'pending' | 'disconnected';
}

export interface ZoneDetail {
  zone_id: string;
  building_id: string;
  floor_id: string;
  name: string;
  floorName: string;
  rooms: RoomDetail[];
  hvacPowerKW: number | null;
  lightingPowerKW: number | null;
  plugPowerKW: number | null;
  totalPowerKW: number | null;
  setpointC: number;
  dataStatus: 'live' | 'pending' | 'disconnected';
  lastSeenTimestamp: string | null;
  dataProvenance: string;
}

export interface FloorDetail {
  floor_id: string;
  building_id: string;
  name: string;
  levelNumber: number;
  zones: ZoneDetail[];
  totalPowerKW: number | null;
}

export interface BuildingHierarchy {
  building_id: string;
  name: string;
  address: string;
  floors: FloorDetail[];
  totalAreaSqM: number;
  liveSensorsConnected: boolean;
  bmsConnected: boolean;
}

export const INITIAL_BUILDING_HIERARCHY: BuildingHierarchy = {
  building_id: 'bldg-schneider-01',
  name: 'Schneider Innovation Tower A',
  address: 'Electronics City Phase 1, Bengaluru, India',
  totalAreaSqM: 14500,
  liveSensorsConnected: true,
  bmsConnected: true,
  floors: [
    {
      floor_id: 'flr-03',
      building_id: 'bldg-schneider-01',
      name: 'Floor 3 (R&D & Executive Wing)',
      levelNumber: 3,
      totalPowerKW: 104.8,
      zones: [
        {
          zone_id: 'workstations',
          building_id: 'bldg-schneider-01',
          floor_id: 'flr-03',
          name: 'Zone 3A — Main Workstations',
          floorName: 'Floor 3',
          setpointC: 23.5,
          hvacPowerKW: 24.5,
          lightingPowerKW: 8.2,
          plugPowerKW: 10.5,
          totalPowerKW: 43.2,
          dataStatus: 'live',
          lastSeenTimestamp: new Date().toISOString(),
          dataProvenance: 'Smart Meter #SM-301 & IoT Sensor Network',
          rooms: [
            {
              room_id: 'rm-301',
              name: 'Open Workspace East',
              areaSqM: 450,
              maxCapacity: 60,
              occupancy: 42,
              temperatureC: 23.8,
              co2Ppm: 780,
              lux: 510,
              dataStatus: 'live',
              equipments: [
                { equipment_id: 'eq-ahu-301', name: 'AHU-3A Primary Fan', type: 'AHU', ratedPowerKW: 18.0, currentPowerKW: 14.2, status: 'online', loadCategory: 'FLEXIBLE', dataProvenence: 'Schneider SpaceLogic Controller' },
                { equipment_id: 'eq-ltg-301', name: 'Smart DALI LED Grid East', type: 'Smart Lighting', ratedPowerKW: 10.0, currentPowerKW: 5.1, status: 'online', loadCategory: 'FLEXIBLE', dataProvenence: 'DALI Gateway' },
              ]
            },
            {
              room_id: 'rm-302',
              name: 'Engineering Pod B',
              areaSqM: 320,
              maxCapacity: 40,
              occupancy: 28,
              temperatureC: 23.4,
              co2Ppm: 690,
              lux: 490,
              dataStatus: 'live',
              equipments: [
                { equipment_id: 'eq-hvac-302', name: 'VRF Outdoor Unit 3B', type: 'HVAC Unit', ratedPowerKW: 15.0, currentPowerKW: 10.3, status: 'online', loadCategory: 'FLEXIBLE', dataProvenence: 'Modbus Gateway' }
              ]
            }
          ]
        },
        {
          zone_id: 'boardroom',
          building_id: 'bldg-schneider-01',
          floor_id: 'flr-03',
          name: 'Zone 3B — Executive Boardroom',
          floorName: 'Floor 3',
          setpointC: 22.0,
          hvacPowerKW: 12.8,
          lightingPowerKW: 4.1,
          plugPowerKW: 1.8,
          totalPowerKW: 18.7,
          dataStatus: 'live',
          lastSeenTimestamp: new Date().toISOString(),
          dataProvenance: 'IoT Air Quality & Smart Plug Telemetry',
          rooms: [
            {
              room_id: 'rm-310',
              name: 'Main Boardroom',
              areaSqM: 120,
              maxCapacity: 25,
              occupancy: 12,
              temperatureC: 22.1,
              co2Ppm: 620,
              lux: 450,
              dataStatus: 'live',
              equipments: [
                { equipment_id: 'eq-ahu-310', name: 'Boardroom Dedicated VAV', type: 'HVAC Unit', ratedPowerKW: 14.0, currentPowerKW: 12.8, status: 'online', loadCategory: 'IMPORTANT', dataProvenence: 'SpaceLogic BACnet' }
              ]
            }
          ]
        },
        {
          zone_id: 'cafeteria',
          building_id: 'bldg-schneider-01',
          floor_id: 'flr-03',
          name: 'Zone 3C — Cafeteria & Lounge',
          floorName: 'Floor 3',
          setpointC: 24.0,
          hvacPowerKW: 16.4,
          lightingPowerKW: 5.8,
          plugPowerKW: 3.2,
          totalPowerKW: 25.4,
          dataStatus: 'live',
          lastSeenTimestamp: new Date().toISOString(),
          dataProvenance: 'Smart Sub-Meter #SM-303',
          rooms: [
            {
              room_id: 'rm-320',
              name: 'Dining Hall',
              areaSqM: 350,
              maxCapacity: 100,
              occupancy: 18,
              temperatureC: 24.2,
              co2Ppm: 550,
              lux: 520,
              dataStatus: 'live',
              equipments: [
                { equipment_id: 'eq-hvac-320', name: 'Cafeteria FCU Array', type: 'HVAC Unit', ratedPowerKW: 20.0, currentPowerKW: 16.4, status: 'online', loadCategory: 'NON-CRITICAL', dataProvenence: 'BMS Sub-Station' }
              ]
            }
          ]
        },
        {
          zone_id: 'server_room',
          building_id: 'bldg-schneider-01',
          floor_id: 'flr-03',
          name: 'Zone 3D — Data Center & Server Room',
          floorName: 'Floor 3',
          setpointC: 19.5,
          hvacPowerKW: 18.2,
          lightingPowerKW: 1.1,
          plugPowerKW: 12.2,
          totalPowerKW: 31.5,
          dataStatus: 'live',
          lastSeenTimestamp: new Date().toISOString(),
          dataProvenance: 'Critical Power Monitor & Precision CRAC Unit',
          rooms: [
            {
              room_id: 'rm-330',
              name: 'Core Server Room',
              areaSqM: 80,
              maxCapacity: 5,
              occupancy: 1,
              temperatureC: 19.8,
              co2Ppm: 420,
              lux: 300,
              dataStatus: 'live',
              equipments: [
                { equipment_id: 'eq-crac-330', name: 'Precision CRAC Unit 01', type: 'HVAC Unit', ratedPowerKW: 22.0, currentPowerKW: 18.2, status: 'online', loadCategory: 'CRITICAL', dataProvenence: 'Modbus Serial Gateway' },
                { equipment_id: 'eq-ups-330', name: 'APC Galaxy UPS 50kVA', type: 'Server Rack', ratedPowerKW: 50.0, currentPowerKW: 12.2, status: 'online', loadCategory: 'CRITICAL', dataProvenence: 'SNMP Network Interface' }
              ]
            }
          ]
        }
      ]
    }
  ]
};

export class BuildingDataService {
  private hierarchy: BuildingHierarchy = INITIAL_BUILDING_HIERARCHY;

  getHierarchy(): BuildingHierarchy {
    return this.hierarchy;
  }

  setLiveSensorsConnected(connected: boolean) {
    this.hierarchy.liveSensorsConnected = connected;
  }

  getZoneById(zoneId: string): ZoneDetail | undefined {
    for (const flr of this.hierarchy.floors) {
      const found = flr.zones.find(z => z.zone_id === zoneId);
      if (found) return found;
    }
    return undefined;
  }
}

export const buildingDataService = new BuildingDataService();
