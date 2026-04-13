import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProfileProvider } from './context/ProfileContext';
import { LocalNotificationProvider } from './context/LocalNotificationProvider';
import { WebLayout } from './components/layout/WebLayout';
// Screens
import { SplashScreen } from './pages/SplashScreen';
import { ProtectedRoute } from './components/ProtectedRoute';
import { OnboardingScreen } from './pages/OnboardingScreen';
import { GetStartedScreen } from './pages/GetStartedScreen';
import { LoginScreen } from './pages/LoginScreen';
import { RegistrationScreen } from './pages/RegistrationScreen';
import { ForgotPasswordScreen } from './pages/ForgotPasswordScreen';
import { VerifyOtpScreen } from './pages/VerifyOtpScreen';
import { ResetPasswordScreen } from './pages/ResetPasswordScreen';
import { PatientDashboard } from './pages/PatientDashboard';
import { DoctorDashboard } from './pages/DoctorDashboard';
import { AdminDashboard } from './pages/AdminDashboard';
import { AppointmentBooking } from './pages/AppointmentBooking';
import { BookingConfirmation } from './pages/BookingConfirmation';
import { HistoryScreen } from './pages/HistoryScreen';
import { PrescriptionScreen } from './pages/PrescriptionScreen';
import { ProfileScreen } from './pages/ProfileScreen';
import { DoctorHistoryScreen } from './pages/DoctorHistoryScreen';
import { PatientConsultationFlow } from './pages/PatientConsultationFlow';
import { DoctorConsultationFlow } from './pages/DoctorConsultationFlow';
// Patient Flow
import { UpcomingAppointmentsScreen } from './pages/UpcomingAppointmentsScreen';
import { PatientWaitingRoomScreen } from './pages/PatientWaitingRoomScreen';
import { PatientVideoCallScreen } from './pages/PatientVideoCallScreen';
import { PatientWaitingForPrescriptionScreen } from './pages/PatientWaitingForPrescriptionScreen';
// Doctor Flow
import { DoctorVideoCallScreen } from './pages/DoctorVideoCallScreen';
import { DoctorSlotAvailabilityScreen } from './pages/DoctorSlotAvailabilityScreen';
import { DoctorReviewReportsScreen } from './pages/DoctorReviewReportsScreen';
import { DoctorTodayAppointmentsScreen } from './pages/DoctorTodayAppointmentsScreen';
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
import PatientRegisterScreen from './pages/PatientRegisterScreen';
import DoctorRegisterScreen from './pages/DoctorRegisterScreen';
import PendingDoctorsScreen from './pages/admin/PendingDoctorsScreen';
import VideoRoomScreen from './pages/VideoRoomScreen';
import PrescriptionWaitingScreen from './pages/PrescriptionWaitingScreen';
import CreatePrescriptionScreen from './pages/CreatePrescriptionScreen';
import PrescriptionViewScreen from './pages/PrescriptionViewScreen';
import PrescriptionDoneScreen from './pages/PrescriptionDoneScreen';
import PrescriptionReadyScreen from './pages/PrescriptionReadyScreen';
import { PatientPrescriptionsScreen } from './pages/PatientPrescriptionsScreen';
import { AppointmentDetailScreen } from './pages/AppointmentDetailScreen';
import { TermsAndConditionsScreen } from './pages/TermsAndConditionsScreen';
import { PrivacyPolicyScreen } from './pages/PrivacyPolicyScreen';
import { PremiumPrescriptionView } from './pages/PremiumPrescriptionView';


