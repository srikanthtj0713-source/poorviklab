import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Patient } from "@/types/lab";
import { User, IdCard, Calendar, Users } from "lucide-react";

interface PatientInfoFormProps {
  patient: Partial<Patient>;
  onUpdate: (updates: Partial<Patient>) => void;
  onNext: () => void;
}

export function PatientInfoForm({ patient, onUpdate, onNext }: PatientInfoFormProps) {
  const isValid = patient.name && patient.age && patient.gender && patient.patientId;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isValid) {
      onNext();
    }
  };

  return (
    <Card className="max-w-2xl mx-auto shadow-medical">
      <CardHeader className="bg-gradient-medical text-white rounded-t-lg">
        <CardTitle className="flex items-center gap-2">
          <User className="w-5 h-5" />
          Patient Information
        </CardTitle>
        <CardDescription className="text-white/90">
          Enter basic patient details to begin the lab report
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="patientId" className="flex items-center gap-2">
                <IdCard className="w-4 h-4" />
                Patient ID
              </Label>
              <Input
                id="patientId"
                value={patient.patientId || ''}
                onChange={(e) => onUpdate({ patientId: e.target.value })}
                placeholder="e.g., PAT001"
                className="transition-all duration-300 focus:shadow-soft"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="name" className="flex items-center gap-2">
                <User className="w-4 h-4" />
                Full Name
              </Label>
              <Input
                id="name"
                value={patient.name || ''}
                onChange={(e) => onUpdate({ name: e.target.value })}
                placeholder="Enter patient's full name"
                className="transition-all duration-300 focus:shadow-soft"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="age" className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Age
              </Label>
              <Input
                id="age"
                type="number"
                value={patient.age || ''}
                onChange={(e) => onUpdate({ age: parseInt(e.target.value) || 0 })}
                placeholder="Enter age"
                min="0"
                max="150"
                className="transition-all duration-300 focus:shadow-soft"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="gender" className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Gender
              </Label>
              <Select
                value={patient.gender || ''}
                onValueChange={(value: 'male' | 'female' | 'other') => onUpdate({ gender: value })}
              >
                <SelectTrigger className="transition-all duration-300 focus:shadow-soft">
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="symptoms">
              Symptoms / Clinical Notes (Optional)
            </Label>
            <Textarea
              id="symptoms"
              value={patient.symptoms || ''}
              onChange={(e) => onUpdate({ symptoms: e.target.value })}
              placeholder="e.g., Fatigue, loss of appetite, fever..."
              className="min-h-[100px] transition-all duration-300 focus:shadow-soft"
            />
          </div>

          <Button 
            type="submit" 
            disabled={!isValid}
            className="w-full bg-gradient-medical hover:opacity-90 transition-all duration-300 shadow-soft hover:shadow-medical"
          >
            Continue to Test Selection
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}