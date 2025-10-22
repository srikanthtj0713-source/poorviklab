import React, { useEffect, useMemo } from "react";
import loincMap from "@/data/loinc-map.json";
import { evaluateInterpretations, evaluateInterpretationsGrouped } from "@/services/interpretation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TEST_CATEGORIES, LabReport } from "@/types/lab";
import { Printer, Download } from "lucide-react";

interface PrintableReportProps {
  patient: Partial<LabReport["patient"]>;
  testResults: Record<string, Record<string, string>>;
  autoPrint?: boolean;
  mode?: 'all' | 'per-category';
  onBackToUpload?: () => void;
}

function Barcode({ value, width = 180, height = 40 }: { value: string; width?: number; height?: number }) {
  const bars: Array<{ x: number; w: number; fill: string }> = [];
  let x = 0;
  const bytes = Array.from(value).map((c) => c.charCodeAt(0));
  for (let i = 0; i < bytes.length; i++) {
    const w = (bytes[i] % 3) + 1; // bar width 1-3
    const gap = 1; // 1px gap
    bars.push({ x, w, fill: i % 2 === 0 ? "#111" : "#000" });
    x += w + gap;
    if (x > width - 2) break;
  }
  return (
    <div className="inline-block">
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="bg-white border">
        {bars.map((b, i) => (
          <rect key={i} x={b.x} y={0} width={b.w} height={height} fill={b.fill} />
        ))}
      </svg>
      <div className="text-[10px] text-center mt-1 tracking-wider">{value}</div>
    </div>
  );
}

