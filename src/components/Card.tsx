import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  hoverable?: boolean;
}

export const Card: React.FC<CardProps> = ({ children, hoverable = true, className = '', ...props }) => {
  return (
    <div
      className={`bg-white border border-border-light-gray rounded-xl p-5 shadow-xs transition-all duration-300 ${
        hoverable ? 'cursor-pointer hover:shadow-md hover:border-slate-300 hover:-translate-y-0.5' : 'cursor-default'
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
