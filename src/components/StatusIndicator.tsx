'use client';

interface StatusIndicatorProps {
  status: 'online' | 'offline' | 'loading' | 'error';
  label?: string;
  className?: string;
}

export default function StatusIndicator({ 
  status, 
  label, 
  className = '' 
}: StatusIndicatorProps) {
  const getStatusConfig = () => {
    switch (status) {
      case 'online':
        return {
          color: 'bg-green-500',
          text: 'Online',
          icon: '●'
        };
      case 'offline':
        return {
          color: 'bg-gray-400',
          text: 'Offline',
          icon: '●'
        };
      case 'loading':
        return {
          color: 'bg-yellow-500',
          text: 'Loading',
          icon: '⟳'
        };
      case 'error':
        return {
          color: 'bg-red-500',
          text: 'Error',
          icon: '●'
        };
    }
  };

  const config = getStatusConfig();

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <div className={`w-2 h-2 rounded-full ${config.color} animate-pulse`}>
        <span className="sr-only">{config.icon}</span>
      </div>
      <span className="text-sm text-gray-600">
        {label || config.text}
      </span>
    </div>
  );
}
