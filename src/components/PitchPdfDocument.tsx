import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from '@react-pdf/renderer';

// Noto Kufi Arabic (brand font) — TTF sources; @react-pdf/fontkit shapes Arabic.
Font.register({
  family: 'Noto Kufi Arabic',
  fonts: [
    { src: 'https://fonts.gstatic.com/s/notokufiarabic/v27/CSRp4ydQnPyaDxEXLFF6LZVLKrodhu8t57o1kDc5Wh5v34bP.ttf', fontWeight: 400 },
    { src: 'https://fonts.gstatic.com/s/notokufiarabic/v27/CSRp4ydQnPyaDxEXLFF6LZVLKrodhu8t57o1kDc5Wh6x2IbP.ttf', fontWeight: 600 },
    { src: 'https://fonts.gstatic.com/s/notokufiarabic/v27/CSRp4ydQnPyaDxEXLFF6LZVLKrodhu8t57o1kDc5Wh6I2IbP.ttf', fontWeight: 700 },
    // react-pdf clamps 800 to the nearest registered weight (700)
  ],
});

const NAVY = '#0F3D24';
const GOLD = '#D4A653';
const GRAY = '#8A8070';
const LIGHT_GRAY = '#B5AE9F';
const WHITE = '#FFFFFF';
const BORDER = '#E8E4DC';

const PITCH_SECTIONS = [
  { key: 'pitch_problem', title: 'المشكلة' },
  { key: 'pitch_solution', title: 'الحل' },
  { key: 'target_market', title: 'السوق المستهدف' },
  { key: 'revenue_model', title: 'نموذج الإيراد' },
  { key: 'break_even_summary', title: 'نقطة التعادل' },
];

const styles = StyleSheet.create({
  // Cover page
  coverPage: {
    backgroundColor: NAVY,
    padding: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  coverContent: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 60,
  },
  coverLogoRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 32,
  },
  coverLogoIQ: {
    fontFamily: 'Noto Kufi Arabic',
    fontWeight: 800,
    fontSize: 42,
    color: GOLD,
    letterSpacing: -0.5,
  },
  coverDivider: {
    width: 60,
    height: 3,
    backgroundColor: GOLD,
    borderRadius: 2,
    marginBottom: 28,
  },
  coverTitle: {
    fontFamily: 'Noto Kufi Arabic',
    fontWeight: 700,
    fontSize: 26,
    color: WHITE,
    textAlign: 'center',
    marginBottom: 14,
    letterSpacing: 0.3,
  },
  coverIdeaName: {
    fontFamily: 'Noto Kufi Arabic',
    fontWeight: 600,
    fontSize: 17,
    color: GOLD,
    textAlign: 'center',
    marginBottom: 28,
  },
  coverMeta: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 6,
  },
  coverMetaText: {
    fontFamily: 'Noto Kufi Arabic',
    fontWeight: 400,
    fontSize: 12,
    color: 'rgba(255,255,255,0.65)',
    textAlign: 'center',
  },
  coverFooter: {
    paddingVertical: 16,
    paddingHorizontal: 60,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.12)',
    width: '100%',
  },
  coverFooterText: {
    fontFamily: 'Noto Kufi Arabic',
    fontWeight: 400,
    fontSize: 10,
    color: 'rgba(255,255,255,0.35)',
    textAlign: 'center',
  },
  // Pitch page
  pitchPage: {
    backgroundColor: WHITE,
    padding: 28,
    paddingBottom: 40,
  },
  pitchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  pitchLogoRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  pitchLogoIQ: {
    fontFamily: 'Noto Kufi Arabic',
    fontWeight: 800,
    fontSize: 16,
    color: GOLD,
  },
  pitchPageTitle: {
    fontFamily: 'Noto Kufi Arabic',
    fontWeight: 700,
    fontSize: 13,
    color: NAVY,
  },
  pitchIdeaSubtitle: {
    fontFamily: 'Noto Kufi Arabic',
    fontWeight: 400,
    fontSize: 9,
    color: LIGHT_GRAY,
    textAlign: 'right',
    marginTop: 2,
  },
  // Elevator pitch quote
  elevatorBox: {
    backgroundColor: '#FAF5E9',
    borderRightWidth: 3,
    borderRightColor: GOLD,
    borderRadius: 4,
    padding: 14,
    marginBottom: 20,
  },
  elevatorText: {
    fontFamily: 'Noto Kufi Arabic',
    fontWeight: 600,
    fontSize: 12,
    color: NAVY,
    lineHeight: 1.6,
    fontStyle: 'italic',
  },
  // Sections
  section: {
    marginBottom: 16,
  },
  sectionHeading: {
    fontFamily: 'Noto Kufi Arabic',
    fontWeight: 700,
    fontSize: 9,
    color: GOLD,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 5,
  },
  sectionText: {
    fontFamily: 'Noto Kufi Arabic',
    fontWeight: 400,
    fontSize: 10,
    color: GRAY,
    lineHeight: 1.6,
  },
  // The Ask
  askBox: {
    backgroundColor: NAVY,
    borderRadius: 8,
    padding: 18,
    marginTop: 8,
  },
  askLabel: {
    fontFamily: 'Noto Kufi Arabic',
    fontWeight: 400,
    fontSize: 9,
    color: 'rgba(255,255,255,0.6)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  askAmount: {
    fontFamily: 'Noto Kufi Arabic',
    fontWeight: 800,
    fontSize: 24,
    color: GOLD,
    marginBottom: 10,
  },
  askFundsLabel: {
    fontFamily: 'Noto Kufi Arabic',
    fontWeight: 700,
    fontSize: 9,
    color: 'rgba(255,255,255,0.6)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  askFundsText: {
    fontFamily: 'Noto Kufi Arabic',
    fontWeight: 400,
    fontSize: 10,
    color: WHITE,
    lineHeight: 1.6,
  },
  // Footer
  pageFooter: {
    position: 'absolute',
    bottom: 16,
    left: 28,
    right: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: BORDER,
    paddingTop: 6,
  },
  footerText: {
    fontFamily: 'Noto Kufi Arabic',
    fontWeight: 400,
    fontSize: 8,
    color: LIGHT_GRAY,
  },
});

