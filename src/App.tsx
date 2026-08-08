import { Suspense, lazy, Component, type ReactNode } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import CookieBanner from './components/CookieBanner';
import WhatsAppFAB from './components/WhatsAppFAB';
import WelcomeNotice from './components/WelcomeNotice';
import ReviewDialog from './components/ReviewDialog';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import theme from './theme';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { IdeaProvider } from './contexts/IdeaContext';
import { ReviewProvider } from './contexts/ReviewContext';
import ProtectedRoute from './components/ProtectedRoute';
import { AdminAuthProvider } from './contexts/AdminAuthContext';
import AdminProtectedRoute from './components/AdminProtectedRoute';

class RouteErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    if (this.state.failed) {
      return (
        <Box sx={{ py: 8, textAlign: 'center' }}>
          <Typography color="text.secondary">This page could not be loaded. Please refresh.</Typography>
        </Box>
      );
    }
    return this.props.children;
  }
}

const HomePage = lazy(() => import('./pages/HomePage'));
const IdeasLibraryPage = lazy(() => import('./pages/IdeasLibraryPage'));
const IdeasLibraryDetailPage = lazy(() => import('./pages/IdeasLibraryDetailPage'));
const IdeasLibraryCustomizePage = lazy(() => import('./pages/IdeasLibraryCustomizePage'));
const AdminIdeasLibraryPage = lazy(() => import('./pages/admin/AdminIdeasLibraryPage'));
const AdminIdeasFormPage = lazy(() => import('./pages/admin/AdminIdeasFormPage'));
const AdminIdeasAnalyticsPage = lazy(() => import('./pages/admin/AdminIdeasAnalyticsPage'));
const AdminIdeasSectorsPage = lazy(() => import('./pages/admin/AdminIdeasSectorsPage'));
const AdminIdeasImportExportPage = lazy(() => import('./pages/admin/AdminIdeasImportExportPage'));
const AdminSupportPage = lazy(() => import('./pages/admin/AdminSupportPage'));
const AdminTicketDetailPage = lazy(() => import('./pages/admin/AdminTicketDetailPage'));
const AdminSupportRecoveryPage = lazy(() => import('./pages/admin/AdminSupportRecoveryPage'));
const AdminCommentsPage = lazy(() => import('./pages/admin/AdminCommentsPage'));
const AdminTrafficPage = lazy(() => import('./pages/admin/AdminTrafficPage'));
const AdminUserAnalyticsPage = lazy(() => import('./pages/admin/AdminUserAnalyticsPage'));
const AdminBusinessPage = lazy(() => import('./pages/admin/AdminBusinessPage'));
const AdminAuditLogPage = lazy(() => import('./pages/admin/AdminAuditLogPage'));
const AdminPromoCodesPage = lazy(() => import('./pages/admin/AdminPromoCodesPage'));
const AdminContentPage = lazy(() => import('./pages/admin/AdminContentPage'));
const AdminSettingsPage = lazy(() => import('./pages/admin/AdminSettingsPage'));
const AdminLoginPage = lazy(() => import('./pages/admin/AdminLoginPage'));
const AdminVerify2FAPage = lazy(() => import('./pages/admin/AdminVerify2FAPage'));
const AdminSetup2FAPage = lazy(() => import('./pages/admin/AdminSetup2FAPage'));
const AdminAcceptInvitePage = lazy(() => import('./pages/admin/AdminAcceptInvitePage'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const AdminUsersPage = lazy(() => import('./pages/admin/AdminUsersPage'));
const AdminUserDetailPage = lazy(() => import('./pages/admin/AdminUserDetailPage'));
const AdminCRMDashboard = lazy(() => import('./pages/admin/AdminCRMDashboard'));
const AdminCRMUserProfile = lazy(() => import('./pages/admin/AdminCRMUserProfile'));
const AdminCRMTagsPage = lazy(() => import('./pages/admin/AdminCRMTagsPage'));
const AdminCRMSegmentsPage = lazy(() => import('./pages/admin/AdminCRMSegmentsPage'));
const AdminCRMSegmentDetail = lazy(() => import('./pages/admin/AdminCRMSegmentDetail'));
const AdminCampaignsPage = lazy(() => import('./pages/admin/AdminCampaignsPage'));
const AdminCampaignNew = lazy(() => import('./pages/admin/AdminCampaignNew'));
const AdminTemplatesPage = lazy(() => import('./pages/admin/AdminTemplatesPage'));
const AdminUploadContacts = lazy(() => import('./pages/admin/AdminUploadContacts'));
const AdminSuppressionPage = lazy(() => import('./pages/admin/AdminSuppressionPage'));
const AdminMarketingDashboard = lazy(() => import('./pages/admin/AdminMarketingDashboard'));
const AdminCampaignReport = lazy(() => import('./pages/admin/AdminCampaignReport'));
const AdminRevenuePage = lazy(() => import('./pages/admin/AdminRevenuePage'));
const AdminSubscriptionsPage = lazy(() => import('./pages/admin/AdminSubscriptionsPage'));
const AdminAutomationsPage = lazy(() => import('./pages/admin/AdminAutomationsPage'));
const AdminAutomationForm = lazy(() => import('./pages/admin/AdminAutomationForm'));
const AdminTestimonialsPage = lazy(() => import('./pages/admin/AdminTestimonialsPage'));
const AdminSuccessStoriesPage = lazy(() => import('./pages/admin/AdminSuccessStoriesPage'));
const AdminContactsPage = lazy(() => import('./pages/admin/AdminContactsPage'));
const PricingPage = lazy(() => import('./pages/PricingPage'));
const CheckoutPage = lazy(() => import('./pages/CheckoutPage'));
const CheckoutSuccessPage = lazy(() => import('./pages/CheckoutSuccessPage'));
const HelpCenterPage = lazy(() => import('./pages/HelpCenterPage'));

const LoginPage = lazy(() => import('./pages/auth/LoginPage'));
const SignupPage = lazy(() => import('./pages/auth/SignupPage'));
const ForgotPasswordPage = lazy(() => import('./pages/auth/ForgotPasswordPage'));
const OnboardingPage = lazy(() => import('./pages/auth/OnboardingPage'));

const FounderDashboard = lazy(() => import('./pages/founder/FounderDashboard'));
const AiCoachPage = lazy(() => import('./pages/AiCoachPage'));
const FounderConnectionsPage = lazy(() => import('./pages/founder/FounderConnectionsPage'));

const JourneyLayout = lazy(() => import('./pages/journey/JourneyLayout'));
const IdeaPage = lazy(() => import('./pages/journey/IdeaPage'));
const ValidationPage = lazy(() => import('./pages/journey/ValidationPage'));
const CanvasPage = lazy(() => import('./pages/journey/CanvasPage'));
const SwotPage = lazy(() => import('./pages/journey/SwotPage'));
const PitchPage = lazy(() => import('./pages/journey/PitchPage'));
const NinetyDayPage = lazy(() => import('./pages/journey/NinetyDayPage'));

const GroupsPage = lazy(() => import('./pages/groups/GroupsPage'));
const GroupDetailPage = lazy(() => import('./pages/groups/GroupDetailPage'));

const InvestorDashboard = lazy(() => import('./pages/investor/InvestorDashboard'));
const InvestorMarketplacePage = lazy(() => import('./pages/investor/InvestorMarketplacePage'));
const IdeaDetailPage = lazy(() => import('./pages/investor/IdeaDetailPage'));
const InvestorConnectionsPage = lazy(() => import('./pages/investor/InvestorConnectionsPage'));
const ConnectionChatPage = lazy(() => import('./pages/investor/ConnectionChatPage'));
const InvestorGuidePage = lazy(() => import('./pages/investor/InvestorGuidePage'));
const InvestorProfilePage = lazy(() => import('./pages/investor/InvestorProfilePage'));

const ValidatePage = lazy(() => import('./pages/ValidatePage'));
const PrivacyPolicyPage = lazy(() => import('./pages/PrivacyPolicyPage'));
const TermsPage = lazy(() => import('./pages/TermsPage'));
const IpProtectionPage = lazy(() => import('./pages/IpProtectionPage'));
const CookiePolicyPage = lazy(() => import('./pages/CookiePolicyPage'));
const ContactPage = lazy(() => import('./pages/ContactPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const WearLessHatsPage = lazy(() => import('./pages/WearLessHatsPage'));
const WallOfFamePage = lazy(() => import('./pages/WallOfFamePage'));
const WhyBethraPage = lazy(() => import('./pages/WhyBethraPage'));
const BlogPage = lazy(() => import('./pages/BlogPage'));
const UnsubscribePage = lazy(() => import('./pages/UnsubscribePage'));

function PageLoader() {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <CircularProgress />
    </Box>
  );
}

function ReviewWrapper({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  return (
    <ReviewProvider userId={user?.id ?? null}>
      {children}
      <ReviewDialog />
    </ReviewProvider>
  );
}

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <AdminAuthProvider>
          <BrowserRouter>
            <AppContent />
          </BrowserRouter>
        </AdminAuthProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export function AppContent() {
  return (
    <ReviewWrapper>
      <Suspense fallback={<PageLoader />}>
        <AppRoutes />
      </Suspense>
      <CookieBanner />
      <WhatsAppFAB />
      <WelcomeNotice />
    </ReviewWrapper>
  );
}

export function AppRoutes() {
  return (
    <Routes>
              {/* Public routes */}
              <Route path="/" element={<HomePage />} />
              <Route path="/ideas-library" element={<IdeasLibraryPage />} />
              <Route
                path="/ideas-library/:slug"
                element={
                  <ProtectedRoute>
                    <IdeasLibraryDetailPage />
                  </ProtectedRoute>
                }
              />
              <Route path="/ideas-library/:slug/customize" element={<IdeasLibraryCustomizePage />} />
              <Route path="/pricing" element={<PricingPage />} />
              <Route path="/validate" element={<ValidatePage />} />
              <Route path="/help" element={<HelpCenterPage />} />

              {/* Checkout */}
              <Route
                path="/checkout"
                element={
                  <ProtectedRoute>
                    <CheckoutPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/checkout/success"
                element={
                  <ProtectedRoute>
                    <CheckoutSuccessPage />
                  </ProtectedRoute>
                }
              />

              {/* Auth routes */}
              <Route path="/signup" element={<SignupPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />

              {/* Onboarding */}
              <Route
                path="/onboarding"
                element={
                  <ProtectedRoute requireOnboarding={false}>
                    <OnboardingPage />
                  </ProtectedRoute>
                }
              />

              {/* Founder routes — all wrapped in IdeaProvider */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute role="founder">
                    <IdeaProvider>
                      <FounderDashboard />
                    </IdeaProvider>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/ai-coach"
                element={
                  <ProtectedRoute role="founder">
                    <IdeaProvider>
                      <AiCoachPage />
                    </IdeaProvider>
                  </ProtectedRoute>
                }
              />

              {/* Journey nested routes */}
              <Route
                path="/journey"
                element={
                  <ProtectedRoute role="founder">
                    <IdeaProvider>
                      <JourneyLayout />
                    </IdeaProvider>
                  </ProtectedRoute>
                }
              >
                <Route index element={<IdeaPage />} />
                <Route path="validation" element={<ValidationPage />} />
                <Route path="canvas" element={<CanvasPage />} />
                <Route path="swot" element={<SwotPage />} />
                <Route path="pitch" element={<PitchPage />} />
                <Route path="90-day" element={<NinetyDayPage />} />
              </Route>

              {/* Groups routes */}
              <Route
                path="/groups"
                element={
                  <ProtectedRoute role="founder">
                    <IdeaProvider>
                      <GroupsPage />
                    </IdeaProvider>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/groups/:id"
                element={
                  <ProtectedRoute role="founder">
                    <IdeaProvider>
                      <GroupDetailPage />
                    </IdeaProvider>
                  </ProtectedRoute>
                }
              />

              {/* Founder connections */}
              <Route
                path="/connections"
                element={
                  <ProtectedRoute role="founder">
                    <IdeaProvider>
                      <FounderConnectionsPage />
                    </IdeaProvider>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/connections/:id"
                element={
                  <ProtectedRoute role="founder">
                    <IdeaProvider>
                      <ConnectionChatPage />
                    </IdeaProvider>
                  </ProtectedRoute>
                }
              />

              {/* Investor routes */}
              <Route
                path="/investor/dashboard"
                element={
                  <ProtectedRoute role="investor">
                    <InvestorDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/marketplace"
                element={
                  <ProtectedRoute role="investor">
                    <InvestorMarketplacePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/marketplace/:id"
                element={
                  <ProtectedRoute role="investor">
                    <IdeaDetailPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/investor/connections"
                element={
                  <ProtectedRoute role="investor">
                    <InvestorConnectionsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/investor/connections/:id"
                element={
                  <ProtectedRoute role="investor">
                    <ConnectionChatPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/investor/guide"
                element={
                  <ProtectedRoute role="investor">
                    <InvestorGuidePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/investor/profile"
                element={
                  <ProtectedRoute role="investor">
                    <InvestorProfilePage />
                  </ProtectedRoute>
                }
              />

              {/* Shared protected routes */}
              <Route
                path="/settings"
                element={
                  <ProtectedRoute>
                    <SettingsPage />
                  </ProtectedRoute>
                }
              />

              {/* Admin routes */}
              <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="/admin/login" element={<AdminLoginPage />} />
              <Route path="/admin/verify-2fa" element={<AdminVerify2FAPage />} />
              <Route path="/admin/accept-invite" element={<AdminAcceptInvitePage />} />
              <Route
                path="/admin/setup-2fa"
                element={
                  <AdminProtectedRoute noLayout>
                    <AdminSetup2FAPage />
                  </AdminProtectedRoute>
                }
              />
              <Route
                path="/admin/dashboard"
                element={
                  <AdminProtectedRoute>
                    <AdminDashboard />
                  </AdminProtectedRoute>
                }
              />
              <Route
                path="/admin/users"
                element={
                  <AdminProtectedRoute>
                    <AdminUsersPage />
                  </AdminProtectedRoute>
                }
              />
              <Route
                path="/admin/users/:id"
                element={
                  <AdminProtectedRoute>
                    <AdminUserDetailPage />
                  </AdminProtectedRoute>
                }
              />
              <Route
                path="/admin/ideas-library"
                element={
                  <AdminProtectedRoute>
                    <AdminIdeasLibraryPage />
                  </AdminProtectedRoute>
                }
              />
              <Route
                path="/admin/ideas-library/new"
                element={
                  <AdminProtectedRoute>
                    <AdminIdeasFormPage />
                  </AdminProtectedRoute>
                }
              />
              <Route
                path="/admin/ideas-library/:id/edit"
                element={
                  <AdminProtectedRoute>
                    <AdminIdeasFormPage />
                  </AdminProtectedRoute>
                }
              />
              <Route
                path="/admin/ideas-library/:id/analytics"
                element={
                  <AdminProtectedRoute>
                    <AdminIdeasAnalyticsPage />
                  </AdminProtectedRoute>
                }
              />
              <Route
                path="/admin/ideas-library/sectors"
                element={
                  <AdminProtectedRoute>
                    <AdminIdeasSectorsPage />
                  </AdminProtectedRoute>
                }
              />
              <Route
                path="/admin/ideas-library/import-export"
                element={
                  <AdminProtectedRoute>
                    <AdminIdeasImportExportPage />
                  </AdminProtectedRoute>
                }
              />
              <Route
                path="/admin/support/recovery"
                element={
                  <AdminProtectedRoute>
                    <AdminSupportRecoveryPage />
                  </AdminProtectedRoute>
                }
              />
              <Route
                path="/admin/support/:id"
                element={
                  <AdminProtectedRoute>
                    <AdminTicketDetailPage />
                  </AdminProtectedRoute>
                }
              />
              <Route
                path="/admin/support"
                element={
                  <AdminProtectedRoute>
                    <AdminSupportPage />
                  </AdminProtectedRoute>
                }
              />
              <Route
                path="/admin/comments"
                element={
                  <AdminProtectedRoute>
                    <AdminCommentsPage />
                  </AdminProtectedRoute>
                }
              />
              <Route
                path="/admin/promo-codes"
                element={
                  <AdminProtectedRoute>
                    <AdminPromoCodesPage />
                  </AdminProtectedRoute>
                }
              />
              <Route
                path="/admin/content"
                element={
                  <AdminProtectedRoute>
                    <AdminContentPage />
                  </AdminProtectedRoute>
                }
              />
              <Route
                path="/admin/analytics/traffic"
                element={
                  <AdminProtectedRoute>
                    <RouteErrorBoundary><AdminTrafficPage /></RouteErrorBoundary>
                  </AdminProtectedRoute>
                }
              />
              <Route
                path="/admin/analytics/users"
                element={
                  <AdminProtectedRoute>
                    <RouteErrorBoundary><AdminUserAnalyticsPage /></RouteErrorBoundary>
                  </AdminProtectedRoute>
                }
              />
              <Route
                path="/admin/analytics/business"
                element={
                  <AdminProtectedRoute>
                    <RouteErrorBoundary><AdminBusinessPage /></RouteErrorBoundary>
                  </AdminProtectedRoute>
                }
              />
              <Route
                path="/admin/audit-log"
                element={
                  <AdminProtectedRoute>
                    <AdminAuditLogPage />
                  </AdminProtectedRoute>
                }
              />
              <Route
                path="/admin/settings"
                element={
                  <AdminProtectedRoute>
                    <AdminSettingsPage />
                  </AdminProtectedRoute>
                }
              />
              <Route
                path="/admin/crm"
                element={
                  <AdminProtectedRoute>
                    <AdminCRMDashboard />
                  </AdminProtectedRoute>
                }
              />
              <Route
                path="/admin/crm/users/:id"
                element={
                  <AdminProtectedRoute>
                    <AdminCRMUserProfile />
                  </AdminProtectedRoute>
                }
              />
              <Route
                path="/admin/crm/tags"
                element={
                  <AdminProtectedRoute>
                    <AdminCRMTagsPage />
                  </AdminProtectedRoute>
                }
              />
              <Route
                path="/admin/crm/segments/:id"
                element={
                  <AdminProtectedRoute>
                    <AdminCRMSegmentDetail />
                  </AdminProtectedRoute>
                }
              />
              <Route
                path="/admin/crm/segments"
                element={
                  <AdminProtectedRoute>
                    <AdminCRMSegmentsPage />
                  </AdminProtectedRoute>
                }
              />
              <Route
                path="/admin/crm/revenue"
                element={
                  <AdminProtectedRoute>
                    <AdminRevenuePage />
                  </AdminProtectedRoute>
                }
              />
              <Route
                path="/admin/crm/revenue/subscriptions"
                element={
                  <AdminProtectedRoute>
                    <AdminSubscriptionsPage />
                  </AdminProtectedRoute>
                }
              />
              <Route
                path="/admin/marketing/campaigns/new"
                element={
                  <AdminProtectedRoute>
                    <AdminCampaignNew />
                  </AdminProtectedRoute>
                }
              />
              <Route
                path="/admin/marketing/campaigns/:id/report"
                element={
                  <AdminProtectedRoute>
                    <AdminCampaignReport />
                  </AdminProtectedRoute>
                }
              />
              <Route
                path="/admin/marketing/campaigns"
                element={
                  <AdminProtectedRoute>
                    <AdminCampaignsPage />
                  </AdminProtectedRoute>
                }
              />
              <Route
                path="/admin/marketing"
                element={
                  <AdminProtectedRoute>
                    <AdminMarketingDashboard />
                  </AdminProtectedRoute>
                }
              />
              <Route
                path="/admin/marketing/templates"
                element={
                  <AdminProtectedRoute>
                    <AdminTemplatesPage />
                  </AdminProtectedRoute>
                }
              />
              <Route
                path="/admin/marketing/upload"
                element={
                  <AdminProtectedRoute>
                    <AdminUploadContacts />
                  </AdminProtectedRoute>
                }
              />
              <Route
                path="/admin/marketing/suppression"
                element={
                  <AdminProtectedRoute>
                    <AdminSuppressionPage />
                  </AdminProtectedRoute>
                }
              />
              <Route
                path="/admin/marketing/contacts"
                element={
                  <AdminProtectedRoute>
                    <AdminContactsPage />
                  </AdminProtectedRoute>
                }
              />
              <Route
                path="/admin/marketing/testimonials"
                element={
                  <AdminProtectedRoute>
                    <AdminTestimonialsPage />
                  </AdminProtectedRoute>
                }
              />
              <Route
                path="/admin/marketing/success-stories"
                element={
                  <AdminProtectedRoute>
                    <AdminSuccessStoriesPage />
                  </AdminProtectedRoute>
                }
              />
              <Route
                path="/admin/marketing/automations/new"
                element={
                  <AdminProtectedRoute>
                    <AdminAutomationForm />
                  </AdminProtectedRoute>
                }
              />
              <Route
                path="/admin/marketing/automations/:id/edit"
                element={
                  <AdminProtectedRoute>
                    <AdminAutomationForm />
                  </AdminProtectedRoute>
                }
              />
              <Route
                path="/admin/marketing/automations"
                element={
                  <AdminProtectedRoute>
                    <AdminAutomationsPage />
                  </AdminProtectedRoute>
                }
              />

              {/* Legal */}
              <Route path="/privacy" element={<PrivacyPolicyPage />} />
              <Route path="/terms" element={<TermsPage />} />
              <Route path="/ip-protection" element={<IpProtectionPage />} />
              <Route path="/cookies" element={<CookiePolicyPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/wear-less-hats" element={<WearLessHatsPage />} />
              <Route path="/wall-of-fame" element={<WallOfFamePage />} />
              <Route path="/why-bethra" element={<WhyBethraPage />} />
              <Route path="/blog" element={<BlogPage />} />
              <Route path="/unsubscribe" element={<UnsubscribePage />} />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
