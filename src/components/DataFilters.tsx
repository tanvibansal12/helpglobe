'use client';

import { useState } from 'react';

interface FilterOption {
  value: string;
  label: string;
}

interface DataFiltersProps {
  title: string;
  options: FilterOption[];
  selectedValues: string[];
  onChange: (values: string[]) => void;
  multiple?: boolean;
  className?: string;
}

export default function DataFilters({
  title,
  options,
  selectedValues,
  onChange,
  multiple = true,
  className = ''
}: DataFiltersProps) {
  const handleOptionChange = (value: string) => {
    if (multiple) {
      const newValues = selectedValues.includes(value)
        ? selectedValues.filter(v => v !== value)
        : [...selectedValues, value];
      onChange(newValues);
    } else {
      onChange([value]);
    }
  };

  return (
    <div className={`bg-white/90 backdrop-blur-sm rounded-lg p-4 shadow-lg border ${className}`}>
      <h3 className="font-semibold text-gray-800 mb-3">{title}</h3>
      <div className="space-y-2">
        {options.map((option) => (
          <label key={option.value} className="flex items-center space-x-2 cursor-pointer">
            <input
              type={multiple ? 'checkbox' : 'radio'}
              name={title}
              value={option.value}
              checked={selectedValues.includes(option.value)}
              onChange={() => handleOptionChange(option.value)}
              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">{option.label}</span>
          </label>
        ))}
      </div>
    </div>
  );
}
