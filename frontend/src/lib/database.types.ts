// ============================================================================
// EcoPulse 360 — Supabase Database Type Definitions
// Auto-generated type mapping for the EcoPulse 360 schema
// ============================================================================

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          role: 'admin' | 'manager' | 'operator' | 'viewer';
          building_id: string;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>;
        Relationships: [];
      };
      zones: {
        Row: {
          id: string;
          name: string;
          area_m2: number;
          max_occupancy: number;
          base_plug_kw: number;
          base_light_kw: number;
          floor: number;
          building_id: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['zones']['Row'], 'created_at'>;
        Update: Partial<Database['public']['Tables']['zones']['Insert']>;
        Relationships: [];
      };
      telemetry: {
        Row: {
          id: string;
          zone_id: string;
          timestamp: string;
          temperature: number | null;
          humidity: number | null;
          co2: number | null;
          pm25: number | null;
          lux: number | null;
          occupancy: number | null;
          hvac_power: number | null;
          lighting_power: number | null;
          plug_power: number | null;
          setpoint: number | null;
          pmv: number | null;
          ppd: number | null;
          ieq_score: number | null;
        };
        Insert: Omit<Database['public']['Tables']['telemetry']['Row'], 'id'>;
        Update: Partial<Database['public']['Tables']['telemetry']['Insert']>;
        Relationships: [];
      };
      building_snapshots: {
        Row: {
          id: string;
          timestamp: string;
          total_power: number | null;
          today_energy: number | null;
          today_cost: number | null;
          carbon_rate: number | null;
          bee_star_rating: number | null;
          epi: number | null;
          hvac_total: number | null;
          lighting_total: number | null;
          plug_total: number | null;
          solar_pv: number | null;
          grid_import: number | null;
          battery_soc: number | null;
          building_score: number | null;
        };
        Insert: Omit<Database['public']['Tables']['building_snapshots']['Row'], 'id'>;
        Update: Partial<Database['public']['Tables']['building_snapshots']['Insert']>;
        Relationships: [];
      };
      occupant_votes: {
        Row: {
          id: string;
          zone_id: string;
          vote: 'too_cold' | 'comfortable' | 'too_warm';
          user_id: string | null;
          timestamp: string;
        };
        Insert: Omit<Database['public']['Tables']['occupant_votes']['Row'], 'id' | 'timestamp'>;
        Update: Partial<Database['public']['Tables']['occupant_votes']['Insert']>;
        Relationships: [];
      };
      alerts: {
        Row: {
          id: string;
          timestamp: string;
          severity: 'critical' | 'warning' | 'info';
          type: 'fdd' | 'anomaly' | 'equipment' | 'comfort' | 'peak' | 'ai';
          equipment: string | null;
          title: string;
          description: string | null;
          energy_bleed: number;
          cost_bleed: number;
          zone_id: string | null;
          acknowledged: boolean;
          acknowledged_by: string | null;
          acknowledged_at: string | null;
          resolved: boolean;
        };
        Insert: Omit<Database['public']['Tables']['alerts']['Row'], 'id' | 'timestamp'>;
        Update: Partial<Database['public']['Tables']['alerts']['Insert']>;
        Relationships: [];
      };
      recommendations: {
        Row: {
          id: string;
          timestamp: string;
          title: string;
          description: string | null;
          impact: 'high' | 'medium' | 'low';
          urgency: 'immediate' | 'today' | 'this_week';
          category: string | null;
          saving_kwh: number;
          saving_cost: number;
          saving_co2: number;
          applied: boolean;
          applied_by: string | null;
          applied_at: string | null;
        };
        Insert: Omit<Database['public']['Tables']['recommendations']['Row'], 'id' | 'timestamp'>;
        Update: Partial<Database['public']['Tables']['recommendations']['Insert']>;
        Relationships: [];
      };
      equipment: {
        Row: {
          id: string;
          name: string;
          type: string;
          health_score: number;
          status: 'healthy' | 'attention' | 'warning' | 'critical';
          current_power: number | null;
          expected_power: number | null;
          predicted_issue: string | null;
          recommendation: string | null;
          days_to_action: number;
          last_inspection: string | null;
          updated_at: string;
        };
        Insert: Database['public']['Tables']['equipment']['Row'];
        Update: Partial<Database['public']['Tables']['equipment']['Insert']>;
        Relationships: [];
      };
      energy_forecasts: {
        Row: {
          id: string;
          generated_at: string;
          forecast_date: string;
          hour: number;
          predicted_kw: number | null;
          optimized_kw: number | null;
          actual_kw: number | null;
          peak_threshold: number;
        };
        Insert: Omit<Database['public']['Tables']['energy_forecasts']['Row'], 'id' | 'generated_at'>;
        Update: Partial<Database['public']['Tables']['energy_forecasts']['Insert']>;
        Relationships: [];
      };
      hvac_modes: {
        Row: {
          zone_id: string;
          mode: 'auto' | 'comfort' | 'energy_saver' | 'peak_reduction';
          set_by: string | null;
          updated_at: string;
        };
        Insert: Database['public']['Tables']['hvac_modes']['Row'];
        Update: Partial<Database['public']['Tables']['hvac_modes']['Insert']>;
        Relationships: [];
      };
      dr_events: {
        Row: {
          id: string;
          status: 'idle' | 'pre_cooling' | 'peak_active' | 'recovery';
          triggered_at: string;
          triggered_by: string | null;
          target_grid_draw: number;
          curtailment_kw: number;
          savings_rupees: number;
          ended_at: string | null;
          notes: string | null;
        };
        Insert: Omit<Database['public']['Tables']['dr_events']['Row'], 'id'>;
        Update: Partial<Database['public']['Tables']['dr_events']['Insert']>;
        Relationships: [];
      };
      audit_log: {
        Row: {
          id: string;
          timestamp: string;
          user_id: string | null;
          action: string;
          entity_type: string | null;
          entity_id: string | null;
          details: Record<string, unknown> | null;
          ip_address: string | null;
        };
        Insert: Omit<Database['public']['Tables']['audit_log']['Row'], 'id' | 'timestamp'>;
        Update: Partial<Database['public']['Tables']['audit_log']['Insert']>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
