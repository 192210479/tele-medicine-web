import { useState, useEffect, useCallback } from 'react';
import {
  Calendar,
  Clock,
  User,
  Stethoscope,
  MoreHorizontal,
  XCircle,
  RefreshCcw,
  CheckCircle,
  AlertCircle } from
'lucide-react';
import { ScreenContainer } from '../components/layout/ScreenContainer';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { apiGet, apiPut } from '../services/api';
import socket from '../services/socketService';

export function AdminAppointmentsScreen() {
  const [activeTab, setActiveTab] = useState<
    'upcoming' | 'pending' | 'completed' | 'cancelled'>(
    'upcoming');
  const [appointmentsList, setAppointmentsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showReassignModal, setShowReassignModal] = useState(false);
  const [selectedApt, setSelectedApt] = useState<any>(null);
  const [availableDoctors, setAvailableDoctors] = useState<any[]>([]);
  const [errorMsg, setErrorMsg] = useState('');

  const adminId = localStorage.getItem("user_id");

  const loadAppointments = useCallback(async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const ids = await apiGet('/api/admin/appointments', { role: 'admin' });
      if (Array.isArray(ids)) {
        const details = await Promise.all(
          ids.map(async (apt: any) => {
            try {
              return await apiGet(`/api/appointment/${apt.id}`);
            } catch (e) {
              return { ...apt, error: true };
            }
          })
        );
        setAppointmentsList(details.filter(d => !d.error));
      }
    } catch (e) {
      console.error("Failed to load appointments", e);
      setErrorMsg("Unable to load appointments");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadDoctors = async () => {
    try {
      const docs = await apiGet('/api/admin/doctors', { role: 'admin' });
      if (Array.isArray(docs)) setAvailableDoctors(docs);
    } catch (e) {
      console.error("Failed to load doctors", e);
    }
  };

  const handleCancel = async (id: number) => {
    if (!window.confirm("Are you sure you want to cancel this appointment?")) return;
    try {
      await apiPut(`/api/appointment/cancel/${id}`, { user_id: adminId, role: 'admin' });
      loadAppointments();
    } catch (e) {
      alert("Failed to cancel appointment");
    }
  };

  const openReassign = (apt: any) => {
    setSelectedApt(apt);
    loadDoctors();
    setShowReassignModal(true);
  };

  const handleReassignSubmit = async (doctorId: number) => {
    try {
      await apiPut(`/api/admin/appointment/reassign/${selectedApt.id}`, {
        role: 'admin',
        doctor_id: doctorId
      });
      setShowReassignModal(false);
      loadAppointments();
    } catch (e) {
      alert("Failed to reassign appointment");
    }
  };

  useEffect(() => {
    loadAppointments();

    // Socket Setup
    if (socket) {
      const refreshHandler = () => loadAppointments();
      socket.on("new_appointment", refreshHandler);
      socket.on("appointment_reassigned", refreshHandler);
      socket.on("consultation_started", refreshHandler);
      socket.on("consultation_ended", refreshHandler);

      return () => {
        socket.off("new_appointment", refreshHandler);
        socket.off("appointment_reassigned", refreshHandler);
        socket.off("consultation_started", refreshHandler);
        socket.off("consultation_ended", refreshHandler);
      };
    }
  }, [loadAppointments]);

  const filteredAppointments = appointmentsList.filter((apt) => {
    if (activeTab === 'upcoming') return apt.status === 'Scheduled';
    if (activeTab === 'pending') return apt.consultation_status === 'Pending';
    if (activeTab === 'completed') return apt.status === 'Completed';
    if (activeTab === 'cancelled') return apt.status === 'Cancelled';
    return false;
  });
  return (
    <ScreenContainer title="Manage Appointments" showBack className="pb-8">
      <div className="px-6 py-4">
        {/* Tabs */}
        <div className="flex p-1 bg-gray-100 rounded-xl mb-6 overflow-x-auto scrollbar-hide">
          {(['upcoming', 'pending', 'completed', 'cancelled'] as const).map(
            (tab) =>
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 min-w-[80px] py-2 px-3 text-sm font-medium rounded-lg capitalize transition-all whitespace-nowrap ${activeTab === tab ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>

                {tab}
              </button>

          )}
        </div>

        {/* List */}
        <div className="space-y-4">
          {errorMsg && (
            <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-xl flex items-center gap-3">
              <AlertCircle size={20} />
              <p className="text-sm font-medium">{errorMsg}</p>
            </div>
          )}

          {loading ? (
            <div className="py-12 flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-gray-500 text-sm font-medium">Loading appointments...</p>
            </div>
          ) : filteredAppointments.length > 0 ? (
            filteredAppointments.map((apt) => (
              <Card key={apt.id} className="flex flex-col gap-3">
                <div className="flex justify-between items-start">
                  <div className="flex flex-col gap-1">
                    <h3 className="font-bold text-text-primary">
                      {apt.patient_name || `Patient ID: ${apt.patient_id}`}
                    </h3>
                    <div className="flex items-center gap-1 text-xs text-text-secondary">
                      <User size={12} />
                      <span>{apt.patient_id ? `ID: #${apt.patient_id}` : 'Patient'}</span>
                    </div>
                  </div>
                  <Badge
                    variant={
                      apt.status === 'Scheduled' ? 'info' :
                      apt.status === 'Completed' ? 'success' :
                      apt.consultation_status === 'Pending' ? 'warning' :
                      apt.status === 'Cancelled' ? 'error' : 'neutral'
                    }
                  >
                    {apt.status === 'Scheduled' ? 'Upcoming' : apt.status}
                  </Badge>
                </div>

                <div className="bg-gray-50 p-3 rounded-lg flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-primary shadow-sm">
                    <Stethoscope size={16} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-text-primary">
                      {apt.doctor_name || `Doctor ID: ${apt.doctor_id}`}
                    </p>
                    <p className="text-xs text-text-secondary">Doctor</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-sm text-text-secondary">
                  <div className="flex items-center gap-1">
                    <Calendar size={14} />
                    {apt.date}
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock size={14} />
                    {apt.time || apt.time_slot || 'N/A'}
                  </div>
                </div>

                {(apt.status !== 'Cancelled' && apt.status !== 'Completed') && (
                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-100 mt-1">
                    <Button 
                      variant="outline" 
                      className="h-9 text-xs"
                      onClick={() => openReassign(apt)}
                    >
                      Reassign
                    </Button>
                    <Button
                      variant="danger"
                      className="h-9 text-xs bg-red-50 text-red-600 shadow-none hover:bg-red-100"
                      onClick={() => handleCancel(apt.id)}
                    >
                      Cancel
                    </Button>
                  </div>
                )}
              </Card>
            ))
          ) : (
            <div className="text-center py-12 text-gray-400">
              <p>No {activeTab} appointments found.</p>
            </div>
          )}
        </div>

        {/* Reassign Modal */}
        <Modal
          isOpen={showReassignModal}
          onClose={() => setShowReassignModal(false)}
          title="Reassign Doctor"
          description="Choose a new doctor for this appointment."
        >
          <div className="space-y-2 mt-4 max-h-[300px] overflow-y-auto pr-2">
            {availableDoctors.length > 0 ? availableDoctors.map((doc) => (
              <button
                key={doc.id}
                onClick={() => handleReassignSubmit(doc.id)}
                className="w-full text-left p-3 rounded-xl border border-gray-100 hover:bg-primary/5 hover:border-primary/20 transition-all flex items-center justify-between group"
              >
                <div>
                  <p className="font-bold text-sm text-gray-900 group-hover:text-primary">{doc.name || doc.full_name}</p>
                  <p className="text-xs text-gray-500">{doc.specialization}</p>
                </div>
                <RefreshCcw size={16} className="text-gray-300 group-hover:text-primary" />
              </button>
            )) : (
              <div className="text-center py-4 text-gray-400 text-sm">No doctors available</div>
            )}
          </div>
        </Modal>
      </div>
    </ScreenContainer>);

}