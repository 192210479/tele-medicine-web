interface DoctorAvatarProps {
  image?: string | null;
  name?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function DoctorAvatar({ image, name, size = 'md', className = '' }: DoctorAvatarProps) {
  const sizeClasses = {
    sm: 'w-10 h-10',
    md: 'w-14 h-14',
    lg: 'w-24 h-24'
  };

  return (
    <div className={`relative flex-shrink-0 ${sizeClasses[size]} ${className}`}>
      <div className="w-full h-full rounded-full overflow-hidden border-2 border-white shadow-md bg-gray-50 flex items-center justify-center">
        {image ? (
          <img
            src={image}
            alt={name || "Doctor"}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
              const parent = (e.target as HTMLImageElement).parentElement;
              if (parent) {
                const fallback = parent.querySelector('.avatar-fallback');
                if (fallback) (fallback as HTMLDivElement).style.display = 'flex';
              }
            }}
          />
        ) : null}
        <div className={`avatar-fallback w-full h-full bg-primary/10 flex items-center justify-center text-primary font-bold transition-all ${image ? 'hidden' : 'flex'}`}>
          {name?.slice(0, 2).toUpperCase() || "DR"}
        </div>
      </div>
    </div>
  );
}
