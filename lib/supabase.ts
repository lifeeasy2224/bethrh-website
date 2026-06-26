import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type User = {
  id: string;
  phone: string | null;
  name: string | null;
  country: string;
  skills: string[] | null;
  role: 'user' | 'admin' | 'investor';
  bio: string | null;
  linkedin_url: string | null;
  sector: string | null;
  goal: string | null;
  created_at: string;
  investor_preferences: {
    preferred_sectors: string[];
    check_size: string;
    preferred_stage: string;
    value_add: string;
  } | null;
};

export type Idea = {
  id: string;
  user_id: string;
  title: string | null;
  description: string | null;
  sector: string | null;
  validation_score: number;
  stage: string;
  week: number;
  created_at: string;
  committed_at: string | null;
  committed_user_id: string | null;
};

export type ValidationLog = {
  id: string;
  idea_id: string;
  interviews: number;
  signups: number;
  preorders_usd: number;
  notes: string | null;
  created_at: string;
};

export type AiChat = {
  id: string;
  user_id: string;
  role: 'user' | 'assistant';
  message: string;
  created_at: string;
};

export type Pod = {
  id: string;
  name: string;
  created_at: string;
};

export type PodMember = {
  pod_id: string;
  user_id: string;
  streak: number;
};

export type Task = {
  id: string;
  idea_id: string;
  user_id: string;
  title: string;
  week: number;
  status: 'todo' | 'done';
  notes?: string | null;
  created_at: string;
};

export type IdeaScore = {
  id: string;
  idea_id: string;
  user_id: string;
  total_score: number;
  value_score: number;
  market_score: number;
  validation_score: number;
  feasibility_score: number;
  pitch_score: number;
  journey_score: number;
  benchmark_sector: string;
  benchmark_country: string;
  benchmark_avg: number;
  recommendations: string[];
  gpt_summary: string;
  version: number;
  created_at: string;
};

export type FounderProgress = {
  id: string;
  user_id: string;
  current_stage: 'seed' | 'sprout' | 'root' | 'stem' | 'pitch' | 'branch' | 'fruit';
  stage_1_done: boolean;
  stage_2_score: number;
  stage_3_tasks_done: number;
  stage_4_first_customer: boolean;
  badges: string[];
  updated_at: string;
};

export const JOURNEY_STAGES = ['seed', 'sprout', 'root', 'stem', 'pitch', 'branch', 'fruit'] as const;
export type JourneyStage = typeof JOURNEY_STAGES[number];

export const SECTORS = [
  // التكنولوجيا
  'FinTech',
  'EdTech',
  'HealthTech',
  'AgriTech',
  'LogisticsTech',
  'PropTech',
  'LegalTech',
  'HRTech',
  'CleanTech',
  'FoodTech',
  // التجارة والخدمات
  'E-Commerce',
  'Retail',
  'Food & Beverage',
  'Fashion & Apparel',
  'Beauty & Wellness',
  'Tourism & Hospitality',
  'Events & Entertainment',
  'Media & Content',
  'Advertising & Marketing',
  // الرعاية والتعليم
  'Healthcare & Clinics',
  'Education & Training',
  'Childcare & Family',
  'Social Impact',
  // الصناعة والزراعة
  'Agriculture & Farming',
  'Food Export',
  'Manufacturing',
  'Construction & Infrastructure',
  'Energy & Sustainability',
  // المال والأعمال
  'Financial Services',
  'Consulting & Advisory',
  'Legal & Compliance',
  'Accounting & Tax',
  'HR & Recruitment',
  // العقارات والخدمات المنزلية
  'Real Estate',
  'Home Services',
  'Furniture & Decor',
  // الخدمات اللوجستية
  'Delivery & Logistics',
  'Supply Chain',
  'Import & Export',
  // أخرى
  'SaaS / Software',
  'Gaming & Esports',
  'Sports & Fitness',
  'Automotive',
  'Pets & Animals',
  'Nonprofit',
  'Other',
];
export const STAGES = ['ideation', 'validation', 'build', 'launch', 'growth'];

export function buildWeeklyTasks(ideaId: string, userId: string, firstStep: string | null): Omit<Task, 'id' | 'created_at'>[] {
  const titles = [
    firstStep ?? 'نفّذ الخطوة الأولى خلال 48 ساعة',
    'تحدث مع 10 عملاء محتملين',
    'اصنع نموذج أولي MVP',
    'احصل على أول دفعة مقدمة',
    'حلل النتائج وعدل المنتج',
    'ابدأ البيع لـ 3 عملاء',
    'شغّل إعلانات واتساب 10$/يوم',
    'وظّف أول مساعد',
    'أتمتة عملية واحدة',
    'وسّع لفريق 3 أشخاص',
    'ضاعف الإيرادات',
    'خطط للتوسع',
  ];
  return titles.map((title, i) => ({
    idea_id: ideaId,
    user_id: userId,
    title,
    week: i + 1,
    status: 'todo',
  }));
}
export const SKILLS = [
  'farming', 'sales', 'coding', 'marketing', 'finance', 'logistics',
  'manufacturing', 'design', 'management', 'research', 'product', 'ai', 'ecommerce',
];
