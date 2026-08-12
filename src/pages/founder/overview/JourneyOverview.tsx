// Bethra-branded "journey map" dashboard body — ported from IdeaIQ's
// founder/overview/JourneyOverview.tsx. Presentational only: consumes a real
// Journey (built by journeyModel.buildJourney) and routes each stop to its
// real /journey/* page. No PRO-locked stop rendering (see journeyModel.ts).
//
// RTL: Bethra's app-wide stylis-plugin-rtl auto-flips the physical CSS here
// (pl/pr/borderLeft/textAlign) under theme direction:'rtl', so it ports as-is.
// The two directional icons below do NOT auto-flip (SVG glyph choice, not
// CSS) — swapped to their "points toward Arabic reading-start" equivalents:
// ChevronRightIcon → ChevronLeftIcon, ArrowForwardIcon → ArrowBackIcon.
import { Fragment, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import CheckIcon from '@mui/icons-material/Check';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { C, type Journey, type Stop, type ScorePart } from './journeyModel';

/** Tiny tracked label (the design's `Label`). */
function Label({ children, color = C.ink600, sx }: { children: React.ReactNode; color?: string; sx?: object }) {
  return (
    <Typography component="span" sx={{ fontSize: 10, fontWeight: 800, letterSpacing: 'normal', color, lineHeight: 1.4, ...sx }}>
      {children}
    </Typography>
  );
}

/** Flat progress bar. */
function Bar({ pct, tone = 'gold', track = C.navy600, height = 4 }: { pct: number; tone?: 'gold' | 'navy'; track?: string; height?: number }) {
  return (
    <Box sx={{ width: '100%', height, bgcolor: track, overflow: 'hidden' }}>
      <Box sx={{ height, width: `${pct}%`, bgcolor: tone === 'gold' ? C.gold : C.navy500, transition: 'width .5s ease' }} />
    </Box>
  );
}

function DayStrip({ currentDay, totalDays, nextStopLabel }: { currentDay: number; totalDays: number; nextStopLabel: string }) {
  const tickCount = 45;
  const elapsed = Math.round((currentDay / totalDays) * tickCount);
  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: '2px', height: 34 }}>
        {Array.from({ length: tickCount }, (_, i) => {
          const past = i < elapsed;
          return <Box key={i} sx={{ flex: 1, bgcolor: past ? C.gold : C.navy600, height: past ? 20 : 11 }} />;
        })}
      </Box>
      <Stack direction="row" justifyContent="space-between" sx={{ mt: 1.5 }}>
        <Label>البداية</Label>
        <Label color={C.gold}>{nextStopLabel}</Label>
        <Label>اليوم ٩٠</Label>
      </Stack>
    </Box>
  );
}

function CoachCard({ coach, onAsk }: { coach: Journey['coach']; onAsk: () => void }) {
  return (
    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={{ xs: 2, sm: 3 }} alignItems={{ sm: 'flex-start' }} sx={{ mt: 2.5, bgcolor: C.navy900, px: { xs: 2.5, sm: 4 }, py: 3 }}>
      <Box sx={{ flex: 1 }}>
        <Stack direction="row" spacing={1.25} alignItems="center">
          <Box sx={{ width: 5, height: 5, bgcolor: C.gold, animation: 'iqPulse 2.4s ease-in-out infinite', '@keyframes iqPulse': { '0%,100%': { opacity: 1 }, '50%': { opacity: 0.35 } } }} />
          <Label color={C.gold}>المدرّب الذكي</Label>
        </Stack>
        <Typography sx={{ mt: 2, fontSize: 15, fontWeight: 500, lineHeight: 1.6, color: C.ink200 }}>{coach.line}</Typography>
        <Typography sx={{ mt: 1.75, fontSize: 11, fontWeight: 700, letterSpacing: 'normal', color: C.ink600 }}>حول: {coach.task}</Typography>
      </Box>
      <Box
        component="button"
        onClick={onAsk}
        sx={{ flexShrink: 0, cursor: 'pointer', border: `1px solid ${C.gold}`, bgcolor: 'transparent', px: 2.75, py: 1.5, fontSize: 12, fontWeight: 800, letterSpacing: 'normal', color: C.gold, fontFamily: 'inherit', '&:hover': { bgcolor: C.gold, color: C.navy900 }, alignSelf: { xs: 'stretch', sm: 'auto' } }}
      >
        اسأل
      </Box>
    </Stack>
  );
}

