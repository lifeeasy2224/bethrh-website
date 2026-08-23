import { useState } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import Snackbar from '@mui/material/Snackbar';
import CircularProgress from '@mui/material/CircularProgress';
import SendOutlinedIcon from '@mui/icons-material/SendOutlined';
import { supabase } from '../../supabase';

export interface SendableCampaign {
  id: string;
  name: string;
  subject: string | null;
}

interface Props {
  /** Staged campaign to send, or null when the dialog is closed. */
  campaign: SendableCampaign | null;
  sessionToken: string | null;
  /** Clear the staged campaign (close the dialog). */
  onClose: () => void;
  /** Called after a successful send; parent typically clears the target + reloads. */
  onSent?: (sent: number) => void;
}

/**
 * NOTE: Bethra's send-campaign function has no `preview: true` dry-run mode
 * (unlike IdeaIQ's) — it resolves recipients and sends in one pass. So this
 * dialog cannot show a real recipient count before sending; it just confirms
 * intent, then fires a single real send.
 */
export default function SendCampaignDialog({ campaign, sessionToken, onClose, onSent }: Props) {
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState<{ severity: 'success' | 'error'; msg: string } | null>(null);

  async function confirmSend() {
    if (!campaign || !sessionToken) return;
    setSending(true);
    const { data, error } = await supabase.functions.invoke('send-campaign', {
      body: { campaign_id: campaign.id, session_token: sessionToken },
    });
    setSending(false);
    if (error || !data?.success) {
      setToast({ severity: 'error', msg: error?.message ?? 'Send failed.' });
    } else {
      setToast({ severity: 'success', msg: `Campaign sent to ${data.sent} recipient${data.sent === 1 ? '' : 's'}.` });
      onSent?.(data.sent);
    }
  }

  function handleClose() {
    if (sending) return;
    onClose();
  }

  return (
    <>
      <Dialog open={Boolean(campaign)} onClose={handleClose} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>Send campaign</DialogTitle>
        <DialogContent>
          {campaign && <Typography variant="body2" fontWeight={700} sx={{ mb: 0.5 }}>{campaign.name}</Typography>}
          {campaign && <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>{campaign.subject}</Typography>}
          <Alert severity="warning">
            This sends immediately to the campaign's resolved segment audience. This cannot be undone.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} disabled={sending}>Cancel</Button>
          <Button
            variant="contained"
            onClick={() => void confirmSend()}
            disabled={sending}
            startIcon={sending ? <CircularProgress size={16} color="inherit" /> : <SendOutlinedIcon />}
            sx={{ bgcolor: '#1B6B3E', '&:hover': { bgcolor: '#2A8A52' } }}
          >
            {sending ? 'Sending…' : 'Send now'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={Boolean(toast)}
        autoHideDuration={5000}
        onClose={() => setToast(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        {toast ? <Alert severity={toast.severity} onClose={() => setToast(null)}>{toast.msg}</Alert> : undefined}
      </Snackbar>
    </>
  );
}
