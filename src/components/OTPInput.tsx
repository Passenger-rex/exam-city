import React, { useState, useRef, KeyboardEvent } from 'react';

interface OTPInputProps {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function OTPInput({ length = 6, value, onChange, disabled = false }: OTPInputProps) {
  const [activeInput, setActiveInput] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const val = e.target.value;
    if (!/^[0-9]*$/.test(val)) return;

    const newValue = value.split('');
    newValue[index] = val.substring(val.length - 1);
    
    const combinedValue = newValue.join('');
    onChange(combinedValue);

    // Focus next input
    if (val && index < length - 1) {
      setActiveInput(index + 1);
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace' && !value[index] && index > 0) {
      setActiveInput(index - 1);
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleFocus = (index: number) => {
    setActiveInput(index);
    // ensure focus is at the end of input
    const input = inputRefs.current[index];
    if (input) {
      input.setSelectionRange(1, 1);
    }
  };

  // Convert string to array
  const valueArray = value.split('');
  // Pad with empty strings if length < expected length
  while (valueArray.length < length) {
    valueArray.push('');
  }

  // Handle paste
  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text/plain').slice(0, length).replace(/[^0-9]/g, '');
    if (pastedData) {
      onChange(pastedData);
      const nextFocus = Math.min(pastedData.length, length - 1);
      setActiveInput(nextFocus);
      inputRefs.current[nextFocus]?.focus();
    }
  };

  return (
    <div className="flex justify-center gap-2 sm:gap-4 my-6">
      {Array.from({ length }, (_, index) => (
        <input
          key={index}
          ref={(el) => (inputRefs.current[index] = el)}
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="[0-9]*"
          maxLength={1}
          disabled={disabled}
          value={valueArray[index] || ''}
          onChange={(e) => handleChange(e, index)}
          onKeyDown={(e) => handleKeyDown(e, index)}
          onFocus={() => handleFocus(index)}
          onPaste={handlePaste}
          className={`w-10 h-12 sm:w-12 sm:h-14 text-center text-xl font-bold rounded-xl border-2 transition-all outline-none 
            ${disabled ? 'bg-surface-dim opacity-50 cursor-not-allowed' : 'bg-surface'}
            ${activeInput === index ? 'border-primary shadow-[0_0_0_2px_rgba(var(--color-primary),0.2)]' : 'border-outline-variant/50 focus:border-primary'}
            ${valueArray[index] ? 'border-primary text-on-surface' : 'text-on-surface-variant'}
          `}
        />
      ))}
    </div>
  );
}