function methodForTestName(name: string): string | undefined {
  const n = name.toLowerCase();
  // Renal/Electrolytes
  if (n.includes('creatinine')) return 'Enzymatic IFCC';
  if (n.includes('urea nitrogen') || n === 'bun') return 'Calculated';
  if (n.includes('bun/creatinine')) return 'Calculated';
  if (n.includes('urea')) return 'Urease';
  if (n.includes('uric acid')) return 'Uricase';
  if (n.includes('sodium') || n.includes('potassium') || n.includes('chloride')) return 'ISE';
  if (n.includes('egfr')) return 'CKD-EPI (Calculated)';

  // Diabetes/Sugar
  if (n.includes('hba1c')) return 'HPLC';
  if (n.includes('glucose')) return 'GOD-POD';

  // LFT
  if (n.includes('sgpt') || n.includes('alt')) return 'IFCC (ALT)';
  if (n.includes('sgot') || n.includes('ast')) return 'IFCC (AST)';
  if (n.includes('bilirubin')) return 'Diazo (Jendrassik-Grof)';
  if (n.includes('albumin')) return 'BCG Dye-Binding';
  if (n.includes('total protein') || n === 'protein') return 'Biuret';

  // Lipid
  if (n.includes('total cholesterol')) return 'CHOD-PAP';
  if (n.includes('hdl')) return 'Direct Homogeneous Assay';
  if (n.includes('ldl')) return 'Calculated (Friedewald)';
  if (n.includes('triglycer')) return 'GPO-PAP';

  // Thyroid
  if (n === 't3' || n.includes(' t3')) return 'CLIA';
  if (n === 't4' || n.includes(' t4')) return 'CLIA';
  if (n.includes('tsh')) return 'CLIA';

  // Hematology - CBC & Coagulation
  if (n.includes('hemoglobin')) return 'SLS-Hb (Analyzer)';
  if (n.includes('hematocrit')) return 'Analyzer Derived';
  if (n.includes('rbc count')) return 'Hematology Analyzer (Impedance/Optical)';
  if (n.includes('wbc count')) return 'Hematology Analyzer (Impedance/Optical)';
  if (n.includes('platelet')) return 'Hematology Analyzer (Impedance/Optical)';
  if (n.includes('mcv') || n.includes('mch') || n.includes('mchc') || n.includes('rdw') || n.includes('mpv') || n.includes('pct')) return 'Analyzer Derived Index';
  if (n.includes('neutrophil') || n.includes('lymphocyte') || n.includes('monocyte') || n.includes('eosinophil') || n.includes('basophil')) return 'Analyzer 5-part Differential';
  if (n.includes('esr')) return 'Westergren';
  if (n.includes('pt/inr') || n.includes('inr') || n.includes('pt ')) return 'Optical Clot Detection';
  if (n.includes('aptt') || n.includes('aPTT'.toLowerCase())) return 'Optical Clot Detection';
  if (n.includes('reticulocyte')) return 'Flow Cytometry (Analyzer)';

  // Immunology / Serology
  if (n.includes('crp')) return 'Immunoturbidimetry';
  if (n.includes('ra factor') || n === 'rafactor' || n === 'ra') return 'Latex Agglutination';
  if (n.includes('aso')) return 'Latex Agglutination';
  if (n === 'ana' || n.includes('anti nuclear')) return 'ELISA';
  if (n === 'hiv') return 'CLIA';
  if (n.includes('hbsag')) return 'CLIA';
  if (n === 'hcv' || n.includes('hepatitis c')) return 'CLIA';

  // Blood Grouping
  if (n.includes('abo')) return 'Forward & Reverse Grouping (Tube/Slide Agglutination)';
  if (n.includes('rh')) return 'Anti‑D Agglutination (Tube/Slide)';

  // Microbiology / Cultures
  if (n.includes('culture')) return 'Culture & Sensitivity';
  if (n.includes('sputum afb')) return 'Ziehl–Neelsen Microscopy';
  if (n.includes('malaria')) return 'Rapid Immunochromatographic';
  if (n.includes('dengue')) return 'Rapid Immunochromatographic';
  if (n.includes('widal')) return 'Tube Agglutination';

  // Urine/Fluids
  if (n.includes('urine protein') || n.includes('urine sugar') || n.includes('urine ketone') || n.includes('urine blood')) return 'Urine Dipstick (Strip)';
  if (n.includes('urine wbc') || n.includes('urine rbc')) return 'Microscopy';
  if (n.includes('stool occult')) return 'Immunochemical';
  if (n.includes('stool parasite') || n.includes('parasite')) return 'Microscopy';
  if (n.includes('semen') || n.includes('csf') || n.includes('ascitic')) return 'Microscopy & Biochemical Assessment';
  return undefined;
}

function flattenResults(testResults: Record<string, Record<string, string>>) {
  const rows: Array<{ category: string; testName: string; value: string; unit: string; normalRange: string }> = [];
  TEST_CATEGORIES.forEach((cat) => {
    const testsForCat = testResults[cat.id] || {};
    Object.entries(testsForCat).forEach(([name, value]) => {
      if (String(value).trim() === "") return;
      const testInfo = cat.panels.flatMap((p) => p.tests).find((t) => t.name === name);
      rows.push({
        category: cat.name,
        testName: name,
        value: String(value),
        unit: testInfo?.unit || "",
        normalRange: testInfo?.normalRange || "",
      });
    });
  });
  return rows;
}

function computeHbA1cExtras(rows: ReturnType<typeof flattenResults>) {
  const hba1cRow = rows.find((r) => r.testName.toLowerCase().includes("hba1c"));
  if (!hba1cRow) return undefined;
  const val = parseFloat(hba1cRow.value);
  if (isNaN(val)) return undefined;
  // ADA-estimated average glucose formula
  const mbg = 28.7 * val - 46.7;
  return { hba1c: val, meanBloodGlucose: Math.round(mbg * 10) / 10 };
}

