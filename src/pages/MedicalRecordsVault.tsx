import { useState, useEffect, useRef } from 'react';
import {
  FileText,
  Upload,
  Download,
  Share2 } from 'lucide-react';
import { ScreenContainer } from '../components/layout/ScreenContainer';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { apiGet, apiUpload } from '../services/api';
import { useAuth } from '../context/AuthContext';

export function MedicalRecordsVault() {
  const { userId } = useAuth();
  const [records, setRecords] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (userId) {
      loadMedicalRecords();
    }
  }, [userId]);

  const loadMedicalRecords = async () => {
    setIsLoading(true);
    try {
      const data = await apiGet('/api/medical-records', { user_id: userId });
      setRecords(data);
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
      await apiUpload('/api/medical-record/upload', formData);
      alert('File uploaded successfully');
      loadMedicalRecords();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setIsLoading(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleDownload = (recordId: number) => {
    const url = `http://localhost:5000/api/medical-record/download/${recordId}?user_id=${userId}&role=patient`;
    window.open(url, '_blank');
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
      actions={
        <button className="p-2 text-primary hover:bg-blue-50 rounded-full">
          <Share2 size={24} />
        </button>
      }
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
                      onClick={() => handleDownload(record.id)}
                      className="p-3 text-gray-400 hover:text-primary hover:bg-blue-50 rounded-full transition-colors"
                    >
                      <Download size={24} />
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
        <div className="sticky bottom-0 left-0 right-0 p-6 bg-white border-t border-gray-100 mt-8 rounded-xl">
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
            className="max-w-md mx-auto"
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