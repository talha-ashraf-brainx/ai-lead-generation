import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { MotionConfig } from 'motion/react'
import { AuthProvider } from './context/AuthContext'
import { ProtectedRoute } from './routes/ProtectedRoute'
import { AppLayout } from './components/layout/AppLayout'
import { ErrorBoundary } from './components/ErrorBoundary'
import { LoginPage } from './pages/LoginPage'
import { ForgotPasswordPage } from './pages/ForgotPasswordPage'
import { NotFoundPage } from './pages/NotFoundPage'
import { LeadsPage } from './pages/leads/LeadsPage'
import { LeadImportPage } from './pages/leads/LeadImportPage'
import { EmailReviewPage } from './pages/leads/EmailReviewPage'
import { CampaignsPage } from './pages/campaigns/CampaignsPage'
import { CampaignWizardPage } from './pages/campaigns/CampaignWizardPage'
import { CampaignDetailPage } from './pages/campaigns/CampaignDetailPage'
import { TrackerPage } from './pages/TrackerPage'
import { AnalyticsPage } from './pages/AnalyticsPage'
import { SettingsPage } from './pages/SettingsPage'
import { DebugPage } from './pages/DebugPage'

function App() {
  return (
    <MotionConfig reducedMotion="user">
      <ErrorBoundary>
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route
                element={
                  <ProtectedRoute>
                    <AppLayout />
                  </ProtectedRoute>
                }
              >
                <Route path="/leads" element={<LeadsPage />} />
                <Route path="/leads/import" element={<LeadImportPage />} />
                <Route path="/leads/:leadId/email" element={<EmailReviewPage />} />
                <Route path="/campaigns" element={<CampaignsPage />} />
                <Route path="/campaigns/new" element={<CampaignWizardPage />} />
                <Route path="/campaigns/:campaignId" element={<CampaignDetailPage />} />
                <Route path="/tracker" element={<TrackerPage />} />
                <Route path="/analytics" element={<AnalyticsPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/debug" element={<DebugPage />} />
              </Route>
              <Route path="/" element={<Navigate to="/leads" replace />} />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </ErrorBoundary>
    </MotionConfig>
  )
}

export default App
