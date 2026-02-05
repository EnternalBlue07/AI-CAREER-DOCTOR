import React, { useState } from 'react';
import { AppStep, TargetRole, UserConfig, AnalysisResult } from './types';
import ResumeUploader from './components/ResumeUploader';
import AnalysisLoader from './components/AnalysisLoader';
import Dashboard from './components/Dashboard';
import { analyzeResume } from './services/geminiService';
import { Briefcase, ArrowRight, UserCircle, Settings } from 'lucide-react';

const App: React.FC = () => {
  const [step, setStep] = useState<AppStep>(AppStep.LANDING);
  const [config, setConfig] = useState<UserConfig>({
    name: 'Candidate',
    resumeText: '',
    targetRole: TargetRole.BACKEND_DEV,
    experienceYears: 2
  });
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loadingError, setLoadingError] = useState<string | null>(null);

  const startApp = () => setStep(AppStep.UPLOAD);

  const handleResumeText = (text: string) => {
    setConfig(prev => ({ ...prev, resumeText: text }));
    setStep(AppStep.CONFIG);
  };

  const startAnalysis = async () => {
    setStep(AppStep.PROCESSING);
    setLoadingError(null);
    try {
      // Pass the actual resume text and user config to Gemini
      const data = await analyzeResume(config.resumeText, config.targetRole, config.experienceYears);
      setResult(data);
    } catch (err) {
      console.error(err);
      setLoadingError("Failed to analyze resume. Please check your API key and try again.");
      setStep(AppStep.CONFIG); // Go back
    }
  };

  const handleAnalysisComplete = () => {
    if (result) setStep(AppStep.DASHBOARD);
  };

  // --- Renders ---

  const renderLanding = () => (
    <div className="min-h-screen flex flex-col justify-center items-center text-center px-4 bg-gradient-to-b from-slate-50 to-white">
      <div className="mb-8 inline-flex items-center justify-center p-4 bg-brand-50 rounded-2xl text-brand-600 mb-6 animate-bounce">
        <Briefcase size={48} />
      </div>
      <h1 className="text-5xl md:text-7xl font-extrabold text-slate-900 tracking-tight mb-6">
        AI Career <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 to-accent-600">Doctor</span>
      </h1>
      <p className="text-xl text-slate-500 max-w-2xl mb-10 leading-relaxed">
        Stop guessing. Upload your resume and let our enterprise-grade AI engines diagnose your profile, score your skills, and build a 90-day roadmap to your dream job.
      </p>
      <button 
        onClick={startApp}
        className="group relative inline-flex items-center justify-center px-8 py-4 font-semibold text-white transition-all duration-200 bg-brand-600 rounded-full hover:bg-brand-700 hover:shadow-lg hover:shadow-brand-500/30 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-600"
      >
        Start Diagnosis <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
      </button>
      
      <div className="mt-16 flex gap-8 text-slate-400">
        <div className="flex items-center gap-2"><span className="w-2 h-2 bg-green-500 rounded-full"></span> Resume Parsing</div>
        <div className="flex items-center gap-2"><span className="w-2 h-2 bg-blue-500 rounded-full"></span> Gap Analysis</div>
        <div className="flex items-center gap-2"><span className="w-2 h-2 bg-purple-500 rounded-full"></span> 90-Day Plan</div>
      </div>
    </div>
  );

  const renderConfig = () => (
    <div className="max-w-2xl mx-auto w-full bg-white p-8 rounded-2xl shadow-xl border border-slate-100">
      <div className="mb-8 text-center">
        <h2 className="text-2xl font-bold text-slate-900">Target Role Configuration</h2>
        <p className="text-slate-500">Tell us where you want to go.</p>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Target Role</label>
          <select 
            value={config.targetRole}
            onChange={(e) => setConfig({...config, targetRole: e.target.value as TargetRole})}
            className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 focus:ring-2 focus:ring-brand-500 outline-none"
          >
            {Object.values(TargetRole).map(role => (
              <option key={role} value={role}>{role}</option>
            ))}
          </select>
        </div>

        <div>
           <label className="block text-sm font-medium text-slate-700 mb-2">Years of Experience: {config.experienceYears}</label>
           <input 
              type="range" 
              min="0" 
              max="15" 
              step="1"
              value={config.experienceYears}
              onChange={(e) => setConfig({...config, experienceYears: parseInt(e.target.value)})}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-brand-600"
           />
           <div className="flex justify-between text-xs text-slate-400 mt-2">
             <span>Fresher (0)</span>
             <span>Mid (5)</span>
             <span>Expert (15+)</span>
           </div>
        </div>
        
        {loadingError && (
          <div className="p-4 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
            {loadingError}
          </div>
        )}

        <button 
          onClick={startAnalysis}
          className="w-full bg-brand-600 hover:bg-brand-700 text-white py-4 rounded-xl font-bold text-lg shadow-lg shadow-brand-500/30 transition-all flex items-center justify-center gap-2"
        >
          <Settings className="animate-spin-slow" size={20} />
          Run Analysis Engine
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-brand-100">
      {step === AppStep.LANDING ? (
        renderLanding()
      ) : (
        <>
          {/* Top Navigation Bar */}
          <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
              <div className="flex items-center gap-2 cursor-pointer" onClick={() => setStep(AppStep.LANDING)}>
                <div className="bg-brand-600 text-white p-1.5 rounded-lg">
                  <Briefcase size={20} />
                </div>
                <span className="font-bold text-xl tracking-tight">AI Career Doctor</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="hidden md:flex items-center gap-2 text-sm text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full">
                  <span className={`w-2 h-2 rounded-full ${step === AppStep.DASHBOARD ? 'bg-green-500' : 'bg-brand-500 animate-pulse'}`}></span>
                  {step === AppStep.PROCESSING ? 'System Processing...' : step === AppStep.DASHBOARD ? 'Analysis Complete' : 'System Ready'}
                </div>
                <img src="https://picsum.photos/40/40" alt="User" className="w-10 h-10 rounded-full border-2 border-white shadow-sm" />
              </div>
            </div>
          </nav>

          <main className="max-w-7xl mx-auto px-4 py-12">
            {step === AppStep.UPLOAD && (
              <div className="animate-in slide-in-from-bottom-4 duration-500">
                <div className="text-center mb-10">
                  <h2 className="text-3xl font-bold text-slate-900">Upload Resume</h2>
                  <p className="text-slate-500 mt-2">Accepted formats: PDF, TXT, MD</p>
                </div>
                <ResumeUploader onContinue={handleResumeText} />
              </div>
            )}

            {step === AppStep.CONFIG && (
               <div className="animate-in slide-in-from-bottom-4 duration-500 flex justify-center">
                 {renderConfig()}
               </div>
            )}

            {step === AppStep.PROCESSING && (
              <div className="min-h-[60vh] flex flex-col items-center justify-center">
                <AnalysisLoader onComplete={handleAnalysisComplete} />
              </div>
            )}

            {step === AppStep.DASHBOARD && result && (
              <Dashboard data={result} />
            )}
          </main>
        </>
      )}
    </div>
  );
};

export default App;