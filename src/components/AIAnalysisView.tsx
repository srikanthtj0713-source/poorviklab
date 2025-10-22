import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { LabReport, TEST_CATEGORIES } from "@/types/lab";
import { 
  Brain, 
  AlertTriangle, 
  CheckCircle, 
  Stethoscope, 
  Clock, 
  Download,
  Printer,
  Edit,
  Loader2,
  Microscope,
  TrendingUp
} from "lucide-react";
import { TrendChart } from "./TrendChart";

interface AIAnalysisViewProps {
  patient: LabReport['patient'];
  testResults: Record<string, Record<string, string>>;
  aiAnalysis?: LabReport['aiAnalysis'];
  isGenerating: boolean;
  onGenerateAnalysis: () => void;
  onBack: () => void;
  onEdit: () => void;
}

export function AIAnalysisView({ 
  patient, 
  testResults, 
  aiAnalysis, 
  isGenerating, 
  onGenerateAnalysis,
  onBack,
  onEdit
}: AIAnalysisViewProps) {
  const getUrgencyColor = (level: string) => {
    switch (level) {
      case 'critical': return 'bg-gradient-alert';
      case 'high': return 'bg-alert-red';
      case 'medium': return 'bg-warning';
      case 'low': return 'bg-lab-green';
      default: return 'bg-muted';
    }
  };

  const getUrgencyIcon = (level: string) => {
    switch (level) {
      case 'critical':
      case 'high':
        return <AlertTriangle className="w-4 h-4" />;
      case 'medium':
        return <Clock className="w-4 h-4" />;
      case 'low':
        return <CheckCircle className="w-4 h-4" />;
      default:
        return <CheckCircle className="w-4 h-4" />;
    }
  };

  const formatTestResults = () => {
    const formattedResults: Array<{ category: string; tests: Array<{ name: string; value: string; unit: string; normalRange: string; isAbnormal: boolean }> }> = [];
    
    Object.entries(testResults).forEach(([categoryId, tests]) => {
      const category = TEST_CATEGORIES.find(c => c.id === categoryId);
      if (!category) return;

      const categoryTests = Object.entries(tests)
        .filter(([_, value]) => value.trim() !== '')
        .map(([testName, value]) => {
          const testInfo = category.panels
            .flatMap(panel => panel.tests)
            .find(t => t.name === testName);
          return {
            name: testName,
            value,
            unit: testInfo?.unit || '',
            normalRange: testInfo?.normalRange || '',
            isAbnormal: isValueAbnormal(testName, value, testInfo?.normalRange || '')
          };
        });

      if (categoryTests.length > 0) {
        formattedResults.push({
          category: category.name,
          tests: categoryTests
        });
      }
    });

    return formattedResults;
  };

  const formattedResults = formatTestResults();

  if (isGenerating) {
    return (
      <Card className="max-w-4xl mx-auto shadow-medical">
        <CardContent className="p-12 text-center">
          <div className="flex flex-col items-center space-y-4">
            <Loader2 className="w-12 h-12 animate-spin text-medical-blue" />
            <h3 className="text-xl font-semibold">Generating AI Analysis</h3>
            <p className="text-muted-foreground">
              Our AI is analyzing the test results and generating insights...
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!aiAnalysis) {
    return (
      <Card className="max-w-4xl mx-auto shadow-medical">
        <CardHeader className="bg-gradient-medical text-white rounded-t-lg">
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5" />
            Ready for AI Analysis
          </CardTitle>
          <CardDescription className="text-white/90">
            Generate intelligent insights from the entered test results
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="text-center space-y-6">
            <div className="bg-muted/50 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-2">Test Results Summary</h3>
              <p className="text-muted-foreground">
                {formattedResults.length} categories with test results entered
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="outline" onClick={onBack}>
                Back to Tests
              </Button>
              <Button 
                onClick={onGenerateAnalysis}
                className="bg-gradient-medical hover:opacity-90"
              >
                Generate AI Analysis
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Report Header with Dates */}
      <Card className="shadow-medical">
        <CardHeader className="bg-gradient-medical text-white rounded-t-lg">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-2xl">LABORATORY REPORT</CardTitle>
              <CardDescription className="text-white/90 mt-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="bg-white/10 rounded p-2">
                    <span className="font-semibold text-white/80">Patient Name:</span><br />
                    <span className="font-bold text-lg">{patient.name || 'Not Specified'}</span>
                  </div>
                  <div className="bg-white/10 rounded p-2">
                    <span className="font-semibold text-white/80">Patient ID:</span><br />
                    <span className="font-bold">{patient.patientId || 'Not Assigned'}</span>
                  </div>
                  <div className="bg-white/10 rounded p-2">
                    <span className="font-semibold text-white/80">Age:</span><br />
                    <span className="font-bold">{patient.age ? `${patient.age} Years` : 'Not Specified'}</span>
                  </div>
                  <div className="bg-white/10 rounded p-2">
                    <span className="font-semibold text-white/80">Gender:</span><br />
                    <span className="font-bold">{patient.gender || 'Not Specified'}</span>
                  </div>
                </div>
              </CardDescription>
            </div>
            <div className="text-right text-white/90">
              <div className="text-sm">Report Date: {new Date().toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}</div>
              <div className="text-sm">Print Date: {new Date().toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}</div>
              <div className="text-sm mt-1">Lab ID: LAB-{Date.now().toString().slice(-6)}</div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Test Results Table */}
      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Microscope className="w-5 h-5" />
            Laboratory Test Results
          </CardTitle>
          <CardDescription>
            Biological Reference Intervals and Test Values
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-8">
            {formattedResults.map((categoryResult) => (
              <div key={categoryResult.category}>
                <div className="bg-muted/30 px-4 py-2 rounded-t-lg border-b-2 border-medical-blue">
                  <h3 className="text-lg font-bold text-medical-blue uppercase tracking-wide">
                    {categoryResult.category}
                  </h3>
                </div>
                
                <div className="border border-t-0 rounded-b-lg overflow-hidden">
                  <table className="w-full table-fixed text-[12px]">
                    <thead>
                      <tr className="bg-muted/20 border-b">
                        <th className="px-2 py-2 font-semibold w-[30%] text-left">Test Name</th>
                        <th className="px-2 py-2 font-semibold w-[20%] text-right">Observed Values</th>
                        <th className="px-2 py-2 font-semibold w-[20%] text-right">Units</th>
                        <th className="px-2 py-2 font-semibold w-[30%] text-left">Biological Reference Intervals</th>
                      </tr>
                    </thead>
                    <tbody>
                      {categoryResult.tests.map((test) => {
                        const displayRange = test.normalRange.replace(/\s*[-–]\s*/g, ' - ');
                        return (
                          <tr key={test.name} className="bg-white border-b">
                            <td className="px-2 py-2 font-medium">{test.name}</td>
                            <td className="px-2 py-2 font-bold text-right whitespace-nowrap">{test.value}</td>
                            <td className="px-2 py-2 text-right text-muted-foreground whitespace-nowrap">{test.unit}</td>
                            <td className="px-2 py-2 text-muted-foreground whitespace-pre-line">{displayRange}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* AI Analysis */}
      <Card className="shadow-medical">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5" />
            AI Analysis & Clinical Insights
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge className={`${getUrgencyColor(aiAnalysis.urgencyLevel)} text-white`}>
              {getUrgencyIcon(aiAnalysis.urgencyLevel)}
              {aiAnalysis.urgencyLevel.toUpperCase()} PRIORITY
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h4 className="font-semibold mb-2">Summary</h4>
            <p className="text-muted-foreground">{aiAnalysis.summary}</p>
          </div>

          {aiAnalysis.abnormalFindings.length > 0 && (
            <div>
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-alert-red" />
                Abnormal Findings
              </h4>
              <ul className="space-y-1">
                {aiAnalysis.abnormalFindings.map((finding, index) => (
                  <li key={index} className="text-alert-red font-medium">
                    • {finding}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div>
            <h4 className="font-semibold mb-2 flex items-center gap-2">
              <Stethoscope className="w-4 h-4" />
              Clinical Interpretation
            </h4>
            <div className="bg-muted/30 rounded-lg p-4">
              <p className="text-foreground whitespace-pre-line leading-relaxed">
                {aiAnalysis.clinicalInterpretation}
              </p>
            </div>
          </div>

          {aiAnalysis.recommendations.length > 0 && (
            <div>
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-medical-blue" />
                Clinical Recommendations
              </h4>
              <ul className="space-y-2">
                {aiAnalysis.recommendations.map((recommendation, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="w-2 h-2 bg-medical-blue rounded-full mt-2 flex-shrink-0" />
                    <span className="text-foreground">{recommendation}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {aiAnalysis.prescriptions.length > 0 && (
            <div>
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <Edit className="w-4 h-4 text-green-600" />
                Prescription Recommendations
              </h4>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <ul className="space-y-2">
                  {aiAnalysis.prescriptions.map((prescription, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="w-2 h-2 bg-green-600 rounded-full mt-2 flex-shrink-0" />
                      <span className="text-green-800 font-medium">{prescription}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {aiAnalysis.followUpInstructions.length > 0 && (
            <div>
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-600" />
                Follow-up Instructions
              </h4>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <ul className="space-y-2">
                  {aiAnalysis.followUpInstructions.map((instruction, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
                      <span className="text-blue-800">{instruction}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          <div className="bg-muted/50 rounded-lg p-4">
            <h4 className="font-semibold mb-2">Doctor's Note</h4>
            <p className="text-foreground whitespace-pre-line leading-relaxed">{aiAnalysis.doctorNote}</p>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex gap-2">
          <Button variant="outline" onClick={onBack}>
            Back to Tests
          </Button>
          <Button variant="outline" onClick={onEdit}>
            <Edit className="w-4 h-4 mr-2" />
            Edit Analysis
          </Button>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline">
            <Printer className="w-4 h-4 mr-2" />
            Print Report
          </Button>
          <Button className="bg-gradient-medical hover:opacity-90">
            <Download className="w-4 h-4 mr-2" />
            Download PDF
          </Button>
        </div>
      </div>
    </div>
  );
}

function isValueAbnormal(testName: string, value: string, normalRange: string): boolean {
  // Handle text-based results (like Positive/Negative)
  if (isNaN(parseFloat(value))) {
    return value !== normalRange;
  }
  
  const numValue = parseFloat(value);

  if (normalRange.includes('-')) {
    const [min, max] = normalRange.split('-').map(s => parseFloat(s.trim()));
    return numValue < min || numValue > max;
  }
  
  if (normalRange.startsWith('<')) {
    const max = parseFloat(normalRange.substring(1));
    return numValue >= max;
  }
  
  if (normalRange.startsWith('>')) {
    const min = parseFloat(normalRange.substring(1));
    return numValue <= min;
  }
  
  return false;
}