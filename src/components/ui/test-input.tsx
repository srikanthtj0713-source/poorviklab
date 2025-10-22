import React from "react";
import { cn } from "@/lib/utils";
import { Input } from "./input";
import { Label } from "./label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select";
import { AlertTriangle, CheckCircle } from "lucide-react";

interface TestInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  unit?: string;
  normalRange?: string;
  placeholder?: string;
  className?: string;
  type?: 'number' | 'select';
  options?: string[];
  onFocus?: () => void;
}

export function TestInput({ 
  label, 
  value, 
  onChange, 
  unit, 
  normalRange, 
  placeholder,
  className,
  type = 'number',
  options = [],
  onFocus
}: TestInputProps) {
  const isAbnormal = value && normalRange && !isValueInRange(value, normalRange);
  
  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={label} className="text-sm font-medium text-foreground">
        {label}
        {unit && <span className="text-muted-foreground ml-1">({unit})</span>}
      </Label>
      
      <div className="relative">
        {type === 'select' ? (
          <Select value={value} onValueChange={onChange}>
            <SelectTrigger 
              className={cn(
                "transition-colors",
                {
                  "border-alert-red focus:border-alert-red focus:ring-alert-red/20": isAbnormal,
                  "border-lab-green focus:border-lab-green focus:ring-lab-green/20": value && !isAbnormal,
                }
              )}
              onFocus={onFocus}
            >
              <SelectValue placeholder="Select result" />
            </SelectTrigger>
            <SelectContent>
              {options.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <Input
            id={label}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder || "Enter value"}
            type={placeholder?.includes('e.g.,') ? "text" : "number"}
            className={cn(
              "transition-colors",
              {
                "border-alert-red focus:border-alert-red focus:ring-alert-red/20": isAbnormal,
                "border-lab-green focus:border-lab-green focus:ring-lab-green/20": value && !isAbnormal,
              }
            )}
            onFocus={onFocus}
          />
        )}
        
        <div
          className={cn(
            "absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none transition-opacity",
            value ? "opacity-100" : "opacity-0"
          )}
          aria-hidden={!value}
        >
          {isAbnormal ? (
            <AlertTriangle className="w-4 h-4 text-alert-red" />
          ) : (
            <CheckCircle className="w-4 h-4 text-lab-green" />
          )}
        </div>
      </div>
      
      {normalRange && (
        <p className="text-xs text-muted-foreground">
          Normal range: {normalRange}
        </p>
      )}
      
      {isAbnormal && (
        <p className="text-xs text-alert-red font-medium flex items-center gap-1">
          <AlertTriangle className="w-3 h-3" />
          Outside normal range
        </p>
      )}
    </div>
  );
}

function isValueInRange(value: string, range: string): boolean {
  // For non-numeric values (like Positive/Negative), check exact match
  if (isNaN(parseFloat(value))) {
    return value === range;
  }
  
  const numValue = parseFloat(value);
  
  // Parse ranges like "3.5-5.0", "<10", ">5", etc.
  if (range.includes('-')) {
    const [min, max] = range.split('-').map(s => parseFloat(s.trim()));
    return numValue >= min && numValue <= max;
  }
  
  if (range.startsWith('<')) {
    const max = parseFloat(range.substring(1));
    return numValue < max;
  }
  
  if (range.startsWith('>')) {
    const min = parseFloat(range.substring(1));
    return numValue > min;
  }
  
  return true;
}