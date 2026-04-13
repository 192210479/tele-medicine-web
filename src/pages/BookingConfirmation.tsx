import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Calendar, Clock, MapPin } from 'lucide-react';
import { ScreenContainer } from '../components/layout/ScreenContainer';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { MedicalIllustration } from '../components/illustrations/MedicalIllustration';

export function BookingConfirmation() {
  const location = useLocation();
  const navigate = useNavigate();

  const {
    appointment_id,
    doctor_name,
    specialization,
    doctor_image,
    date,
    time,
  } = location.state ?? {};

  const formatDate = (raw: string): string => {
    if (!raw) return "—";
    const [y, m, d] = raw.split("-").map(Number);
    const dt = new Date(y, m - 1, d);
    return dt.toLocaleDateString("en-US", {
      weekday: "long", year: "numeric",
      month:   "short", day: "numeric",
    });
  };

  const formatTime = (raw: string): string => {
    if (!raw) return "—";
    const [h, m] = raw.split(":").map(Number);
    const suffix = h >= 12 ? "PM" : "AM";
    const hour   = h % 12 || 12;
    return `${String(hour).padStart(2,"0")}:${String(m).padStart(2,"0")} ${suffix}`;
  };

  const avatarSrc = doctor_image ?? null;

  return (
    <ScreenContainer className="bg-white" noScroll>
      <div className="flex flex-col h-full px-6 py-8">
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <MedicalIllustration type="success" className="w-48 h-48 mb-6" />

          <h1 className="text-2xl font-bold text-text-primary mb-2">
            Booking Confirmed!
          </h1>
          <p className="text-text-secondary mb-8">
            Your appointment has been successfully booked.
          </p>

          <Card className="w-full bg-surface border-none mb-6">
            <div className="flex items-center gap-4 mb-4 pb-4 border-b border-gray-200">
              {avatarSrc ? (
                <img
                  src={avatarSrc}
                  alt={doctor_name}
                  className="w-14 h-14 rounded-full object-cover"
                  onError={e => { (e.target as HTMLImageElement).src = "/default-avatar.png"; }}
                />
              ) : (
                <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xl">
                  {doctor_name?.[0] ?? "D"}
                </div>
              )}
              
              <div className="text-left">
                <h3 className="font-bold text-text-primary">{doctor_name ?? "Doctor"}</h3>
                <p className="text-sm text-primary">{specialization ?? ""}</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm text-text-secondary">
                <Calendar size={18} className="text-primary" />
                <span>{formatDate(date)}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-text-secondary">
                <Clock size={18} className="text-primary" />
                <span>{formatTime(time)}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-text-secondary">
                <MapPin size={18} className="text-primary" />
                <span>Video Consultation</span>
              </div>
            </div>
          </Card>
        </div>

        <Button fullWidth onClick={() => navigate('/patient-dashboard')}>
          Go to Dashboard
        </Button>
      </div>
    </ScreenContainer>);

}
