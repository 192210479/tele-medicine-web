import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, ThumbsUp } from 'lucide-react';
import { ScreenContainer } from '../components/layout/ScreenContainer';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
export function RateDoctorScreen() {
  const navigate = useNavigate();
  const [rating, setRating] = useState(0);
  const [tags, setTags] = useState<string[]>([]);
  const [review, setReview] = useState('');
  const ratingLabels = ['Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];
  const availableTags = [
  'Professional',
  'Knowledgeable',
  'Patient',
  'Clear Explanation',
  'On Time'];

  const toggleTag = (tag: string) => {
    if (tags.includes(tag)) setTags(tags.filter((t) => t !== tag));else
    setTags([...tags, tag]);
  };
  const handleSubmit = () => {
    navigate('/patient-dashboard');
  };
  return (
    <ScreenContainer title="Rate Experience" showBack>
      <div className="px-6 py-6 pb-8">
        {/* Doctor Info */}
        <div className="text-center mb-8">
          <div className="w-24 h-24 rounded-full bg-gray-200 mx-auto mb-4 overflow-hidden border-4 border-white shadow-md">
            <img
              src="https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=300&h=300"
              alt="Doctor"
              className="w-full h-full object-cover" />

          </div>
          <h2 className="text-xl font-bold text-text-primary">
            Dr. Sarah Smith
          </h2>
          <p className="text-text-secondary">Cardiologist</p>
        </div>

        {/* Main Rating */}
        <div className="flex flex-col items-center mb-8">
          <div className="flex gap-2 mb-2">
            {[1, 2, 3, 4, 5].map((star) =>
            <button
              key={star}
              onClick={() => setRating(star)}
              className="transition-transform hover:scale-110 focus:outline-none">

                <Star
                size={40}
                className={
                star <= rating ?
                'fill-yellow-400 text-yellow-400' :
                'text-gray-300'
                }
                strokeWidth={1.5} />

              </button>
            )}
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
            {availableTags.map((tag) =>
            <button
              key={tag}
              onClick={() => toggleTag(tag)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all border ${tags.includes(tag) ? 'bg-primary text-white border-primary' : 'bg-white text-text-secondary border-gray-200 hover:border-gray-300'}`}>

                {tag}
              </button>
            )}
          </div>
        </div>

        {/* Review Text */}
        <div className="mb-8">
          <textarea
            value={review}
            onChange={(e) => setReview(e.target.value)}
            placeholder="Share your experience (optional)..."
            className="w-full h-32 p-4 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:border-primary resize-none transition-colors" />

        </div>

        {/* Actions */}
        <div className="space-y-3">
          <Button
            fullWidth
            onClick={handleSubmit}
            disabled={rating === 0}
            icon={<ThumbsUp size={18} />}>

            Submit Review
          </Button>
          <Button
            variant="ghost"
            fullWidth
            onClick={() => navigate('/patient-dashboard')}>

            Skip
          </Button>
        </div>
      </div>
    </ScreenContainer>);

}