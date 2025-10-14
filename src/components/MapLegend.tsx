'use client';

interface LegendItem {
  color: string;
  label: string;
  description?: string;
}

interface MapLegendProps {
  title: string;
  items: LegendItem[];
  className?: string;
}

export default function MapLegend({ title, items, className = '' }: MapLegendProps) {
  return (
    <div className={`bg-white/90 backdrop-blur-sm rounded-lg p-4 shadow-lg border ${className}`}>
      <h3 className="font-semibold text-gray-800 mb-3">{title}</h3>
      <div className="space-y-2">
        {items.map((item, index) => (
          <div key={index} className="flex items-center space-x-3">
            <div 
              className="w-4 h-4 rounded-full flex-shrink-0"
              style={{ backgroundColor: item.color }}
            />
            <div className="flex-1">
              <div className="text-sm font-medium text-gray-700">
                {item.label}
              </div>
              {item.description && (
                <div className="text-xs text-gray-500">
                  {item.description}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
