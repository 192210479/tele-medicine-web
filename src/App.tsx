import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { NotificationProvider } from './context/NotificationContext';
import { WebLayout } from './components/layout/WebLayout';
// Screens
import { SplashScreen } from './pages/SplashScreen';
import { OnboardingScreen } from './pages/OnboardingScreen';
import { GetStartedScreen } from './pages/GetStartedScreen';
import { LoginScreen } from './pages/LoginScreen';
import { RegistrationScreen } from './pages/RegistrationScreen';
import { ResetPasswordScreen } from './pages/ResetPasswordScreen';
import { PatientDashboard } from './pages/PatientDashboard';
import { DoctorDashboard } from './pages/DoctorDashboard';
import { AdminDashboard } from './pages/AdminDashboard';
import { AppointmentBooking } from './pages/AppointmentBooking';
import { BookingConfirmation } from './pages/BookingConfirmation';
import { HistoryScreen } from './pages/HistoryScreen';
import { PrescriptionScreen } from './pages/PrescriptionScreen';
import { PatientPrescriptionsScreen } from './pages/PatientPrescriptionsScreen';
import { ProfileScreen } from './pages/ProfileScreen';
// Patient Flow
import { UpcomingAppointmentsScreen } from './pages/UpcomingAppointmentsScreen';
import { PatientWaitingRoomScreen } from './pages/PatientWaitingRoomScreen';
import { PatientVideoCallScreen } from './pages/PatientVideoCallScreen';
import { PatientWaitingForPrescriptionScreen } from './pages/PatientWaitingForPrescriptionScreen';
// Doctor Flow
import { DoctorVideoCallScreen } from './pages/DoctorVideoCallScreen';
import { DoctorPrescriptionCreationScreen } from './pages/DoctorPrescriptionCreationScreen';
// Other Screens
import { MissedAppointmentScreen } from './pages/MissedAppointmentScreen';
import { PatientDetailsScreen } from './pages/PatientDetailsScreen';
import { DoctorAppointmentsScreen } from './pages/DoctorAppointmentsScreen';
import { AdminAppointmentsScreen } from './pages/AdminAppointmentsScreen';
import { EditProfileScreen } from './pages/EditProfileScreen';
import { PrivacySecurityScreen } from './pages/PrivacySecurityScreen';
import { ChangePasswordScreen } from './pages/ChangePasswordScreen';
import { LoginActivityScreen } from './pages/LoginActivityScreen';
import { DeviceManagementScreen } from './pages/DeviceManagementScreen';
import { DataPolicyScreen } from './pages/DataPolicyScreen';
import { DeleteAccountScreen } from './pages/DeleteAccountScreen';
import { NotificationSettingsScreen } from './pages/NotificationSettingsScreen';
import { HelpSupportScreen } from './pages/HelpSupportScreen';
import { AboutAppScreen } from './pages/AboutAppScreen';
import { SessionSummaryScreen } from './pages/SessionSummaryScreen';
// NEW SCREENS
import { MedicalRecordsVault } from './pages/MedicalRecordsVault';
import { SymptomCheckerScreen } from './pages/SymptomCheckerScreen';
import { MedicationRemindersScreen } from './pages/MedicationRemindersScreen';
import { NotificationCenterScreen } from './pages/NotificationCenterScreen';
import { PaymentsBillingScreen } from './pages/PaymentsBillingScreen';
import { EmergencyHelpScreen } from './pages/EmergencyHelpScreen';
import { DoctorApprovalScreen } from './pages/DoctorApprovalScreen';
import { RateDoctorScreen } from './pages/RateDoctorScreen';
import { DoctorAvailabilityScreen } from './pages/DoctorAvailabilityScreen';

