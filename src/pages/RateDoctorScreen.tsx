import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Star, ThumbsUp } from 'lucide-react';
import { ScreenContainer } from '../components/layout/ScreenContainer';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';
import { DoctorAvatar } from '../components/ui/DoctorAvatar';
import socketService from '../services/consultationSocket';

interface RateState {
  appointment_id?: number;
  doctor_id?: number;
  doctor_name?: string;
  specialization?: string;
  doctor_image?: string | null;
}

export function RateDoctorScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const { userId } = useAuth();
  const state = (location.state as RateState) || {};

  const appointmentId = state.appointment_id;
  const doctorId = state.doctor_id;
  const doctorName = state.doctor_name || 'Your Doctor';
  const specialization = state.specialization || '';
  const doctorImage = state.doctor_image || null;

  const [rating, setRating] = useState(0);
  const [tags, setTags] = useState<string[]>([]);
  const [review, setReview] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const ratingLabels = ['Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];
  const availableTags = ['Professional', 'Knowledgeable', 'Patient', 'Clear Explanation', 'On Time'];

  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!userId || !appointmentId) {
      setChecking(false);
      return;
    }

    fetch(`/api/appointment/${appointmentId}/rating-status?user_id=${userId}`)
      .then(r => r.json())
      .then(data => {
        if (data.already_rated) {
          setSubmitted(true);
        } else if (data.can_rate === false) {
          setError(data.reason || 'You cannot rate this appointment.');
        }
      })
      .catch(err => console.error('Status check error:', err))
      .finally(() => setChecking(false));
  }, [userId, appointmentId]);

  const toggleTag = (tag: string) => {
    setTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  };

  const handleSubmit = async () => {
    if (!userId || !appointmentId || !doctorId) {
      setError('Missing session info. Please go back and try again.');
      return;
    }
    if (rating === 0) {
      setError('Please select a star rating.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const res = await fetch(`/api/appointment/rate/${appointmentId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: Number(userId),
          role: 'patient',
          doctor_id: Number(doctorId),
          rating: Number(rating),
          review: review.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 409) {
          setSubmitted(true);
          return;
        }
        throw new Error(data.error || 'Failed to submit rating');
      }

      // 🔄 Real-time triggers
      socketService.emit('rating_updated', {
          doctor_id: doctorId,
          // data.new_rating may be null, but that's fine as listeners usually refetch
          new_rating: data.rating, 
      });
      
      window.dispatchEvent(new CustomEvent('rating-updated', {
          detail: { doctor_id: doctorId }
      }));

      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (checking) {
    return (
      <ScreenContainer title="Rate Experience" showBack>
        <div className="flex flex-col items-center justify-center h-full py-20">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-gray-500 font-medium">Checking rating status...</p>
        </div>
      </ScreenContainer>
    );
  }

  // ── Success state ────────────────────────────────────────────
  if (submitted) {
    return (
      <ScreenContainer title="Rate Experience" showBack>
        <div className="flex flex-col items-center justify-center h-full px-6 py-12 text-center">
          <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mb-6">
            <ThumbsUp size={36} className="text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-text-primary mb-3">Thank You!</h2>
          <p className="text-text-secondary mb-8">
            Your feedback helps other patients find the right doctor.
          </p>
          <Button fullWidth onClick={() => navigate('/patient-dashboard')}>
            Back to Dashboard
          </Button>
        </div>
      </ScreenContainer>
    );
  }

  // ── Error state (Only if can_rate is false) ──────────────────
  if (error && !rating && !submitting) {
    return (
      <ScreenContainer title="Rate Experience" showBack>
        <div className="flex flex-col items-center justify-center h-full px-6 py-12 text-center">
          <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center mb-6 text-red-500">
            <Star size={36} />
          </div>
          <h2 className="text-xl font-bold text-text-primary mb-3">Notice</h2>
          <p className="text-text-secondary mb-8">{error}</p>
          <Button variant="outline" fullWidth onClick={() => navigate('/history')}>
            Back to History
          </Button>
        </div>
      </ScreenContainer>
    );
  }

  // ── Rating form ──────────────────────────────────────────────
  return (
    <ScreenContainer title="Rate Experience" showBack>
      <div className="px-6 py-6 pb-8">

        <div className="flex justify-center mb-8">
          <DoctorAvatar image={doctorImage} name={doctorName} size="lg" />
        </div>
        <div className="text-center mb-8">
          <h2 className="text-xl font-bold text-text-primary">{doctorName}</h2>
          {specialization && (
            <p className="text-text-secondary">{specialization}</p>
          )}
        </div>

        {/* Star rating */}
        <div className="flex flex-col items-center mb-8">
          <div className="flex gap-2 mb-2">
            {[1, 2, 3, 4, 5].map(star => (
              <button
                key={star}
                onClick={() => setRating(star)}
                className="transition-transform hover:scale-110 focus:outline-none"
              >
                <Star
                  size={40}
                  className={star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}
                  strokeWidth={1.5}
                />
              </button>
            ))}
          </div>
          <span className="text-lg font-medium text-primary h-8">
            {rating > 0 ? ratingLabels[rating - 1] : ''}
          </span>
        </div>

        {/* Tags */}
        <div className="mb-8">
          <p className="text-sm font-bold text-text-secondary mb-3 text-center">
            What went well?
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {availableTags.map(tag => (
              <button
                key={tag}
                onClick={() => toggleTag(tag)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all border ${tags.includes(tag)
                    ? 'bg-primary text-white border-primary'
                    : 'bg-white text-text-secondary border-gray-200 hover:border-gray-300'
                  }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Review text */}
        <div className="mb-8">
          <textarea
            value={review}
            onChange={e => setReview(e.target.value)}
            placeholder="Share your experience (optional)..."
            className="w-full h-32 p-4 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:border-primary resize-none transition-colors"
          />
        </div>

        {/* Error */}
        {error && (
          <Card className="bg-red-50 border-red-200 mb-4">
            <p className="text-red-600 text-sm text-center">{error}</p>
          </Card>
        )}

        {/* Actions */}
        <div className="space-y-3">
          <Button
            fullWidth
            onClick={handleSubmit}
            disabled={rating === 0 || submitting}
            icon={<ThumbsUp size={18} />}
          >
            {submitting ? 'Submitting…' : 'Submit Review'}
          </Button>
          <Button variant="ghost" fullWidth onClick={() => navigate('/patient-dashboard')}>
            Skip
          </Button>
        </div>
      </div>
    </ScreenContainer>
  );
}