function NextAction({ nextAction, onGo }: { nextAction: NonNullable<Journey['nextAction']>; onGo: () => void }) {
  return (
    <Box sx={{ bgcolor: C.navy900, px: { xs: 2.5, sm: 4.25 }, py: { xs: 3, sm: 4 } }}>
      <Label color={C.gold}>افعل هذا الآن</Label>
      <Typography sx={{ mt: 2.25, maxWidth: 560, fontSize: { xs: 20, sm: 25 }, fontWeight: 700, lineHeight: 1.32, letterSpacing: 'normal', color: C.ink100 }}>
        {nextAction.title}
      </Typography>
      <Typography sx={{ mt: 1.75, maxWidth: 580, fontSize: 15, fontWeight: 500, lineHeight: 1.6, color: C.ink400 }}>
        {nextAction.why}
      </Typography>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={{ xs: 2, sm: 3.25 }} alignItems={{ sm: 'center' }} sx={{ mt: 3.75 }}>
        <Box
          component="button"
          onClick={onGo}
          sx={{ cursor: 'pointer', border: 'none', bgcolor: C.gold, px: 3.75, py: 1.75, fontSize: 13, fontWeight: 800, letterSpacing: 'normal', color: C.navy900, fontFamily: 'inherit', '&:hover': { bgcolor: C.goldLight } }}
        >
          {nextAction.cta}
        </Box>
        <Label>{nextAction.gain}</Label>
      </Stack>
    </Box>
  );
}

const num = (i: number) => String(i + 1).padStart(2, '0');

function StopRow({ stop, index, journey, onOpen, onAsk }: { stop: Stop; index: number; journey: Journey; onOpen: () => void; onAsk: () => void }) {
  // DONE — one quiet collapsed line.
  if (stop.state === 'done') {
    return (
      <Box
        component="button"
        onClick={onOpen}
        sx={{ display: 'grid', width: '100%', gridTemplateColumns: { xs: '40px 1fr', sm: '56px minmax(0,1fr) auto' }, alignItems: 'center', gap: { xs: 2, sm: 3.5 }, borderTop: `1px solid ${C.navy600}`, py: 2, pr: { sm: 2.5 }, textAlign: 'left', bgcolor: 'transparent', cursor: 'pointer', fontFamily: 'inherit', '&:hover': { bgcolor: C.navy800 } }}
      >
        <Stack direction="row" spacing={0.75} alignItems="center">
          <CheckIcon sx={{ fontSize: 14, color: C.gold }} />
          <Typography sx={{ fontSize: 12, fontWeight: 800, letterSpacing: 'normal', color: C.gold }}>{num(index)}</Typography>
        </Stack>
        <Typography sx={{ fontSize: 16, fontWeight: 700, color: C.ink500, minWidth: 0 }} noWrap>{stop.name}</Typography>
        <Typography sx={{ fontSize: 12, fontWeight: 600, color: C.ink600, display: { xs: 'none', sm: 'block' } }} noWrap>{stop.result}</Typography>
      </Box>
    );
  }

  // CURRENT — full panel with the next action + coach.
  if (stop.state === 'current') {
    return (
      <Box sx={{ mb: 5, borderLeft: `4px solid ${C.gold}`, bgcolor: C.navy700, px: { xs: 2.5, sm: 5.5 }, py: { xs: 3.5, sm: 5 } }}>
        <Stack direction="row" spacing={{ xs: 2, sm: 3.5 }}>
          <Typography sx={{ fontSize: 12, fontWeight: 800, letterSpacing: 'normal', color: C.gold, pt: 1 }}>{num(index)}</Typography>
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Stack direction="row" spacing={2} alignItems="baseline" flexWrap="wrap">
              <Typography sx={{ fontSize: { xs: 24, sm: 30 }, fontWeight: 800, letterSpacing: 'normal', color: C.ink100 }}>{stop.name}</Typography>
              <Box sx={{ bgcolor: C.gold, px: 1.25, py: 0.625, fontSize: 10, fontWeight: 800, letterSpacing: 'normal', color: C.navy900 }}>{stop.status}</Box>
            </Stack>
            <Stack direction="row" spacing={2.5} alignItems="center" sx={{ mt: 2.75 }}>
              <Box sx={{ maxWidth: 340, flex: 1 }}><Bar pct={stop.pct} height={6} track={C.navy900} /></Box>
              <Typography sx={{ fontSize: 12, fontWeight: 700, color: C.ink300, whiteSpace: 'nowrap' }}>{stop.metric}</Typography>
            </Stack>
            <Box sx={{ mt: 4 }}>
              {journey.nextAction && <NextAction nextAction={journey.nextAction} onGo={onOpen} />}
              <CoachCard coach={journey.coach} onAsk={onAsk} />
            </Box>
          </Box>
        </Stack>
      </Box>
    );
  }

  // AHEAD — a row with progress; opens the real page.
  const statusColor = stop.status === 'قيد التقدم' ? C.ink300 : C.ink600;
  return (
    <Box
      component="button"
      onClick={onOpen}
      sx={{ display: 'grid', width: '100%', gridTemplateColumns: { xs: '40px 1fr auto', md: '56px minmax(0,1fr) 180px auto' }, alignItems: 'center', gap: { xs: 2, md: 3.5 }, borderTop: `1px solid ${C.navy600}`, py: { xs: 2.5, sm: 3.25 }, pr: { sm: 2.5 }, textAlign: 'left', bgcolor: 'transparent', cursor: 'pointer', fontFamily: 'inherit', '&:hover': { bgcolor: C.navy800 } }}
    >
      <Typography sx={{ fontSize: 12, fontWeight: 800, letterSpacing: 'normal', color: C.ink600 }}>{num(index)}</Typography>
      <Box sx={{ minWidth: 0 }}>
        <Stack direction="row" spacing={1.75} alignItems="baseline" flexWrap="wrap">
          <Typography sx={{ fontSize: { xs: 16, sm: 19 }, fontWeight: 700, color: C.ink100 }}>{stop.name}</Typography>
          <Label color={statusColor}>{stop.status}</Label>
        </Stack>
        <Typography sx={{ mt: 0.75, maxWidth: 520, fontSize: 13, fontWeight: 500, lineHeight: 1.55, color: C.ink500 }}>{stop.detail}</Typography>
        {/* On small screens the progress bar sits under the text. */}
        <Box sx={{ display: { xs: 'block', md: 'none' }, mt: 1.5, maxWidth: 220 }}>
          <Bar pct={stop.pct} tone={stop.pct > 0 ? 'gold' : 'navy'} />
        </Box>
      </Box>
      <Box sx={{ display: { xs: 'none', md: 'block' } }}><Bar pct={stop.pct} tone={stop.pct > 0 ? 'gold' : 'navy'} /></Box>
      <ChevronLeftIcon sx={{ fontSize: 20, color: C.ink600 }} />
    </Box>
  );
}

