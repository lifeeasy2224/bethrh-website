import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. ' +
    'Ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set ' +
    '(note: Vite only exposes variables prefixed with VITE_ to the browser bundle).'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  role: 'founder' | 'investor' | 'admin';
  plan: 'free' | 'pro' | 'growth' | 'accelerator' | 'builder' | 'launch' | 'family';
  onboarding_completed: boolean;
  avatar_url: string | null;
  current_streak: number;
  last_login_date: string | null;
  stress_test_completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface FounderProfile {
  id: string;
  user_id: string;
  founder_type: string;
  sectors_of_interest: string[];
  has_idea: boolean;
  city: string;
  bio: string;
}

export interface InvestorProfile {
  id: string;
  user_id: string;
  investor_type: string;
  sectors_of_interest: string[];
  check_size: string;
  is_verified: boolean;
  city: string;
  bio: string;
}

export interface LibraryIdea {
  id: string;
  slug: string;
  title: string;
  sector: string;
  emoji: string;
  tagline: string;
  problem: string;
  solution: string;
  target_market: string;
  revenue_model: string;
  why_now: string;
  biggest_challenge: string;
  best_markets: string;
  est_roi_min: number;
  est_roi_max: number;
  break_even_months: number;
  initial_investment_min: number;
  initial_investment_max: number;
  monthly_revenue_y1_min: number;
  monthly_revenue_y1_max: number;
  difficulty: 'easy' | 'medium' | 'hard';
  time_to_launch_weeks: number;
  spots_total: number;
  spots_taken: number;
  is_published: boolean;
  is_featured: boolean;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface LibraryGrab {
  id: string;
  library_idea_id: string;
  user_id: string;
  user_idea_id: string | null;
  status: 'grabbed' | 'converted' | 'abandoned';
  grabbed_at: string;
  converted_at: string | null;
}

export interface UserIdea {
  id: string;
  user_id: string;
  library_idea_id: string | null;
  title: string;
  sector: string;
  problem: string;
  solution: string;
  target_customer: string;
  stage: 'seed' | 'growing' | 'ready';
  iq_score: number;
  city: string;
  differentiator: string;
  advantage: string;
  business_name: string;
  in_marketplace: boolean;
  created_at: string;
  updated_at: string;
}

export interface ValidationEntry {
  id: string;
  user_idea_id: string;
  type: 'interview' | 'signup' | 'preorder' | 'observation';
  notes: string;
  amount: number;
  created_at: string;
}

export interface CanvasData {
  id: string;
  user_idea_id: string;
  key_partners: string;
  key_activities: string;
  value_proposition: string;
  customer_relationships: string;
  customer_segments: string;
  channels: string;
  key_resources: string;
  cost_structure: string;
  revenue_streams: string;
  monthly_revenue: number;
  monthly_costs: number;
  break_even_month: number;
  updated_at: string;
}

export interface JourneyTask {
  id: string;
  user_idea_id: string;
  week_number: number;
  task_key: string;
  completed_at: string;
}

// key = stored DB value (matches library_ideas.sector); label = Arabic display
export const SECTORS = [
  { key: 'Food & Agriculture', label: 'الغذاء والزراعة', emoji: '🌾' },
  { key: 'B2B SaaS', label: 'البرمجيات كخدمة', emoji: '💼' },
  { key: 'E-commerce', label: 'التجارة الإلكترونية', emoji: '🛒' },
  { key: 'Fintech', label: 'التقنية المالية', emoji: '💰' },
  { key: 'EdTech', label: 'تقنية التعليم', emoji: '📚' },
  { key: 'HealthTech', label: 'التقنية الصحية', emoji: '🏥' },
  { key: 'Logistics', label: 'اللوجستيات', emoji: '🚚' },
  { key: 'Services', label: 'الخدمات', emoji: '🔧' },
  { key: 'Sustainability', label: 'الاستدامة', emoji: '♻️' },
];

export function getStageInfo(stage: string) {
  switch (stage) {
    case 'seed': return { label: 'Seed', emoji: '🌱', color: '#2A8A52' };
    case 'growing': return { label: 'Growing', emoji: '🌿', color: '#1B6B3E' };
    case 'ready': return { label: 'Ready', emoji: '🍎', color: '#D4A653' };
    default: return { label: 'Seed', emoji: '🌱', color: '#2A8A52' };
  }
}

export const PLAN_LABELS: Record<string, string> = {
  free: 'مجاني',
  pro: 'برو',
  growth: 'نمو',
  accelerator: 'المسرعات',
  // legacy keys (pre-rename rows may still hold these)
  builder: 'برو',
  launch: 'نمو',
  family: 'نمو',
};

export interface ConnectionRequest {
  id: string;
  investor_id: string;
  founder_id: string;
  idea_id: string;
  message: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired' | 'cancelled';
  responded_at: string | null;
  expires_at: string;
  created_at: string;
  updated_at: string;
}

export interface Connection {
  id: string;
  investor_id: string;
  founder_id: string;
  idea_id: string;
  request_id: string | null;
  status: 'active' | 'ended';
  ended_at: string | null;
  ended_by: string | null;
  end_reason: string;
  created_at: string;
}

export interface ChatMessage {
  id: string;
  connection_id: string;
  sender_id: string;
  content: string;
  is_system_message: boolean;
  is_deleted: boolean;
  read_at: string | null;
  created_at: string;
}

export interface AppNotification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string;
  link: string;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}

export interface InvestorProfileData {
  id: string;
  user_id: string;
  investor_type: string;
  sectors_of_interest: string[];
  check_size: string;
  is_verified: boolean;
  city: string;
  state: string;
  bio: string;
  linkedin_url: string;
  value_add: string;
  created_at: string;
  updated_at: string;
}

