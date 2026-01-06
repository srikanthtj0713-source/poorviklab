import React, { useState } from "react";
import { ProgressSteps } from "@/components/ui/progress-steps";
import { PatientInfoForm } from "@/components/PatientInfoForm";
import { TestSelectionForm } from "@/components/TestSelectionForm";
import { AIAnalysisView } from "@/components/AIAnalysisView";
import PrintableReport from "@/components/PrintableReport";
import { BillingPage } from "@/components/BillingPage";
import { useLabReport } from "@/hooks/useLabReport";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RotateCcw, Microscope, Brain, FileText, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { TEST_CATEGORIES } from "@/types/lab";
import aliasMapRaw from "@/data/test-aliases.json";

const WORKFLOW_STEPS = [
  { id: 'patient-info', label: 'Patient Info', description: 'Basic details' },
  { id: 'test-selection', label: 'Test Results', description: 'Enter values' },
  { id: 'ai-analysis', label: 'AI Analysis', description: 'Generate report' },
  { id: 'final-report', label: 'Final Report', description: 'Download & print' },
  { id: 'billing', label: 'Billing', description: 'Invoice & payment' },
];

const Index = () => {
  const [frontPageSearch, setFrontPageSearch] = useState("");
  const [reportMode, setReportMode] = useState<'all' | 'per-category'>('all');
  const { toast } = useToast();
  const {
    currentStep,
    completedSteps,
    patient,
    testResults,
    aiAnalysis,
    isGeneratingReport,
    refDoctor,
    regNo,
    bookingNo,
    invoiceNo,
    receiptNo,
    billingPrices,
    billingDiscount,
    billingPaid,
    billingPayMode,
    updatePatient,
    updateTestResult,
    completeStep,
    goToStep,
    generateAIAnalysis,
    resetReport,
    setRefDoctor,
    setRegNo,
    setBookingNo,
    setInvoiceNo,
    setReceiptNo,
    setBillingPrices,
    setBillingDiscount,
    setBillingPaid,
    setBillingPayMode,
  } = useLabReport();

  const handleImportDataFromUpload = (data: Record<string, Record<string, string>>) => {
    const aliasMap = Object.fromEntries(
      Object.entries(aliasMapRaw as Record<string, string>).map(([k, v]) => [k.toLowerCase(), v])
    ) as Record<string, string>;

    const findCanonicalTestName = (rawName: string) => {
      const trimmed = String(rawName || '').trim();
      if (!trimmed) return '';
      const mapped = aliasMap[trimmed.toLowerCase()];
      const afterAlias = mapped || trimmed;

      // Snap to canonical test name from TEST_CATEGORIES (case-insensitive) if present
      for (const cat of TEST_CATEGORIES) {
        for (const pnl of cat.panels) {
          for (const t of pnl.tests) {
            if (t.name.toLowerCase() === afterAlias.toLowerCase()) return t.name;
          }
        }
      }
      return afterAlias;
    };

    const findCategoryId = (rawCategory: string, canonTestName?: string) => {
      const c = String(rawCategory || '').trim();
      if (!c && canonTestName) {
        for (const cat of TEST_CATEGORIES) {
          if (cat.panels.some(p => p.tests.some(t => t.name.toLowerCase() === canonTestName.toLowerCase()))) {
            return cat.id;
          }
        }
      }

      // match by id or name
      for (const cat of TEST_CATEGORIES) {
        if (cat.id.toLowerCase() === c.toLowerCase()) return cat.id;
        if (cat.name.toLowerCase() === c.toLowerCase()) return cat.id;
      }

      // fallback infer from test name if possible
      if (canonTestName) {
        for (const cat of TEST_CATEGORIES) {
          if (cat.panels.some(p => p.tests.some(t => t.name.toLowerCase() === canonTestName.toLowerCase()))) {
            return cat.id;
          }
        }
      }
      return '';
    };

    const unmatched: Array<{ category: string; testName: string }> = [];

    Object.entries(data).forEach(([categoryRaw, tests]) => {
      Object.entries(tests).forEach(([testNameRaw, value]) => {
        const canonTestName = findCanonicalTestName(testNameRaw);
        const categoryId = findCategoryId(categoryRaw, canonTestName);

        if (!canonTestName || !categoryId) {
          unmatched.push({ category: categoryRaw, testName: testNameRaw });
          return;
        }

        updateTestResult(categoryId, canonTestName, value);
      });
    });

    if (unmatched.length > 0) {
      const preview = unmatched.slice(0, 6).map(u => `${u.testName} (${u.category || 'no category'})`).join(', ');
      toast({
        title: 'Some uploaded rows were not imported',
        description: unmatched.length > 6 ? `${preview} … (+${unmatched.length - 6} more)` : preview,
        variant: 'destructive',
      });
    }

    completeStep('test-selection');
    goToStep('final-report');
  };

  const handlePatientNext = () => {
    completeStep('patient-info');
    goToStep('test-selection');
  };

  const handleTestsNext = () => {
    completeStep('test-selection');
    goToStep('ai-analysis');
  };

  const handleTestsBack = () => {
    goToStep('patient-info');
  };

  const handleAnalysisBack = () => {
    goToStep('test-selection');
  };

  const handleGenerateAnalysis = async () => {
    await generateAIAnalysis();
    goToStep('final-report');
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'patient-info':
        return (
          <PatientInfoForm
            patient={patient}
            onUpdate={updatePatient}
            onNext={handlePatientNext}
          />
        );
      case 'test-selection':
        return (
          <TestSelectionForm
            testResults={testResults}
            onUpdateTest={updateTestResult}
            onImportData={handleImportDataFromUpload}
            onNext={handleTestsNext}
            onBack={handleTestsBack}
          />
        );
      case 'ai-analysis':
        return (
          <AIAnalysisView
            patient={patient as any}
            testResults={testResults}
            aiAnalysis={aiAnalysis}
            isGenerating={isGeneratingReport}
            onGenerateAnalysis={handleGenerateAnalysis}
            onBack={handleAnalysisBack}
            onEdit={() => goToStep('test-selection')}
          />
        );
      case 'final-report':
        return (
          <div className="max-w-[210mm] mx-auto p-4 space-y-3">
            <div className="flex items-center justify-between gap-2 print:hidden">
              <span className="text-sm text-muted-foreground">View mode:</span>
              <div className="flex items-center justify-end gap-2">
                <Button
                  variant={reportMode === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setReportMode('all')}
                >
                  Single Page (All)
                </Button>
                <Button
                  variant={reportMode === 'per-category' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setReportMode('per-category')}
                >
                  Per Category (Pages)
                </Button>
              </div>
            </div>
            <PrintableReport
              patient={patient as any}
              testResults={testResults}
              refDoctor={refDoctor}
              regNo={regNo}
              onChangeRefDoctor={setRefDoctor}
              onChangeRegNo={setRegNo}
              onGoToBilling={() => goToStep('billing')}
              mode={reportMode}
            />
          </div>
        );
      case 'billing':
        return (
          <BillingPage
            patient={patient as any}
            testResults={testResults}
            refDoctor={refDoctor}
            bookingNo={bookingNo}
            invoiceNo={invoiceNo}
            receiptNo={receiptNo}
            billingPrices={billingPrices}
            billingDiscount={billingDiscount}
            billingPaid={billingPaid}
            billingPayMode={billingPayMode}
            onBack={() => goToStep('final-report')}
            onChangePrice={(testName, price) =>
              setBillingPrices((prev) => ({ ...prev, [testName]: price }))
            }
            onChangeDiscount={(discount) => setBillingDiscount(discount)}
            onChangePaid={(paid) => setBillingPaid(paid)}
            onChangeBookingNo={(booking) => setBookingNo(booking)}
            onChangeInvoiceNo={(invoice) => setInvoiceNo(invoice)}
            onChangeReceiptNo={(receipt) => setReceiptNo(receipt)}
            onChangePayMode={(mode) => setBillingPayMode(mode)}
          />
        );
      default:
        return null;
    }
  };

  if (currentStep === 'final-report' || currentStep === 'billing') {
    return (
      <div className="bg-white min-h-screen">
        {renderCurrentStep()}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-7xl mx-auto space-y-8">
        {currentStep !== 'final-report' && (
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-medical flex items-center justify-center">
                <Microscope className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-4xl font-bold text-foreground">LabIntel Pro</h1>
            </div>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              AI-powered medical laboratory reporting system for fast, accurate, and intelligent test analysis
            </p>
            
            {/* Front Page Search */}
            <></>
          </div>
        )}

        {currentStep !== 'final-report' && (<></>)}

        {/* Main Content */}
        <div className="animate-fade-in">
          {renderCurrentStep()}
        </div>

        {currentStep !== 'final-report' && (
          <div className="text-center text-sm text-muted-foreground border-t pt-6">
            <div className="flex items-center justify-center gap-4">
              <div className="flex items-center gap-2">
                <Brain className="w-4 h-4" />
                <span>AI-Powered Analysis</span>
              </div>
              <span>•</span>
              <div className="flex items-center gap-2">
                <Microscope className="w-4 h-4" />
                <span>Professional Lab Reports</span>
              </div>
              <span>•</span>
              <span>Secure & HIPAA Compliant</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;