import React from 'react'

interface CircularProgressProps {
  progress: number
  size?: number
  strokeWidth?: number
  label?: string
}

export default function CircularProgress({ progress, size = 120, strokeWidth = 4, label = 'OVERALL' }: CircularProgressProps) {
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const strokeDashoffset = circumference - (progress*10 / 100) * circumference

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#f97316"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold">{progress}</span>
        <span className="text-xs uppercase">{label}</span>
      </div>
    </div>
  )
}

// Example usage
export function Component() {
  return (
    <div className="p-4 bg-white">
      <div className="flex items-center space-x-4">
        <CircularProgress progress={54} />
        <h1 className="text-2xl font-bold text-gray-800">Track your progress</h1>
      </div>
    </div>
  )
}