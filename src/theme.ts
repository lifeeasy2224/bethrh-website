import { createTheme, responsiveFontSizes } from '@mui/material/styles';

// Bethra brand fonts: Noto Kufi Arabic (primary, Arabic + UI) with Nunito Sans
// fallback for Latin text and numbers. NEVER apply letter-spacing to Arabic —
// it breaks the cursive joining of the script, so letterSpacing is 'normal'
// throughout and textTransform is 'none' (Arabic has no letter case).
const FONT = '"Noto Kufi Arabic", "Nunito Sans", -apple-system, sans-serif';

// Bethra palette (from the official brand guidelines, 05-07-2026).
const GREEN_DEEP = '#0F3D24'; // primary — deepest forest green
const GREEN_MID = '#1B6B3E';  // primary hover / mid green
const GOLD = '#D4A653';       // accent — gold (CTAs, wordmark)
const GOLD_LIGHT = '#E8C07A';
const GOLD_DARK = '#A07830';
const CREAM = '#F7F3EC';      // page background
const BEIGE = '#E8E4DC';      // surfaces / borders
const TAUPE = '#8A8070';      // muted text
const INK = '#1A1A1A';        // near-black body text

let theme = createTheme({
  direction: 'rtl',
  palette: {
    mode: 'light',
    primary: {
      main: GREEN_DEEP,
      light: GREEN_MID,
      dark: '#0A2A19',
      contrastText: CREAM,
    },
    secondary: {
      main: GOLD,
      light: GOLD_LIGHT,
      dark: GOLD_DARK,
      contrastText: GREEN_DEEP,
    },
    warning: {
      main: '#D08A28',
      light: '#E8C07A',
      dark: '#A07830',
      contrastText: '#ffffff',
    },
    success: {
      main: '#2A8A52',
      light: '#3AAD6A',
      dark: '#1B6B3E',
    },
    error: {
      main: '#C0392B',
      light: '#E05B4C',
      dark: '#96271B',
    },
    info: { main: GREEN_MID },
    background: {
      default: CREAM,
      paper: '#FFFFFF',
    },
    text: {
      primary: INK,
      secondary: TAUPE,
      disabled: '#B5AE9F',
    },
    divider: BEIGE,
    grey: {
      50: '#FAF8F3',
      100: CREAM,
      200: BEIGE,
      300: '#D8D3C8',
      400: TAUPE,
      500: '#6E6555',
      600: '#554E41',
      700: '#3E382E',
      800: '#2A251E',
      900: INK,
    },
  },
  typography: {
    // Arabic reads comfortably with more line-height than Latin; letterSpacing
    // stays 'normal' everywhere (see note above).
    fontFamily: FONT,
    htmlFontSize: 16,
    h1: { fontFamily: FONT, fontWeight: 700, fontSize: '3rem', lineHeight: 1.4, letterSpacing: 'normal' },
    h2: { fontFamily: FONT, fontWeight: 700, fontSize: '2rem', lineHeight: 1.45, letterSpacing: 'normal' },
    h3: { fontFamily: FONT, fontWeight: 600, fontSize: '1.5rem', lineHeight: 1.5, letterSpacing: 'normal' },
    h4: { fontFamily: FONT, fontWeight: 600, fontSize: '1.125rem', lineHeight: 1.5, letterSpacing: 'normal' },
    h5: { fontFamily: FONT, fontWeight: 600, fontSize: '1.125rem', lineHeight: 1.5, letterSpacing: 'normal' },
    h6: { fontFamily: FONT, fontWeight: 600, fontSize: '1rem', lineHeight: 1.5, letterSpacing: 'normal' },
    body1: { fontFamily: FONT, fontWeight: 400, fontSize: '1rem', lineHeight: 1.9, letterSpacing: 'normal' },
    body2: { fontFamily: FONT, fontWeight: 400, fontSize: '0.9375rem', lineHeight: 1.85, letterSpacing: 'normal' },
    subtitle1: { fontFamily: FONT, fontWeight: 500, fontSize: '1rem', letterSpacing: 'normal' },
    subtitle2: { fontFamily: FONT, fontWeight: 600, fontSize: '0.9375rem', letterSpacing: 'normal' },
    caption: { fontFamily: FONT, fontWeight: 400, fontSize: '0.75rem', letterSpacing: 'normal' },
    button: { fontFamily: FONT, fontWeight: 700, fontSize: '0.9375rem', textTransform: 'none', letterSpacing: 'normal' },
    overline: { fontFamily: FONT, fontWeight: 600, fontSize: '0.75rem', letterSpacing: 'normal', textTransform: 'none' },
  },
  shape: { borderRadius: 10 },
  components: {
    MuiCssBaseline: {
      styleOverrides: { body: { fontFamily: FONT, backgroundColor: CREAM } },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: {
          borderRadius: 10,
          fontWeight: 700,
          textTransform: 'none',
          letterSpacing: 'normal',
          padding: '10px 22px',
          transition: 'all 150ms ease',
        },
        sizeLarge: { padding: '14px 32px', fontSize: '1rem' },
        sizeSmall: { padding: '6px 14px', fontSize: '0.8125rem' },
        contained: {
          '&.MuiButton-containedPrimary': {
            background: `linear-gradient(135deg, ${GREEN_MID} 0%, ${GREEN_DEEP} 100%)`,
            color: CREAM,
            '&:hover': { background: `linear-gradient(135deg, #217A48 0%, #123F27 100%)` },
          },
          '&.MuiButton-containedSecondary': {
            background: `linear-gradient(135deg, ${GOLD} 0%, ${GOLD_DARK} 100%)`,
            color: GREEN_DEEP,
            '&:hover': { background: `linear-gradient(135deg, ${GOLD_LIGHT} 0%, ${GOLD} 100%)` },
          },
        },
        outlined: { borderWidth: '1.5px', '&:hover': { borderWidth: '1.5px' } },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: { borderRadius: 14, border: `1px solid ${BEIGE}`, boxShadow: '0 1px 3px rgba(15,61,36,0.06)', backgroundImage: 'none' },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: { backgroundImage: 'none' },
        elevation1: { boxShadow: '0 1px 3px rgba(15,61,36,0.06)' },
      },
    },
    MuiTextField: {
      defaultProps: { variant: 'outlined' },
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 10,
            '& fieldset': { borderColor: BEIGE, borderWidth: '1.5px' },
            '&:hover fieldset': { borderColor: '#D8D3C8' },
            '&.Mui-focused fieldset': { borderColor: GOLD, borderWidth: '2px' },
          },
          '& .MuiInputLabel-root.Mui-focused': { color: GOLD },
        },
      },
    },
    MuiChip: {
      styleOverrides: { root: { fontWeight: 600, fontSize: '0.75rem', borderRadius: 9999 } },
    },
    MuiDrawer: { styleOverrides: { paper: { backgroundImage: 'none' } } },
    MuiAppBar: { styleOverrides: { root: { backgroundImage: 'none' } } },
    MuiDivider: { styleOverrides: { root: { borderColor: BEIGE } } },
    MuiLinearProgress: {
      styleOverrides: {
        root: { borderRadius: 4, backgroundColor: BEIGE },
        bar: { borderRadius: 4 },
      },
    },
    MuiAccordion: {
      styleOverrides: { root: { borderRadius: '10px !important', '&:before': { display: 'none' } } },
    },
    MuiTooltip: {
      styleOverrides: { tooltip: { backgroundColor: GREEN_DEEP, fontSize: '0.75rem', borderRadius: 6 } },
    },
    MuiTab: {
      styleOverrides: { root: { textTransform: 'none', fontWeight: 500 } },
    },
  },
});

theme = responsiveFontSizes(theme);
export default theme;