export function App() {
  return (
    <AuthProvider>
      <ProfileProvider>
        <LocalNotificationProvider>
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
                <Route path="/register/patient" element={<PatientRegisterScreen />} />
                <Route path="/register/doctor" element={<DoctorRegisterScreen />} />
                <Route path="/forgot-password" element={<ForgotPasswordScreen />} />
                <Route path="/verify-otp" element={<VerifyOtpScreen />} />
                <Route path="/reset-password" element={<ResetPasswordScreen />} />
                <Route path="/terms" element={<TermsAndConditionsScreen />} />
                <Route path="/privacy" element={<PrivacyPolicyScreen />} />

                {/* Protected Dashboards */}
                <Route path="/patient-dashboard" element={<ProtectedRoute allowedRoles={["patient"]}><PatientDashboard /></ProtectedRoute>} />
                <Route path="/home" element={<ProtectedRoute allowedRoles={["patient"]}><PatientDashboard /></ProtectedRoute>} />
                <Route path="/doctor-dashboard" element={<ProtectedRoute allowedRoles={["doctor"]}><DoctorDashboard /></ProtectedRoute>} />
                <Route path="/doctor/dashboard" element={<ProtectedRoute allowedRoles={["doctor"]}><DoctorDashboard /></ProtectedRoute>} />
                <Route path="/admin-dashboard" element={<ProtectedRoute allowedRoles={["admin"]}><AdminDashboard /></ProtectedRoute>} />
                <Route path="/admin/dashboard" element={<ProtectedRoute allowedRoles={["admin"]}><AdminDashboard /></ProtectedRoute>} />

                {/* Patient Flow */}
                <Route path="/upcoming-appointments" element={<ProtectedRoute allowedRoles={["patient"]}><UpcomingAppointmentsScreen /></ProtectedRoute>} />
                <Route path="/book-appointment" element={<ProtectedRoute allowedRoles={["patient"]}><AppointmentBooking /></ProtectedRoute>} />
                <Route path="/booking-confirmation" element={<ProtectedRoute allowedRoles={["patient"]}><BookingConfirmation /></ProtectedRoute>} />
                <Route path="/consultation/:appointmentId" element={<ProtectedRoute allowedRoles={["patient"]}><PatientConsultationFlow /></ProtectedRoute>} />
                <Route path="/patient-waiting-room" element={<ProtectedRoute allowedRoles={["patient"]}><PatientWaitingRoomScreen /></ProtectedRoute>} />
                <Route path="/patient-video-call" element={<ProtectedRoute allowedRoles={["patient"]}><PatientVideoCallScreen /></ProtectedRoute>} />
                <Route path="/waiting-for-prescription" element={<ProtectedRoute allowedRoles={["patient"]}><PatientWaitingForPrescriptionScreen /></ProtectedRoute>} />
                <Route path="/missed-appointment" element={<ProtectedRoute allowedRoles={["patient"]}><MissedAppointmentScreen /></ProtectedRoute>} />
                <Route path="/medical-records" element={<ProtectedRoute allowedRoles={["patient"]}><MedicalRecordsVault /></ProtectedRoute>} />
                <Route path="/symptom-checker" element={<ProtectedRoute allowedRoles={["patient"]}><SymptomCheckerScreen /></ProtectedRoute>} />
                <Route path="/medication-reminders" element={<ProtectedRoute allowedRoles={["patient"]}>< MedicationRemindersScreen /></ProtectedRoute>} />
                <Route path="/notifications" element={<ProtectedRoute allowedRoles={["patient", "doctor", "admin"]}><NotificationCenterScreen /></ProtectedRoute>} />
                <Route path="/payments-billing" element={<ProtectedRoute allowedRoles={["patient", "doctor", "admin"]}><PaymentsBillingScreen /></ProtectedRoute>} />
                <Route path="/emergency-help" element={<ProtectedRoute allowedRoles={["patient"]}><EmergencyHelpScreen /></ProtectedRoute>} />
                <Route path="/rate-doctor" element={<ProtectedRoute allowedRoles={["patient"]}><RateDoctorScreen /></ProtectedRoute>} />

                {/* Doctor Flow */}
                <Route path="/patient-details" element={<ProtectedRoute allowedRoles={["doctor"]}><PatientDetailsScreen /></ProtectedRoute>} />
                <Route path="/doctor-consultation/:appointmentId" element={<ProtectedRoute allowedRoles={["doctor"]}><DoctorConsultationFlow /></ProtectedRoute>} />
                <Route path="/doctor-video-call" element={<ProtectedRoute allowedRoles={["doctor"]}><DoctorVideoCallScreen /></ProtectedRoute>} />
                <Route path="/doctor-slot-availability" element={<ProtectedRoute allowedRoles={["doctor"]}><DoctorSlotAvailabilityScreen /></ProtectedRoute>} />
                <Route path="/doctor-appointments" element={<ProtectedRoute allowedRoles={["doctor"]}><DoctorAppointmentsScreen /></ProtectedRoute>} />
                <Route path="/doctor-review-reports" element={<ProtectedRoute allowedRoles={["doctor"]}><DoctorReviewReportsScreen /></ProtectedRoute>} />
                <Route path="/doctor-today-appointments" element={<ProtectedRoute allowedRoles={["doctor"]}><DoctorTodayAppointmentsScreen /></ProtectedRoute>} />

                {/* Admin Flow */}
                <Route path="/admin-appointments" element={<ProtectedRoute allowedRoles={["admin"]}><AdminAppointmentsScreen /></ProtectedRoute>} />
                <Route path="/doctor-approvals" element={<ProtectedRoute allowedRoles={["admin"]}><DoctorApprovalScreen /></ProtectedRoute>} />
                <Route path="/admin/doctors/approvals" element={<ProtectedRoute allowedRoles={["admin"]}><PendingDoctorsScreen /></ProtectedRoute>} />

                {/* Common */}
                <Route path="/consultation/video" element={<ProtectedRoute allowedRoles={["patient", "doctor"]}><VideoRoomScreen /></ProtectedRoute>} />
                <Route path="/prescription/create" element={<ProtectedRoute allowedRoles={["doctor"]}><CreatePrescriptionScreen /></ProtectedRoute>} />
                <Route path="/consultation/prescription-waiting" element={<ProtectedRoute allowedRoles={["patient"]}><PrescriptionWaitingScreen /></ProtectedRoute>} />
                <Route path="/consultation/prescription-ready" element={<ProtectedRoute allowedRoles={["patient"]}><PrescriptionReadyScreen /></ProtectedRoute>} />
                <Route path="/consultation/prescription-view" element={<ProtectedRoute allowedRoles={["patient"]}><PrescriptionViewScreen /></ProtectedRoute>} />
                <Route path="/consultation/prescription-done" element={<ProtectedRoute allowedRoles={["doctor"]}><PrescriptionDoneScreen /></ProtectedRoute>} />
                <Route path="/session-summary" element={<ProtectedRoute allowedRoles={["patient", "doctor", "admin"]}><SessionSummaryScreen /></ProtectedRoute>} />
                <Route path="/history" element={<ProtectedRoute allowedRoles={["patient"]}><HistoryScreen /></ProtectedRoute>} />
                <Route path="/prescriptions" element={<ProtectedRoute allowedRoles={["patient"]}><PatientPrescriptionsScreen /></ProtectedRoute>} />
                <Route path="/prescription/view/:id" element={<ProtectedRoute allowedRoles={["patient"]}><PremiumPrescriptionView /></ProtectedRoute>} />
                <Route path="/doctor-history" element={<ProtectedRoute allowedRoles={["doctor"]}><DoctorHistoryScreen /></ProtectedRoute>} />
                <Route path="/prescription/:id" element={<ProtectedRoute allowedRoles={["patient", "doctor", "admin"]}><PrescriptionScreen /></ProtectedRoute>} />
                <Route path="/appointment/:id" element={<ProtectedRoute allowedRoles={["patient", "doctor", "admin"]}><AppointmentDetailScreen /></ProtectedRoute>} />

                {/* Profile & Settings */}
                <Route path="/profile" element={<ProtectedRoute allowedRoles={["patient", "doctor", "admin"]}><ProfileScreen /></ProtectedRoute>} />
                <Route path="/edit-profile" element={<ProtectedRoute allowedRoles={["patient", "doctor", "admin"]}><EditProfileScreen /></ProtectedRoute>} />
                <Route path="/privacy-security" element={<ProtectedRoute allowedRoles={["patient", "doctor", "admin"]}><PrivacySecurityScreen /></ProtectedRoute>} />
                <Route path="/change-password" element={<ProtectedRoute allowedRoles={["patient", "doctor", "admin"]}><ChangePasswordScreen /></ProtectedRoute>} />
                <Route path="/login-activity" element={<ProtectedRoute allowedRoles={["patient", "doctor", "admin"]}><LoginActivityScreen /></ProtectedRoute>} />
                <Route path="/device-management" element={<ProtectedRoute allowedRoles={["patient", "doctor", "admin"]}><DeviceManagementScreen /></ProtectedRoute>} />
                <Route path="/data-policy" element={<ProtectedRoute allowedRoles={["patient", "doctor", "admin"]}><DataPolicyScreen /></ProtectedRoute>} />
                <Route path="/delete-account" element={<ProtectedRoute allowedRoles={["patient", "doctor", "admin"]}><DeleteAccountScreen /></ProtectedRoute>} />
                <Route path="/notification-settings" element={<ProtectedRoute allowedRoles={["patient", "doctor", "admin"]}><NotificationSettingsScreen /></ProtectedRoute>} />
                <Route path="/help-support" element={<ProtectedRoute allowedRoles={["patient", "doctor", "admin"]}><HelpSupportScreen /></ProtectedRoute>} />
                <Route path="/about" element={<ProtectedRoute allowedRoles={["patient", "doctor", "admin"]}><AboutAppScreen /></ProtectedRoute>} />

                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </WebLayout>
          </HashRouter>
        </LocalNotificationProvider>
      </ProfileProvider>
    </AuthProvider>
  );
}
