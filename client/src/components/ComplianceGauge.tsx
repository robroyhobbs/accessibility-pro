import React from 'react';

interface ComplianceGaugeProps {
  score: number;
}

const ComplianceGauge: React.FC<ComplianceGaugeProps> = ({ score }) => {
  // Calculate the stroke-dashoffset for the progress circle
  const radius = 69;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  
  // Determine color based on score
  const getColor = () => {
    if (score >= 80) return 'text-green-500'; // Success
    if (score >= 50) return 'text-yellow-500'; // Warning
    return 'text-red-500'; // Danger
  };

  return (
    <div className="relative w-40 h-40">
      <svg className="progress-ring" width="160" height="160">
        <circle
          className="text-gray-200"
          strokeWidth="12"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx="80"
          cy="80"
        />
        <circle
          className={getColor()}
          strokeWidth="12"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx="80"
          cy="80"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center flex-col">
        <span className="text-3xl font-bold">{score}%</span>
        <span className="text-sm text-gray-500">Compliance</span>
      </div>
    </div>
  );
};

export default ComplianceGauge;