export interface PitchPdfData {
  elevator_pitch: string;
  pitch_problem: string;
  pitch_solution: string;
  target_market: string;
  revenue_model: string;
  break_even_summary: string;
  investment_amount: number | null;
  use_of_funds: string;
}

interface Props {
  pitch: PitchPdfData;
  ideaName: string;
  founderName: string;
  date: string;
}

function PageFooter({ pageNumber, date }: { pageNumber: number; date: string }) {
  return (
    <View style={styles.pageFooter} fixed>
      <Text style={styles.footerText}>Bethra — www.bethra.co</Text>
      <Text style={styles.footerText}>Page {pageNumber}</Text>
      <Text style={styles.footerText}>{date}</Text>
    </View>
  );
}

export default function PitchPdfDocument({ pitch, ideaName, founderName, date }: Props) {
  const hasAsk = !!(pitch.investment_amount || pitch.use_of_funds);

  return (
    <Document title={`Bethra Pitch — ${ideaName}`} author="Bethra" creator="Bethra — www.bethra.co">
      {/* Page 1: Cover */}
      <Page size="A4" style={styles.coverPage}>
        <View style={styles.coverContent}>
          <View style={styles.coverLogoRow}>
            <Text style={styles.coverLogoIQ}>بذرة</Text>
          </View>
          <View style={styles.coverDivider} />
          <Text style={styles.coverTitle}>العرض التمويلي</Text>
          <Text style={styles.coverIdeaName}>{ideaName}</Text>
          <View style={styles.coverMeta}>
            <Text style={styles.coverMetaText}>إعداد {founderName}</Text>
            <Text style={styles.coverMetaText}>{date}</Text>
          </View>
        </View>
        <View style={styles.coverFooter}>
          <Text style={styles.coverFooterText}>
            أُنشئ بواسطة بذرة — www.bethra.co · Life Easy LLC
          </Text>
        </View>
      </Page>

      {/* Page 2: Pitch content */}
      <Page size="A4" style={styles.pitchPage}>
        {/* Header */}
        <View style={styles.pitchHeader}>
          <View style={styles.pitchLogoRow}>
            <Text style={styles.pitchLogoIQ}>بذرة</Text>
          </View>
          <View>
            <Text style={styles.pitchPageTitle}>العرض التمويلي</Text>
            <Text style={styles.pitchIdeaSubtitle}>{ideaName}</Text>
          </View>
        </View>

        {pitch.elevator_pitch && (
          <View style={styles.elevatorBox}>
            <Text style={styles.elevatorText}>"{pitch.elevator_pitch}"</Text>
          </View>
        )}

        {PITCH_SECTIONS.map(s => (
          <View style={styles.section} key={s.key}>
            <Text style={styles.sectionHeading}>{s.title}</Text>
            <Text style={styles.sectionText}>{(pitch as any)[s.key] || '—'}</Text>
          </View>
        ))}

        {hasAsk && (
          <View style={styles.askBox}>
            <Text style={styles.askLabel}>طلب التمويل</Text>
            {!!pitch.investment_amount && (
              <Text style={styles.askAmount}>${pitch.investment_amount.toLocaleString()}</Text>
            )}
            {pitch.use_of_funds && (
              <>
                <Text style={styles.askFundsLabel}>استخدام التمويل</Text>
                <Text style={styles.askFundsText}>{pitch.use_of_funds}</Text>
              </>
            )}
          </View>
        )}

        <PageFooter pageNumber={2} date={date} />
      </Page>
    </Document>
  );
}