export function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <NotificationProvider>
          <HashRouter>
            <WebLayout>
              <Routes>
                {/* Onboarding Flow */}
                <Route path="/" element={<SplashScreen />} />
                <Route path="/onboarding" element={<OnboardingScreen />} />
                <Route path="/get-started" element={<GetStartedScreen />} />

                {/* Auth Flow */}
                <Route path="/login" element={<LoginScreen />} />
                <Route path="/register" element={<RegistrationScreen />} />
                <Route path="/reset-password" element={<ResetPasswordScreen />} />

                {/* Dashboards */}
                <Route path="/patient-dashboard" element={<PatientDashboard />} />
                <Route path="/doctor-dashboard" element={<DoctorDashboard />} />
                <Route path="/admin-dashboard" element={<AdminDashboard />} />

                {/* Patient Flow */}
                <Route
                  path="/upcoming-appointments"
                  element={<UpcomingAppointmentsScreen />} />

                <Route path="/book-appointment" element={<AppointmentBooking />} />
                <Route
                  path="/booking-confirmation"
                  element={<BookingConfirmation />} />

                <Route
                  path="/patient-waiting-room"
                  element={<PatientWaitingRoomScreen />} />

                <Route
                  path="/patient-video-call"
                  element={<PatientVideoCallScreen />} />

                <Route
                  path="/waiting-for-prescription"
                  element={<PatientWaitingForPrescriptionScreen />} />

                <Route
                  path="/missed-appointment"
                  element={<MissedAppointmentScreen />} />

                <Route path="/medical-records" element={<MedicalRecordsVault />} />
                <Route path="/symptom-checker" element={<SymptomCheckerScreen />} />
                <Route
                  path="/medication-reminders"
                  element={<MedicationRemindersScreen />} />

                <Route
                  path="/notifications"
                  element={<NotificationCenterScreen />} />

                <Route
                  path="/payments-billing"
                  element={<PaymentsBillingScreen />} />

                <Route path="/emergency-help" element={<EmergencyHelpScreen />} />
                <Route path="/rate-doctor" element={<RateDoctorScreen />} />

                {/* Doctor Flow */}
                <Route path="/patient-details" element={<PatientDetailsScreen />} />
                <Route
                  path="/doctor-video-call"
                  element={<DoctorVideoCallScreen />} />

                <Route
                  path="/doctor-prescription-creation"
                  element={<DoctorPrescriptionCreationScreen />} />

                <Route
                  path="/doctor-appointments"
                  element={<DoctorAppointmentsScreen />} />

                <Route
                  path="/doctor-availability"
                  element={<DoctorAvailabilityScreen />} />


                {/* Admin Flow */}
                <Route
                  path="/admin-appointments"
                  element={<AdminAppointmentsScreen />} />

                <Route
                  path="/doctor-approvals"
                  element={<DoctorApprovalScreen />} />


                {/* Common */}
                <Route path="/session-summary" element={<SessionSummaryScreen />} />
                <Route path="/history" element={<HistoryScreen />} />
                <Route path="/patient-prescriptions" element={<PatientPrescriptionsScreen />} />
                <Route path="/prescription/:id" element={<PrescriptionScreen />} />

                {/* Profile & Settings */}
                <Route path="/profile" element={<ProfileScreen />} />
                <Route path="/edit-profile" element={<EditProfileScreen />} />
                <Route
                  path="/privacy-security"
                  element={<PrivacySecurityScreen />} />

                <Route path="/change-password" element={<ChangePasswordScreen />} />
                <Route path="/login-activity" element={<LoginActivityScreen />} />
                <Route
                  path="/device-management"
                  element={<DeviceManagementScreen />} />

                <Route path="/data-policy" element={<DataPolicyScreen />} />
                <Route path="/delete-account" element={<DeleteAccountScreen />} />
                <Route
                  path="/notification-settings"
                  element={<NotificationSettingsScreen />} />

                <Route path="/help-support" element={<HelpSupportScreen />} />
                <Route path="/about" element={<AboutAppScreen />} />

                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </WebLayout>
          </HashRouter>
        </NotificationProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}