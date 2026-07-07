// Shared types and rule-evaluation engine for CRM segments

export interface SegmentRule {
  field: string;
  operator: string;
  value: unknown;
}

export interface Segment {
  id: string;
  name: string;
  type: 'smart' | 'manual';
  rules: SegmentRule[];
  user_count: number;
  created_at: string;
  updated_at: string;
}

export interface EnrichedUser {
  user_id: string;
  full_name: string | null;
  role: string | null;
  tier: string | null;
  lead_score: number;
  lifecycle_stage: string | null;
  user_status: string | null;
  last_login_at: string | null;
  created_at: string | null;
  login_count: number;
  iq_score: number | null;
  ideas_count: number;
  tags?: Array<{ name: string; color: string }>;
}

export const PAYING_TIERS = ['builder', 'launch', 'family', 'pro', 'growth', 'accelerator'];

function daysBetween(date: string | null): number {
  if (!date) return 9999;
  return Math.floor((Date.now() - new Date(date).getTime()) / 86400000);
}

export function evaluateRule(user: EnrichedUser, rule: SegmentRule): boolean {
  const { field, operator, value } = rule;

  switch (field) {
    case 'role':
      if (operator === 'is') return user.role === value;
      if (operator === 'is_not') return user.role !== value;
      break;

    case 'tier':
      if (operator === 'is') return (user.tier ?? 'free') === value;
      if (operator === 'is_not') return (user.tier ?? 'free') !== value;
      if (operator === 'in') return Array.isArray(value) && value.includes(user.tier ?? 'free');
      if (operator === 'not_in') return Array.isArray(value) && !value.includes(user.tier ?? 'free');
      break;

    case 'user_status': {
      const status = user.user_status ?? 'inactive';
      if (operator === 'is') return status === value;
      break;
    }

    case 'lifecycle_stage': {
      const stage = user.lifecycle_stage ?? 'new';
      if (operator === 'is') return stage === value;
      break;
    }

    case 'lead_score': {
      const s = user.lead_score ?? 0;
      if (operator === 'gte') return s >= Number(value);
      if (operator === 'lte') return s <= Number(value);
      if (operator === 'equals') return s === Number(value);
      break;
    }

    case 'iq_score': {
      const iq = user.iq_score ?? 0;
      if (operator === 'gte') return iq >= Number(value);
      if (operator === 'lte') return iq <= Number(value);
      if (operator === 'equals') return iq === Number(value);
      break;
    }

    case 'login_count': {
      const lc = user.login_count ?? 0;
      if (operator === 'gte') return lc >= Number(value);
      if (operator === 'lte') return lc <= Number(value);
      if (operator === 'equals') return lc === Number(value);
      break;
    }

    case 'ideas_count': {
      const ic = user.ideas_count ?? 0;
      if (operator === 'gte') return ic >= Number(value);
      if (operator === 'lte') return ic <= Number(value);
      if (operator === 'equals') return ic === Number(value);
      break;
    }

    case 'last_login_at': {
      const d = daysBetween(user.last_login_at);
      if (operator === 'within_days') return d <= Number(value);
      if (operator === 'more_than_days') return d > Number(value);
      break;
    }

    case 'created_at': {
      const d = daysBetween(user.created_at);
      if (operator === 'within_days') return d <= Number(value);
      if (operator === 'more_than_days') return d > Number(value);
      break;
    }
  }

  return false;
}

export function applyRules(users: EnrichedUser[], rules: SegmentRule[], logic: 'AND' | 'OR' = 'AND'): EnrichedUser[] {
  if (!rules.length) return users;
  if (logic === 'OR') {
    return users.filter(u => rules.some(r => evaluateRule(u, r)));
  }
  return users.filter(u => rules.every(r => evaluateRule(u, r)));
}

// Field definitions for the rule builder UI
export interface FieldDef {
  field: string;
  label: string;
  category: string;
  type: 'select' | 'number' | 'days' | 'multi_select';
  options?: Array<{ value: string; label: string }>;
  operators: Array<{ value: string; label: string }>;
}

export const FIELD_DEFS: FieldDef[] = [
  // Profile
  {
    field: 'role', label: 'Role', category: 'Profile', type: 'select',
    options: [{ value: 'founder', label: 'Founder' }, { value: 'investor', label: 'Investor' }],
    operators: [{ value: 'is', label: 'is' }, { value: 'is_not', label: 'is not' }],
  },
  {
    field: 'tier', label: 'Plan', category: 'Profile', type: 'select',
    options: [
      { value: 'free', label: 'Free' }, { value: 'builder', label: 'Builder' },
      { value: 'launch', label: 'Launch' }, { value: 'family', label: 'Family' },
      { value: 'pro', label: 'Pro' }, { value: 'growth', label: 'Growth' },
      { value: 'accelerator', label: 'Accelerator' },
    ],
    operators: [{ value: 'is', label: 'is' }, { value: 'is_not', label: 'is not' }],
  },
  {
    field: 'user_status', label: 'Status', category: 'Profile', type: 'select',
    options: [
      { value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' },
      { value: 'at_risk', label: 'At Risk' }, { value: 'churned', label: 'Churned' },
    ],
    operators: [{ value: 'is', label: 'is' }],
  },
  {
    field: 'lifecycle_stage', label: 'Lifecycle Stage', category: 'Profile', type: 'select',
    options: [
      { value: 'new', label: 'New' }, { value: 'onboarding', label: 'Onboarding' },
      { value: 'active', label: 'Active' }, { value: 'power_user', label: 'Power User' },
      { value: 'paying', label: 'Paying' }, { value: 'churned', label: 'Churned' },
    ],
    operators: [{ value: 'is', label: 'is' }],
  },
  {
    field: 'lead_score', label: 'Lead Score', category: 'Profile', type: 'number',
    operators: [{ value: 'gte', label: '≥' }, { value: 'lte', label: '≤' }, { value: 'equals', label: '=' }],
  },
  {
    field: 'iq_score', label: 'IQ Score', category: 'Profile', type: 'number',
    operators: [{ value: 'gte', label: '≥' }, { value: 'lte', label: '≤' }, { value: 'equals', label: '=' }],
  },
  // Activity
  {
    field: 'last_login_at', label: 'Last Active', category: 'Activity', type: 'days',
    operators: [{ value: 'within_days', label: 'within last X days' }, { value: 'more_than_days', label: 'more than X days ago' }],
  },
  {
    field: 'created_at', label: 'Signed Up', category: 'Activity', type: 'days',
    operators: [{ value: 'within_days', label: 'within last X days' }, { value: 'more_than_days', label: 'more than X days ago' }],
  },
  {
    field: 'login_count', label: 'Login Count', category: 'Activity', type: 'number',
    operators: [{ value: 'gte', label: '≥' }, { value: 'lte', label: '≤' }, { value: 'equals', label: '=' }],
  },
  {
    field: 'ideas_count', label: 'Ideas Created', category: 'Activity', type: 'number',
    operators: [{ value: 'gte', label: '≥' }, { value: 'lte', label: '≤' }, { value: 'equals', label: '=' }],
  },
];
