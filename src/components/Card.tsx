import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  hoverable?: boolean;
}

export const Card: React.FC<CardProps> = ({ children, hoverable = true, className = '', ...props }) => {
  return (
    <div
      className={`bg-white border border-border-light-gray rounded-lg p-5 shadow-xs transition-all duration-200 ${
        hoverable ? 'cursor-pointer hover:border-gray-300' : 'cursor-default'
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
