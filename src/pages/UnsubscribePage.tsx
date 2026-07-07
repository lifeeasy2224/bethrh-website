import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import MailOutlineIcon from '@mui/icons-material/MailOutline';
import { supabase } from '../supabase';

type Status = 'loading' | 'success' | 'resubscribed' | 'invalid' | 'error';

export default function UnsubscribePage() {
  const [params] = useSearchParams();
  const token = params.get('token');
  const email = params.get('email');
  const campaignId = params.get('campaign');
  const [status, setStatus] = useState<Status>('loading');

  useEffect(() => {
    // Campaign-level unsubscribe: ?email=...&campaign=...
    if (email && campaignId) {
      void handleCampaignUnsubscribe(email, campaignId);
      return;
    }
    // Profile-level unsubscribe: ?token=...
    if (!token) { setStatus('invalid'); return; }
    void unsubscribe(token);
  }, [token, email, campaignId]);

  async function handleCampaignUnsubscribe(em: string, cid: string) {
    try {
      const emailLower = em.toLowerCase();
      // Mark recipient as unsubscribed
      await supabase
        .from('campaign_recipients')
        .update({ status: 'unsubscribed', unsubscribed_at: new Date().toISOString() })
        .eq('campaign_id', cid)
        .eq('email', emailLower);

      // Add to suppression list
      await supabase
        .from('email_suppression_list')
        .upsert({ email: emailLower, reason: 'unsubscribed', source: cid }, { onConflict: 'email' });

      // Increment campaign unsubscribe count
      const { data: camp } = await supabase
        .from('marketing_campaigns')
        .select('unsubscribe_count')
        .eq('id', cid)
        .single<{ unsubscribe_count: number }>();
      if (camp) {
        await supabase
          .from('marketing_campaigns')
          .update({ unsubscribe_count: (camp.unsubscribe_count ?? 0) + 1 })
          .eq('id', cid);
      }

      setStatus('success');
    } catch {
      setStatus('error');
    }
  }

  async function unsubscribe(t: string) {
    const { data, error } = await supabase
      .from('profiles')
      .update({ email_digest_enabled: false, inspiration_enabled: false })
      .eq('unsubscribe_token', t)
      .select('id')
      .maybeSingle();

    if (error) { setStatus('error'); return; }
    if (!data) { setStatus('invalid'); return; }
    setStatus('success');
  }

  async function resubscribe() {
    if (!token) return; // Campaign unsubscribes can't re-subscribe via this flow
    const { error } = await supabase
      .from('profiles')
      .update({ email_digest_enabled: true, inspiration_enabled: true })
      .eq('unsubscribe_token', token);
    if (!error) setStatus('resubscribed');
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'grey.50', display: 'flex', alignItems: 'center' }}>
      <Container maxWidth="sm">
        <Box sx={{ mb: 4, textAlign: 'center' }}>
          <Typography variant="h5" fontWeight={900} sx={{ color: 'primary.main', letterSpacing: '-0.5px' }}>
            بذرة
          </Typography>
        </Box>

        <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
          <CardContent sx={{ p: { xs: 3, sm: 5 } }}>
            {status === 'loading' && (
              <Stack alignItems="center" spacing={2} py={4}>
                <CircularProgress />
                <Typography color="text.secondary">جارٍ معالجة طلبك…</Typography>
              </Stack>
            )}

            {status === 'success' && (
              <Stack alignItems="center" spacing={2.5} textAlign="center">
                <Box sx={{ width: 64, height: 64, borderRadius: '50%', bgcolor: 'success.light', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CheckCircleOutlineIcon sx={{ fontSize: 36, color: 'success.dark' }} />
                </Box>
                <Typography variant="h5" fontWeight={700}>تم إلغاء اشتراكك</Typography>
                <Typography color="text.secondary" sx={{ maxWidth: 380 }}>
                  لن تصلك رسائل الملخص أو الإلهام الأسبوعية من بذرة بعد الآن. يمكنك إعادة الاشتراك في أي وقت من الإعدادات.
                </Typography>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} width="100%">
                  <Button variant="outlined" fullWidth onClick={resubscribe}>
                    أعد الاشتراك
                  </Button>
                  <Button variant="contained" fullWidth component={Link} to="/login">
                    اذهب للتطبيق
                  </Button>
                </Stack>
              </Stack>
            )}

            {status === 'resubscribed' && (
              <Stack alignItems="center" spacing={2.5} textAlign="center">
                <Box sx={{ width: 64, height: 64, borderRadius: '50%', bgcolor: 'primary.light', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <MailOutlineIcon sx={{ fontSize: 36, color: 'primary.main' }} />
                </Box>
                <Typography variant="h5" fontWeight={700}>عدت من جديد!</Typography>
                <Typography color="text.secondary">
                  أُعيد تفعيل رسائل الملخص والإلهام الأسبوعية.
                </Typography>
                <Button variant="contained" component={Link} to="/login" fullWidth>
                  اذهب للتطبيق
                </Button>
              </Stack>
            )}

            {(status === 'invalid' || status === 'error') && (
              <Stack alignItems="center" spacing={2.5} textAlign="center">
                <Box sx={{ width: 64, height: 64, borderRadius: '50%', bgcolor: 'warning.light', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ErrorOutlineIcon sx={{ fontSize: 36, color: 'warning.dark' }} />
                </Box>
                <Typography variant="h5" fontWeight={700}>
                  {status === 'invalid' ? 'الرابط غير موجود' : 'حدث خطأ ما'}
                </Typography>
                <Typography color="text.secondary">
                  {status === 'invalid'
                    ? 'رابط إلغاء الاشتراك غير صالح أو استُخدم من قبل. يمكنك إدارة الإشعارات من إعداداتك.'
                    : 'تعذّرت معالجة طلبك. حاول مرة أخرى أو أدر الإشعارات من إعداداتك.'}
                </Typography>
                <Button variant="contained" component={Link} to="/settings" fullWidth>
                  إدارة الإشعارات
                </Button>
              </Stack>
            )}
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}
