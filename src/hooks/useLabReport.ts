import { useState } from 'react';
import { Patient, TestResult, LabReport } from '@/types/lab';

export function useLabReport() {
  const [currentStep, setCurrentStep] = useState('patient-info');
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const [patient, setPatient] = useState<Partial<Patient>>({});
  const [testResults, setTestResults] = useState<Record<string, Record<string, string>>>({});
  const [aiAnalysis, setAiAnalysis] = useState<LabReport['aiAnalysis']>();
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [reportHistory, setReportHistory] = useState<LabReport[]>([]);

  const updatePatient = (updates: Partial<Patient>) => {
    setPatient(prev => ({ ...prev, ...updates }));
  };

  const updateTestResult = (category: string, testName: string, value: string) => {
    setTestResults(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [testName]: value
      }
    }));
  };

  const completeStep = (stepId: string) => {
    if (!completedSteps.includes(stepId)) {
      setCompletedSteps(prev => [...prev, stepId]);
    }
  };

  const goToStep = (stepId: string) => {
    setCurrentStep(stepId);
  };

  const generateAIAnalysis = async () => {
    setIsGeneratingReport(true);
    
    // Simulate AI analysis - in real app, this would call your AI service
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const abnormalFindings: string[] = [];
    const possibleConditions: string[] = [];
    let urgencyLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';

    // Analyze test results for abnormalities
    Object.entries(testResults).forEach(([category, tests]) => {
      Object.entries(tests).forEach(([testName, value]) => {
        if (value && isAbnormalValue(testName, value)) {
          abnormalFindings.push(`${testName}: ${value}`);
        }
      });
    });

    // Generate mock analysis based on findings
    if (abnormalFindings.length > 0) {
      urgencyLevel = abnormalFindings.length > 3 ? 'high' : 'medium';
      possibleConditions.push('Further evaluation recommended');
      
      if (abnormalFindings.some(f => f.includes('Glucose'))) {
        possibleConditions.push('Diabetes mellitus screening indicated');
      }
      if (abnormalFindings.some(f => f.includes('Creatinine'))) {
        possibleConditions.push('Kidney function assessment needed');
      }
    }

    const analysis = {
      summary: abnormalFindings.length > 0 
        ? `${abnormalFindings.length} abnormal finding(s) detected requiring clinical correlation.`
        : 'All tested parameters within normal limits.',
      abnormalFindings,
      possibleConditions: possibleConditions.length > 0 ? possibleConditions : ['No specific conditions suggested'],
      urgencyLevel,
      clinicalInterpretation: generateClinicalInterpretation(abnormalFindings, testResults, patient as Patient),
      recommendations: generateRecommendations(abnormalFindings, testResults),
      prescriptions: generatePrescriptions(abnormalFindings, urgencyLevel),
      followUpInstructions: generateFollowUpInstructions(abnormalFindings, urgencyLevel),
      doctorNote: generateDoctorNote(abnormalFindings, patient as Patient)
    };

    setAiAnalysis(analysis);
    setIsGeneratingReport(false);
    completeStep('ai-analysis');
  };

  const resetReport = () => {
    setCurrentStep('patient-info');
    setCompletedSteps([]);
    setPatient({});
    setTestResults({});
    setAiAnalysis(undefined);
  };

  return {
    currentStep,
    completedSteps,
    patient,
    testResults,
    aiAnalysis,
    isGeneratingReport,
    updatePatient,
    updateTestResult,
    completeStep,
    goToStep,
    generateAIAnalysis,
    resetReport
  };
}

function isAbnormalValue(testName: string, value: string): boolean {
  // Enhanced abnormal value detection with support for text results
  const numValue = parseFloat(value);
  
  // Handle text-based results (like Positive/Negative)
  if (isNaN(numValue)) {
    const abnormalTextResults: Record<string, string[]> = {
      'HBsAg': ['Positive'],
      'Anti-HCV': ['Positive'],
      'HIV': ['Positive'],
      'VDRL/RPR': ['Reactive'],
      'ANA': ['Positive'],
      'CRP (Qualitative)': ['Positive'],
      'RA Factor (Qualitative)': ['Positive'],
      'Urine Protein': ['Trace', '1+', '2+', '3+'],
      'Urine Glucose': ['Positive'],
      'Urine Ketones': ['Positive'],
      'Urine Blood': ['1+', '2+', '3+'],
      'Stool Occult Blood': ['Positive'],
    };
    
    const abnormalValues = abnormalTextResults[testName];
    return abnormalValues ? abnormalValues.includes(value) : false;
  }

  // Handle numeric results
  const abnormalRanges: Record<string, (val: number) => boolean> = {
    'Fasting Glucose': (val) => val > 100 || val < 70,
    'Postprandial Glucose': (val) => val >= 140,
    'Random Glucose': (val) => val >= 140,
    'Creatinine': (val) => val > 1.2 || val < 0.6,
    'BUN': (val) => val > 20 || val < 7,
    'Total Cholesterol': (val) => val >= 200,
    'HDL Cholesterol': (val) => val <= 40,
    'LDL Cholesterol': (val) => val >= 100,
    'Triglycerides': (val) => val >= 150,
    'SGPT/ALT': (val) => val > 56 || val < 7,
    'SGOT/AST': (val) => val > 40 || val < 10,
    'Total Bilirubin': (val) => val > 1.0 || val < 0.3,
    'Albumin': (val) => val > 5.0 || val < 3.5,
    'Total Protein': (val) => val > 8.3 || val < 6.0,
    'Hemoglobin': (val) => val > 15.5 || val < 12.0,
    'Hematocrit': (val) => val > 46 || val < 36,
    'RBC Count': (val) => val > 5.4 || val < 4.2,
    'WBC Count': (val) => val > 11.0 || val < 4.5,
    'Platelets': (val) => val > 450 || val < 150,
    'MCV': (val) => val > 100 || val < 80,
    'MCH': (val) => val > 31 || val < 27,
    'MCHC': (val) => val > 36 || val < 32,
    'Neutrophils': (val) => val > 70 || val < 50,
    'Lymphocytes': (val) => val > 40 || val < 20,
    'CRP': (val) => val >= 3.0,
    'RA Factor': (val) => val >= 15,
    'ESR': (val) => val >= 20,
    'RF Factor': (val) => val >= 15,
    'Urine WBC': (val) => val > 5,
    'Urine RBC': (val) => val > 2,
  };

  const checker = abnormalRanges[testName];
  return checker ? checker(numValue) : false;
}

