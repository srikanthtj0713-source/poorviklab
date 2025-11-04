export interface Patient {
  id: string;
  name: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  patientId: string;
  symptoms?: string;
}

export interface TestResult {
  name: string;
  value: string;
  unit: string;
  normalRange: string;
  isAbnormal: boolean;
}

export interface TestPanel {
  id: string;
  name: string;
  tests: {
    name: string;
    unit: string;
    normalRange: string;
    placeholder?: string;
    type?: 'number' | 'select';
    options?: string[];
    info?: string;
  }[];
}

export interface TestCategory {
  id: string;
  name: string;
  icon: string;
  description: string;
  panels: TestPanel[];
}

export interface LabReport {
  id: string;
  patient: Patient;
  testResults: Record<string, TestResult[]>;
  aiAnalysis?: {
    summary: string;
    abnormalFindings: string[];
    possibleConditions: string[];
    urgencyLevel: 'low' | 'medium' | 'high' | 'critical';
    clinicalInterpretation: string;
    recommendations: string[];
    prescriptions: string[];
    followUpInstructions: string[];
    doctorNote: string;
  };
  createdAt: Date;
  labWorkerName?: string;
}

export const TEST_CATEGORIES: TestCategory[] = [
  {
    id: 'biochemistry',
    name: 'Biochemistry',
    icon: '🔬',
    description: 'Blood chemistry and metabolic panels',
    panels: [
      {
        id: 'kft',
        name: 'Kidney Function Test (KFT)',
        tests: [
          { name: 'Urea', unit: 'mg/dL', normalRange: '7-20', info: 'Waste from protein breakdown; rises in dehydration or kidney issues.' },
          { name: 'Creatinine', unit: 'mg/dL', normalRange: '0.6-1.2', info: 'Marker of kidney filtration (GFR); persistent elevation suggests CKD.' },
          { name: 'Uric Acid', unit: 'mg/dL', normalRange: '3.5-7.2', info: 'High levels may cause gout and kidney stones.' },
          { name: 'eGFR', unit: 'mL/min/1.73m²', normalRange: '>60', info: 'Estimated kidney filtration rate; <60 suggests chronic kidney disease.' },
          { name: 'BUN', unit: 'mg/dL', normalRange: '7-23' },
          { name: 'Urea/Creatinine Ratio', unit: 'ratio', normalRange: '10-20' },
          { name: 'Cystatin C', unit: 'mg/L', normalRange: '0.5-1.2' },
          { name: 'Calcium', unit: 'mg/dL', normalRange: '8.5-10.5' },
          { name: 'Phosphorus', unit: 'mg/dL', normalRange: '2.5-4.5' },
          { name: 'Bicarbonate (Total CO2)', unit: 'mEq/L', normalRange: '22-29' },
          { name: 'Anion Gap', unit: 'mEq/L', normalRange: '8-16' },
        ]
      },
      {
        id: 'lft',
        name: 'Liver Function Test (LFT)',
        tests: [
          { name: 'SGPT/ALT', unit: 'U/L', normalRange: '7-56', info: 'Liver enzyme; rises with hepatocellular injury.' },
          { name: 'SGOT/AST', unit: 'U/L', normalRange: '10-40', info: 'Liver/cardiac enzyme; elevated with liver or muscle injury.' },
          { name: 'Total Bilirubin', unit: 'mg/dL', normalRange: '0.3-1.0', info: 'Pigment from RBC breakdown; high in jaundice or bile obstruction.' },
          { name: 'Direct Bilirubin', unit: 'mg/dL', normalRange: '0.0-0.3' },
          { name: 'Indirect Bilirubin', unit: 'mg/dL', normalRange: '0.2-0.7' },
          { name: 'Alkaline Phosphatase (ALP)', unit: 'U/L', normalRange: '44-147', info: 'Bile duct/bone activity; high in cholestasis or bone disease.' },
          { name: 'Gamma GT (GGT)', unit: 'U/L', normalRange: '9-48', info: 'Supports cholestasis and alcohol-related liver disease.' },
          { name: 'Albumin', unit: 'g/dL', normalRange: '3.5-5.0' },
          { name: 'Total Protein', unit: 'g/dL', normalRange: '6.0-8.3' },
        ]
      },
      {
        id: 'lipid',
        name: 'Lipid Profile',
        tests: [
          { name: 'Total Cholesterol', unit: 'mg/dL', normalRange: '<200', info: 'Sum of blood lipids; higher levels increase CVD risk.' },
          { name: 'HDL Cholesterol', unit: 'mg/dL', normalRange: '>40', info: '“Good” cholesterol; higher is protective.' },
          { name: 'LDL Cholesterol', unit: 'mg/dL', normalRange: '<100', info: '“Bad” cholesterol; target lowered in high CVD risk.' },
          { name: 'Triglycerides', unit: 'mg/dL', normalRange: '<150', info: 'Blood fats; high in insulin resistance and pancreatitis risk.' },
          { name: 'VLDL Cholesterol', unit: 'mg/dL', normalRange: '5-40' },
        ]
      },
      {
        id: 'thyroid',
        name: 'Thyroid Profile',
        tests: [
          { name: 'T3', unit: 'ng/dL', normalRange: '80-200', info: 'Active thyroid hormone; low with hypothyroidism.' },
          { name: 'T4', unit: 'μg/dL', normalRange: '4.5-12.0', info: 'Thyroxine; together with TSH assesses thyroid function.' },
          { name: 'TSH', unit: 'μIU/mL', normalRange: '0.27-4.2', info: 'Pituitary hormone; high in hypothyroidism, low in hyperthyroidism.' },
        ]
      },
      {
        id: 'sugar',
        name: 'Blood Sugar',
        tests: [
          { name: 'Fasting Glucose', unit: 'mg/dL', normalRange: '70-100', info: 'Glucose after 8–12h fast; screens for diabetes.' },
          { name: 'Postprandial Glucose', unit: 'mg/dL', normalRange: '<140', info: 'Measured ~2h after meal; reflects post‑meal control.' },
          { name: 'Random Glucose', unit: 'mg/dL', normalRange: '<140', info: 'Anytime glucose; very high values suggest diabetes.' },
          { name: 'HbA1c', unit: '%', normalRange: '<5.7', info: '3‑month average glucose; used to diagnose and monitor diabetes.' },
        ]
      },
      {
        id: 'electrolytes',
        name: 'Electrolytes',
        tests: [
          { name: 'Sodium', unit: 'mEq/L', normalRange: '136-145', info: 'Key extracellular electrolyte; reflects water balance.' },
          { name: 'Potassium', unit: 'mEq/L', normalRange: '3.5-5.1', info: 'Critical for heart rhythm; both high/low can cause arrhythmia.' },
          { name: 'Chloride', unit: 'mEq/L', normalRange: '98-107', info: 'Tracks acid–base and hydration status with sodium/bicarbonate.' },
        ]
      },
      {
        id: 'renal-extended',
        name: 'Renal Extended',
        tests: [
          { name: 'BUN', unit: 'mg/dL', normalRange: '7-23', info: 'Protein waste; high in dehydration or renal impairment.' },
          { name: 'BUN/Creatinine', unit: 'ratio', normalRange: '10-20', info: 'Helps differentiate pre‑renal vs intrinsic kidney causes.' },
        ]
      },
      {
        id: 'bilirubin-profile',
        name: 'Bilirubin Profile',
        tests: [
          { name: 'Direct Bilirubin', unit: 'mg/dL', normalRange: '0.0-0.3' },
          { name: 'Indirect Bilirubin', unit: 'mg/dL', normalRange: '0.2-0.7' },
        ]
      },
      {
        id: 'enzymes',
        name: 'Enzymes',
        tests: [
          { name: 'Alkaline Phosphatase (ALP)', unit: 'U/L', normalRange: '44-147' },
          { name: 'Gamma GT (GGT)', unit: 'U/L', normalRange: '9-48' },
          { name: 'LDH', unit: 'U/L', normalRange: '140-280' },
          { name: 'Amylase', unit: 'U/L', normalRange: '30-110' },
          { name: 'Lipase', unit: 'U/L', normalRange: '13-60' },
        ]
      },
      {
        id: 'minerals',
        name: 'Minerals',
        tests: [
          { name: 'Calcium', unit: 'mg/dL', normalRange: '8.5-10.5' },
          { name: 'Phosphorus', unit: 'mg/dL', normalRange: '2.5-4.5' },
          { name: 'Magnesium', unit: 'mg/dL', normalRange: '1.6-2.6' },
        ]
      },
      {
        id: 'iron-studies',
        name: 'Iron Studies',
        tests: [
          { name: 'Serum Iron', unit: 'μg/dL', normalRange: '60-170' },
          { name: 'TIBC', unit: 'μg/dL', normalRange: '240-450' },
          { name: 'Transferrin Saturation', unit: '%', normalRange: '20-50' },
          { name: 'Ferritin', unit: 'ng/mL', normalRange: '30-400' },
        ]
      },
      {
        id: 'vitamins',
        name: 'Vitamins',
        tests: [
          { name: 'Vitamin D (25-OH)', unit: 'ng/mL', normalRange: '30-100' },
          { name: 'Vitamin B12', unit: 'pg/mL', normalRange: '200-900' },
        ]
      },
      {
        id: 'protein-profile',
        name: 'Protein Profile',
        tests: [
          { name: 'Globulin', unit: 'g/dL', normalRange: '2.0-3.5' },
          { name: 'A/G Ratio', unit: 'ratio', normalRange: '1.0-2.2' },
        ]
      }
    ]
  },
  {
    id: 'hematology',
    name: 'Hematology',
    icon: '🧪',
    description: 'Complete blood count and coagulation studies',
    panels: [
      {
        id: 'cbc',
        name: 'Complete Blood Count (CBC)',
        tests: [
          { name: 'Hemoglobin', unit: 'g/dL', normalRange: '12.0-15.5', info: 'Oxygen-carrying protein; low suggests anemia.' },
          { name: 'Hematocrit', unit: '%', normalRange: '36-46', info: 'Packed cell volume; mirrors hemoglobin/anaemia status.' },
          { name: 'PCV', unit: '%', normalRange: '36-46' },
          { name: 'HCP', unit: '%', normalRange: '36-46' },
          { name: 'RBC Count', unit: '×10⁶/μL', normalRange: '4.2-5.4' },
          { name: 'WBC Count', unit: '×10³/μL', normalRange: '4.5-11.0' },
          { name: 'Platelets', unit: '×10³/μL', normalRange: '150-450' },
          { name: 'MCV', unit: 'fL', normalRange: '80-100' },
          { name: 'MCH', unit: 'pg', normalRange: '27-31' },
          { name: 'MCHC', unit: 'g/dL', normalRange: '32-36' },
          { name: 'RDW-CV', unit: '%', normalRange: '11.5-14.5' },
          { name: 'RDW-SD', unit: 'fL', normalRange: '37-54' },
          { name: 'MPV', unit: 'fL', normalRange: '7.5-11.5' },
          { name: 'PDW', unit: 'fL', normalRange: '9-17' },
          { name: 'Neutrophils', unit: '%', normalRange: '50-70' },
          { name: 'Lymphocytes', unit: '%', normalRange: '20-40' },
          { name: 'Monocytes', unit: '%', normalRange: '2-8' },
          { name: 'Eosinophils', unit: '%', normalRange: '1-4' },
          { name: 'Basophils', unit: '%', normalRange: '0-1' },
          { name: 'Absolute Neutrophil Count', unit: '×10³/μL', normalRange: '1.5-7.5' },
          { name: 'Absolute Lymphocyte Count', unit: '×10³/μL', normalRange: '1.0-4.0' },
          { name: 'Absolute Monocyte Count', unit: '×10³/μL', normalRange: '0.2-0.8' },
          { name: 'Absolute Eosinophil Count', unit: '×10³/μL', normalRange: '0.0-0.5' },
          { name: 'Absolute Basophil Count', unit: '×10³/μL', normalRange: '0.0-0.1' },
        ]
      },
      {
        id: 'coagulation',
        name: 'Coagulation Profile',
        tests: [
          { name: 'PT/INR', unit: 'seconds', normalRange: '11-13' },
          { name: 'aPTT', unit: 'seconds', normalRange: '25-35' },
        ]
      },
      {
        id: 'other-hem',
        name: 'Other Tests',
        tests: [
          { name: 'ESR', unit: 'mm/hr', normalRange: '<20', info: 'Non‑specific inflammation marker; elevated in infection/autoimmune.' },
          { name: 'Reticulocyte Count', unit: '%', normalRange: '0.5-2.5' },
        ]
      },
      {
        id: 'blood-grouping',
        name: 'Blood Grouping',
        tests: [
          { name: 'Blood Group (ABO/Rh)', unit: 'result', normalRange: 'A+/A-/B+/B-/AB+/AB-/O+/O-', type: 'select', options: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] },
          { name: 'Antibody Screen', unit: 'result', normalRange: 'Negative', type: 'select', options: ['Negative', 'Positive'] },
          { name: 'Crossmatch Compatibility', unit: 'result', normalRange: 'Compatible', type: 'select', options: ['Compatible', 'Incompatible'] },
        ]
      }
    ]
  },
  {
    id: 'microbiology',
    name: 'Microbiology',
    icon: '🧫',
    description: 'Bacterial cultures and sensitivity testing',
    panels: [
      {
        id: 'cultures',
        name: 'Culture Tests',
        tests: [
          { name: 'Urine Culture', unit: 'result', normalRange: 'No growth', placeholder: 'e.g., E. coli >100K CFU', info: 'Identifies urinary pathogens and guides antibiotic choice.' },
          { name: 'Blood Culture', unit: 'result', normalRange: 'No growth', placeholder: 'e.g., No growth, S. aureus' },
          { name: 'Sputum Culture', unit: 'result', normalRange: 'Normal flora', placeholder: 'e.g., Normal flora, S. pneumoniae' },
          { name: 'Stool Culture', unit: 'result', normalRange: 'Normal flora', placeholder: 'e.g., Salmonella species' },
          { name: 'CSF Culture', unit: 'result', normalRange: 'No growth', placeholder: 'e.g., No growth' },
          { name: 'Wound Culture', unit: 'result', normalRange: 'No growth', placeholder: 'e.g., MRSA isolated' },
        ]
      },
      {
        id: 'special-tests',
        name: 'Special Tests',
        tests: [
          { name: 'Sputum AFB', unit: 'result', normalRange: 'Negative', type: 'select', options: ['Negative', 'Positive'] },
          { name: 'Malaria Test', unit: 'result', normalRange: 'Negative', type: 'select', options: ['Negative', 'Positive'] },
          { name: 'Dengue', unit: 'result', normalRange: 'Negative', type: 'select', options: ['Negative', 'Positive'] },
          { name: 'Dengue NS1 Antigen', unit: 'result', normalRange: 'Negative', type: 'select', options: ['Negative', 'Positive'] },
          { name: 'Dengue IgM', unit: 'result', normalRange: 'Negative', type: 'select', options: ['Negative', 'Positive'] },
          { name: 'Dengue IgG', unit: 'result', normalRange: 'Negative', type: 'select', options: ['Negative', 'Positive'] },
          { name: 'Dengue Method', unit: 'result', normalRange: 'Rapid', type: 'select', options: ['Rapid', 'ELISA'] },
          { name: 'Dengue Interpretation', unit: 'result', normalRange: '', placeholder: 'e.g., Primary infection (NS1+/IgM-), suggest retest' },
          { name: 'Widal Test', unit: 'result', normalRange: 'Negative', type: 'select', options: ['Negative', 'Positive'] },
          { name: 'Widal Method', unit: 'result', normalRange: 'Slide', type: 'select', options: ['Slide', 'Tube'] },
          { name: 'Widal TO Titer', unit: 'titer', normalRange: '', type: 'select', options: ['1:20', '1:40', '1:80', '1:160', '1:320', '1:640'] },
          { name: 'Widal TH Titer', unit: 'titer', normalRange: '', type: 'select', options: ['1:20', '1:40', '1:80', '1:160', '1:320', '1:640'] },
          { name: 'Widal AH Titer', unit: 'titer', normalRange: '', type: 'select', options: ['1:20', '1:40', '1:80', '1:160', '1:320', '1:640'] },
          { name: 'Widal BH Titer', unit: 'titer', normalRange: '', type: 'select', options: ['1:20', '1:40', '1:80', '1:160', '1:320', '1:640'] },
          { name: 'Widal Interpretation', unit: 'result', normalRange: '', placeholder: 'e.g., Significant TH 1:160; correlate clinically' },
        ]
      }
    ]
  },
  {
    id: 'immunology',
    name: 'Immunology / Serology',
    icon: '🧬',
    description: 'Immunological markers and infectious disease serology',
    panels: [
      {
        id: 'infectious',
        name: 'Infectious Disease Markers',
        tests: [
          { name: 'HIV', unit: 'result', normalRange: 'Negative', type: 'select', options: ['Negative', 'Positive'], info: 'Screening test; positive requires confirmatory assay.' },
          { name: 'HBsAg', unit: 'result', normalRange: 'Negative', type: 'select', options: ['Negative', 'Positive'], info: 'Hepatitis B surface antigen; positive indicates active infection.' },
          { name: 'HCV', unit: 'result', normalRange: 'Negative', type: 'select', options: ['Negative', 'Positive'], info: 'Hepatitis C antibody; positive needs RNA confirmation.' },
          { name: 'VDRL', unit: 'result', normalRange: 'Negative', type: 'select', options: ['Negative', 'Positive'], info: 'Syphilis screening; biological false positives possible—confirm with TPHA.' },
        ]
      },
      {
        id: 'autoimmune',
        name: 'Autoimmune Markers',
        tests: [
          { name: 'RA Factor', unit: 'IU/mL', normalRange: '<15', info: 'Autoantibody; supports rheumatoid arthritis with clinical features.' },
          { name: 'RA Factor (Qualitative)', unit: 'result', normalRange: 'Negative', type: 'select', options: ['Negative', 'Positive'] },
          { name: 'CRP', unit: 'mg/L', normalRange: '<6.0', placeholder: '0.0', type: 'number', info: 'Acute-phase protein; rises in infection/inflammation.' },
          { name: 'CRP (Qualitative)', unit: 'result', normalRange: 'Negative', type: 'select', options: ['Negative', 'Positive'] },
          { name: 'hs-CRP', unit: 'mg/L', normalRange: '<1.0', placeholder: '0.00', type: 'number' },
          { name: 'ANA', unit: 'result', normalRange: 'Negative', type: 'select', options: ['Negative', 'Positive'] },
          { name: 'ASO Titer', unit: 'IU/mL', normalRange: '<200' },
        ]
      }
    ]
  },
  {
    id: 'fluids',
    name: 'Body Fluids',
    icon: '🧻',
    description: 'Urinalysis and body fluid examination',
    panels: [
      {
        id: 'urine-routine',
        name: 'Urine Routine',
        tests: [
          { name: 'Urine Protein', unit: 'result', normalRange: 'Negative', type: 'select', options: ['Negative', 'Trace', '1+', '2+', '3+'], info: 'Protein in urine indicates renal or glomerular involvement.' },
          { name: 'Urine Sugar', unit: 'result', normalRange: 'Negative', type: 'select', options: ['Negative', 'Positive'] },
          { name: 'Urine Ketones', unit: 'result', normalRange: 'Negative', type: 'select', options: ['Negative', 'Positive'] },
          { name: 'Urine Blood', unit: 'result', normalRange: 'Negative', type: 'select', options: ['Negative', '1+', '2+', '3+'], info: 'Blood in urine (hematuria) requires microscopy and clinical correlation.' },
          { name: 'Urine WBC', unit: '/hpf', normalRange: '0-5' },
          { name: 'Urine RBC', unit: '/hpf', normalRange: '0-2' },
          { name: 'Color', unit: 'result', normalRange: '', placeholder: 'e.g., Pale yellow' },
          { name: 'Appearance', unit: 'result', normalRange: '', placeholder: 'e.g., Clear' },
          { name: 'Specific Gravity', unit: '', normalRange: '1.005-1.030' },
          { name: 'pH', unit: '', normalRange: '4.5-8.0' },
          { name: 'Leukocyte Esterase', unit: 'result', normalRange: 'Negative', type: 'select', options: ['Negative', 'Trace', 'Small', 'Moderate', 'Large'] },
          { name: 'Nitrite', unit: 'result', normalRange: 'Negative', type: 'select', options: ['Negative', 'Positive'] },
          { name: 'Urobilinogen', unit: 'mg/dL', normalRange: '0.1-1.0' },
          { name: 'Bilirubin', unit: 'result', normalRange: 'Negative', type: 'select', options: ['Negative', 'Positive'] },
          { name: 'Epithelial Cells', unit: '/hpf', normalRange: '0-5' },
          { name: 'Casts', unit: 'result', normalRange: '', placeholder: 'e.g., Hyaline 0-2/lpf' },
          { name: 'Crystals', unit: 'result', normalRange: '', placeholder: 'e.g., Calcium oxalate occasional' },
          { name: 'Bacteria', unit: 'result', normalRange: '', placeholder: 'e.g., Few / Moderate / Numerous' },
        ]
      },
      {
        id: 'stool-routine',
        name: 'Stool Routine',
        tests: [
          { name: 'Stool Occult Blood', unit: 'result', normalRange: 'Negative', type: 'select', options: ['Negative', 'Positive'], info: 'Detects hidden blood; positive suggests GI bleeding.' },
          { name: 'Stool Parasites', unit: 'result', normalRange: 'None seen', placeholder: 'e.g., Giardia cysts' },
        ]
      },
      {
        id: 'other-fluids',
        name: 'Other Body Fluids',
        tests: [
          { name: 'Semen Analysis', unit: 'result', normalRange: 'Normal', placeholder: 'e.g., Normal parameters' },
          { name: 'CSF Analysis', unit: 'result', normalRange: 'Normal', placeholder: 'e.g., Clear, no cells' },
          { name: 'Ascitic Fluid', unit: 'result', normalRange: 'Normal', placeholder: 'e.g., Transudate' },
        ]
      }
    ]
  },
];