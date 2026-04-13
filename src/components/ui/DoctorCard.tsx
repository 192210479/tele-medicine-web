import * as React from 'react';
import { Star, MapPin } from 'lucide-react';
import { Card } from './Card';
import { Button } from './Button';
interface DoctorCardProps extends React.HTMLAttributes<HTMLDivElement> {
  name: string;
  specialty: string;
  rating: number;
  reviews: number;
  image?: string | null;
  location?: string;
  onBook?: () => void;
  compact?: boolean;
}
export function DoctorCard({
  name,
  specialty,
  rating,
  reviews,
  image,
  location,
  onBook,
  compact = false
}: DoctorCardProps) {
  const getAvatarUrl = (profile_image?: string | null): string | null => {
    if (!profile_image) return null;
    if (profile_image.startsWith("/api/") || profile_image.startsWith("http"))
      return profile_image;
    return `/api/profile/image/file/${profile_image}`;
  };

  const avatarUrl = getAvatarUrl(image);

  return (
    <Card className="flex flex-col gap-3">
      <div className="flex gap-4">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={name}
            className="w-20 h-20 rounded-xl object-cover bg-gray-200"
            onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
          />
        ) : (
          <div className="w-20 h-20 rounded-xl bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-2xl">
            {name?.[0] ?? "D"}
          </div>
        )}
        
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-bold text-text-primary truncate">{name}</h3>
              <p className="text-sm text-primary font-medium">{specialty}</p>
            </div>
            <div className="flex items-center gap-1 bg-yellow-50 px-1.5 py-0.5 rounded text-xs font-medium text-yellow-700">
              <Star size={12} className="fill-yellow-400 text-yellow-400" />
              {Number(reviews) === 0 ? "0.0" : rating}
            </div>
          </div>

          <div className="mt-2 flex items-center gap-1 text-xs text-text-secondary">
            <MapPin size={12} />
            <span className="truncate">
              Tele Health+ Medical Center
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