function ScoreBoard({ score }: { score: Journey['score'] }) {
  return (
    <Box sx={{ mt: 7, display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'auto minmax(0,1fr)' }, alignItems: 'center', gap: { xs: 4, sm: 9 }, bgcolor: C.navy700, px: { xs: 3, sm: 5.5 }, py: { xs: 4, sm: 5 } }}>
      <Box>
        <Label>درجة بذرة</Label>
        <Stack direction="row" spacing={1.25} alignItems="baseline" sx={{ mt: 1.75 }}>
          <Typography sx={{ fontSize: { xs: 54, sm: 68 }, fontWeight: 800, lineHeight: 0.9, letterSpacing: 'normal', color: C.gold }}>{score.value}</Typography>
          <Typography sx={{ fontSize: 15, fontWeight: 700, color: C.ink600 }}>/100</Typography>
        </Stack>
        <Typography sx={{ mt: 1.75, fontSize: 11, fontWeight: 800, letterSpacing: 'normal', color: C.ink300 }}>مرحلة {score.stageLabel}</Typography>
      </Box>
      {/* Five score components. A 2-column grid on ≥sm keeps the list balanced
          against the big number rather than running as one tall column. Values
          are % of each component's cap; gold when that component is strong. */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, columnGap: 5, rowGap: 2.25 }}>
        {score.parts.map((part: ScorePart) => (
          <Box key={part.label}>
            <Stack direction="row" justifyContent="space-between" alignItems="baseline" spacing={1.5}>
              <Typography sx={{ fontSize: 12.5, fontWeight: 600, color: C.ink300 }}>{part.label}</Typography>
              <Typography sx={{ fontSize: 12.5, fontWeight: 800, color: part.strong ? C.gold : C.ink100 }}>{part.value}%</Typography>
            </Stack>
            <Box sx={{ mt: 1 }}><Bar pct={part.value} tone={part.strong ? 'gold' : 'navy'} track={C.navy900} /></Box>
          </Box>
        ))}
      </Box>
    </Box>
  );
}

