import { useState } from 'react';
import { Star, MapPin, User } from 'lucide-react';
import { Card } from './Card';
import { Button } from './Button';

interface DoctorCardProps {
  id: number;
  name: string;
  specialization: string;
  hospital?: string;
  address?: string;
  rating?: number;
  reviews?: number;
  image?: string;
  location?: string; // Kept for compatibility if needed, but we use address
  onBook?: () => void;
  compact?: boolean;
}

export function DoctorCard({
  id,
  name,
  specialization,
  hospital,
  address,
  rating = 4.5,
  reviews = 50,
  image,
  location,
  onBook,
  compact = false
}: DoctorCardProps) {
  const [imageError, setImageError] = useState(false);
  
  // Attempt to load /uploads/doctors/{doctor_id}.jpg
  const profileImage = imageError ? null : (image || `http://localhost:5000/uploads/doctors/${id}.jpg`);

  return (
    <Card className="flex flex-col gap-3">
      <div className="flex gap-4">
        {profileImage ? (
          <img
            src={profileImage}
            alt={name}
            onError={() => setImageError(true)}
            className="w-20 h-20 rounded-xl object-cover bg-gray-100" />
        ) : (
          <div className="w-20 h-20 rounded-xl bg-gray-100 flex items-center justify-center text-gray-400">
            <User size={32} />
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-bold text-text-primary truncate">{name}</h3>
              <p className="text-sm text-primary font-medium">{specialization}</p>
            </div>
            <div className="flex items-center gap-1 bg-yellow-50 px-1.5 py-0.5 rounded text-xs font-medium text-yellow-700">
              <Star size={12} className="fill-yellow-400 text-yellow-400" />
              {rating}
            </div>
          </div>

          <div className="mt-2 flex items-center gap-1 text-xs text-text-secondary">
            <MapPin size={12} />
            <span className="truncate">
              {address || hospital || location || 'Clinic information unavailable'}
            </span>
          </div>

          {!compact &&
          <p className="text-xs text-text-secondary mt-1">
              {reviews} Patient Reviews
            </p>
          }
        </div>
      </div>

      {onBook &&
      <Button
        variant="secondary"
        className="w-full h-10 text-sm"
        onClick={onBook}>
          Book Appointment
        </Button>
      }
    </Card>);
}