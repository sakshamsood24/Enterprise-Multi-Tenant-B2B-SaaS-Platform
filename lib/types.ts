export type TenantRole = "owner" | "admin" | "operator" | "viewer";
export type SubscriptionTier = "free" | "growth" | "enterprise";
export type SubscriptionStatus = "trialing" | "active" | "past_due" | "canceled";

export type TenantContext = {
  userId: string;
  tenantId: string;
  role: TenantRole;
  subscriptionTier: SubscriptionTier;
  subscriptionStatus: SubscriptionStatus;
};

export type Database = {
  public: {
    Tables: {
      assets: {
        Row: {
          id: string;
          tenant_id: string;
          vendor_id: string | null;
          name: string;
          serial_number: string | null;
          status: "available" | "assigned" | "maintenance" | "retired";
          replacement_value_cents: number;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          tenant_id: string;
          vendor_id?: string | null;
          name: string;
          serial_number?: string | null;
          status?: "available" | "assigned" | "maintenance" | "retired";
          replacement_value_cents?: number;
          created_by?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["assets"]["Insert"]>;
      };
      vendors: {
        Row: {
          id: string;
          tenant_id: string;
          name: string;
          category: string;
          risk_score: number;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          tenant_id: string;
          name: string;
          category: string;
          risk_score?: number;
          created_by?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["vendors"]["Insert"]>;
      };
      audit_events: {
        Row: {
          id: number;
          tenant_id: string;
          actor_id: string | null;
          event_name: string;
          entity_table: string;
          entity_id: string | null;
          metadata: Record<string, unknown>;
          created_at: string;
        };
        Insert: {
          tenant_id: string;
          actor_id?: string | null;
          event_name: string;
          entity_table: string;
          entity_id?: string | null;
          metadata?: Record<string, unknown>;
        };
        Update: never;
      };
    };
  };
};
