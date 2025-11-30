import React, { useState } from 'react';
import { Upload, FileText, Sparkles, AlertCircle, FileJson, FileSpreadsheet, ArrowLeft } from 'lucide-react';
import { Course, TimeSlotMapping } from '../types';
import { GoogleGenAI } from "@google/genai";
import * as pdfjsLib from 'pdfjs-dist';
import * as XLSX from 'xlsx';

// Initialize PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

interface Props {
    onDataLoaded: (courses: Course[], slots: TimeSlotMapping) => void;
    onGoBack?: () => void;
}

export const DataUpload: React.FC<Props> = ({ onDataLoaded, onGoBack }) => {
    const [aiInput, setAiInput] = useState('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [error, setError] = useState('');

    const extractTextFromPdf = async (file: File): Promise<string> => {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        let fullText = '';

        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items.map((item: any) => item.str).join(' ');
            fullText += `Page ${i}:\n${pageText}\n\n`;
        }
        return fullText;
    };

    const extractTextFromExcel = async (file: File): Promise<string> => {
        const arrayBuffer = await file.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer);
        let fullText = '';

        workbook.SheetNames.forEach(sheetName => {
            const sheet = workbook.Sheets[sheetName];
            const json = XLSX.utils.sheet_to_json(sheet, { header: 1 });
            fullText += `Sheet: ${sheetName}\n${JSON.stringify(json, null, 2)}\n\n`;
        });
        return fullText;
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setError('');
        const extension = file.name.split('.').pop()?.toLowerCase();

        if (extension === 'json') {
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const content = event.target?.result as string;
                    const data = JSON.parse(content);
                    if (Array.isArray(data.courses)) {
                        onDataLoaded(data.courses, data.slots || {});
                    } else {
                        setError("Invalid JSON format. Expected object with 'courses' array.");
                    }
                } catch (err) {
                    setError("Failed to parse JSON file.");
                }
            };
            reader.readAsText(file);
        } else if (extension === 'pdf') {
            try {
                setIsAnalyzing(true);
                const text = await extractTextFromPdf(file);
                // Directly analyze with AI
                await analyzeWithAI(text);
            } catch (err) {
                console.error(err);
                setError("Failed to extract text from PDF.");
                setIsAnalyzing(false);
            }
        } else if (extension === 'xlsx' || extension === 'xls') {
            try {
                setIsAnalyzing(true);
                const text = await extractTextFromExcel(file);
                // Directly analyze with AI
                await analyzeWithAI(text);
            } catch (err) {
                console.error(err);
                setError("Failed to extract text from Excel.");
                setIsAnalyzing(false);
            }
        } else {
            setError("Unsupported file format. Please upload JSON, PDF, or Excel.");
        }
    };

    const analyzeWithAI = async (inputText: string) => {
        if (!process.env.API_KEY) {
            setError("API Key not found. Please configure it in your environment.");
            setIsAnalyzing(false);
            return;
        }

        if (!inputText.trim()) {
            setError("No text to analyze.");
            setIsAnalyzing(false);
            return;
        }

        setError('');

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const prompt = `
You are a VIT University timetable data extraction assistant. Extract course and schedule data from the following text and return it as a VALID JSON object.

IMPORTANT: VIT SLOT GRID (This is the EXACT mapping of slots to days/times):
| Time (Slot#) | Mon  | Tue  | Wed  | Thu  | Fri  |
|--------------|------|------|------|------|------|
| 9:00  (1)    | A1   | B1   | C1   | D1   | E1   |
| 9:55  (2)    | F1   | G1   | A1   | B1   | C1   |
| 10:50 (3)    | D1   | E1   | F1   | G1   | A1   |
| 11:45 (4)    | TC1  | TA1  | B1   | C1   | TB1  |
| 1:15  (5)    | A2   | B2   | C2   | D2   | E2   |
| 2:10  (6)    | F2   | G2   | A2   | B2   | C2   |
| 3:05  (7)    | D2   | E2   | F2   | G2   | A2   |
| 4:00  (8)    | TC2  | TA2  | B2   | C2   | TB2  |

SLOT TO DAY/TIME MAPPING:
- A1: MON 9:00, WED 9:55, FRI 10:50
- A2: MON 1:15, WED 2:10, FRI 3:05
- B1: TUE 9:00, THU 9:55, WED 11:45
- B2: TUE 1:15, THU 2:10, WED 4:00
- C1: WED 9:00, FRI 9:55, THU 11:45
- C2: WED 1:15, FRI 2:10, THU 4:00
- D1: THU 9:00, MON 10:50
- D2: THU 1:15, MON 3:05
- E1: FRI 9:00, TUE 10:50
- E2: FRI 1:15, TUE 3:05
- F1: MON 9:55, WED 10:50
- F2: MON 2:10, WED 3:05
- G1: TUE 9:55, THU 10:50
- G2: TUE 2:10, THU 3:05
- TA1: TUE 11:45 only
- TA2: TUE 4:00 only
- TB1: FRI 11:45 only
- TB2: FRI 4:00 only
- TC1: MON 11:45 only
- TC2: MON 4:00 only

Lab Slots (2-hour blocks):
Morning: L1+L2, L3+L4 (Mon) | L5+L6, L7+L8 (Tue) | L9+L10, L11+L12 (Wed) | L13+L14, L15+L16 (Thu) | L17+L18, L19+L20 (Fri)
Afternoon: L21+L22, L23+L24 (Mon) | L25+L26, L27+L28 (Tue) | L29+L30, L31+L32 (Wed) | L33+L34, L35+L36 (Thu) | L37+L38, L39+L40 (Fri)

The output must strictly follow this structure:
{
    "courses": [
        {
            "code": "string (e.g., CSE2001, MAT2002)",
            "title": "string",
            "credits": number,
            "sections": [
                {
                    "id": "unique-string (e.g., CSE2001-DrRajat-B2)",
                    "courseCode": "string (same as parent course code)",
                    "faculty": "string (professor name)",
                    "theorySlot": "string (e.g., A1, B2, C1 - use the slot codes above)",
                    "labSlot": "string (optional, e.g., L1+L2, L25+L26)"
                }
            ]
        }
    ],
    "slots": {}
}

RULES:
1. Extract ALL courses and ALL sections/faculty from the text
2. Use EXACT slot codes like A1, B2, C1, etc. Do NOT use time ranges
3. If a course has multiple faculty options, create separate section entries for each
4. The "id" should be unique: use format "COURSECODE-FacultyName-Slot"
5. Lab slots are always in format L##+L## (e.g., L1+L2, L25+L26)
6. Use the grid above to convert any day/time to slot codes
7. Return ONLY valid JSON, no markdown formatting

Text to analyze:
${inputText.substring(0, 30000)} 
      `;

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
            });

            const text = response.text || '';
            // Clean up the response - remove markdown code blocks if present
            let jsonStr = text.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
            
            // Try to extract JSON if there's extra text
            const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                jsonStr = jsonMatch[0];
            }

            try {
                const data = JSON.parse(jsonStr);
                if (Array.isArray(data.courses) && data.courses.length > 0) {
                    // Validate and clean the data
                    const cleanedCourses = data.courses.map((course: any) => ({
                        code: course.code || 'UNKNOWN',
                        title: course.title || course.code || 'Unknown Course',
                        credits: course.credits || 3,
                        sections: (course.sections || []).map((sec: any) => ({
                            id: sec.id || `${course.code}-${sec.faculty}-${sec.theorySlot}`,
                            courseCode: course.code,
                            faculty: sec.faculty || 'TBA',
                            theorySlot: sec.theorySlot || '',
                            labSlot: sec.labSlot || undefined
                        }))
                    }));
                    onDataLoaded(cleanedCourses, data.slots || {});
                } else {
                    setError("AI extracted invalid data structure. No courses found.");
                }
            } catch (e) {
                console.error("JSON Parse Error:", e);
                setError("Failed to parse AI response as JSON. Please try again or use manual JSON upload.");
            }
        } catch (err) {
            console.error(err);
            setError("AI Analysis failed. Please check your API key and try again.");
        } finally {
            setIsAnalyzing(false);
        }
    };

    // Wrapper for manual text input
    const handleAiParse = () => {
        if (!aiInput.trim()) {
            setError("Please enter some text to analyze.");
            return;
        }
        setIsAnalyzing(true);
        analyzeWithAI(aiInput);
    };

    return (
        <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in zoom-in-95 duration-500">
            {/* Go Back Button */}
            {onGoBack && !isAnalyzing && (
                <button
                    onClick={onGoBack}
                    className="text-sm font-medium text-slate-500 hover:text-indigo-600 flex items-center gap-1"
                >
                    <ArrowLeft className="w-4 h-4" /> Go Back
                </button>
            )}

            <div className="bg-white rounded-2xl p-8 shadow-xl border border-slate-200">
                {isAnalyzing ? (
                    // Analyzing State - Full screen loader
                    <div className="py-12 text-center">
                        <div className="w-20 h-20 mx-auto mb-6 relative">
                            <div className="absolute inset-0 border-4 border-indigo-200 rounded-full"></div>
                            <div className="absolute inset-0 border-4 border-transparent border-t-indigo-600 rounded-full animate-spin"></div>
                            <div className="absolute inset-3 bg-indigo-100 rounded-full flex items-center justify-center">
                                <Sparkles className="w-6 h-6 text-indigo-600" />
                            </div>
                        </div>
                        <h3 className="text-xl font-bold text-slate-800 mb-2">Analyzing Your Data</h3>
                        <p className="text-slate-500 max-w-md mx-auto">
                            AutoScheduler AI is extracting courses, faculty names, and slot timings. This may take 10-20 seconds.
                        </p>
                        <div className="mt-6 flex justify-center gap-1">
                            <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{animationDelay: '0s'}}></div>
                            <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                            <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                        </div>
                    </div>
                ) : (
                    // Normal Upload State
                    <>
                        <div className="text-center mb-8">
                            <h2 className="text-2xl font-bold text-slate-900 mb-2">Upload Your Schedule Data</h2>
                            <p className="text-slate-500">Import from JSON, PDF, or Excel file</p>
                        </div>

                        {error && (
                            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 flex items-center gap-2 text-sm">
                                <AlertCircle className="w-4 h-4" />
                                {error}
                            </div>
                        )}

                        {/* File Upload Section */}
                        <div className="border-2 border-dashed border-slate-300 rounded-xl p-10 text-center hover:border-indigo-500 transition-colors bg-slate-50 mb-6">
                            <input
                                type="file"
                                accept=".json,.pdf,.xlsx,.xls"
                                onChange={handleFileUpload}
                                className="hidden"
                                id="file-upload"
                            />
                            <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center">
                                <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mb-4">
                                    <Upload className="w-8 h-8" />
                                </div>
                                <span className="text-lg font-medium text-slate-700">Click to upload file</span>
                                <span className="text-sm text-slate-500 mt-1">Supports JSON, PDF, Excel</span>
                            </label>
                            <div className="flex gap-4 justify-center mt-6 text-slate-400">
                                <div className="flex flex-col items-center gap-1">
                                    <FileJson className="w-6 h-6" />
                                    <span className="text-xs">JSON</span>
                                </div>
                                <div className="flex flex-col items-center gap-1">
                                    <FileText className="w-6 h-6" />
                                    <span className="text-xs">PDF</span>
                                </div>
                                <div className="flex flex-col items-center gap-1">
                                    <FileSpreadsheet className="w-6 h-6" />
                                    <span className="text-xs">Excel</span>
                                </div>
                            </div>
                        </div>

                        {/* Or Text Input */}
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-slate-200"></div>
                            </div>
                            <div className="relative flex justify-center">
                                <span className="px-3 bg-white text-sm text-slate-400">or paste text</span>
                            </div>
                        </div>

                        <div className="mt-6 space-y-4">
                            <textarea
                                value={aiInput}
                                onChange={(e) => setAiInput(e.target.value)}
                                placeholder="Paste your course details here (faculty names, slots, etc.)"
                                className="w-full h-32 p-4 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none text-slate-700 placeholder:text-slate-400 text-sm"
                            />
                            <div className="flex justify-end">
                                <button
                                    onClick={handleAiParse}
                                    disabled={!aiInput.trim()}
                                    className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg font-medium shadow-md hover:bg-indigo-700 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Sparkles className="w-4 h-4" />
                                    Analyze Text
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};