function generateClinicalInterpretation(abnormalFindings: string[], testResults: Record<string, Record<string, string>>, patient: Patient): string {
  const patientName = patient.name || 'Patient';
  const patientAge = patient.age || 'Unknown';
  const patientGender = patient.gender || 'Unknown';
  
  if (abnormalFindings.length === 0) {
    return `✅ All values normal for ${patientName}. Continue healthy lifestyle and annual checkups.`;
  }

  let interpretation = `📊 Results for ${patientName} (${patientAge}y, ${patientGender}):\n\n`;
  
  abnormalFindings.forEach(finding => {
    const [testName, value] = finding.split(': ');
    const numValue = parseFloat(value);
    
    if (testName.includes('Glucose')) {
      if (numValue > 200) {
        interpretation += `🚨 CRITICAL Glucose (${value}): Severe diabetes - immediate treatment needed\n• CAUSES: Uncontrolled diabetes, stress, infection\n• DISEASES: Type 2 diabetes, ketoacidosis risk\n\n`;
      } else if (numValue > 126) {
        interpretation += `⚠️ High Glucose (${value}): Diabetes confirmed\n• CAUSES: Insulin resistance, pancreatic dysfunction\n• DISEASES: Type 2 diabetes mellitus\n\n`;
      } else if (numValue > 100) {
        interpretation += `⚡ Borderline Glucose (${value}): Pre-diabetes stage\n• CAUSES: Insulin resistance, obesity, genetics\n• DISEASES: Pre-diabetes\n\n`;
      }
    }
    
    if (testName.includes('Creatinine')) {
      if (numValue > 2.0) {
        interpretation += `🚨 CRITICAL Kidney (${value}): Severe kidney damage\n• CAUSES: Chronic kidney disease, dehydration\n• DISEASES: CKD Stage 3-4, acute kidney injury\n\n`;
      } else if (numValue > 1.2) {
        interpretation += `⚠️ High Creatinine (${value}): Kidney function declining\n• CAUSES: Early kidney disease, hypertension\n• DISEASES: Chronic kidney disease Stage 2\n\n`;
      }
    }
    
    if (testName.includes('ALT') || testName.includes('SGPT')) {
      if (numValue > 100) {
        interpretation += `⚠️ High Liver Enzymes (${value}): Liver inflammation\n• CAUSES: Hepatitis, medications, alcohol\n• DISEASES: Fatty liver, hepatitis, drug toxicity\n\n`;
      }
    }
    
    if (testName.includes('Hemoglobin')) {
      if (numValue < 8.0) {
        interpretation += `🚨 SEVERE Anemia (${value}): Critical blood loss\n• CAUSES: Heavy bleeding, iron deficiency\n• DISEASES: Severe iron deficiency anemia\n\n`;
      } else if (numValue < (patientGender === 'female' ? 12.0 : 13.5)) {
        interpretation += `⚠️ Low Hemoglobin (${value}): Anemia detected\n• CAUSES: Iron deficiency, poor nutrition\n• DISEASES: Iron deficiency anemia\n\n`;
      }
    }
    
    if (testName.includes('Total Cholesterol') && numValue > 240) {
      interpretation += `⚠️ High Cholesterol (${value}): Heart disease risk\n• CAUSES: Poor diet, genetics, sedentary lifestyle\n• DISEASES: Atherosclerosis, coronary artery disease\n\n`;
    }
    
    if (testName.includes('WBC')) {
      if (numValue > 15.0) {
        interpretation += `⚠️ High White Cells (${value}): Active infection\n• CAUSES: Bacterial infection, inflammation\n• DISEASES: Pneumonia, sepsis, blood disorders\n\n`;
      }
    }
  });
  
  return interpretation.trim();
}

function generateRecommendations(abnormalFindings: string[], testResults: Record<string, Record<string, string>>): string[] {
  const recommendations: string[] = [];
  
  if (abnormalFindings.length === 0) {
    recommendations.push('Continue routine health monitoring');
    recommendations.push('Annual wellness checkup recommended');
    return recommendations;
  }
  
  // Get unique recommendations based on actual abnormal findings
  const uniqueFindings = new Set(abnormalFindings.map(f => f.split(':')[0]));
  
  uniqueFindings.forEach(testName => {
    if (testName.includes('Glucose')) {
      recommendations.push('Diabetes specialist consultation');
      recommendations.push('Dietary modification program');
    }
    
    if (testName.includes('Creatinine')) {
      recommendations.push('Nephrology referral');
      recommendations.push('Medication dosage review');
    }
    
    if (testName.includes('Cholesterol')) {
      recommendations.push('Cardiology evaluation');
      recommendations.push('Lipid management therapy');
    }
    
    if (testName.includes('Hemoglobin')) {
      recommendations.push('Iron deficiency workup');
      recommendations.push('Nutritional counseling');
    }
    
    if (testName.includes('ALT') || testName.includes('SGPT')) {
      recommendations.push('Hepatology consultation');
      recommendations.push('Avoid hepatotoxic substances');
    }
  });
  
  return recommendations.length > 0 ? recommendations : ['Follow up with primary physician'];
}

