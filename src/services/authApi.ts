import { apiPost, apiPut } from '../utils/api';

export const authApi = {
  sendOtp: async (email: string) => {
    return apiPost('/api/password/send-otp', { email });
  },

  verifyOtp: async (email: string, otp: string) => {
    return apiPost('/api/password/verify-otp', { email, otp });
  },

  resetPassword: async (email: string, newPassword: string) => {
    return apiPut('/api/password/reset', { email, new_password: newPassword });
  }
};
