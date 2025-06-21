
import React from 'react';

interface InputFieldProps {
  label: string;
  id: string;
  type: 'number' | 'text'; // Simplified for this use case
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  unit?: string;
  min?: number;
  max?: number;
  step?: number;
  placeholder?: string;
  isOptional?: boolean;
  options?: { value: string | number; label: string }[]; // For select dropdown
  disabled?: boolean;
}

const InputField: React.FC<InputFieldProps> = ({
  label,
  id,
  type,
  value,
  onChange,
  unit,
  min,
  max,
  step,
  placeholder,
  isOptional = false,
  options,
  disabled = false,
}) => {
  const commonProps = {
    id,
    value: value ?? '', // Handle null/undefined for controlled components
    onChange,
    min,
    max,
    step,
    placeholder,
    disabled,
    className: `mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#007bff] focus:border-[#007bff] sm:text-sm ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}`,
  };

  return (
    <div className="mb-4">
      <label htmlFor={id} className="block text-sm font-medium text-gray-700">
        {label} {isOptional && <span className="text-xs text-gray-500">(Opcional)</span>}
      </label>
      <div className="mt-1 relative rounded-md shadow-sm">
        {options ? (
          <select {...commonProps} value={value}>
            {options.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        ) : (
          <input type={type} {...commonProps} />
        )}
        {unit && !options && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <span className="text-gray-500 sm:text-sm">{unit}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default InputField;