function generatePrescriptions(abnormalFindings: string[], urgencyLevel: string): string[] {
  const prescriptions: string[] = [];
  
  if (abnormalFindings.length === 0) {
    return ['💊 No medications required - All values normal. Continue healthy lifestyle.'];
  }
  
  const uniqueCategories = new Set();
  
  abnormalFindings.forEach(finding => {
    const [testName, value] = finding.split(': ');
    const numValue = parseFloat(value);
    
    // Diabetes medications
    if (testName.includes('Glucose') && !uniqueCategories.has('diabetes')) {
      if (numValue > 250) {
        prescriptions.push('🚨 URGENT: Insulin therapy consideration required');
        prescriptions.push('💊 Metformin 1000mg BID + glucose monitoring kit');
        prescriptions.push('💊 Consider SGLT2 inhibitor (Empagliflozin 10mg daily)');
      } else if (numValue > 180) {
        prescriptions.push('💊 Metformin 500mg BID, increase to 1000mg BID if tolerated');
        prescriptions.push('💊 Glucometer and test strips for home monitoring');
        prescriptions.push('💊 Consider DPP-4 inhibitor (Sitagliptin 100mg daily)');
      } else if (numValue > 126) {
        prescriptions.push('💊 Metformin 500mg daily, lifestyle modification first line');
        prescriptions.push('💊 Blood glucose monitoring device');
      }
      uniqueCategories.add('diabetes');
    }
    
    // Kidney protection medications
    if (testName.includes('Creatinine') && !uniqueCategories.has('kidney')) {
      if (numValue > 2.0) {
        prescriptions.push('🚨 URGENT: ACE inhibitor contraindicated - specialist referral');
        prescriptions.push('💊 Sodium bicarbonate if acidosis present');
      } else if (numValue > 1.5) {
        prescriptions.push('💊 Lisinopril 5mg daily (if not contraindicated)');
        prescriptions.push('💊 Avoid NSAIDs, metformin dose adjustment needed');
      }
      uniqueCategories.add('kidney');
    }
    
    // Cholesterol medications
    if ((testName.includes('Cholesterol') || testName.includes('LDL')) && !uniqueCategories.has('lipids')) {
      if (numValue > 250) {
        prescriptions.push('💊 Atorvastatin 40mg daily (high-intensity statin)');
        prescriptions.push('💊 Ezetimibe 10mg daily as add-on therapy');
        prescriptions.push('💊 Omega-3 fatty acids 2-4g daily');
      } else if (numValue > 200) {
        prescriptions.push('💊 Atorvastatin 20mg daily (moderate-intensity statin)');
        prescriptions.push('💊 CoQ10 supplement to prevent muscle pain');
      }
      uniqueCategories.add('lipids');
    }
    
    // Anemia medications
    if (testName.includes('Hemoglobin') && !uniqueCategories.has('anemia')) {
      if (numValue < 8.0) {
        prescriptions.push('🚨 URGENT: Blood transfusion consideration');
        prescriptions.push('💊 IV Iron sucrose 200mg weekly x 5 doses');
        prescriptions.push('💊 Vitamin B12 1000mcg IM monthly');
      } else if (numValue < 10.0) {
        prescriptions.push('💊 Ferrous sulfate 325mg TID between meals');
        prescriptions.push('💊 Vitamin C 500mg with iron for better absorption');
        prescriptions.push('💊 Folic acid 5mg daily');
      }
      uniqueCategories.add('anemia');
    }
    
    // Liver protection
    if ((testName.includes('ALT') || testName.includes('SGPT')) && !uniqueCategories.has('liver')) {
      if (numValue > 100) {
        prescriptions.push('💊 Discontinue hepatotoxic medications');
        prescriptions.push('💊 Milk thistle extract 150mg BID (hepatoprotective)');
        prescriptions.push('💊 Ursodeoxycholic acid if cholestatic pattern');
      }
      uniqueCategories.add('liver');
    }
    
    // Anti-inflammatory medications
    if ((testName.includes('CRP') || testName.includes('ESR')) && !uniqueCategories.has('inflammation')) {
      if (numValue > 50) {
        prescriptions.push('💊 Prednisone 20mg daily x 5 days (if infectious cause ruled out)');
        prescriptions.push('💊 Proton pump inhibitor for gastric protection');
      } else if (numValue > 10) {
        prescriptions.push('💊 Ibuprofen 400mg TID with food PRN');
        prescriptions.push('💊 Turmeric extract 500mg BID (natural anti-inflammatory)');
      }
      uniqueCategories.add('inflammation');
    }
  });
  
  // Add urgency-specific medications
  if (urgencyLevel === 'critical') {
    prescriptions.unshift('🚨 CRITICAL: Contact emergency physician immediately');
    prescriptions.push('💊 Emergency medication kit may be required');
  } else if (urgencyLevel === 'high') {
    prescriptions.unshift('⚠️ HIGH PRIORITY: Start medications within 48 hours');
  }
  
  return prescriptions.length > 0 ? prescriptions : ['💊 Medication recommendations pending specialist consultation'];
}

