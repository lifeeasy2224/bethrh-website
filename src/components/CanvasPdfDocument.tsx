import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from '@react-pdf/renderer';
import type { CanvasData } from '../supabase';

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

// Distinct shades from the Bethra brand palette so canvas blocks stay tellable apart
const BLOCK_HEADER_COLORS: Record<string, string> = {
  key_partners: '#1B6B3E',
  key_activities: '#2A8A52',
  value_proposition: '#D4A653',
  customer_relationships: '#A07830',
  customer_segments: '#D08A28',
  key_resources: '#3AAD6A',
  channels: '#217A48',
  cost_structure: '#C0392B',
  revenue_streams: '#0F3D24',
};

const CANVAS_ROWS = [
  [
    { key: 'key_partners', title: 'الشركاء الرئيسيون' },
    { key: 'key_activities', title: 'الأنشطة الرئيسية' },
    { key: 'value_proposition', title: 'عرض القيمة' },
  ],
  [
    { key: 'customer_relationships', title: 'علاقات العملاء' },
    { key: 'customer_segments', title: 'شرائح العملاء' },
    { key: 'key_resources', title: 'الموارد الرئيسية' },
  ],
  [
    { key: 'channels', title: 'القنوات' },
    { key: 'cost_structure', title: 'هيكل التكاليف' },
    { key: 'revenue_streams', title: 'مصادر الإيرادات' },
  ],
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
  coverLogoIdea: {
    fontFamily: 'Noto Kufi Arabic',
    fontWeight: 800,
    fontSize: 42,
    color: WHITE,
    letterSpacing: -0.5,
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
  // Canvas page
  canvasPage: {
    backgroundColor: WHITE,
    padding: 28,
    paddingBottom: 40,
  },
  canvasHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  canvasLogoRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  canvasLogoIdea: {
    fontFamily: 'Noto Kufi Arabic',
    fontWeight: 800,
    fontSize: 16,
    color: NAVY,
  },
  canvasLogoIQ: {
    fontFamily: 'Noto Kufi Arabic',
    fontWeight: 800,
    fontSize: 16,
    color: GOLD,
  },
  canvasPageTitle: {
    fontFamily: 'Noto Kufi Arabic',
    fontWeight: 700,
    fontSize: 13,
    color: NAVY,
  },
  canvasIdeaSubtitle: {
    fontFamily: 'Noto Kufi Arabic',
    fontWeight: 400,
    fontSize: 9,
    color: LIGHT_GRAY,
    textAlign: 'right',
    marginTop: 2,
  },
  // Grid
  gridOuter: {
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 6,
    overflow: 'hidden',
    flex: 1,
  },
  gridRow: {
    flexDirection: 'row',
    flex: 1,
  },
  gridCell: {
    flex: 1,
    borderRightWidth: 1,
    borderRightColor: BORDER,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    flexDirection: 'column',
  },
  gridCellLast: {
    borderRightWidth: 0,
  },
  gridRowLast: {
    borderBottomWidth: 0,
  },
  blockHeader: {
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  blockHeaderText: {
    fontFamily: 'Noto Kufi Arabic',
    fontWeight: 700,
    fontSize: 8,
    color: WHITE,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  blockContent: {
    padding: 8,
    flex: 1,
  },
  blockContentText: {
    fontFamily: 'Noto Kufi Arabic',
    fontWeight: 400,
    fontSize: 8.5,
    color: GRAY,
    lineHeight: 1.55,
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
  // Financials page
  financialsPage: {
    backgroundColor: WHITE,
    padding: 28,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontFamily: 'Noto Kufi Arabic',
    fontWeight: 700,
    fontSize: 18,
    color: NAVY,
    marginBottom: 20,
  },
  financialsRow: {
    flexDirection: 'row',
    gap: 14,
    marginBottom: 24,
  },
  financialCard: {
    flex: 1,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  financialCardLabel: {
    fontFamily: 'Noto Kufi Arabic',
    fontWeight: 400,
    fontSize: 9,
    color: LIGHT_GRAY,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
    textAlign: 'center',
  },
  financialCardValue: {
    fontFamily: 'Noto Kufi Arabic',
    fontWeight: 800,
    fontSize: 22,
    textAlign: 'center',
  },
  netProfitCard: {
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginBottom: 0,
  },
});

interface Props {
  canvas: CanvasData;
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

function CanvasBlock({
  blockKey,
  title,
  content,
  isLastInRow,
  isLastRow,
}: {
  blockKey: string;
  title: string;
  content: string;
  isLastInRow: boolean;
  isLastRow: boolean;
}) {
  const headerColor = BLOCK_HEADER_COLORS[blockKey] ?? '#2A8A52';
  return (
    <View
      style={[
        styles.gridCell,
        isLastInRow ? styles.gridCellLast : {},
        isLastRow ? styles.gridRowLast : {},
      ]}
    >
      <View style={[styles.blockHeader, { backgroundColor: headerColor }]}>
        <Text style={styles.blockHeaderText}>{title}</Text>
      </View>
      <View style={styles.blockContent}>
        <Text style={styles.blockContentText}>{content || '—'}</Text>
      </View>
    </View>
  );
}

export default function CanvasPdfDocument({ canvas, ideaName, founderName, date }: Props) {
  const hasFinancials =
    (canvas.monthly_revenue > 0) ||
    (canvas.monthly_costs > 0) ||
    (canvas.break_even_month > 0);

  const netProfit = (canvas.monthly_revenue ?? 0) - (canvas.monthly_costs ?? 0);

  return (
    <Document title={`Bethra Canvas — ${ideaName}`} author="Bethra" creator="Bethra — www.bethra.co">
      {/* Page 1: Cover */}
      <Page size="A4" style={styles.coverPage}>
        <View style={styles.coverContent}>
          <View style={styles.coverLogoRow}>
            <Text style={styles.coverLogoIQ}>بذرة</Text>
          </View>
          <View style={styles.coverDivider} />
          <Text style={styles.coverTitle}>مخطط نموذج العمل</Text>
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

      {/* Page 2: Canvas Grid */}
      <Page size="A4" orientation="landscape" style={styles.canvasPage}>
        {/* Header */}
        <View style={styles.canvasHeader}>
          <View style={styles.canvasLogoRow}>
            <Text style={styles.canvasLogoIQ}>بذرة</Text>
          </View>
          <View>
            <Text style={styles.canvasPageTitle}>مخطط نموذج العمل</Text>
            <Text style={styles.canvasIdeaSubtitle}>{ideaName}</Text>
          </View>
        </View>

        {/* Grid */}
        <View style={styles.gridOuter}>
          {CANVAS_ROWS.map((row, rowIdx) => (
            <View style={styles.gridRow} key={rowIdx}>
              {row.map((block, colIdx) => (
                <CanvasBlock
                  key={block.key}
                  blockKey={block.key}
                  title={block.title}
                  content={(canvas as any)[block.key] ?? ''}
                  isLastInRow={colIdx === row.length - 1}
                  isLastRow={rowIdx === CANVAS_ROWS.length - 1}
                />
              ))}
            </View>
          ))}
        </View>

        <PageFooter pageNumber={2} date={date} />
      </Page>

      {/* Page 3: Financial Projections (only if filled) */}
      {hasFinancials && (
        <Page size="A4" style={styles.financialsPage}>
          {/* Header */}
          <View style={styles.canvasHeader}>
            <View style={styles.canvasLogoRow}>
              <Text style={styles.canvasLogoIQ}>بذرة</Text>
            </View>
            <View>
              <Text style={styles.canvasPageTitle}>التوقعات المالية</Text>
              <Text style={styles.canvasIdeaSubtitle}>{ideaName}</Text>
            </View>
          </View>

          <Text style={styles.sectionTitle}>التوقعات المالية</Text>

          <View style={styles.financialsRow}>
            {canvas.monthly_revenue > 0 && (
              <View style={styles.financialCard}>
                <Text style={styles.financialCardLabel}>الإيراد الشهري</Text>
                <Text style={[styles.financialCardValue, { color: '#D4A653' }]}>
                  ${canvas.monthly_revenue.toLocaleString()}
                </Text>
              </View>
            )}
            {canvas.monthly_costs > 0 && (
              <View style={styles.financialCard}>
                <Text style={styles.financialCardLabel}>التكاليف الشهرية</Text>
                <Text style={[styles.financialCardValue, { color: '#C0392B' }]}>
                  ${canvas.monthly_costs.toLocaleString()}
                </Text>
              </View>
            )}
            {canvas.break_even_month > 0 && (
              <View style={styles.financialCard}>
                <Text style={styles.financialCardLabel}>شهر التعادل</Text>
                <Text style={[styles.financialCardValue, { color: '#2A8A52' }]}>
                  Month {canvas.break_even_month}
                </Text>
              </View>
            )}
          </View>

          {canvas.monthly_revenue > 0 && canvas.monthly_costs > 0 && (
            <View style={styles.netProfitCard}>
              <Text style={styles.financialCardLabel}>Net Monthly Profit</Text>
              <Text style={[styles.financialCardValue, { color: netProfit >= 0 ? '#2A8A52' : '#C0392B' }]}>
                {netProfit >= 0 ? '+' : ''}${Math.abs(netProfit).toLocaleString()}/mo
              </Text>
            </View>
          )}

          <PageFooter pageNumber={3} date={date} />
        </Page>
      )}
    </Document>
  );
}
