import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';
import { ScreenContainer } from '../components/layout/ScreenContainer';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { useAuth } from '../context/AuthContext';

export function DeleteAccountScreen() {
  const navigate = useNavigate();
  const [confirmText, setConfirmText] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { userId, role, logout } = useAuth();
  
  const handleDeleteClick = () => {
    if (confirmText === 'DELETE') {
      setShowConfirmModal(true);
    }
  };

  const handleConfirmDelete = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`http://localhost:5000/api/account/delete?user_id=${userId}&role=${role}`, {
        method: "DELETE"
      });

      if (response.ok) {
        alert("Account deleted successfully.");
        logout();
        navigate('/login');
      } else {
        const data = await response.json();
        alert(data.error || "Failed to delete account.");
        setIsLoading(false);
        setShowConfirmModal(false);
      }
    } catch (error) {
      alert("An error occurred. Please try again.");
      setIsLoading(false);
      setShowConfirmModal(false);
    }
  };

  return (
    <ScreenContainer title="Delete Account" showBack>
      <div className="px-6 py-8 flex flex-col items-center text-center">
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center text-red-500 mb-6">
          <AlertTriangle size={40} />
        </div>

        <h2 className="text-xl font-bold text-text-primary mb-2">
          Are you sure?
        </h2>
        <p className="text-text-secondary mb-8">
          This action cannot be undone. This will permanently delete your
          account and remove your data from our servers.
        </p>

        <div className="w-full bg-gray-50 p-4 rounded-xl border border-gray-200 mb-6 text-left">
          <p className="text-sm font-medium text-text-primary mb-2">
            To confirm, type "DELETE" below:
          </p>
          <Input
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="DELETE"
            className="uppercase" />
        </div>

        <div className="w-full space-y-3">
          <Button
            variant="danger"
            fullWidth
            isLoading={isLoading}
            disabled={confirmText !== 'DELETE'}
            onClick={handleDeleteClick}>
            Delete My Account
          </Button>
          <Button variant="ghost" fullWidth onClick={() => navigate(-1)}>
            Cancel
          </Button>
        </div>
      </div>

      <Modal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        title="Final Confirmation"
        description="This is your last chance. Once deleted, your account cannot be recovered. Are you absolutely sure?"
        confirmText="Yes, Delete Forever"
        cancelText="No, Keep My Account"
        onConfirm={handleConfirmDelete}
        variant="danger" />
    </ScreenContainer>
  );
}