export default function JourneyOverview({ journey, onOpenRoute, onAskCoach, ideaSwitcher }: { journey: Journey; onOpenRoute: (route: string) => void; onAskCoach: () => void; ideaSwitcher?: ReactNode }) {
  const navigate = useNavigate();
  const go = (route: string) => (onOpenRoute ? onOpenRoute(route) : navigate(route));

  const currentIndex = journey.stops.findIndex(s => s.state === 'current');
  const current = currentIndex >= 0 ? journey.stops[currentIndex] : null;
  const headline = current ?? journey.stops.find(s => s.state !== 'done') ?? journey.stops[0];

  return (
    <Box sx={{ bgcolor: C.navy900, color: C.ink100, px: { xs: 2.5, sm: 5, md: 7 }, py: { xs: 4, sm: 6 }, overflow: 'hidden' }}>
      {/* Hero */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'minmax(0,1fr) auto' }, alignItems: 'flex-end', gap: { xs: 3, md: 8 } }}>
        <Box>
          <Stack direction="row" spacing={1.75} alignItems="center">
            <Label color={C.gold}>{current ? 'أنت هنا' : 'رحلتك'}</Label>
            <Box sx={{ flex: 1, maxWidth: 120, height: '1px', bgcolor: C.navy600 }} />
            <Label>محطة {String((currentIndex >= 0 ? currentIndex : 0) + 1).padStart(2, '0')} / {String(journey.stops.length).padStart(2, '0')}</Label>
          </Stack>
          <Typography sx={{ mt: 2.5, fontSize: { xs: '2.5rem', sm: '3.5rem', md: '4.75rem' }, fontWeight: 800, lineHeight: 0.94, letterSpacing: 'normal', color: C.ink100 }}>
            {headline.name}
          </Typography>
          <Typography sx={{ mt: 2.75, maxWidth: 520, fontSize: 16, fontWeight: 500, lineHeight: 1.6, color: C.ink400 }}>
            {journey.stageBlurb}
          </Typography>
        </Box>
        <Box sx={{ textAlign: { xs: 'left', md: 'right' } }}>
          <Label>اليوم</Label>
          <Stack direction="row" spacing={0.75} alignItems="baseline" justifyContent={{ xs: 'flex-start', md: 'flex-end' }} sx={{ mt: 1 }}>
            <Typography sx={{ fontSize: { xs: '3.5rem', md: '5.5rem' }, fontWeight: 800, lineHeight: 0.86, letterSpacing: 'normal', color: C.gold }}>{journey.currentDay}</Typography>
            <Typography sx={{ fontSize: 22, fontWeight: 700, letterSpacing: 'normal', color: C.ink600 }}>/{journey.totalDays}</Typography>
          </Stack>
        </Box>
      </Box>

      {/* 90-day strip */}
      <Box sx={{ mt: { xs: 4, sm: 5.5 } }}>
        <DayStrip currentDay={journey.currentDay} totalDays={journey.totalDays} nextStopLabel={journey.nextStopLabel} />
      </Box>

      {/* Stops. The active-idea switcher sits directly under "My Ideas". */}
      <Box sx={{ mt: { xs: 5, sm: 7 } }}>
        {journey.stops.map((stop, i) => (
          <Fragment key={stop.id}>
            <StopRow stop={stop} index={i} journey={journey} onOpen={() => go(stop.route)} onAsk={onAskCoach} />
            {stop.id === 'my-ideas' && ideaSwitcher && (
              <Box sx={{ borderTop: `1px solid ${C.navy600}`, py: 1.75, pl: { xs: 0, sm: 7 }, display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                <Label>الفكرة النشطة</Label>
                {ideaSwitcher}
              </Box>
            )}
          </Fragment>
        ))}
      </Box>

      {/* If nothing is 'current' (all done), still surface the next action. */}
      {!current && journey.nextAction && (
        <Box sx={{ mt: 2 }}>
          <NextAction nextAction={journey.nextAction} onGo={() => go(journey.nextAction!.route)} />
        </Box>
      )}

      <ScoreBoard score={journey.score} />

      <Stack direction="row" justifyContent="flex-end" sx={{ mt: 2 }}>
        <Box component="button" onClick={() => go('/journey')} sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75, bgcolor: 'transparent', border: 'none', cursor: 'pointer', color: C.gold, fontFamily: 'inherit', fontSize: 12, fontWeight: 800, letterSpacing: 'normal', '&:hover': { color: C.goldLight } }}>
          عرض الرحلة كاملة <ArrowBackIcon sx={{ fontSize: 15 }} />
        </Box>
      </Stack>
    </Box>
  );
}
