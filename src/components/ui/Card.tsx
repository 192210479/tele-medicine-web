import React, { HTMLAttributes } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export const Card: React.FC<CardProps> = ({ children, className = "", ...rest }) => (
  <div className={`bg-white rounded-2xl shadow-soft p-4 ${className}`} {...rest}>
    {children}
  </div>
);

export default Card;
