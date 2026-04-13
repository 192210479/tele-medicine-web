/**
 * src/services/api.ts
 *
 * Central HTTP helpers for the web app.
 * All paths are relative — proxied by Vite to http://103.249.82.251:8002
 *
 * Rules:
 *  - No JWT authentication
 *  - user_id and role are passed as query/body params (from localStorage / AuthContext)
 *  - Payments section being connected now
 */

// ─── Base helpers ─────────────────────────────────────────────────────────────

export async function apiGet<T = unknown>(
    path: string,
    params?: Record<string, string | number | undefined | null>
): Promise<T> {
    const filtered = params
        ? Object.fromEntries(
            Object.entries(params)
                .filter(([, v]) => v !== undefined && v !== null)
                .map(([k, v]) => [k, String(v)])
        )
        : undefined;

    const url =
        filtered && Object.keys(filtered).length > 0
            ? `${path}?${new URLSearchParams(filtered).toString()}`
            : path;

    const res = await fetch(url);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || data.message || "Request failed");
    return data as T;
}

export async function apiPost<T = unknown>(path: string, body: object): Promise<T> {
    const res = await fetch(path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || data.message || "Request failed");
    return data as T;
}

export async function apiPut<T = unknown>(path: string, body: object): Promise<T> {
    const res = await fetch(path, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || data.message || "Request failed");
    return data as T;
}

