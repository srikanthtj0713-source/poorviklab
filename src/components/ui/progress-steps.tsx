import React from "react";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface Step {
  id: string;
  label: string;
  description?: string;
}

interface ProgressStepsProps {
  steps: Step[];
  currentStep: string;
  completedSteps: string[];
  className?: string;
}

export function ProgressSteps({ steps, currentStep, completedSteps, className }: ProgressStepsProps) {
  const currentIndex = steps.findIndex(step => step.id === currentStep);
  
  return (
    <div className={cn("w-full", className)}>
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isCompleted = completedSteps.includes(step.id);
          const isCurrent = step.id === currentStep;
          const isPast = index < currentIndex;
          
          return (
            <React.Fragment key={step.id}>
              <div className="flex flex-col items-center space-y-2">
                <div
                  className={cn(
                    "w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all duration-300",
                    {
                      "bg-gradient-medical border-medical-blue text-white": isCurrent,
                      "bg-lab-green border-lab-green text-white": isCompleted || isPast,
                      "border-border bg-background text-muted-foreground": !isCurrent && !isCompleted && !isPast,
                    }
                  )}
                >
                  {isCompleted || isPast ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <span className="text-sm font-medium">{index + 1}</span>
                  )}
                </div>
                <div className="text-center">
                  <p className={cn(
                    "text-sm font-medium transition-colors",
                    {
                      "text-medical-blue": isCurrent,
                      "text-lab-green": isCompleted || isPast,
                      "text-muted-foreground": !isCurrent && !isCompleted && !isPast,
                    }
                  )}>
                    {step.label}
                  </p>
                  {step.description && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {step.description}
                    </p>
                  )}
                </div>
              </div>
              
              {index < steps.length - 1 && (
                <div 
                  className={cn(
                    "flex-1 h-0.5 mx-4 transition-colors duration-300",
                    {
                      "bg-lab-green": index < currentIndex,
                      "bg-border": index >= currentIndex,
                    }
                  )} 
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}