function isAbnormalByRange(value: string, normalRange: string): boolean | null {
  if (value.trim() === '') return null;
  const num = parseFloat(value);
  if (isNaN(num)) return null;
  const r = normalRange.trim();
  if (!r) return null;
  if (r.includes('-')) {
    const [min, max] = r.split('-').map(s => parseFloat(s.trim()));
    if (isNaN(min) || isNaN(max)) return null;
    return num < min || num > max;
  }
  if (r.startsWith('<')) {
    const max = parseFloat(r.substring(1));
    if (isNaN(max)) return null;
    return num >= max;
  }
  if (r.startsWith('>')) {
    const min = parseFloat(r.substring(1));
    if (isNaN(min)) return null;
    return num <= min;
  }
  return null;
}

function buildPerTestInterpretation(rows: ReturnType<typeof flattenResults>) {
  const items: string[] = [];
  rows.forEach(r => {
    const abnormal = isAbnormalByRange(r.value, r.normalRange);
    const val = parseFloat(r.value);
    const name = r.testName.toUpperCase();
    if (isNaN(val)) return;
    if (name.includes('CREATININE')) {
      if (abnormal) {
        items.push(val > 1.2 ? 'Elevated creatinine suggests reduced kidney filtration (consider CKD, dehydration, or medication effects).' : 'Low creatinine can be seen with low muscle mass or pregnancy.');
      } else {
        items.push('Creatinine within reference range indicates stable kidney filtration.');
      }
    } else if (name.includes('UREA NITROGEN') || name === 'BUN' || name.includes('BUN')) {
      if (abnormal) {
        items.push(val > 23 ? 'High BUN may indicate dehydration, high protein intake, or kidney impairment.' : 'Low BUN can occur in liver disease or malnutrition.');
      } else {
        items.push('BUN within range supports adequate protein metabolism and kidney clearance.');
      }
    } else if (name.includes('BUN/CREATININE')) {
      if (abnormal) {
        items.push('Abnormal BUN/Creatinine ratio: high suggests pre‑renal causes (dehydration); low may reflect liver disease or low protein.');
      } else {
        items.push('BUN/Creatinine ratio in range—no pre‑renal pattern.');
      }
    } else if (name.includes('URIC ACID')) {
      if (abnormal) {
        items.push(val > 7.2 ? 'High uric acid increases gout risk; assess diet, alcohol, diuretics.' : 'Low uric acid is uncommon and usually benign.');
      }
    } else if (name.includes('SODIUM')) {
      if (abnormal) {
        items.push(val > 145 ? 'Hypernatremia: consider dehydration or endocrine causes.' : 'Hyponatremia: evaluate fluids, medications, SIADH.');
      }
    } else if (name.includes('POTASSIUM')) {
      if (abnormal) {
        items.push(val > 5.5 ? 'Hyperkalemia: risk of arrhythmia—review renal function and medications (ACEi, ARBs, K‑sparing).' : 'Hypokalemia: may cause cramps/arrhythmia—check GI loss or diuretics.');
      }
    } else if (name.includes('CHLORIDE')) {
      if (abnormal) {
        items.push('Abnormal chloride may reflect acid–base imbalance or fluid status.');
      }
    } else if (name.includes('HBA1C')) {
      if (abnormal) {
        items.push('HbA1c elevated—indicates suboptimal glycemic control over last ~3 months; adjust lifestyle/therapy.');
      } else {
        items.push('HbA1c within goal—continue current diabetes management.');
      }
    }
  });
  return items;
}

