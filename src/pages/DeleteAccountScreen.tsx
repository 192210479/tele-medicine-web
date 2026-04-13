import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ScreenContainer } from '../components/layout/ScreenContainer';
import { Card } from '../components/ui/Card';
import { AlertTriangle, Trash2, ArrowLeft, ShieldAlert } from 'lucide-react';

export function DeleteAccountScreen() {
  const navigate = useNavigate();
  const authContext = useAuth();
  const { userId: authUserId, role: authRole } = authContext;
  const userId = authUserId ?? Number(localStorage.getItem("user_id"));
  const role   = authRole   ?? localStorage.getItem("role") ?? "";

  const [confirmText, setConfirmText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    if (confirmText !== "DELETE") {
      setError('Please type "DELETE" exactly to confirm.');
      return;
    }
    
    if (!window.confirm("FINAL WARNING: This will permanently delete your account and all associated medical data. Are you absolutely certain?")) return;

    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/account/delete?user_id=${userId}&role=${role}`,
        { method: "DELETE" }
      );
      
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Failed to delete account");
        return;
      }

      // Clear ALL session data
      ["user_id","role","name","email","profile_image",
       "userId","full_name","userEmail","auth_token"].forEach(k => {
        localStorage.removeItem(k);
        sessionStorage.removeItem(k);
      });
      
      authContext.logout();
      navigate("/login");
    } catch {
      setError("Connection error. Our servers are unreachable. Try again later.");
    } finally {
      setLoading(false);
    }
  };

  const isInvalid = confirmText.length > 0 && confirmText !== "DELETE";
  const isValid = confirmText === "DELETE";

  return (
    <ScreenContainer title="Delete Account" showBack className="bg-red-50/20 pb-8">
      <div className="p-6 max-w-xl mx-auto space-y-10">
        
        <header className="text-center pt-8">
          <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-red-200/50">
             <AlertTriangle size={48} className="text-red-500" strokeWidth={2.5} />
          </div>
          <h2 className="text-3xl font-black text-red-600 tracking-tight">Are you sure?</h2>
          <p className="text-red-400 font-bold text-sm mt-3 px-12 leading-relaxed uppercase tracking-widest">
            This action cannot be undone.
          </p>
        </header>

        <Card className="bg-white border-none shadow-soft p-10 space-y-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-10 opacity-5 -mr-8 -mt-8 rotate-12">
             <ShieldAlert size={140} strokeWidth={1} className="text-red-600" />
          </div>
          
          <div className="relative z-10 space-y-6">
             <p className="text-gray-600 text-center font-bold text-sm leading-relaxed">
                This will permanently delete your profile, appointment history, prescriptions, and all electronic medical records from our secure servers.
             </p>

             <div className="space-y-3">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] text-center">
                   Type <span className="text-red-500">DELETE</span> to confirm
                </label>
                <input
                  type="text"
                  placeholder="DELETE"
                  value={confirmText}
                  onChange={e => setConfirmText(e.target.value)}
                  className={`w-full h-14 rounded-2xl border-2 text-center text-xl font-black uppercase tracking-[0.25em] focus:outline-none transition-all shadow-inner
                             ${isInvalid ? 'border-red-300 bg-red-50/50 text-red-500' : 
                               isValid ? 'border-green-400 bg-green-50/50 text-green-600' : 'border-gray-100 bg-gray-50'}`}
                />
             </div>

             {error && (
               <div className="flex items-center gap-3 p-4 bg-red-600 text-white rounded-2xl animate-in fade-in zoom-in duration-300 shadow-lg shadow-red-200">
                 <AlertTriangle size={20} />
                 <p className="text-xs font-black uppercase tracking-wider">{error}</p>
               </div>
             )}

             <div className="space-y-4 pt-4">
                <button
                  onClick={handleDelete}
                  disabled={loading || !isValid}
                  className={`w-full h-16 rounded-2xl flex items-center justify-center gap-4 font-black text-lg transition-all shadow-xl active:scale-[0.98]
                             ${isValid ? 'bg-red-600 text-white hover:bg-red-700 shadow-red-200' : 'bg-gray-100 text-gray-300 shadow-none grayscale opacity-50'}`}
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                      DELETING...
                    </>
                  ) : (
                    <>
                      <Trash2 size={24} />
                      DELETE MY ACCOUNT
                    </>
                  )}
                </button>

                <button
                  onClick={() => navigate(-1)}
                  className="w-full h-14 rounded-2xl flex items-center justify-center gap-3 font-bold text-gray-500 hover:text-text-primary hover:bg-gray-50 transition-all"
                >
                   <ArrowLeft size={20} />
                   Cancel & Return
                </button>
             </div>
          </div>
        </Card>

      </div>
    </ScreenContainer>
  );
}
