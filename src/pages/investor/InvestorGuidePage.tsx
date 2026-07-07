import React, { useState } from 'react';
import {
  AppBar,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Chip,
  Container,
  Grid,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Toolbar,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  Menu as MenuIcon,
  MenuBookOutlined,
  NotificationsOutlined,
  WarningAmber,
  InfoOutlined,
  CheckCircle,
  CheckBox as _CheckBoxIcon,
  LooksOneOutlined,
  LooksTwoOutlined,
  Looks3Outlined,
  Looks4Outlined,
  Looks5Outlined,
  Looks6Outlined,
  ExpandMore,
  WhatsApp as WhatsAppIcon,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import InvestorSidebar from '../../components/InvestorSidebar';

export default function InvestorGuidePage() {
  const { profile } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [expandedAccordion, setExpandedAccordion] = useState<string | false>(
    'section1'
  );

  const handleAccordionChange =
    (panel: string) => (_event: React.SyntheticEvent, isExpanded: boolean) => {
      setExpandedAccordion(isExpanded ? panel : false);
    };

  const sectionIcons: Record<string, React.ReactNode> = {
    section1: <LooksOneOutlined />,
    section2: <LooksTwoOutlined />,
    section3: <Looks3Outlined />,
    section4: <Looks4Outlined />,
    section5: <Looks5Outlined />,
    section6: <Looks6Outlined />,
  };

  const faqItems = [
    { question: 'كيف أعرف أن الفكرة جادة؟', answer: 'كل فكرة في السوق اجتازت تقييم الذكاء الاصطناعي (+٨٠)، ولديها تحقق موثّق من العملاء ونموذج عمل مكتمل. راجع أدلة التحقق دائماً وثق بحدسك.' },
    { question: 'ماذا يحدث بعد التواصل؟', answer: 'بعد التواصل تستطيعان إجراء محادثات غير محدودة عبر منصتنا الآمنة. لا يوجد أي التزام بالمضي قدماً.' },
    { question: 'هل أبقى مجهولاً قبل التواصل؟', answer: 'نعم! أثناء التصفح وإرسال الطلبات، يرى المؤسسون ملفك الاستثماري فقط عند الطلب. لا تُفتح المحادثة إلا بموافقة الطرفين.' },
    { question: 'كيف تُحسب درجة بذرة؟', answer: 'تُحسب الدرجة من عوامل متعددة: جودة التحقق، واكتمال نموذج العمل، والتوقعات المالية، والتنفيذ، والتفاعل. وتُحدَّث باستمرار كلما طوّر المؤسس بياناته.' },
    { question: 'هل المحادثات مع المؤسسين خاصة؟', answer: 'نعم، كل المحادثات خاصة بينك وبين المؤسس. فريق بذرة لا يطّلع على محتوى الرسائل أبداً.' },
    { question: 'ماذا لو طلب أحدهم دفعة مقدمة؟', answer: 'هذه إشارة خطر كبيرة. لا يُطلب في المنصة أي رسوم مقدمة بين الأطراف. أبلغ فريق الدعم فوراً عن أي نشاط مريب.' },
    { question: 'هل يمكنني التواصل مع نفس المؤسس أكثر من مرة؟', answer: 'يمكنك إعادة طلب التواصل بعد فترة الانتظار إذا رُفض طلبك، أو التواصل بشأن فكرة أخرى لنفس المؤسس.' },
  ];

  return (
    <Box sx={{ display: 'flex', height: '100vh', flexDirection: 'row' }}>
      <InvestorSidebar
        open={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, width: 0 }}>
        {/* AppBar */}
        <AppBar
          position="sticky"
          sx={{
            backgroundColor: '#fff',
            color: 'text.primary',
            elevation: 0,
            borderBottom: '1px solid #E8E4DC',
          }}
        >
          <Toolbar>
            <IconButton
              size="small"
              onClick={() => setMobileOpen(!mobileOpen)}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
            <MenuBookOutlined sx={{ mr: 1.5 }} />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              دليل المستثمر
            </Typography>
            <Box sx={{ flex: 1 }} />
            <IconButton size="small" sx={{ mr: 2 }}>
              <NotificationsOutlined />
            </IconButton>
            <Avatar
              sx={{
                width: 32,
                height: 32,
                backgroundColor: 'secondary.main',
                fontSize: '0.875rem',
              }}
            >
              {profile?.full_name?.charAt(0).toUpperCase() || 'U'}
            </Avatar>
          </Toolbar>
        </AppBar>

        {/* Main Content */}
        <Box
          sx={{
            flex: 1,
            overflowY: 'auto',
            backgroundColor: '#FAF8F3',
          }}
        >
          <Container maxWidth="lg" sx={{ py: 4 }}>
            <Grid container spacing={3}>
              {/* Left: accordion content */}
              <Grid size={{ xs: 12, md: 8 }}>
            {/* Page Header */}
            <Box sx={{ mb: 4 }}>
              <Typography
                variant="h5"
                sx={{ fontWeight: 800, mb: 1 }}
              >
                دليل المستثمر
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
                كل ما تحتاج معرفته عن الاستثمار عبر بذرة.
              </Typography>
              <Chip
                label="مجاني لجميع المستثمرين"
                color="success"
                variant="filled"
              />
            </Box>

            {/* Section 1: How Bethra Works */}
            <Accordion
              expanded={expandedAccordion === 'section1'}
              onChange={handleAccordionChange('section1')}
              sx={{ mb: 3 }}
            >
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  {sectionIcons.section1}
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    كيف تعمل بذرة للمستثمرين
                  </Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Stack spacing={2}>
                  {[
                    {
                      title: 'جهّز ملفك',
                      description:
                        'أنشئ ملفك الاستثماري بمعاييرك وتفضيلاتك.',
                    },
                    {
                      title: 'تصفّح السوق',
                      description:
                        'استكشف المشاريع بهدوء. اطّلع على العروض ودرجات بذرة قبل أن تكشف هويتك.',
                    },
                    {
                      title: 'اطلب التواصل',
                      description:
                        'أرسل طلبات تواصل للمؤسسين الذين يهمونك — وهم يقررون القبول أو الرفض.',
                    },
                    {
                      title: 'ابدأ المحادثات',
                      description:
                        'بعد التواصل، أجرِ محادثات غير محدودة لتتعرف أكثر على المشروع.',
                    },
                    {
                      title: 'اتخذ قرارك بنفسك',
                      description:
                        'تابع بالفحص النافي للجهالة والاجتماعات أو الاستثمار بإيقاعك الخاص.',
                    },
                  ].map((step, index) => (
                    <Stack
                      key={index}
                      direction="row"
                      spacing={2}
                      alignItems="flex-start"
                    >
                      <Chip label={index + 1} size="small" variant="filled" />
                      <Box>
                        <Typography sx={{ fontWeight: 600 }}>
                          {step.title}
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                          {step.description}
                        </Typography>
                      </Box>
                    </Stack>
                  ))}
                </Stack>
              </AccordionDetails>
            </Accordion>

            {/* Section 2: Understanding the Score */}
            <Accordion
              expanded={expandedAccordion === 'section2'}
              onChange={handleAccordionChange('section2')}
              sx={{ mb: 3 }}
            >
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  {sectionIcons.section2}
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    فهم درجة بذرة
                  </Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Stack spacing={3}>
                  <TableContainer component={Card}>
                    <Table>
                      <TableHead sx={{ backgroundColor: '#F7F3EC' }}>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 600 }}>
                            نطاق الدرجة
                          </TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>المستوى</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>
                            ماذا تعني لك
                          </TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        <TableRow>
                          <TableCell>80-84</TableCell>
                          <TableCell>جاهزة</TableCell>
                          <TableCell>
                            أساسيات جيدة؛ جاهزة لمحادثات المستثمرين.
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>85-89</TableCell>
                          <TableCell>قوية</TableCell>
                          <TableCell>
                            عرض ومؤشرات قوية؛ في موقع جيد للتمويل.
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>90-94</TableCell>
                          <TableCell>ممتازة</TableCell>
                          <TableCell>
                            حالة عمل استثنائية؛ جذابة جداً للمستثمرين.
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>95-100</TableCell>
                          <TableCell>استثنائية</TableCell>
                          <TableCell>
                            فئة نادرة؛ إمكانات وتنفيذ مميزان.
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </TableContainer>

                  <Box>
                    <Typography
                      variant="subtitle2"
                      sx={{ fontWeight: 600, mb: 1.5, color: 'warning.main' }}
                    >
                      ما لا تضمنه الدرجة:
                    </Typography>
                    <List>
                      {[
                        'نجاح الاستثمار أو ربحيته',
                        'تمويلاً من أي مستثمر بعينه',
                        'جدوى السوق أو طلب العملاء',
                        'الامتثال القانوني أو التنظيمي',
                      ].map((item, index) => (
                        <ListItem key={index} sx={{ py: 0.5 }}>
                          <ListItemIcon sx={{ minWidth: 36 }}>
                            <WarningAmber
                              sx={{
                                fontSize: '1.25rem',
                                color: 'warning.main',
                              }}
                            />
                          </ListItemIcon>
                          <ListItemText
                            primary={item}
                            primaryTypographyProps={{ variant: 'body2' }}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                </Stack>
              </AccordionDetails>
            </Accordion>

            {/* Section 3: Connection Process */}
            <Accordion
              expanded={expandedAccordion === 'section3'}
              onChange={handleAccordionChange('section3')}
              sx={{ mb: 3 }}
            >
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  {sectionIcons.section3}
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    عملية التواصل
                  </Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Stack spacing={3}>
                  <Grid container spacing={2}>
                    {[
                      {
                        title: 'تصفّح',
                        description: 'بهوية محفوظة',
                        details:
                          'يمكنك رؤية العروض والدرجات دون كشف هويتك.',
                      },
                      {
                        title: 'اطلب',
                        description: 'بموافقة الطرفين',
                        details:
                          'أرسل طلب تواصل — والمؤسس يقرر القبول أو الرفض.',
                      },
                      {
                        title: 'تواصل',
                        description: 'وصول كامل',
                        details:
                          'بعد القبول، تتشاركان الملفات الكاملة وتجريان محادثات غير محدودة.',
                      },
                    ].map((step, index) => (
                      <Grid size={{ xs: 12, sm: 4 }} key={index}>
                        <Card sx={{ height: '100%' }}>
                          <CardContent>
                            <Typography
                              variant="subtitle1"
                              sx={{ fontWeight: 700, mb: 0.5 }}
                            >
                              {step.title}
                            </Typography>
                            <Typography
                              variant="caption"
                              sx={{
                                color: 'primary.main',
                                fontWeight: 600,
                                display: 'block',
                                mb: 1.5,
                              }}
                            >
                              {step.description}
                            </Typography>
                            <Typography variant="body2">
                              {step.details}
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>

                  <Box>
                    <Typography
                      variant="subtitle2"
                      sx={{ fontWeight: 600, mb: 1.5 }}
                    >
                      قواعد العملية:
                    </Typography>
                    <List>
                      {[
                        'يستطيع المؤسسون رفض طلبات التواصل دون أي عقوبة.',
                        'هويتك مخفية حتى يقبل الطرفان التواصل.',
                        'لا تواصل قبل قبول الطلب.',
                      ].map((item, index) => (
                        <ListItem key={index} sx={{ py: 0.5 }}>
                          <ListItemIcon sx={{ minWidth: 36 }}>
                            <InfoOutlined
                              sx={{
                                fontSize: '1.25rem',
                                color: 'info.main',
                              }}
                            />
                          </ListItemIcon>
                          <ListItemText
                            primary={item}
                            primaryTypographyProps={{ variant: 'body2' }}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                </Stack>
              </AccordionDetails>
            </Accordion>

            {/* Section 4: Due Diligence Tips */}
            <Accordion
              expanded={expandedAccordion === 'section4'}
              onChange={handleAccordionChange('section4')}
              sx={{ mb: 3 }}
            >
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  {sectionIcons.section4}
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    نصائح الفحص النافي للجهالة
                  </Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={3}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Box>
                      <Typography
                        variant="subtitle2"
                        sx={{ fontWeight: 600, mb: 1.5 }}
                      >
                        أسئلة تطرحها
                      </Typography>
                      <List>
                        {[
                          'ما المشكلة التي يحلها المشروع؟',
                          'من العميل المستهدف؟',
                          'ما نموذج العمل؟',
                          'ما الميزة التنافسية؟',
                          'ما المؤشرات والمحطات الرئيسية؟',
                        ].map((item, index) => (
                          <ListItem key={index} sx={{ py: 0.5 }}>
                            <ListItemIcon sx={{ minWidth: 36 }}>
                              <Checkbox
                                disabled
                                checked={false}
                                size="small"
                              />
                            </ListItemIcon>
                            <ListItemText
                              primary={item}
                              primaryTypographyProps={{ variant: 'body2' }}
                            />
                          </ListItem>
                        ))}
                      </List>
                    </Box>
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Box>
                      <Typography
                        variant="subtitle2"
                        sx={{ fontWeight: 600, mb: 1.5, color: 'error.main' }}
                      >
                        إشارات الخطر
                      </Typography>
                      <List>
                        {[
                          'توقعات إيرادات غير واقعية',
                          'غموض نموذج العمل',
                          'لا منتج فعلي بعد (وعود فقط)',
                          'مؤسس بلا خبرة ذات صلة',
                          'طلب دفعات مقدمة',
                        ].map((item, index) => (
                          <ListItem key={index} sx={{ py: 0.5 }}>
                            <ListItemIcon sx={{ minWidth: 36 }}>
                              <WarningAmber
                                sx={{
                                  fontSize: '1.25rem',
                                  color: 'error.main',
                                }}
                              />
                            </ListItemIcon>
                            <ListItemText
                              primary={item}
                              primaryTypographyProps={{ variant: 'body2' }}
                            />
                          </ListItem>
                        ))}
                      </List>

                      <Typography
                        variant="subtitle2"
                        sx={{ fontWeight: 600, mt: 2.5, mb: 1.5, color: 'success.main' }}
                      >
                        إشارات إيجابية
                      </Typography>
                      <List>
                        {[
                          'رؤية واضحة وشغف حقيقي',
                          'فريق تأسيسي قوي',
                          'منتج يعمل مع انطلاقة مبكرة',
                          'استراتيجية دخول سوق واضحة',
                          'شفافية في التقارير المالية',
                        ].map((item, index) => (
                          <ListItem key={index} sx={{ py: 0.5 }}>
                            <ListItemIcon sx={{ minWidth: 36 }}>
                              <CheckCircle
                                sx={{
                                  fontSize: '1.25rem',
                                  color: 'success.main',
                                }}
                              />
                            </ListItemIcon>
                            <ListItemText
                              primary={item}
                              primaryTypographyProps={{ variant: 'body2' }}
                            />
                          </ListItem>
                        ))}
                      </List>
                    </Box>
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>

            {/* Section 5: What Bethra Is and Isn't */}
            <Accordion
              expanded={expandedAccordion === 'section5'}
              onChange={handleAccordionChange('section5')}
              sx={{ mb: 3 }}
            >
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  {sectionIcons.section5}
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    ما هي بذرة (وما ليست)
                  </Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Stack spacing={3}>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Card
                        sx={{
                          height: '100%',
                          borderLeft: `4px solid ${
                            new URL('', window.location.href).searchParams ||
                            '#2A8A52'
                          }`,
                          backgroundColor: '#F0F5F1',
                        }}
                      >
                        <CardContent>
                          <Typography
                            variant="h6"
                            sx={{ fontWeight: 700, mb: 2 }}
                          >
                            بذرة هي
                          </Typography>
                          <List>
                            {[
                              'سوق يربط المستثمرين بالمؤسسين',
                              'منصة للمحادثات والتواصلات الأولية',
                              'أداة بحث لتقييم الفرص',
                              'مجتمع من المستثمرين والبنّائين المتشابهين',
                            ].map((item, index) => (
                              <ListItem key={index} sx={{ py: 0.5 }}>
                                <ListItemIcon sx={{ minWidth: 36 }}>
                                  <CheckCircle
                                    sx={{
                                      fontSize: '1.25rem',
                                      color: 'success.main',
                                    }}
                                  />
                                </ListItemIcon>
                                <ListItemText
                                  primary={item}
                                  primaryTypographyProps={{
                                    variant: 'body2',
                                  }}
                                />
                              </ListItem>
                            ))}
                          </List>
                        </CardContent>
                      </Card>
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Card
                        sx={{
                          height: '100%',
                          borderLeft: `4px solid #C0392B`,
                          backgroundColor: '#FAF0EE',
                        }}
                      >
                        <CardContent>
                          <Typography
                            variant="h6"
                            sx={{ fontWeight: 700, mb: 2 }}
                          >
                            بذرة ليست
                          </Typography>
                          <List>
                            {[
                              'مستشاراً مالياً أو استثمارياً',
                              'مستشاراً قانونياً أو ضريبياً',
                              'طرفاً في أي صفقة أو اتفاق',
                              'مسؤولة عن نتائج الاستثمار',
                            ].map((item, index) => (
                              <ListItem key={index} sx={{ py: 0.5 }}>
                                <ListItemIcon sx={{ minWidth: 36 }}>
                                  <WarningAmber
                                    sx={{
                                      fontSize: '1.25rem',
                                      color: 'error.main',
                                    }}
                                  />
                                </ListItemIcon>
                                <ListItemText
                                  primary={item}
                                  primaryTypographyProps={{
                                    variant: 'body2',
                                  }}
                                />
                              </ListItem>
                            ))}
                          </List>
                        </CardContent>
                      </Card>
                    </Grid>
                  </Grid>

                  <Card sx={{ backgroundColor: '#F5EAD3', border: '1px solid #F5EAD3' }}>
                    <CardContent>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        بذرة ليست طرفاً في أي صفقة أو اتفاق أبداً. كل قرارات الاستثمار وشروطه ومفاوضاته تتم بالكامل بين المستثمر والمؤسس.
                      </Typography>
                    </CardContent>
                  </Card>
                </Stack>
              </AccordionDetails>
            </Accordion>

            {/* Section 6: FAQ */}
            <Accordion
              expanded={expandedAccordion === 'section6'}
              onChange={handleAccordionChange('section6')}
              sx={{ mb: 4 }}
            >
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  {sectionIcons.section6}
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    الأسئلة الشائعة
                  </Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Stack spacing={0}>
                  {faqItems.map((faq, index) => (
                    <Accordion
                      key={index}
                      sx={{
                        boxShadow: 'none',
                        border: 'none',
                        '&:before': {
                          display: 'none',
                        },
                      }}
                    >
                      <AccordionSummary expandIcon={<ExpandMore />}>
                        <Typography sx={{ fontWeight: 600 }}>
                          {faq.question}
                        </Typography>
                      </AccordionSummary>
                      <AccordionDetails>
                        <Typography variant="body2">
                          {faq.answer}
                        </Typography>
                      </AccordionDetails>
                    </Accordion>
                  ))}
                </Stack>
              </AccordionDetails>
            </Accordion>

            {/* Bottom CTA */}
            <Card sx={{ mt: 4, p: 3 }}>
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                spacing={2}
                alignItems="center"
                justifyContent="space-between"
              >
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
                    جاهز لإيجاد استثمارك القادم؟
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    ابدأ تصفح السوق واكتشف فرصاً واعدة.
                  </Typography>
                </Box>
                <Button variant="contained" sx={{ whiteSpace: 'nowrap' }}>
                  تصفّح السوق ←
                </Button>
              </Stack>
            </Card>

            <Box sx={{ py: 2 }} />
              </Grid>

              {/* Right: sticky WhatsApp sidebar */}
              <Grid size={{ xs: 12, md: 4 }}>
                <Box sx={{ position: { md: 'sticky' }, top: { md: 24 } }}>
                  <Card
                    sx={{
                      border: '2px solid #25D366',
                      borderRadius: 2,
                      overflow: 'hidden',
                    }}
                  >
                    <Box sx={{ bgcolor: '#25D366', px: 2.5, py: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <WhatsAppIcon sx={{ color: 'white', fontSize: 24 }} />
                      <Typography variant="subtitle1" fontWeight={700} sx={{ color: 'white' }}>
                        أسئلة؟
                      </Typography>
                    </Box>
                    <CardContent sx={{ p: 2.5 }}>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2, lineHeight: 1.7 }}>
                        فريقنا متاح على واتساب لمساعدتك في استخدام المنصة والإجابة عن أسئلتك الاستثمارية أو أمور حسابك.
                      </Typography>
                      <Button
                        component="a"
                        href="https://wa.me/14804476256"
                        target="_blank"
                        rel="noopener noreferrer"
                        variant="contained"
                        startIcon={<WhatsAppIcon />}
                        fullWidth
                        sx={{
                          bgcolor: '#25D366',
                          '&:hover': { bgcolor: '#1ebe5c' },
                          fontWeight: 700,
                          mb: 2,
                        }}
                      >
                        راسلنا على واتساب
                      </Button>
                      <Stack spacing={0.75}>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                          <Box component="span" sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#25D366', display: 'inline-block', flexShrink: 0 }} />
                          +1 (480) 447-6256
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                          <Box component="span" sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#25D366', display: 'inline-block', flexShrink: 0 }} />
                          الأحد–الخميس
                        </Typography>
                      </Stack>
                    </CardContent>
                  </Card>

                  <Card sx={{ mt: 2, bgcolor: 'grey.50' }}>
                    <CardContent sx={{ p: 2.5 }}>
                      <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                        روابط سريعة
                      </Typography>
                      <Stack spacing={1}>
                        {[
                          { label: 'تصفّح السوق', href: '/marketplace' },
                          { label: 'ملفك الشخصي', href: '/investor/profile' },
                          { label: 'تواصلاتك', href: '/investor/connections' },
                        ].map(link => (
                          <Typography
                            key={link.label}
                            component="a"
                            href={link.href}
                            variant="body2"
                            sx={{ color: 'primary.main', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
                          >
                            {link.label} ←
                          </Typography>
                        ))}
                      </Stack>
                    </CardContent>
                  </Card>
                </Box>
              </Grid>
            </Grid>
          </Container>
        </Box>
      </Box>
    </Box>
  );
}