export default function PrintableReport({ patient, testResults, autoPrint, mode = 'all', onBackToUpload }: PrintableReportProps) {
  const rows = useMemo(() => flattenResults(testResults), [testResults]);
  const perCategory = mode === 'per-category';
  const hb = useMemo(() => computeHbA1cExtras(rows), [rows]);
  const firstPresent = useMemo(() => rows[0], [rows]);
  const categoryName = useMemo(() => {
    if (!firstPresent) return '';
    const cat = TEST_CATEGORIES.find(c => c.panels.some(p => p.tests.some(t => t.name === firstPresent.testName)));
    return cat?.name?.toUpperCase() || 'BIOCHEMISTRY';
  }, [firstPresent]);
  const panelName = useMemo(() => {
    if (!firstPresent) return '';
    const cat = TEST_CATEGORIES.find(c => c.panels.some(p => p.tests.some(t => t.name === firstPresent.testName)));
    const panel = cat?.panels.find(p => p.tests.some(t => t.name === firstPresent.testName));
    return panel?.name || '';
  }, [firstPresent]);
  const now = new Date();
  const fmt = (d: Date) => d.toLocaleString(undefined, {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: true
  });
  const registeredAt = fmt(now);
  const sampleCollectedAt = fmt(new Date(now.getTime() + 30 * 60 * 1000));
  const reportedAt = fmt(new Date(now.getTime() + 60 * 60 * 1000));
  const printedAt = fmt(new Date(now.getTime() + 90 * 60 * 1000));

  const handlePrint = () => window.print();
  const handleDownload = () => window.print(); // let the user "Save as PDF" via print dialog
  const handleBackToUpload = () => {
    try {
      if (onBackToUpload) return onBackToUpload();
      if (window.history && window.history.length > 1) {
        window.history.back();
        return;
      }
    } catch {}
    window.location.href = '/';
  };

  useEffect(() => {
    if (autoPrint) {
      const t = setTimeout(() => window.print(), 300);
      return () => clearTimeout(t);
    }
  }, [autoPrint]);

  const renderHeaderBlock = () => (
    <>
      {/* Top spacer reserved for Lab Name & Address */}
      <div className="grid grid-cols-[10rem,1fr,10rem] items-start mb-3">
        <div className="flex items-center justify-start pl-2 -mt-4">
          <img
            src="/PURVIK.png"
            alt="Logo"
            className="h-36 object-contain"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = '/placeholder.svg';
            }}
          />
        </div>
        <div className="text-center mt-4">
          <div className="text-2xl font-bold tracking-widest uppercase leading-snug whitespace-nowrap">PURVIK DIAGNOSTIC CENTRE</div>
          <div className="mt-1 text-[11px] leading-4 text-gray-700">
            <div>A R Khan Complex, Doddamudavadi Sante Gate, Kanakapura Taluk</div>
            <div>Ramanagar District - 562117 • E-mail: poorvikdiagnostic@gmail.com</div>
          </div>
        </div>
        <div></div>
      </div>
      <div className="flex items-start justify-between mt-2 pt-2 border-t">
        {/* Left column */}
        <div className="w-1/2 pr-4 space-y-0.5">
          <div className="text-[11px] grid items-center" style={{gridTemplateColumns: '6.5rem 0.5rem 1fr'}}>
            <span className="whitespace-nowrap">Name</span>
            <span className="text-center">:</span>
            <span className="font-extrabold uppercase tracking-wide">{patient.name || '—'}</span>
          </div>
          <div className="text-[11px] grid items-center" style={{gridTemplateColumns: '6.5rem 0.5rem 1fr'}}>
            <span className="whitespace-nowrap">Age/Gender</span>
            <span className="text-center">:</span>
            <span className="font-semibold">{patient.age ?? '—'} Yrs / {patient.gender ? String(patient.gender).charAt(0).toUpperCase() : '—'}</span>
          </div>
          <div className="text-[11px] grid items-center" style={{gridTemplateColumns: '6.5rem 0.5rem 1fr'}}>
            <span className="whitespace-nowrap">Ref. Dr.</span>
            <span className="text-center">:</span>
            <span className="font-semibold">Self</span>
          </div>
          <div className="text-[11px] grid items-center" style={{gridTemplateColumns: '6.5rem 0.5rem 1fr'}}>
            <span className="whitespace-nowrap">Reg No.</span>
            <span className="text-center">:</span>
            <span className="font-bold">BNG2566550</span>
          </div>
          <div className="text-[11px] grid items-center" style={{gridTemplateColumns: '6.5rem 0.5rem 1fr'}}>
            <span className="whitespace-nowrap">Sample Type</span>
            <span className="text-center">:</span>
            <span className="font-semibold">Serum</span>
          </div>
          <div className="text-[11px] grid items-center" style={{gridTemplateColumns: '6.5rem 0.5rem 1fr'}}>
            <span className="whitespace-nowrap">KPME No.</span>
            <span className="text-center">:</span>
            <span className="font-semibold">RMG00450ALMDL</span>
          </div>
        </div>
        {/* Right column */}
        <div className="w-1/2 pl-4 space-y-0.5">
          <div className="text-[11px] grid items-center" style={{gridTemplateColumns: '6.5rem 0.5rem 1fr'}}>
            <span className="whitespace-nowrap">Vial ID</span>
            <span className="text-center">:</span>
            <span className="font-semibold">2101273</span>
          </div>
          <div className="text-[11px] grid items-center" style={{gridTemplateColumns: '6.5rem 0.5rem 1fr'}}>
            <span className="whitespace-nowrap">Collected On</span>
            <span className="text-center">:</span>
            <span className="font-semibold">{sampleCollectedAt}</span>
          </div>
          <div className="text-[11px] grid items-center" style={{gridTemplateColumns: '6.5rem 0.5rem 1fr'}}>
            <span className="whitespace-nowrap">Registered On</span>
            <span className="text-center">:</span>
            <span className="font-semibold">{registeredAt}</span>
          </div>
          <div className="text-[11px] grid items-center" style={{gridTemplateColumns: '6.5rem 0.5rem 1fr'}}>
            <span className="whitespace-nowrap">Reported On</span>
            <span className="text-center">:</span>
            <span className="font-semibold">{reportedAt}</span>
          </div>
          <div className="text-[11px] grid items-center" style={{gridTemplateColumns: '6.5rem 0.5rem 1fr'}}>
            <span className="whitespace-nowrap">Client Code</span>
            <span className="text-center">:</span>
            <span className="font-semibold">CMLKAF211</span>
          </div>
        </div>
      </div>
    </>
  );

  const renderCategoryTable = (categoryId?: string) => {
    const filteredRows = categoryId
      ? rows.filter(r => {
          const cat = TEST_CATEGORIES.find(c => c.panels.some(p => p.tests.some(t => t.name === r.testName)));
          return cat?.id === categoryId;
        })
      : rows;
    const first = filteredRows[0];
    const catName = categoryId
      ? (TEST_CATEGORIES.find(c => c.id === categoryId)?.name?.toUpperCase() || 'BIOCHEMISTRY')
      : (categoryName || 'BIOCHEMISTRY');
    const pnlName = categoryId
      ? (() => {
          if (!first) return '';
          const cat = TEST_CATEGORIES.find(c => c.panels.some(p => p.tests.some(t => t.name === first.testName)));
          const pnl = cat?.panels.find(p => p.tests.some(t => t.name === first.testName));
          return pnl?.name || '';
        })()
      : panelName;
    return (
      <>
        <div className="border-t border-b py-1 mt-1 text-center font-semibold uppercase">{catName}</div>
        {pnlName && (
          <div className="border-b py-1 text-center font-semibold">{pnlName}</div>
        )}
        <Card className="shadow-none border">
          <CardContent className="p-0">
            <table className="w-full text-[11px] table-fixed">
              <colgroup>
                <col style={{ width: '30%' }} />
                <col style={{ width: '20%' }} />
                <col style={{ width: '20%' }} />
                <col style={{ width: '30%' }} />
              </colgroup>
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="text-left pl-2 pr-4 py-1.5">Test Name</th>
                  <th className="text-right pl-3 pr-2 py-1.5">Observed Values</th>
                  <th className="text-center px-2 py-1.5">Units</th>
                  <th className="text-left pl-6 pr-2 py-1.5">Biological Reference Intervals</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((r, i) => {
                  const method = methodForTestName(r.testName);
                  const starred = ['creatinine','urea','urea nitrogen','bun/creatinine','uric acid','sodium','potassium','chloride'].some(k => r.testName.toLowerCase().includes(k));
                  const loinc = (loincMap as Record<string, string | undefined>)[r.testName];
                  return (
                    <tr key={i} className="align-top border-b">
                      <td className="pl-2 pr-4 py-1.5">
                        <div className="font-medium uppercase">{starred ? '* ' : ''}{r.testName}</div>
                        <div className="text-[10px] text-gray-700">Method: {method || '—'}{loinc ? ` • LOINC: ${loinc}` : ''}</div>
                      </td>
                      <td className="pl-3 pr-1 py-1.5 font-semibold text-right whitespace-nowrap tabular-nums">{r.value}</td>
                      <td className="px-2 py-1.5 text-center whitespace-nowrap">{r.unit}</td>
                      <td className="pl-6 pr-2 py-1.5 whitespace-pre-line">{r.normalRange}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>

        <div className="mt-3 border p-3 rounded">
          <div className="font-semibold mb-2">INTERPRETATION::</div>
          <div className="space-y-2">
            {(() => {
              const grouped = evaluateInterpretationsGrouped(filteredRows.map(r => ({ testName: r.testName, value: r.value })));
              const groups = Object.entries(grouped).filter(([, arr]) => arr.length > 0);
              if (groups.length === 0) {
                return (
                  <p className="text-[11px] leading-relaxed">Clinical interpretation is based on observed values and reference intervals. Correlate with patient history and symptoms.</p>
                );
              }
              return (
                <div className="space-y-2">
                  {groups.map(([name, arr]) => (
                    <div key={name}>
                      <div className="font-medium text-[11px] mb-1">{name}</div>
                      <div className="space-y-1">
                        {arr.map((raw, idx) => {
                          const isStr = typeof raw === 'string';
                          const item = isStr ? { message: raw as string } : (raw as any);
                          return (
                            <div key={idx} className="text-[11px] leading-relaxed">
                              <div>• {item.message}</div>
                              {item.suggestions && item.suggestions.length > 0 && (
                                <div className="ml-4">
                                  <div className="font-medium">Suggested actions</div>
                                  <ul className="list-disc ml-4">
                                    {item.suggestions.map((s: string, i: number) => (<li key={i}>{s}</li>))}
                                  </ul>
                                </div>
                              )}
                              {item.drug_classes && item.drug_classes.length > 0 && (
                                <div className="ml-4">
                                  <div className="font-medium">Drug classes</div>
                                  <ul className="list-disc ml-4">
                                    {item.drug_classes.map((d: string, i: number) => (<li key={i}>{d}</li>))}
                                  </ul>
                                </div>
                              )}
                              {item.refs && item.refs.length > 0 && (
                                <div className="ml-4">
                                  <div className="font-medium">References</div>
                                  <ul className="list-disc ml-4">
                                    {item.refs.map((r: string, i: number) => (<li key={i}><a href={r} target="_blank" rel="noopener noreferrer" className="underline text-primary">{r}</a></li>))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        </div>
        
      </>
    );
  };

  if (perCategory) {
    const categoriesWithRows = TEST_CATEGORIES.filter(cat => rows.some(r => cat.panels.some(p => p.tests.some(t => t.name === r.testName))));
    const renderSignatureBlock = () => (
      <div className="mt-6 flex items-end justify-between">
        <div className="ml-6">
          <Barcode value={`VIAL:2101273`} />
        </div>
        <div className="text-right mr-6">
          <div className="h-12"></div>
          <div className="border-t w-48 ml-auto"></div>
          <div className="text-[11px] font-medium">Pathologist</div>
          <div className="text-[11px]">Dr. __________________</div>
          <div className="text-[10px] text-gray-700">MD (Pathology), Reg No: __________</div>
        </div>
      </div>
    );
    return (
      <div className="report-a4 mx-auto bg-white text-black pt-0 px-0 pb-4 print:p-0 text-[12px]">
        <style>{`
        @page { size: A4; margin: 8mm; }
        @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
        @media screen { .report-a4 { max-width: 210mm; } }
        `}</style>
        {categoriesWithRows.map((cat, idx) => (
          <div key={cat.id} style={{ breakAfter: idx === categoriesWithRows.length - 1 ? 'auto' : 'page' }}>
            {renderHeaderBlock()}
            {renderCategoryTable(cat.id)}
            {renderSignatureBlock()}
          </div>
        ))}

        <div className="flex justify-between items-center mt-6 gap-2 print:hidden">
          <div className="flex gap-2">
            <Button variant="outline" onClick={handlePrint}>
              <Printer className="w-4 h-4 mr-2" /> Print
            </Button>
            <Button onClick={handleDownload} className="bg-gradient-medical">
              <Download className="w-4 h-4 mr-2" /> Download PDF
            </Button>
            <Button variant="secondary" onClick={handleBackToUpload}>
              ← Back to Upload
            </Button>
          </div>
          <div className="text-xs text-gray-500">Generated by LabIntel Pro</div>
        </div>
      </div>
    );
  }

  return (
    <div className="report-a4 mx-auto bg-white text-black pt-0 px-0 pb-4 print:p-0 text-[12px]">
      <style>{`
        @page { size: A4; margin: 8mm; }
        @media print {
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .report-a4 { width: 100% !important; max-width: initial !important; padding: 0 !important; }
        }
        @media screen {
          .report-a4 { max-width: 210mm; }
        }
      `}</style>
      {renderHeaderBlock()}

      <div className="border-t border-b py-1 mt-1 text-center font-semibold uppercase">LAB REPORT</div>
      {panelName && (
        <div className="border-b py-1 text-center font-semibold">{panelName}</div>
      )}

      <Card className="shadow-none border">
        <CardContent className="p-0">
          <table className="w-full text-[11px] table-fixed">
            <colgroup>
              <col style={{ width: '30%' }} />
              <col style={{ width: '20%' }} />
              <col style={{ width: '20%' }} />
              <col style={{ width: '30%' }} />
            </colgroup>
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="text-left pl-2 pr-4 py-1.5">Test Name</th>
                <th className="text-right pl-3 pr-2 py-1.5">Observed Values</th>
                <th className="text-center px-2 py-1.5">Units</th>
                <th className="text-left pl-6 pr-2 py-1.5">Biological Reference Intervals</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => {
                const method = methodForTestName(r.testName);
                const starred = ['creatinine','urea','urea nitrogen','bun/creatinine','uric acid','sodium','potassium','chloride'].some(k => r.testName.toLowerCase().includes(k));
                const loinc = (loincMap as Record<string, string | undefined>)[r.testName];
                return (
                  <tr key={i} className="align-top border-b">
                    <td className="pl-2 pr-4 py-1.5">
                      <div className="font-medium uppercase">{starred ? '* ' : ''}{r.testName}</div>
                      <div className="text-[10px] text-gray-700">Method: {method || '—'}{loinc ? ` • LOINC: ${loinc}` : ''}</div>
                    </td>
                    <td className="pl-3 pr-1 py-1.5 font-semibold text-right whitespace-nowrap tabular-nums">{r.value}</td>
                    <td className="px-2 py-1.5 text-center whitespace-nowrap">{r.unit}</td>
                    <td className="pl-6 pr-2 py-1.5 whitespace-pre-line">{r.normalRange}</td>
                  </tr>
                );
              })}
              {hb && (
                <tr className="border-b">
                  <td className="px-2 py-1.5">Mean Blood Glucose</td>
                  <td className="px-2 py-1.5 font-semibold text-right whitespace-nowrap">{hb.meanBloodGlucose}</td>
                  <td className="px-2 py-1.5 text-center whitespace-nowrap">mg/dL</td>
                  <td className="px-2 py-1.5">
                    <div>90 - 120 : Excellent Control</div>
                    <div>121 - 150 : Good Control</div>
                    <div>151 - 181 : Average Control</div>
                    <div>181 - 210 : Action Suggested</div>
                    <div>Above 211 : Panic Value</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <div className="mt-3 border p-3 rounded">
        <div className="font-semibold mb-2">INTERPRETATION::</div>
        <div className="space-y-2">
          {(() => {
            const grouped = evaluateInterpretationsGrouped(rows.map(r => ({ testName: r.testName, value: r.value })));
            const groups = Object.entries(grouped).filter(([, arr]) => arr.length > 0);
            if (groups.length === 0) {
              return (
                <p className="text-[11px] leading-relaxed">Clinical interpretation is based on observed values and reference intervals. Correlate with patient history and symptoms.</p>
              );
            }
            return (
              <div className="space-y-2">
                {groups.map(([name, arr]) => (
                  <div key={name}>
                    <div className="font-medium text-[11px] mb-1">{name}</div>
                    <div className="space-y-1">
                      {arr.map((raw, idx) => {
                        const isStr = typeof raw === 'string';
                        const item = isStr ? { message: raw as string } : (raw as any);
                        return (
                          <div key={idx} className="text-[11px] leading-relaxed">
                            <div>• {item.message}</div>
                            {item.suggestions && item.suggestions.length > 0 && (
                              <div className="ml-4">
                                <div className="font-medium">Suggested actions</div>
                                <ul className="list-disc ml-4">
                                  {item.suggestions.map((s: string, i: number) => (<li key={i}>{s}</li>))}
                                </ul>
                              </div>
                            )}
                            {item.drug_classes && item.drug_classes.length > 0 && (
                              <div className="ml-4">
                                <div className="font-medium">Drug classes</div>
                                <ul className="list-disc ml-4">
                                  {item.drug_classes.map((d: string, i: number) => (<li key={i}>{d}</li>))}
                                </ul>
                              </div>
                            )}
                            {item.refs && item.refs.length > 0 && (
                              <div className="ml-4">
                                <div className="font-medium">References</div>
                                <ul className="list-disc ml-4">
                                  {item.refs.map((r: string, i: number) => (<li key={i}><a href={r} target="_blank" rel="noopener noreferrer" className="underline text-primary">{r}</a></li>))}
                                </ul>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
      </div>
      

      {/* Footer branding intentionally excluded per request (no barcode/QR/signature) */}

      <div className="mt-6 flex items-end justify-between">
        <div className="ml-6">
          <Barcode value={`VIAL:2101273`} />
        </div>
        <div className="text-right mr-6">
          <div className="h-12"></div>
          <div className="border-t w-48 ml-auto"></div>
          <div className="text-[11px] font-medium">Pathologist</div>
          <div className="text-[11px]">Dr. __________________</div>
          <div className="text-[10px] text-gray-700">MD (Pathology), Reg No: __________</div>
        </div>
      </div>

      <div className="text-center text-xs mt-4">---------------- End Of The Report ----------------</div>

      <div className="flex justify-between items-center mt-6 gap-2 print:hidden">
        <div className="flex gap-2">
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="w-4 h-4 mr-2" /> Print
          </Button>
          <Button onClick={handleDownload} className="bg-gradient-medical">
            <Download className="w-4 h-4 mr-2" /> Download PDF
          </Button>
          <Button variant="secondary" onClick={handleBackToUpload}>
            ← Back to Upload
          </Button>
        </div>
        <div className="text-xs text-gray-500">Generated by LabIntel Pro</div>
      </div>
    </div>
  );
}
