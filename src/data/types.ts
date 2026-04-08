export interface IndustryConfig {
  industry: string;
  labels: Record<string, string>;
  fields: FieldConfig[];
  features: Record<string, boolean>;
  workflows: WorkflowConfig[];
  kpis: KPIConfig[];
  spatialConfig?: SpatialConfig;
}

export interface FieldConfig {
  key: string;
  label: string;
  type: string;
  required?: boolean;
}

export interface WorkflowConfig {
  key: string;
  label: string;
  steps: string[];
}

export interface KPIConfig {
  key: string;
  label: string;
  format: 'percent' | 'number' | 'currency';
}

export interface SpatialConfig {
  enabled: boolean;
}

export interface Campaign {
  id: string;
  workspace_id: string;
  industry: string;
  name: string;
  type: string;
  channel: string;
  status: string;
  audience_filter: Record<string, unknown>;
  message_template: string;
  subject?: string;
  schedule: Record<string, unknown>;
  total_sent: number;
  total_opened: number;
  total_responded: number;
  total_converted: number;
  created_at: string;
}

export interface CommMessage {
  id: string;
  campaign_id: string;
  workspace_id: string;
  person_id: string;
  person_name: string;
  channel: string;
  direction: string;
  content: string;
  subject?: string;
  status: string;
  sent_at?: string;
  opened_at?: string;
  replied_at?: string;
  outcome?: string;
  notes?: string;
  created_at: string;
}

export interface CommTemplate {
  id: string;
  workspace_id: string;
  name: string;
  category: string;
  channel: string;
  subject?: string;
  body: string;
  is_active: boolean;
  created_at: string;
}

export interface ReviewTracking {
  id: string;
  workspace_id: string;
  person_id: string;
  person_name?: string;
  platform: string;
  requested_at?: string;
  completed_at?: string;
  rating?: number;
  review_text?: string;
  review_url?: string;
  response_text?: string;
  responded_at?: string;
  status: string;
  created_at: string;
}
