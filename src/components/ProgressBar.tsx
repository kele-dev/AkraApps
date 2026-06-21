import React from 'react';

interface ProgressBarProps {
  value: number;
  max: number;
  showText?: boolean;
  color?: 'emerald' | 'gold' | 'purple';
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ 
  value, 
  max, 
  showText = true, 
  color = 'emerald' 
}) => {
  const percentage = Math.round((value / max) * 100) || 0;

  const colorMap = {
    emerald: {
      bar: 'bg-brand-green',
      text: 'text-brand-green'
    },
    gold: {
      bar: 'bg-brand-orange',
      text: 'text-brand-orange'
    },
    purple: {
      bar: 'bg-purple-600',
      text: 'text-purple-600'
    }
  };

  const selectedColor = colorMap[color];

  return (
    <div className="w-full">
      {showText && (
        <div className="flex justify-between mb-2 text-xs">
          <span className="text-text-slate-medium font-medium">
            {value} dari {max} halaman
          </span>
          <span className={`${selectedColor.text} font-bold`}>
            {percentage}%
          </span>
        </div>
      )}
      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden relative">
        <div
          className={`h-full rounded-full transition-all duration-300 ${selectedColor.bar}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};