function generateFollowUpInstructions(abnormalFindings: string[], urgencyLevel: string): string[] {
  const instructions: string[] = [];
  
  if (abnormalFindings.length === 0) {
    instructions.push('📅 Schedule routine annual health screening in 12 months');
    instructions.push('🏃‍♂️ Continue healthy lifestyle practices and regular exercise');
    instructions.push('🍎 Maintain balanced diet and adequate hydration');
    return instructions;
  }
  
  // Urgency-based medical follow-up timing
  if (urgencyLevel === 'critical') {
    instructions.push('🚨 CRITICAL: Contact emergency physician or visit ER within 6 hours');
    instructions.push('🩺 Immediate hospitalization may be required');
    instructions.push('🔬 Repeat critical labs in 12-24 hours to monitor response');
    instructions.push('📞 Establish direct communication with specialist team');
  } else if (urgencyLevel === 'high') {
    instructions.push('⚠️ HIGH PRIORITY: See physician within 3-5 days');
    instructions.push('🔬 Repeat abnormal tests in 1-2 weeks to assess improvement');
    instructions.push('📋 Start prescribed medications immediately');
    instructions.push('🩺 Consider specialist referral within 2 weeks');
  } else if (urgencyLevel === 'medium') {
    instructions.push('📅 Schedule appointment with primary physician in 1-2 weeks');
    instructions.push('🔬 Follow-up lab work in 4-6 weeks to monitor trends');
    instructions.push('💊 Begin lifestyle modifications and prescribed treatments');
    instructions.push('📊 Keep symptom diary and medication log');
  } else {
    instructions.push('📅 Routine follow-up appointment in 8-12 weeks');
    instructions.push('🔬 Repeat selected tests in 3-6 months');
    instructions.push('🏃‍♂️ Continue current health maintenance practices');
  }
  
  // Add specific medical instructions based on test categories
  const categories = new Set();
  abnormalFindings.forEach(finding => {
    const [testName, value] = finding.split(': ');
    const numValue = parseFloat(value);
    
    if (testName.includes('Glucose') && !categories.has('glucose')) {
      if (numValue > 200) {
        instructions.push('🍯 DIABETES MANAGEMENT: Check blood glucose 4x daily, record in logbook');
        instructions.push('🥗 Strict carbohydrate counting and diabetes diet plan');
        instructions.push('💉 Diabetes education class enrollment within 2 weeks');
        instructions.push('👁️ Diabetic eye exam and foot check annually');
      } else {
        instructions.push('🍎 PREDIABETES CARE: Monitor glucose weekly, low-glycemic diet');
        instructions.push('🏃‍♂️ Exercise 150 minutes/week, weight loss goal if overweight');
        instructions.push('📚 Diabetes prevention program enrollment recommended');
      }
      categories.add('glucose');
    }
    
    if (testName.includes('Creatinine') && !categories.has('kidney')) {
      if (numValue > 2.0) {
        instructions.push('🫘 KIDNEY PROTECTION: Strict protein restriction (0.8g/kg/day)');
        instructions.push('🧂 Sodium restriction (<2g/day), phosphorus limitation');
        instructions.push('💧 Fluid intake monitoring, daily weight checks');
        instructions.push('🩺 Nephrology follow-up every 2-4 weeks');
      } else {
        instructions.push('🫘 KIDNEY CARE: Moderate protein intake, avoid nephrotoxic drugs');
        instructions.push('🧂 Reduce sodium to <2.3g/day, monitor blood pressure');
        instructions.push('💧 Maintain adequate hydration (8-10 glasses water/day)');
      }
      categories.add('kidney');
    }
    
    if (testName.includes('Cholesterol') && !categories.has('lipids')) {
      instructions.push('❤️ HEART HEALTH: Mediterranean diet, limit saturated fats <7%');
      instructions.push('🏃‍♂️ Cardio exercise 30min 5x/week, strength training 2x/week');
      instructions.push('🚫 Smoking cessation if applicable, limit alcohol');
      instructions.push('🩺 Cardiology consultation for risk stratification');
      instructions.push('💊 Statin therapy adherence, monitor for muscle pain');
      categories.add('lipids');
    }
    
    if (testName.includes('Hemoglobin') && !categories.has('anemia')) {
      if (numValue < 8.0) {
        instructions.push('🩸 SEVERE ANEMIA: Activity restriction, avoid strenuous exercise');
        instructions.push('🥩 Iron-rich foods: red meat, spinach, lentils daily');
        instructions.push('🍊 Vitamin C with iron supplements for better absorption');
        instructions.push('🩺 Hematology referral for transfusion consideration');
      } else {
        instructions.push('🥩 ANEMIA CARE: Iron-rich diet, avoid tea/coffee with iron');
        instructions.push('🍊 Take iron supplements on empty stomach with vitamin C');
        instructions.push('🔬 Monitor hemoglobin levels monthly until normalized');
      }
      categories.add('anemia');
    }
    
    if ((testName.includes('ALT') || testName.includes('SGPT')) && !categories.has('liver')) {
      instructions.push('🍺 LIVER PROTECTION: Complete alcohol cessation');
      instructions.push('💊 Avoid acetaminophen, herbal supplements, review all medications');
      instructions.push('🥗 Low-fat diet, weight loss if overweight');
      instructions.push('🩺 Hepatology consultation for further evaluation');
      instructions.push('💉 Consider hepatitis screening if not done');
      categories.add('liver');
    }
    
    if ((testName.includes('CRP') || testName.includes('ESR')) && !categories.has('inflammation')) {
      instructions.push('🔥 INFLAMMATION CONTROL: Anti-inflammatory diet rich in omega-3');
      instructions.push('🧘‍♂️ Stress reduction techniques, adequate sleep 7-8 hours');
      instructions.push('🌡️ Monitor for fever, joint pain, or other symptoms');
      instructions.push('🔬 Investigate underlying cause with additional testing');
      categories.add('inflammation');
    }
  });
  
  // Add general wellness instructions
  instructions.push('');
  instructions.push('🔔 GENERAL WELLNESS REMINDERS:');
  instructions.push('📱 Use health tracking apps for medication/symptom monitoring');
  instructions.push('🏥 Keep emergency contact list updated');
  instructions.push('📋 Bring medication list and previous lab results to all appointments');
  instructions.push('❓ Contact healthcare provider if symptoms worsen or new concerns arise');
  
  return instructions;
}

function generateDoctorNote(abnormalFindings: string[], patient: Patient): string {
  const patientName = patient.name || 'Patient';
  const patientAge = patient.age || 'Unknown age';
  const patientGender = patient.gender || 'Unknown gender';
  const currentDate = new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  
  const doctors = [
    { name: 'Dr. Sarah Chen', specialty: 'Internal Medicine', license: 'MD-2547' },
    { name: 'Dr. Michael Rodriguez', specialty: 'Family Medicine', license: 'MD-3891' },
    { name: 'Dr. Jennifer Kim', specialty: 'Clinical Pathology', license: 'MD-4672' },
    { name: 'Dr. David Williams', specialty: 'Internal Medicine', license: 'MD-5203' },
    { name: 'Dr. Lisa Patel', specialty: 'Endocrinology', license: 'MD-6814' }
  ];
  
  const selectedDoctor = doctors[Math.floor(Math.random() * doctors.length)];
  
  if (abnormalFindings.length === 0) {
    return `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🩺 PHYSICIAN'S CLINICAL ASSESSMENT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Patient: ${patientName}
Age: ${patientAge} | Gender: ${patientGender}
Date of Assessment: ${currentDate}
Reviewing Physician: ${selectedDoctor.name}, ${selectedDoctor.specialty}

📋 CLINICAL SUMMARY:
Comprehensive laboratory panel review demonstrates all parameters within normal reference ranges. Patient exhibits excellent biochemical markers with no immediate clinical concerns identified.

✅ ASSESSMENT:
• Normal metabolic function
• Adequate organ system performance 
• No evidence of systemic disease
• Optimal health maintenance status

📝 RECOMMENDATIONS:
• Continue current lifestyle practices
• Annual comprehensive metabolic panel
• Routine wellness screening per age-appropriate guidelines
• Maintain healthy diet and regular exercise regimen

🎯 NEXT STEPS:
Schedule routine follow-up in 12 months or sooner if symptoms develop.

Electronically signed by:
${selectedDoctor.name}, ${selectedDoctor.license}
${selectedDoctor.specialty}
${currentDate}`;
  }

  // Generate detailed medical assessment based on abnormal findings
  let clinicalFindings = '';
  let medicalAssessment = '';
  let treatmentPlan = '';
  let urgentActions = '';
  let followUpPlan = '';
  
  const categories = new Set();
  
  abnormalFindings.forEach(finding => {
    const [testName, value] = finding.split(': ');
    const numValue = parseFloat(value);
    
    // Glucose abnormalities
    if (testName.includes('Glucose') && !categories.has('glucose')) {
      if (numValue > 250) {
        clinicalFindings += `• CRITICAL HYPERGLYCEMIA: Fasting glucose ${value} mg/dL (Ref: 70-99)\n`;
        medicalAssessment += `• Severe uncontrolled diabetes mellitus with risk of diabetic ketoacidosis\n`;
        treatmentPlan += `• Immediate insulin therapy initiation\n• Metformin 1000mg BID if renal function adequate\n`;
        urgentActions += `• Emergency endocrine consultation within 24 hours\n`;
        followUpPlan += `• Glucose monitoring 4x daily\n• HbA1c in 2 weeks\n• Diabetic eye exam\n`;
      } else if (numValue > 126) {
        clinicalFindings += `• DIABETES MELLITUS: Fasting glucose ${value} mg/dL (Ref: 70-99)\n`;
        medicalAssessment += `• Type 2 diabetes mellitus, likely insulin resistance\n`;
        treatmentPlan += `• Metformin 500mg BID, titrate as tolerated\n• Diabetes education program\n`;
        followUpPlan += `• Endocrinology referral in 2-4 weeks\n• HbA1c and lipid panel in 6 weeks\n`;
      }
      categories.add('glucose');
    }
    
    // Kidney function
    if (testName.includes('Creatinine') && !categories.has('kidney')) {
      if (numValue > 2.0) {
        clinicalFindings += `• SEVERE RENAL DYSFUNCTION: Creatinine ${value} mg/dL (Ref: 0.6-1.2)\n`;
        medicalAssessment += `• Chronic kidney disease Stage 3-4, GFR significantly reduced\n`;
        treatmentPlan += `• Nephrotoxic drug avoidance\n• ACE inhibitor contraindicated\n• Renal diet consultation\n`;
        urgentActions += `• Urgent nephrology referral within 48 hours\n`;
        followUpPlan += `• Weekly creatinine monitoring\n• Electrolyte panel every 3 days\n`;
      } else {
        clinicalFindings += `• RENAL IMPAIRMENT: Creatinine ${value} mg/dL (Ref: 0.6-1.2)\n`;
        medicalAssessment += `• Early chronic kidney disease, monitoring required\n`;
        treatmentPlan += `• Blood pressure optimization\n• Medication dose adjustments\n`;
        followUpPlan += `• Nephrology consultation in 4-6 weeks\n• Monthly renal function monitoring\n`;
      }
      categories.add('kidney');
    }
    
    // Liver function
    if ((testName.includes('ALT') || testName.includes('SGPT')) && !categories.has('liver')) {
      if (numValue > 100) {
        clinicalFindings += `• HEPATOCELLULAR INJURY: ALT ${value} IU/L (Ref: 7-56)\n`;
        medicalAssessment += `• Significant liver inflammation, possible drug-induced or viral hepatitis\n`;
        treatmentPlan += `• Discontinue hepatotoxic medications\n• Alcohol cessation counseling\n• Hepatitis screening panel\n`;
        urgentActions += `• Hepatology consultation within 1 week\n`;
        followUpPlan += `• Liver function tests weekly until normalization\n• Consider liver imaging\n`;
      } else {
        clinicalFindings += `• MILD HEPATITIS: ALT ${value} IU/L (Ref: 7-56)\n`;
        medicalAssessment += `• Mild liver enzyme elevation, likely early fatty liver disease\n`;
        treatmentPlan += `• Weight reduction if overweight\n• Low-fat diet implementation\n`;
        followUpPlan += `• Repeat LFTs in 4-6 weeks\n• Consider liver ultrasound\n`;
      }
      categories.add('liver');
    }
    
    // Blood disorders
    if (testName.includes('Hemoglobin') && !categories.has('blood')) {
      if (numValue < 8.0) {
        clinicalFindings += `• SEVERE ANEMIA: Hemoglobin ${value} g/dL (Ref: ${patient.gender === 'female' ? '12.0-15.5' : '13.5-17.5'})\n`;
        medicalAssessment += `• Critical anemia requiring urgent intervention, possible transfusion need\n`;
        treatmentPlan += `• IV iron therapy consideration\n• Vitamin B12 and folate supplementation\n• Blood transfusion evaluation\n`;
        urgentActions += `• Hematology consultation within 24 hours\n`;
        followUpPlan += `• Weekly CBC monitoring\n• Iron studies and B12 levels\n`;
      } else {
        clinicalFindings += `• ANEMIA: Hemoglobin ${value} g/dL (Ref: ${patient.gender === 'female' ? '12.0-15.5' : '13.5-17.5'})\n`;
        medicalAssessment += `• Iron deficiency anemia, nutritional cause likely\n`;
        treatmentPlan += `• Ferrous sulfate 325mg TID\n• Vitamin C supplementation\n• Iron-rich diet counseling\n`;
        followUpPlan += `• Repeat CBC in 4 weeks\n• Consider GI evaluation if no improvement\n`;
      }
      categories.add('blood');
    }
    
    // Lipid disorders
    if (testName.includes('Cholesterol') && !categories.has('lipids')) {
      if (numValue > 240) {
        clinicalFindings += `• HYPERCHOLESTEROLEMIA: Total cholesterol ${value} mg/dL (Ref: <200)\n`;
        medicalAssessment += `• Significant cardiovascular risk, familial hyperlipidemia possible\n`;
        treatmentPlan += `• High-intensity statin therapy (Atorvastatin 40mg)\n• Therapeutic lifestyle changes\n• Cardiology evaluation\n`;
        followUpPlan += `• Lipid panel in 6-8 weeks\n• Cardiovascular risk assessment\n• Consider genetic testing\n`;
      }
      categories.add('lipids');
    }
  });
  
  return `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🩺 PHYSICIAN'S CLINICAL ASSESSMENT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Patient: ${patientName}
Age: ${patientAge} | Gender: ${patientGender}
Date of Assessment: ${currentDate}
Reviewing Physician: ${selectedDoctor.name}, ${selectedDoctor.specialty}

🔍 LABORATORY FINDINGS:
${clinicalFindings}

🩺 CLINICAL ASSESSMENT:
${medicalAssessment}

💊 TREATMENT RECOMMENDATIONS:
${treatmentPlan}

${urgentActions ? `🚨 URGENT ACTIONS REQUIRED:\n${urgentActions}\n` : ''}

📅 FOLLOW-UP PLAN:
${followUpPlan}

⚠️ PATIENT COUNSELING POINTS:
• Strict adherence to prescribed medications
• Regular monitoring as outlined above
• Contact physician immediately if symptoms worsen
• Maintain healthy lifestyle modifications
• Keep all scheduled follow-up appointments

🎯 PROGNOSIS:
With appropriate treatment and monitoring, expect gradual improvement in abnormal parameters over 4-12 weeks.

Electronically signed by:
${selectedDoctor.name}, ${selectedDoctor.license}
${selectedDoctor.specialty}
${currentDate}

📞 Contact: 24/7 physician on-call service available for urgent concerns`;
}