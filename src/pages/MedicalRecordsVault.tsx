import { useState, useEffect, useRef } from 'react';
import {
  FileText,
  Upload,
  Download,
  Trash2
} from 'lucide-react';
import { ScreenContainer } from '../components/layout/ScreenContainer';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { apiGet, apiUpload } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { getSocket } from '../utils/socketUtils';

export function MedicalRecordsVault() {
  const { userId } = useAuth();
  const [records, setRecords] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (userId) {
      loadMedicalRecords();
      
      // Listen for socket events to refetch records in real-time
      const socket = getSocket();
      const onRecordUpdate = () => {
        loadMedicalRecords();
      };
      
      socket.on('medical_record_uploaded', onRecordUpdate);
      socket.on('medical_record_shared', onRecordUpdate);
      
      return () => {
        socket.off('medical_record_uploaded', onRecordUpdate);
        socket.off('medical_record_shared', onRecordUpdate);
      };
    }
  }, [userId]);

  const loadMedicalRecords = async () => {
    setIsLoading(true);
    try {
      const data = await apiGet('/api/medical-records', { user_id: userId, role: 'patient' });
      setRecords(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to load medical records:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedExtensions = ['pdf', 'png', 'jpg', 'jpeg', 'doc', 'docx'];
    const extension = file.name.split('.').pop()?.toLowerCase();

    if (!extension || !allowedExtensions.includes(extension)) {
      alert(`Unsupported file type. Allowed: ${allowedExtensions.join(', ')}`);
      return;
    }

    const formData = new FormData();
    formData.append('user_id', String(userId));
    formData.append('role', 'patient');
    formData.append('file', file);

    try {
      setIsLoading(true);
      // Corrected to match the backend route
      await apiUpload('/api/patient/upload-medical-record', formData);
      alert('File uploaded successfully');
      loadMedicalRecords();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setIsLoading(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleDelete = async (recordId: number) => {
    if (!window.confirm('Are you sure you want to permanently delete this medical record?')) {
      return;
    }

    try {
      setIsLoading(true);
      const res = await fetch(`/api/medical-record/delete/${recordId}?user_id=${userId}&role=patient`, {
        method: 'DELETE'
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete record');
      }

      alert('Record deleted successfully');
      loadMedicalRecords();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Deletion failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = (recordId: number, asView = false) => {
    const url = `/api/medical-record/download/${recordId}?user_id=${userId}&role=patient&view=${asView}`;
    
    if (asView) {
      window.open(url, '_blank', 'noopener,noreferrer');
    } else {
      const a = document.createElement('a');
      a.href = url;
      a.download = ''; 
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch (e) {
      return dateStr;
    }
  };

  return (
    <ScreenContainer
      title="Medical Records"
      showBack
    >
      <div className="flex flex-col h-full">
        <div className="px-6 py-6 pb-8">
          {/* Main Content */}
          <div className="space-y-4">
            {isLoading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : records.length > 0 ? (
              records.map((record) => (
                <Card
                  key={record.id}
                  className="flex items-center justify-between p-5"
                >
                  <div className="flex items-center gap-5">
                    <div className="w-14 h-14 rounded-xl flex items-center justify-center text-blue-500 bg-blue-50">
                      <FileText size={28} />
                    </div>
                    <div>
                      <h3 className="font-bold text-text-primary text-base">
                        {record.file_name}
                      </h3>
                      <p className="text-sm text-text-secondary mt-1">
                        Uploaded on {formatDate(record.created_at)}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleDownload(record.id, true)}
                      className="px-4 py-2 text-primary text-sm font-bold bg-primary/5 hover:bg-primary/10 rounded-xl transition-colors hidden sm:block"
                    >
                      View
                    </button>
                    <button
                      onClick={() => handleDownload(record.id, false)}
                      className="p-3 text-gray-400 hover:text-primary hover:bg-blue-50 rounded-full transition-colors flex items-center justify-center"
                      title="Download File"
                    >
                      <Download size={24} />
                    </button>
                    <button
                      onClick={() => handleDelete(record.id)}
                      className="p-3 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors flex items-center justify-center"
                      title="Delete Record"
                    >
                      <Trash2 size={24} />
                    </button>
                  </div>
                </Card>
              ))
            ) : (
              <EmptyState
                title="No Records Found"
                description="Your medical vault is empty. Upload your reports, prescriptions, or other medical documents."
                illustrationType="empty"
              />
            )}
          </div>
        </div>

        {/* Floating Action Button area */}
        <div className="sticky bottom-0 bg-white border-t border-gray-100 p-6 z-10 mt-auto">
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
            onChange={handleFileChange}
          />
          <Button
            fullWidth
            icon={<Upload size={20} />}
            onClick={handleUploadClick}
            disabled={isLoading}
          >
            Upload Document
          </Button>
        </div>
      </div>
    </ScreenContainer>
  );
}