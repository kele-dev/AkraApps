import React from 'react';

interface AnimatedBookProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const AnimatedBook: React.FC<AnimatedBookProps> = ({ className = '', size = 'sm' }) => {
  // Scale classes to size the book loader easily
  const sizeClasses = {
    sm: 'scale-75',
    md: 'scale-100',
    lg: 'scale-150',
  };

  return (
    <div className={`inline-flex items-center justify-center ${sizeClasses[size]} ${className}`} aria-hidden="true">
      <div className="flipping-book">
        <div className="book-cover-left" />
        <div className="book-cover-right" />
        <div className="book-spine" />
        <div className="page" />
        <div className="page" />
        <div className="page" />
      </div>
    </div>
  );
};
