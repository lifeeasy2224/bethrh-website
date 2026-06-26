'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Check } from 'lucide-react';

type Settings = Record<string, string | number | boolean>;

const DEFAULT_SETTINGS: Settings = {
  platform_name: 'بذرة',
  maintenance_mode: false,
  registration_mode: 'open',
  api_rate_limit: 100,
  login_rate_limit: 5,
  session_timeout_hrs: 24,
  feature_ai_coach: true,
  feature_connections: true,
  feature_groups: true,
  feature_seeds: true,
  feature_marketplace: true,
  feature_whatsapp: true,
  meta_keywords: 'startup, idea validation, بذرة',
  meta_description: 'The platform for entrepreneurs',
  site_title: 'بذرة — Validate Your Startup Idea',
  email_digest: 'daily',
  from_email: 'hello@bethrh.co',
  from_name: 'بذرة Team',
  welcome_email: true,
  notify_failed_logins: true,
  notify_new_ticket: true,
  notify_new_signup: true,
  notify_system_errors: true,
  notify_traffic_spikes: false,
  whatsapp_alert_number: '',
};

const FEATURE_DESCRIPTIONS: Record<string, string> = {
  feature_ai_coach: 'AI-powered coaching and guidance',
  feature_connections: 'Founder connections network',
  feature_groups: 'Community groups and channels',
  feature_seeds: 'Seed ideas marketplace',
  feature_marketplace: 'Business marketplace features',
  feature_whatsapp: 'WhatsApp notifications',
};

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Settings>({ ...DEFAULT_SETTINGS });
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase
      .from('admin_settings')
      .select('key,value')
      .then(({ data }) => {
        if (data) {
          const merged = { ...DEFAULT_SETTINGS };
          data.forEach((item: { key: string; value: string }) => {
            // Parse boolean values
            if (item.value === 'true') merged[item.key] = true;
            else if (item.value === 'false') merged[item.key] = false;
            // Parse number values
            else if (!isNaN(Number(item.value))) merged[item.key] = Number(item.value);
            else merged[item.key] = item.value;
          });
          setSettings(merged);
        }
        setLoading(false);
      });
  }, []);

  async function saveSettings() {
    setSaving(true);
    const updates = Object.entries(settings).map(([key, value]) => ({
      key,
      value: String(value),
    }));

    for (const item of updates) {
      await supabase
        .from('admin_settings')
        .upsert({ key: item.key, value: item.value }, { onConflict: 'key' });
    }

    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    setSaving(false);
  }

  const updateSetting = (key: string, value: any) => {
    setSettings((p) => ({ ...p, [key]: value }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-7 h-7 border-2 border-t-transparent rounded-full animate-spin border-[var(--green-brand)]" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Settings</h1>
          <p className="text-slate-500 text-sm mt-0.5">Manage platform configuration</p>
        </div>
        <div className="flex items-center gap-2">
          {saved && (
            <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 text-emerald-700 rounded-lg text-sm">
              <Check className="w-4 h-4" />
              Saved!
            </div>
          )}
          <button
            onClick={saveSettings}
            disabled={saving}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 transition-colors"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      {/* General */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">General</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Platform Name
            </label>
            <input
              type="text"
              value={String(settings.platform_name ?? '')}
              onChange={(e) => updateSetting('platform_name', e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Registration Mode
            </label>
            <select
              value={String(settings.registration_mode ?? 'open')}
              onChange={(e) => updateSetting('registration_mode', e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 appearance-none"
            >
              <option value="open">Open</option>
              <option value="closed">Closed</option>
              <option value="invite">Invite Only</option>
            </select>
          </div>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.maintenance_mode as boolean}
              onChange={(e) => updateSetting('maintenance_mode', e.target.checked)}
              className="w-4 h-4 rounded border-slate-300"
            />
            <span className="text-sm text-slate-700">Maintenance Mode</span>
          </label>
        </div>
      </div>

      {/* Security */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Security</h2>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              API Rate Limit
            </label>
            <input
              type="number"
              value={Number(settings.api_rate_limit ?? 100)}
              onChange={(e) => updateSetting('api_rate_limit', Number(e.target.value))}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Login Rate Limit
            </label>
            <input
              type="number"
              value={Number(settings.login_rate_limit ?? 5)}
              onChange={(e) => updateSetting('login_rate_limit', Number(e.target.value))}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Session Timeout (hours)
            </label>
            <input
              type="number"
              value={Number(settings.session_timeout_hrs ?? 24)}
              onChange={(e) => updateSetting('session_timeout_hrs', Number(e.target.value))}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>
      </div>

      {/* Feature Flags */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Feature Flags</h2>
        <div className="grid grid-cols-2 gap-6">
          {Object.entries(settings)
            .filter(([key]) => key.startsWith('feature_'))
            .map(([key, value]) => (
              <label key={key} className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={value as boolean}
                  onChange={(e) => updateSetting(key, e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 mt-0.5"
                />
                <div>
                  <div className="text-sm font-medium text-slate-700">
                    {key.replace('feature_', '').replace(/_/g, ' ')}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {FEATURE_DESCRIPTIONS[key]}
                  </p>
                </div>
              </label>
            ))}
        </div>
      </div>

      {/* SEO */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">SEO</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Site Title
            </label>
            <input
              type="text"
              value={String(settings.site_title ?? '')}
              onChange={(e) => updateSetting('site_title', e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Meta Description
            </label>
            <textarea
              value={String(settings.meta_description ?? '')}
              onChange={(e) => updateSetting('meta_description', e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Meta Keywords
            </label>
            <input
              type="text"
              value={String(settings.meta_keywords ?? '')}
              onChange={(e) => updateSetting('meta_keywords', e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>
      </div>

      {/* Email */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Email</h2>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                From Email
              </label>
              <input
                type="email"
                value={String(settings.from_email ?? '')}
                onChange={(e) => updateSetting('from_email', e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                From Name
              </label>
              <input
                type="text"
                value={String(settings.from_name ?? '')}
                onChange={(e) => updateSetting('from_name', e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Digest Frequency
            </label>
            <select
              value={String(settings.email_digest ?? 'daily')}
              onChange={(e) => updateSetting('email_digest', e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 appearance-none"
            >
              <option value="real_time">Real Time</option>
              <option value="hourly">Hourly</option>
              <option value="daily">Daily</option>
              <option value="off">Off</option>
            </select>
          </div>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.welcome_email as boolean}
              onChange={(e) => updateSetting('welcome_email', e.target.checked)}
              className="w-4 h-4 rounded border-slate-300"
            />
            <span className="text-sm text-slate-700">Send Welcome Emails</span>
          </label>
        </div>
      </div>

      {/* Notifications */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Notifications</h2>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-6">
            {Object.entries(settings)
              .filter(([key]) => key.startsWith('notify_'))
              .map(([key, value]) => (
                <label key={key} className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={value as boolean}
                    onChange={(e) => updateSetting(key, e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300"
                  />
                  <span className="text-sm text-slate-700">
                    {key.replace('notify_', '').replace(/_/g, ' ')}
                  </span>
                </label>
              ))}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              WhatsApp Alert Number
            </label>
            <input
              type="text"
              value={String(settings.whatsapp_alert_number ?? '')}
              onChange={(e) => updateSetting('whatsapp_alert_number', e.target.value)}
              placeholder="+1234567890"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