export async function apiDelete<T = unknown>(path: string, body?: object): Promise<T> {
    const res = await fetch(path, {
        method: "DELETE",
        headers: body ? { "Content-Type": "application/json" } : undefined,
        body: body ? JSON.stringify(body) : undefined,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || data.message || "Request failed");
    return data as T;
}

// Multipart upload — browser sets Content-Type with boundary automatically
export async function apiUpload<T = unknown>(path: string, formData: FormData): Promise<T> {
    const res = await fetch(path, { method: "POST", body: formData });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || data.message || "Upload failed");
    return data as T;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const authService = {
    login: (email: string, password: string) =>
        apiPost<any>("/api/login", { email, password }),

    registerPatient: (body: object) =>
        apiPost<any>("/api/register/patient", body),

    // Doctor register uses multipart (license file)
    registerDoctor: (formData: FormData) =>
        apiUpload<any>("/api/register/doctor", formData),

    sendOtp: (email: string) =>
        apiPost<any>("/api/password/send-otp", { email }),

    verifyOtp: (email: string, otp: string) =>
        apiPost<any>("/api/password/verify-otp", { email, otp }),

    resetPassword: (email: string, newPassword: string) =>
        apiPut<any>("/api/password/reset", { email, new_password: newPassword }),

    changePassword: (userId: number, role: string, oldPassword: string, newPassword: string) =>
        apiPut<any>("/api/password/change", {
            user_id: userId, role,
            old_password: oldPassword,
            new_password: newPassword,
        }),
};

// ─── Profile ──────────────────────────────────────────────────────────────────

export const profileService = {
    get: (userId: number, role: string) =>
        apiGet<any>("/api/profile", { user_id: userId, role }),

    update: (body: object) =>
        apiPut<any>("/api/profile/update", body),

    uploadImage: (formData: FormData) =>
        apiUpload<any>("/api/profile/image/upload", formData),

    deleteAccount: (userId: number, role: string) =>
        apiDelete<any>(`/api/account/delete?user_id=${userId}&role=${role}`),
};

// ─── Appointments ─────────────────────────────────────────────────────────────

export const appointmentService = {
    // status: "Scheduled" | "Completed" | "Missed" | "Cancelled" | omit for all
    getMyAppointments: (userId: number, role: string, status?: string) =>
        apiGet<any[]>("/api/my-appointments", { user_id: userId, role, status }),

    getHistory: (userId: number) =>
        apiGet<any[]>(`/api/patient/history/${userId}`, { user_id: userId, role: "patient" }),

    book: (body: object) =>
        apiPost<any>("/api/appointment/book", body),

    cancel: (appointmentId: number, body: object) =>
        apiPut<any>(`/api/appointment/cancel/${appointmentId}`, body),

    getDetails: (appointmentId: number) =>
        apiGet<any>(`/api/appointment/${appointmentId}`),
};

// ─── Doctors ──────────────────────────────────────────────────────────────────

export const doctorService = {
    list: (specialization?: string) =>
        apiGet<any[]>("/api/doctors", specialization ? { specialization } : undefined),

    getDetails: (doctorId: number) =>
        apiGet<any>(`/api/doctor/${doctorId}`),

    getAvailability: (doctorId: number) =>
        apiGet<any[]>(`/api/doctor/availability/${doctorId}`),

    blockAvailability: (body: object) =>
        apiPost<any>("/api/doctor/availability/block", body),

    deleteAvailability: (slotId: number, userId: number) =>
        apiDelete<any>(`/api/doctor/availability/${slotId}?user_id=${userId}&role=doctor`),

    getTodayAppointments: (doctorId: number) =>
        apiGet<any[]>("/api/doctor/appointments/today", { doctor_id: doctorId }),

    getPatients: (doctorId: number) =>
        apiGet<any[]>("/api/doctor/patients", { user_id: doctorId, role: "doctor" }),
};

// ─── Consultation ─────────────────────────────────────────────────────────────

export const consultationService = {
    start: (appointmentId: number, doctorId: number) =>
        apiPost<any>("/api/consultation/start", {
            appointment_id: appointmentId,
            user_id: doctorId,
        }),

    getStatus: (appointmentId: number) =>
        apiGet<any>(`/api/consultation/status/${appointmentId}`),

    getDetails: (appointmentId: number) =>
        apiGet<any>(`/api/consultation/details/${appointmentId}`),

    end: (consultationId: number, appointmentId: number) =>
        apiPost<any>("/api/consultation/end", {
            consultation_id: consultationId,
            appointment_id: appointmentId,
        }),

    getVideoToken: (userId: number, channelName: string, role: string) =>
        apiGet<any>("/api/video/token", { user_id: userId, channel_name: channelName, role }),

    sendChat: (consultationId: number, senderId: number, senderRole: string, message: string) =>
        apiPost<any>("/api/consultation/chat/send", {
            consultation_id: consultationId,
            sender_id: senderId,
            sender_role: senderRole,
            message,
        }),

    getChat: (consultationId: number) =>
        apiGet<any[]>(`/api/consultation/chat/${consultationId}`),
};

// ─── Prescriptions ────────────────────────────────────────────────────────────

export const prescriptionService = {
    create: (appointmentId: number, body: object) =>
        apiPost<any>(`/api/prescription/create/${appointmentId}`, body),

    get: (appointmentId: number, userId: number, role: string) =>
        apiGet<any>(`/api/prescription/${appointmentId}`, { user_id: userId, role }),

    getPatientPrescriptions: (userId: number, role: string) =>
        apiGet<any[]>("/api/patient/prescriptions", { user_id: userId, role }),
};

// ─── Medical Records ──────────────────────────────────────────────────────────

export const medicalRecordService = {
    getAll: (userId: number, role: string) =>
        apiGet<any[]>("/api/medical-records", { user_id: userId, role }),

    getPatientReports: (patientId: number, userId: number) =>
        apiGet<any[]>(`/api/patient/reports/${patientId}`, { user_id: userId, role: "patient" }),

    upload: (formData: FormData) =>
        apiUpload<any>("/api/medical-record/upload", formData),

    // Use window.open() with this URL for view/download
    getDownloadUrl: (recordId: number, userId: number, role: string) =>
        `/api/medical-record/download/${recordId}?user_id=${userId}&role=${role}`,
};

// ─── Notifications ────────────────────────────────────────────────────────────

export const notificationService = {
    getAll: (userId: number, role: string) =>
        apiGet<any[]>("/api/notifications", { user_id: userId, role }),

    markRead: (notifId: number) =>
        apiPut<any>(`/api/notification/read/${notifId}`, {}),

    markAllRead: (userId: number, role: string) =>
        apiPut<any>("/api/notifications/read-all", { user_id: userId, role }),
};

// ─── Medication Reminders ─────────────────────────────────────────────────────

export const reminderService = {
    getAll: (userId: number) =>
        apiGet<any[]>("/api/reminders", { user_id: userId }),

    add: (body: object) =>
        apiPost<any>("/api/reminder/add", body),

    markComplete: (reminderId: number) =>
        apiPut<any>(`/api/reminder/complete/${reminderId}`, {}),

    reactivate: (reminderId: number) =>
        apiPut<any>(`/api/reminder/reactivate/${reminderId}`, {}),

    delete: (reminderId: number) =>
        apiDelete<any>(`/api/reminder/delete/${reminderId}`),
};

// ─── Emergency ────────────────────────────────────────────────────────────────
// FIXED URLs:
//   /api/emergency-contacts      → /api/emergency/contacts
//   /api/emergency-contacts/add  → /api/emergency/contact/add
//   /api/nearby-hospitals        → /api/hospitals

export const emergencyService = {
    getContacts: (userId: number, role: string) =>
        apiGet<any[]>("/api/emergency/contacts", { user_id: userId, role }),

    addContact: (body: object) =>
        apiPost<any>("/api/emergency/contact/add", body),

    deleteContact: (contactId: number) =>
        apiDelete<any>(`/api/emergency/contact/delete/${contactId}`),

    getHospitals: (lat?: number, lon?: number) =>
        apiGet<any[]>("/api/hospitals", lat && lon ? { lat, lon } : undefined),

    shareLocation: (body: object) =>
        apiPost<any>("/api/emergency/location", body),

    sendSOS: (body: object) =>
        apiPost<any>("/api/emergency/sos", body),
        
    sendAlert: (body: object) =>
        apiPost<any>("/api/emergency/alert", body),
};

// ─── Payments ─────────────────────────────────────────────────────────────────
export const paymentService = {
    createOrder: (appointmentId: number, userId: number, role: string) =>
        apiPost<any>("/api/payments/create-order", { appointment_id: appointmentId, user_id: userId, role }),

    verifyPayment: (body: object) =>
        apiPost<any>("/api/payments/verify", body),
};

// ─── Dashboard ────────────────────────────────────────────────────────────────
export const dashboardService = {
    getStats: (userId: number, role: string) =>
        apiGet<any>("/api/dashboard", { user_id: userId, role }),
};

// ─── Admin ────────────────────────────────────────────────────────────────────

export const adminService = {
    getDashboardStats: () =>
        apiGet<any>("/api/admin/dashboard-stats", { role: "admin" }),

    getWeeklyAppointments: () =>
        apiGet<any[]>("/api/admin/weekly_appointments"),

    getRevenueTrend: () =>
        apiGet<any[]>("/api/admin/revenue_trend"),

    getPendingDoctors: () =>
        apiGet<any[]>("/api/admin/doctors/pending", { role: "admin" }),

    getApprovedDoctors: () =>
        apiGet<any[]>("/api/admin/doctors/approved", { role: "admin" }),

    getRejectedDoctors: () =>
        apiGet<any[]>("/api/admin/doctors/rejected", { role: "admin" }),

    approveDoctor: (doctorId: number) =>
        apiPut<any>(`/api/admin/doctors/approve/${doctorId}`, { role: "admin" }),

    rejectDoctor: (doctorId: number) =>
        apiPut<any>(`/api/admin/doctors/reject/${doctorId}`, { role: "admin" }),

    getAllAppointments: () =>
        apiGet<any[]>("/api/admin/appointments", { role: "admin" }),

    cancelAppointment: (appointmentId: number) =>
        apiPut<any>(`/api/appointment/cancel/${appointmentId}`, { role: "admin" }),

    reassignAppointment: (appointmentId: number, body: object) =>
        apiPut<any>(`/api/admin/appointment/reassign/${appointmentId}`, body),
};

// ─── Devices & Login Activity ─────────────────────────────────────────────────

export const deviceService = {
    getAll: (userId: number, role: string) =>
        apiGet<any[]>("/api/devices", { user_id: userId, role }),

    delete: (deviceId: number) =>
        apiDelete<any>(`/api/device/delete/${deviceId}`),

    logoutAll: (userId: number, role: string) =>
        apiDelete<any>("/api/devices/logout-all", { user_id: userId, role }),

    getLoginActivity: (userId: number, role: string) =>
        apiGet<any[]>("/api/login-activity", { user_id: userId, role }),
};

// ─── AI Features ──────────────────────────────────────────────────────────────

export const aiService = {
    symptomTriage: (symptoms: string) =>
        apiPost<any>("/ai/symptom-triage", { symptoms }),

    recommendDoctor: (specialization: string) =>
        apiPost<any>("/ai/recommend-doctor", { specialization }),

    getDailyHealthTip: (userId?: number) =>
        apiGet<any>("/api/daily-health-tip", userId ? { user_id: userId } : undefined),
};