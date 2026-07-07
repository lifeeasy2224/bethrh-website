import { useState, useRef } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Rating from '@mui/material/Rating';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import CircularProgress from '@mui/material/CircularProgress';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import AddPhotoAlternateOutlinedIcon from '@mui/icons-material/AddPhotoAlternateOutlined';
import StarIcon from '@mui/icons-material/Star';
import { supabase } from '../supabase';
import { useAuth } from '../contexts/AuthContext';
import { useReview, type ReviewTrigger } from '../contexts/ReviewContext';

const TRIGGER_COPY: Record<ReviewTrigger, { title: string; subtitle: string; emoji: string }> = {
  stage_complete: {
    title: 'أكملت مرحلة!',
    subtitle: 'كيف كانت تجربتك مع هذه المرحلة؟ ملاحظاتك تساعدنا على التحسّن.',
    emoji: '🎉',
  },
  high_score: {
    title: 'درجتك في بذرة تجاوزت ٨٠!',
    subtitle: 'فكرة قوية! كيف ساعدتك بذرة للوصول إلى هنا؟',
    emoji: '🚀',
  },
  investor_connect: {
    title: 'تواصلت مع مستثمر!',
    subtitle: 'كيف كانت تجربتك في التواصل مع المستثمرين على بذرة؟',
    emoji: '🤝',
  },
};

const RATING_LABELS: Record<number, string> = {
  1: 'ضعيفة',
  2: 'مقبولة',
  3: 'جيدة',
  4: 'رائعة',
  5: 'ممتازة',
};

export default function ReviewDialog() {
  const { user } = useAuth();
  const { pending, clearPending } = useReview();
  const [rating, setRating, ] = useState<number | null>(null);
  const [hover, setHover] = useState(-1);
  const [feedback, setFeedback] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  if (!pending) return null;

  const triggerType = pending.triggerType;
  const copy = TRIGGER_COPY[triggerType];

  function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  }

  async function handleSubmit() {
    if (!rating || !user || !pending) return;
    const snapshot = pending;
    setSaving(true);
    try {
      let photoUrl: string | null = null;
      if (photoFile) {
        const ext = photoFile.name.split('.').pop();
        const path = `${user.id}/${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from('review-photos')
          .upload(path, photoFile, { upsert: true });
        if (!upErr) {
          const { data: urlData } = supabase.storage.from('review-photos').getPublicUrl(path);
          photoUrl = urlData.publicUrl;
        }
      }

      await supabase.from('user_reviews').insert({
        user_id: user.id,
        trigger_type: triggerType,
        stage_name: snapshot.stageName ?? null,
        idea_id: snapshot.ideaId ?? null,
        rating,
        feedback: feedback.trim(),
        photo_url: photoUrl,
      });
    } finally {
      setSaving(false);
      resetAndClose();
    }
  }

  function resetAndClose() {
    setRating(null);
    setHover(-1);
    setFeedback('');
    setPhotoFile(null);
    setPhotoPreview(null);
    clearPending();
  }

  const displayRating = hover !== -1 ? hover : rating;

  return (
    <Dialog
      open
      onClose={resetAndClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{ sx: { borderRadius: 3, overflow: 'hidden' } }}
    >
      <Box
        sx={{
          background: 'linear-gradient(135deg, #1B6B3E 0%, #0F3D24 100%)',
          px: 3,
          pt: 3,
          pb: 2.5,
          position: 'relative',
        }}
      >
        <IconButton
          onClick={resetAndClose}
          size="small"
          sx={{ position: 'absolute', top: 12, right: 12, color: 'rgba(255,255,255,0.7)', '&:hover': { color: 'white', bgcolor: 'rgba(255,255,255,0.1)' } }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
        <Typography sx={{ fontSize: '2rem', mb: 0.5 }}>{copy.emoji}</Typography>
        <Typography variant="h6" fontWeight={700} sx={{ color: 'white', lineHeight: 1.2 }}>
          {copy.title}
        </Typography>
        {pending.stageName && (
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.75)', mt: 0.25, display: 'block' }}>
            المرحلة: {pending.stageName}
          </Typography>
        )}
      </Box>

      <DialogContent sx={{ px: 3, pt: 3 }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          {copy.subtitle}
        </Typography>

        {/* Star rating */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" fontWeight={600} gutterBottom>
            قيّم تجربتك
          </Typography>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Rating
              value={rating}
              onChange={(_, v) => setRating(v)}
              onChangeActive={(_, v) => setHover(v)}
              precision={1}
              size="large"
              emptyIcon={<StarIcon sx={{ opacity: 0.3 }} fontSize="inherit" />}
              sx={{ '& .MuiRating-iconFilled': { color: '#D4A653' }, '& .MuiRating-iconHover': { color: '#D4A653' } }}
            />
            {displayRating !== null && displayRating > 0 && (
              <Typography variant="body2" sx={{ color: '#D4A653', fontWeight: 600, minWidth: 64 }}>
                {RATING_LABELS[displayRating]}
              </Typography>
            )}
          </Stack>
        </Box>

        {/* Feedback */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" fontWeight={600} gutterBottom>
            شاركنا رأيك <Typography component="span" variant="caption" color="text.secondary">(اختياري)</Typography>
          </Typography>
          <TextField
            multiline
            rows={3}
            fullWidth
            placeholder="ما الذي يعمل جيداً؟ وما الذي يمكن تحسينه؟"
            value={feedback}
            onChange={e => setFeedback(e.target.value)}
            inputProps={{ maxLength: 1000 }}
          />
        </Box>

        {/* Photo upload */}
        <Box>
          <Typography variant="subtitle2" fontWeight={600} gutterBottom>
            أضف صورة <Typography component="span" variant="caption" color="text.secondary">(اختياري)</Typography>
          </Typography>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handlePhoto}
          />
          {photoPreview ? (
            <Box sx={{ position: 'relative', display: 'inline-block' }}>
              <Box
                component="img"
                src={photoPreview}
                alt="Preview"
                sx={{ width: 120, height: 90, objectFit: 'cover', borderRadius: 2, border: '2px solid', borderColor: 'divider' }}
              />
              <IconButton
                size="small"
                onClick={() => { setPhotoFile(null); setPhotoPreview(null); }}
                sx={{ position: 'absolute', top: -8, right: -8, bgcolor: 'error.main', color: 'white', width: 20, height: 20, '&:hover': { bgcolor: 'error.dark' } }}
              >
                <CloseIcon sx={{ fontSize: 12 }} />
              </IconButton>
            </Box>
          ) : (
            <Button
              variant="outlined"
              startIcon={<AddPhotoAlternateOutlinedIcon />}
              onClick={() => fileRef.current?.click()}
              size="small"
              sx={{ borderStyle: 'dashed', color: 'text.secondary', borderColor: 'grey.300' }}
            >
              ارفع صورة
            </Button>
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
        <Button onClick={resetAndClose} color="inherit" sx={{ color: 'text.secondary' }}>
          تخطَّ
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={!rating || saving}
          startIcon={saving ? <CircularProgress size={16} color="inherit" /> : undefined}
          sx={{ px: 3, minWidth: 120 }}
        >
          {saving ? 'جارٍ الإرسال…' : 'أرسل التقييم'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
