import React, { useState, useMemo } from "react";
import { getLocalBioRef } from "@/services/bioRef";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TestInput } from "@/components/ui/test-input";
import { UploadPanel } from "@/components/UploadPanel";
import { TEST_CATEGORIES } from "@/types/lab";
import { Microscope, Upload, FileSpreadsheet, Search, Filter, Download, ArrowLeft } from "lucide-react";

interface TestSelectionFormProps {
  testResults: Record<string, Record<string, string>>;
  onUpdateTest: (category: string, testName: string, value: string) => void;
  onImportData: (data: Record<string, Record<string, string>>) => void;
  onNext: () => void;
  onBack: () => void;
}

export function TestSelectionForm({ testResults, onUpdateTest, onImportData, onNext, onBack }: TestSelectionFormProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedPanel, setSelectedPanel] = useState<string>("");
  const [viewMode, setViewMode] = useState<"categories" | "panels" | "tests">("categories");
  const [focusedTest, setFocusedTest] = useState<string>("");

  const hasAnyResults = Object.values(testResults).some(category => 
    Object.values(category).some(value => value.trim() !== '')
  );

  const exportToCSV = () => {
    const allTests: Array<{
      categoryName: string;
      panelName: string;
      testName: string;
      value: string;
      unit: string;
      normalRange: string;
    }> = [];

    TEST_CATEGORIES.forEach(category => {
      category.panels.forEach(panel => {
        panel.tests.forEach(test => {
          const value = testResults[category.id]?.[test.name] || "";
          if (value.trim() !== '') {
            allTests.push({
              categoryName: category.name,
              panelName: panel.name,
              testName: test.name,
              value,
              unit: test.unit,
              normalRange: test.normalRange
            });
          }
        });
      });
    });

    const csvContent = [
      ['Category', 'Panel', 'Test Name', 'Result', 'Unit', 'Normal Range'],
      ...allTests.map(test => [
        test.categoryName,
        test.panelName,
        test.testName,
        test.value,
        test.unit,
        test.normalRange
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', 'lab-results.csv');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-');

  const navigateToQuery = () => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return;
    // Try test match first
    for (const category of TEST_CATEGORIES) {
      for (const panel of category.panels) {
        for (const test of panel.tests) {
          if (test.name.toLowerCase().includes(q)) {
            setSelectedCategory(category.id);
            setSelectedPanel(panel.id);
            setViewMode("tests");
            const id = `test-${slug(test.name)}`;
            setTimeout(() => {
              const el = document.getElementById(id);
              el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
              const input = el?.querySelector('input, textarea, [contenteditable="true"]') as HTMLElement | null;
              input?.focus();
              // Temporary highlight pulse
              if (el) {
                el.classList.add('ring', 'ring-primary', 'ring-offset-2', 'rounded-md');
                setTimeout(() => el.classList.remove('ring', 'ring-primary', 'ring-offset-2', 'rounded-md'), 1200);
              }
            }, 100);
            return;
          }
        }
      }
    }
    // Then panel match
    for (const category of TEST_CATEGORIES) {
      for (const panel of category.panels) {
        if (panel.name.toLowerCase().includes(q)) {
          setSelectedCategory(category.id);
          setSelectedPanel(panel.id);
          setViewMode("tests");
          return;
        }
      }
    }
    // Then category match
    for (const category of TEST_CATEGORIES) {
      if (category.name.toLowerCase().includes(q)) {
        setSelectedCategory(category.id);
        setViewMode("panels");
        return;
      }
    }
  };

  const renderCategoriesView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {TEST_CATEGORIES.map((category) => {
        const categoryResults = testResults[category.id] || {};
        const filledCount = Object.values(categoryResults).filter(value => value.trim() !== '').length;
        
        return (
          <Card 
            key={category.id} 
            className="shadow-soft hover:shadow-medical transition-all duration-300 cursor-pointer border-2 hover:border-primary"
            onClick={() => {
              setSelectedCategory(category.id);
              setViewMode("panels");
            }}
          >
            <CardHeader className="text-center">
              <div className="text-4xl mb-2">{category.icon}</div>
              <CardTitle className="text-lg">{category.name}</CardTitle>
              <CardDescription>{category.description}</CardDescription>
              {filledCount > 0 && (
                <span className="inline-block text-sm bg-primary text-primary-foreground px-2 py-1 rounded-full mt-2">
                  {filledCount} tests completed
                </span>
              )}
            </CardHeader>
          </Card>
        );
      })}
    </div>
  );

  const renderPanelsView = () => {
    const selectedCategoryData = TEST_CATEGORIES.find(c => c.id === selectedCategory);
    if (!selectedCategoryData) return null;

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4 mb-6">
          <Button 
            variant="outline" 
            onClick={() => {
              setSelectedCategory("");
              setViewMode("categories");
            }}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Categories
          </Button>
          <div className="flex items-center gap-2">
            <span className="text-2xl">{selectedCategoryData.icon}</span>
            <h2 className="text-2xl font-bold">{selectedCategoryData.name}</h2>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {selectedCategoryData.panels.map((panel) => {
            const panelTests = panel.tests;
            const filledTests = panelTests.filter(test => 
              testResults[selectedCategory]?.[test.name]?.trim() !== ''
            );
            
            return (
              <Card 
                key={panel.id} 
                className="shadow-soft hover:shadow-medical transition-all duration-300 cursor-pointer border-2 hover:border-primary"
                onClick={() => {
                  setSelectedPanel(panel.id);
                  setViewMode("tests");
                }}
              >
                <CardHeader>
                  <CardTitle className="text-lg">{panel.name}</CardTitle>
                  <CardDescription>
                    {panelTests.length} tests available
                    {filledTests.length > 0 && (
                      <span className="block text-sm bg-primary text-primary-foreground px-2 py-1 rounded-full mt-2 w-fit">
                        {filledTests.length} completed
                      </span>
                    )}
                  </CardDescription>
                </CardHeader>
              </Card>
            );
          })}
        </div>
      </div>
    );
  };

  const renderTestsView = () => {
    const selectedCategoryData = TEST_CATEGORIES.find(c => c.id === selectedCategory);
    const selectedPanelData = selectedCategoryData?.panels.find(p => p.id === selectedPanel);
    if (!selectedCategoryData || !selectedPanelData) return null;

    const categoryResults = testResults[selectedCategory] || {};

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4 mb-6">
          <Button 
            variant="outline" 
            onClick={() => {
              setSelectedPanel("");
              setViewMode("panels");
            }}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Panels
          </Button>
          <div className="flex items-center gap-2">
            <span className="text-2xl">{selectedCategoryData.icon}</span>
            <h2 className="text-xl font-bold">{selectedCategoryData.name}</h2>
            <span className="text-muted-foreground">→</span>
            <h3 className="text-xl font-semibold text-primary">{selectedPanelData.name}</h3>
          </div>
        </div>

        <Card className="shadow-soft">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                {selectedPanelData.tests.map((test) => {
                  const bio = getLocalBioRef(test.name);
                  return (
                    <div key={test.name} id={`test-${slug(test.name)}`}>
                      <TestInput
                        label={test.name}
                        value={categoryResults[test.name] || ''}
                        onChange={(value) => onUpdateTest(selectedCategory, test.name, value)}
                        unit={test.unit}
                        normalRange={test.normalRange}
                        placeholder={test.placeholder}
                        type={test.type}
                        options={test.options}
                        onFocus={() => setFocusedTest(test.name)}
                      />
                      {(bio) && (
                        <div className="mt-1 text-[12px] text-muted-foreground space-y-1">
                          {bio.normalRange && (
                            <div><span className="font-medium">Ref:</span> {bio.normalRange} {bio.unit || ''}</div>
                          )}
                          {bio.notes && bio.notes.length > 0 && (
                            <div>
                              <span className="font-medium">Notes:</span> {bio.notes.join(' ')}
                            </div>
                          )}
                          {bio.interferences && bio.interferences.length > 0 && (
                            <div>
                              <span className="font-medium">Interference:</span> {bio.interferences.map(i => i.name + (i.note ? ` (${i.note})` : '')).join('; ')}
                            </div>
                          )}
                          <div>
                            <a
                              href={`https://medlineplus.gov/search/?query=${encodeURIComponent(test.name)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary hover:underline"
                            >
                              Learn more on MedlinePlus
                            </a>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="lg:col-span-4">
                <div className="sticky top-6 border rounded-md p-4 bg-card">
                  <div className="text-sm text-muted-foreground mb-2">Focused test</div>
                  <div className="text-lg font-semibold mb-2">{focusedTest || '—'}</div>
                  {focusedTest ? (() => {
                    const bio = getLocalBioRef(focusedTest);
                    return (
                      <div className="text-sm space-y-2">
                        {bio?.normalRange && (
                          <div><span className="font-medium">Reference:</span> {bio.normalRange} {bio.unit || ''}</div>
                        )}
                        {bio?.notes && bio.notes.length > 0 && (
                          <div>
                            <div className="font-medium">Notes</div>
                            <ul className="list-disc ml-5">
                              {bio.notes.map((n, i) => (<li key={i}>{n}</li>))}
                            </ul>
                          </div>
                        )}
                        {bio?.interferences && bio.interferences.length > 0 && (
                          <div>
                            <div className="font-medium">Interferences</div>
                            <ul className="list-disc ml-5">
                              {bio.interferences.map((i, idx) => (
                                <li key={idx}>{i.name}{i.note ? ` — ${i.note}` : ''}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        <div>
                          <a
                            href={`https://medlineplus.gov/search/?query=${encodeURIComponent(focusedTest)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline"
                          >
                            Learn more on MedlinePlus
                          </a>
                        </div>
                      </div>
                    );
                  })() : (
                    <div className="text-sm text-muted-foreground">Focus a test field to see details here.</div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <Card className="shadow-medical">
        <CardHeader className="bg-gradient-medical text-white rounded-t-lg">
          <CardTitle className="flex items-center gap-2">
            <Microscope className="w-5 h-5" />
            Laboratory Test Results Entry
          </CardTitle>
          <CardDescription className="text-white/90">
            {viewMode === "categories" && "Select a test category to begin entering results"}
            {viewMode === "panels" && "Choose a test panel from the selected category"}
            {viewMode === "tests" && "Enter test results for the selected panel"}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          {/* Quick Search for Tests/Panels/Categories - Only show on categories view */}
          {viewMode === "categories" && (
            <div className="mb-6">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Type test / panel / category to jump..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); navigateToQuery(); } }}
                    className="pl-10"
                  />
                </div>
                <Button
                  onClick={navigateToQuery}
                  className="flex items-center gap-2"
                >
                  <Search className="w-4 h-4" />
                  Search
                </Button>
              </div>
              <div className="text-[12px] text-muted-foreground mt-1">Examples: "Biochemistry Urea", "Thyroid TSH", or a category/panel/test name</div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Test Results Display */}
      {viewMode === "categories" && renderCategoriesView()}
      {viewMode === "panels" && renderPanelsView()}
      {viewMode === "tests" && renderTestsView()}

      {/* Navigation */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <Button 
          variant="outline" 
          onClick={onBack}
          className="transition-all duration-300"
        >
          Back to Patient Info
        </Button>
        
        <Button 
          onClick={onNext}
          disabled={!hasAnyResults}
          className="bg-gradient-medical hover:opacity-90 transition-all duration-300 shadow-soft hover:shadow-medical"
        >
          Generate AI Analysis
        </Button>
      </div>
    </div>
  );
}