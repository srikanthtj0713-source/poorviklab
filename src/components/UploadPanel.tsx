import React, { useState, useCallback, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Upload, Search, FileSpreadsheet, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface UploadPanelProps {
  onDataImport: (data: Record<string, Record<string, string>>) => void;
  children: React.ReactNode;
  externalSearchQuery?: string;
  openSignal?: number;
}

interface ParsedData {
  category: string;
  panel: string;
  testName: string;
  result: string;
  unit: string;
  normalRange: string;
}

export function UploadPanel({ onDataImport, children, externalSearchQuery, openSignal }: UploadPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [uploadedData, setUploadedData] = useState<ParsedData[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchField, setSearchField] = useState<'all' | 'test' | 'panel' | 'category'>("all");
  const searchInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split('\n');
        const headers = lines[0].split(',').map(h => h.trim());
        
        const parsed: ParsedData[] = [];
        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(',').map(v => v.trim());
          if (values.length >= 6) {
            parsed.push({
              category: values[0] || '',
              panel: values[1] || '',
              testName: values[2] || '',
              result: values[3] || '',
              unit: values[4] || '',
              normalRange: values[5] || ''
            });
          }
        }
        
        setUploadedData(parsed);
        toast({
          title: "File uploaded successfully",
          description: `Loaded ${parsed.length} test results`
        });
      } catch (error) {
        toast({
          title: "Upload failed",
          description: "Please check your file format",
          variant: "destructive"
        });
      }
    };
    reader.readAsText(file);
  }, [toast]);

  // Open from parent and prefill search (top-level hook)
  useEffect(() => {
    if (openSignal !== undefined) {
      setIsOpen(true);
      if (externalSearchQuery !== undefined) {
        setSearchQuery(externalSearchQuery);
      }
      // focus after dialog mounts
      const t = setTimeout(() => searchInputRef.current?.focus(), 50);
      return () => clearTimeout(t);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openSignal]);

  const q = searchQuery.trim().toLowerCase();
  const filteredData = uploadedData.filter(item => {
    if (!q) return true;
    if (searchField === 'test') return item.testName.toLowerCase().includes(q);
    if (searchField === 'panel') return item.panel.toLowerCase().includes(q);
    if (searchField === 'category') return item.category.toLowerCase().includes(q);
    // all
    return (
      item.testName.toLowerCase().includes(q) ||
      item.panel.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q)
    );
  });

  const handleImportData = () => {
    const groupedData: Record<string, Record<string, string>> = {};
    
    uploadedData.forEach(item => {
      if (!groupedData[item.category]) {
        groupedData[item.category] = {};
      }
      groupedData[item.category][item.testName] = item.result;
    });
    
    onDataImport(groupedData);
    setIsOpen(false);
    toast({
      title: "Data imported successfully",
      description: `Imported ${uploadedData.length} test results`
    });
  };

  const clearData = () => {
    setUploadedData([]);
    setSearchQuery("");
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Upload Lab Results
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Upload Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Upload File</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div>
                    <input
                      type="file"
                      accept=".csv"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="csv-upload"
                    />
                    <Button 
                      variant="outline" 
                      onClick={() => document.getElementById('csv-upload')?.click()}
                      className="flex items-center gap-2"
                    >
                      <Upload className="w-4 h-4" />
                      Upload CSV
                    </Button>
                  </div>
                  <div>
                    <input
                      type="file"
                      accept=".xlsx,.xls"
                      className="hidden"
                      id="excel-upload"
                    />
                    <Button 
                      variant="outline" 
                      onClick={() => toast({ title: "Excel support coming soon" })}
                      className="flex items-center gap-2"
                    >
                      <FileSpreadsheet className="w-4 h-4" />
                      Import Excel
                    </Button>
                  </div>
                </div>
                
                <div className="text-sm text-muted-foreground">
                  Expected CSV format: Category, Panel, Test Name, Result, Unit, Normal Range
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Search and Data Display */}
          {uploadedData.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Uploaded Results</CardTitle>
                  <div className="flex gap-2">
                    <Button onClick={clearData} variant="outline" size="sm">
                      <X className="w-4 h-4 mr-2" />
                      Clear
                    </Button>
                    <Button onClick={handleImportData} size="sm">
                      Import Data
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Search */}
                  <div className="flex items-center gap-2">
                    <div className="text-[12px]">
                      <label className="mr-2">In</label>
                      <select
                        value={searchField}
                        onChange={(e) => setSearchField(e.target.value as any)}
                        className="border rounded px-2 py-1 text-[12px]"
                      >
                        <option value="all">All</option>
                        <option value="test">Test</option>
                        <option value="panel">Panel</option>
                        <option value="category">Category</option>
                      </select>
                    </div>
                    <div className="relative flex-1">
                      <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        ref={searchInputRef}
                        placeholder="Search uploaded results..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    <Button
                      variant="secondary"
                      onClick={() => searchInputRef.current?.focus()}
                      className="flex items-center gap-2"
                    >
                      <Search className="w-4 h-4" />
                      Search
                    </Button>
                  </div>
                  
                  {/* Results Table */}
                  <div className="max-h-96 overflow-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Category</TableHead>
                          <TableHead>Panel</TableHead>
                          <TableHead>Test Name</TableHead>
                          <TableHead>Result</TableHead>
                          <TableHead>Unit</TableHead>
                          <TableHead>Normal Range</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredData.map((item, index) => (
                          <TableRow key={index}>
                            <TableCell>{item.category}</TableCell>
                            <TableCell>{item.panel}</TableCell>
                            <TableCell>{item.testName}</TableCell>
                            <TableCell className="font-medium">{item.result}</TableCell>
                            <TableCell>{item.unit}</TableCell>
                            <TableCell>{item.normalRange}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  
                  <div className="text-sm text-muted-foreground">
                    Showing {filteredData.length} of {uploadedData.length} results
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}