import React from 'react';
type IllustrationType =
'login' |
'success' |
'doctor' |
'empty' |
'consultation';
interface MedicalIllustrationProps {
  type: IllustrationType;
  className?: string;
}
export function MedicalIllustration({
  type,
  className = ''
}: MedicalIllustrationProps) {
  if (type === 'login') {
    return (
      <svg
        className={className}
        viewBox="0 0 200 160"
        fill="none"
        xmlns="http://www.w3.org/2000/svg">

        <circle cx="100" cy="80" r="70" fill="#E3F2FD" />
        <rect
          x="60"
          y="40"
          width="80"
          height="100"
          rx="8"
          fill="white"
          stroke="#1E88E5"
          strokeWidth="2" />

        <circle cx="100" cy="70" r="20" fill="#BBDEFB" />
        <path d="M80 110C80 100 120 100 120 110V120H80V110Z" fill="#1E88E5" />
        <circle cx="150" cy="40" r="15" fill="#43A047" opacity="0.8" />
        <path d="M145 40H155M150 35V45" stroke="white" strokeWidth="2" />
      </svg>);

  }
  if (type === 'success') {
    return (
      <svg
        className={className}
        viewBox="0 0 200 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg">

        <circle cx="100" cy="100" r="80" fill="#E8F5E9" />
        <path
          d="M60 100L90 130L140 70"
          stroke="#43A047"
          strokeWidth="12"
          strokeLinecap="round"
          strokeLinejoin="round" />

      </svg>);

  }
  if (type === 'consultation') {
    return (
      <svg
        className={className}
        viewBox="0 0 200 160"
        fill="none"
        xmlns="http://www.w3.org/2000/svg">

        <rect x="40" y="30" width="120" height="100" rx="8" fill="#1E88E5" />
        <circle cx="100" cy="70" r="25" fill="white" />
        <path
          d="M70 110C70 95 130 95 130 110V130H70V110Z"
          fill="white"
          opacity="0.5" />

        <rect
          x="130"
          y="90"
          width="40"
          height="50"
          rx="4"
          fill="white"
          stroke="#212121"
          strokeWidth="2" />

      </svg>);

  }
  return (
    <svg
      className={className}
      viewBox="0 0 200 160"
      fill="none"
      xmlns="http://www.w3.org/2000/svg">

      <rect x="50" y="50" width="100" height="60" rx="4" fill="#E0E0E0" />
      <path
        d="M80 80H120"
        stroke="#9E9E9E"
        strokeWidth="4"
        strokeLinecap="round" />

    </svg>);

}