import React, { useState } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

interface ResumeUploaderProps {
  onContinue: (text: string) => void;
}

const ResumeUploader: React.FC<ResumeUploaderProps> = ({ onContinue }) => {
  const [text, setText] = useState('');
  const [activeTab, setActiveTab] = useState<'paste' | 'upload'>('paste');
  const [error, setError] = useState('');
  const [isParsing, setIsParsing] = useState(false);

  const handleContinue = () => {
    if (text.trim().length < 50) {
      setError("Please provide a valid resume (at least 50 characters).");
      return;
    }
    onContinue(text);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError('');
    
    // PDF Handling
    if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
        setIsParsing(true);
        try {
            // Dynamic import to ensure it uses the importmap version
            // @ts-ignore
            const pdfjsLib = await import('pdfjs-dist');
            // Set worker using a reliable CDN
            pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;

            const arrayBuffer = await file.arrayBuffer();
            const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
            const pdf = await loadingTask.promise;
            
            let fullText = "";
            for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const textContent = await page.getTextContent();
                const pageText = textContent.items.map((item: any) => item.str).join(" ");
                fullText += pageText + "\n";
            }
            
            if (fullText.trim().length < 50) {
                 throw new Error("Could not extract enough text from this PDF. It might be scanned.");
            }

            setText(fullText);
            setActiveTab('paste');
        } catch (err: any) {
            console.error(err);
            setError(err.message || "Failed to parse PDF. Please copy-paste the content.");
        } finally {
            setIsParsing(false);
        }
        return;
    }

    // Text/MD Handling
    if (file.type === "text/plain" || file.name.endsWith(".md") || file.name.endsWith(".txt")) {
        const reader = new FileReader();
        reader.onload = (ev) => {
            setText(ev.target?.result as string);
            setActiveTab('paste'); // Switch to view content
        };
        reader.readAsText(file);
    } else {
        setError("Unsupported file type. Please upload PDF, TXT, or MD.");
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
      <div className="bg-slate-50 border-b border-slate-200 p-4 flex gap-4">
        <button
          onClick={() => setActiveTab('paste')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'paste'
              ? 'bg-white text-brand-600 shadow-sm ring-1 ring-slate-200'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Paste Text
        </button>
        <button
          onClick={() => setActiveTab('upload')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'upload'
              ? 'bg-white text-brand-600 shadow-sm ring-1 ring-slate-200'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Upload File
        </button>
      </div>

      <div className="p-8">
        {activeTab === 'paste' ? (
          <div className="space-y-4">
            <label className="block text-sm font-semibold text-slate-700">
              Paste your resume content here
            </label>
            <textarea
              className="w-full h-64 p-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none resize-none font-mono text-sm text-slate-700 bg-slate-50"
              placeholder="Jane Doe&#10;Senior Software Engineer&#10;Experience..."
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                setError('');
              }}
            />
          </div>
        ) : (
          <div className="h-64 flex flex-col items-center justify-center border-2 border-dashed border-slate-300 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors relative">
            <input
                type="file"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                onChange={handleFileUpload}
                accept=".txt,.md,.pdf"
                disabled={isParsing}
            />
            {isParsing ? (
               <div className="flex flex-col items-center animate-in fade-in zoom-in">
                 <Loader2 size={32} className="text-brand-600 animate-spin mb-3" />
                 <p className="text-brand-900 font-medium">Extracting text from PDF...</p>
               </div>
            ) : (
                <>
                    <div className="w-16 h-16 bg-brand-100 text-brand-600 rounded-full flex items-center justify-center mb-4">
                    <Upload size={32} />
                    </div>
                    <p className="text-slate-900 font-medium">Click to upload or drag and drop</p>
                    <p className="text-slate-500 text-sm mt-2">PDF, TXT or MD files</p>
                </>
            )}
          </div>
        )}

        {error && (
            <div className="mt-4 flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-lg text-sm">
                <AlertCircle size={16} />
                {error}
            </div>
        )}

        <div className="mt-8 flex justify-end">
          <button
            onClick={handleContinue}
            disabled={!text.trim() || isParsing}
            className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-8 py-3 rounded-xl font-semibold transition-all shadow-lg shadow-brand-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isParsing ? <Loader2 className="animate-spin" size={20} /> : <FileText size={20} />}
            Analyze Resume
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResumeUploader;