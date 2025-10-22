import React from "react";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronRight } from "lucide-react";

interface CategoryCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  isExpanded: boolean;
  onToggle: () => void;
  children?: React.ReactNode;
  testCount?: number;
  className?: string;
}

export function CategoryCard({ 
  icon, 
  title, 
  description, 
  isExpanded, 
  onToggle, 
  children, 
  testCount,
  className 
}: CategoryCardProps) {
  return (
    <div className={cn(
      "border rounded-lg bg-card shadow-soft transition-all duration-300 hover:shadow-medical",
      className
    )}>
      <button
        onClick={onToggle}
        className="w-full p-6 text-left flex items-center justify-between hover:bg-muted/50 transition-colors rounded-lg"
      >
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-full bg-gradient-medical flex items-center justify-center text-white text-xl">
            {icon}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">{title}</h3>
            <p className="text-sm text-muted-foreground">{description}</p>
            {testCount && (
              <span className="inline-block mt-1 px-2 py-1 bg-secondary text-secondary-foreground text-xs rounded-full">
                {testCount} tests available
              </span>
            )}
          </div>
        </div>
        <div className="text-muted-foreground">
          {isExpanded ? (
            <ChevronDown className="w-5 h-5" />
          ) : (
            <ChevronRight className="w-5 h-5" />
          )}
        </div>
      </button>
      
      {isExpanded && children && (
        <div className="px-6 pb-6 animate-fade-in">
          <div className="border-t pt-4">
            {children}
          </div>
        </div>
      )}
    </div>
  );
}