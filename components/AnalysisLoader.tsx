import React, { useEffect, useState } from 'react';
import { Scan, Database, BrainCircuit, Target, FileOutput } from 'lucide-react';

interface AnalysisLoaderProps {
  onComplete: () => void;
}

const steps = [
  { icon: Scan, label: "Resume Parsing Engine", sub: "Extracting entities..." },
  { icon: Database, label: "Skill Normalization", sub: "Mapping ontology..." },
  { icon: Target, label: "ATS Scoring Engine", sub: "Calculating weights..." },
  { icon: BrainCircuit, label: "Role Readiness Analyzer", sub: "Detecting gaps..." },
  { icon: FileOutput, label: "Roadmap Generator", sub: "Building 90-day plan..." },
];

const AnalysisLoader: React.FC<AnalysisLoaderProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev >= steps.length - 1) {
          clearInterval(interval);
          setTimeout(onComplete, 800); // Small pause at the end
          return prev;
        }
        return prev + 1;
      });
    }, 1200); // 1.2s per step

    return () => clearInterval(interval);
  }, [onComplete]);

  return (
    <div className="max-w-xl mx-auto text-center">
      <div className="mb-12">
        <h2 className="text-3xl font-bold text-slate-900 mb-2">Analyzing Profile</h2>
        <p className="text-slate-500">Our AI engines are diagnosing your career health...</p>
      </div>

      <div className="space-y-6 relative">
        {/* Connector Line */}
        <div className="absolute left-[2rem] top-4 bottom-4 w-0.5 bg-slate-200 -z-10"></div>

        {steps.map((step, index) => {
          const Icon = step.icon;
          const isActive = index === currentStep;
          const isCompleted = index < currentStep;

          return (
            <div 
              key={index}
              className={`flex items-center gap-6 p-4 rounded-xl transition-all duration-500 border ${
                isActive 
                  ? 'bg-white border-brand-200 shadow-xl scale-105' 
                  : 'bg-transparent border-transparent opacity-60'
              }`}
            >
              <div className={`
                w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 transition-colors duration-500
                ${isActive ? 'bg-brand-600 text-white' : isCompleted ? 'bg-green-500 text-white' : 'bg-slate-200 text-slate-400'}
              `}>
                <Icon size={28} className={isActive ? 'animate-pulse' : ''} />
              </div>
              
              <div className="text-left">
                <h3 className={`font-bold text-lg ${isActive ? 'text-brand-900' : 'text-slate-700'}`}>
                  {step.label}
                </h3>
                <p className={`text-sm ${isActive ? 'text-brand-600 font-medium' : 'text-slate-400'}`}>
                  {isCompleted ? "Completed" : isActive ? step.sub : "Waiting..."}
                </p>
              </div>

              {isActive && (
                <div className="ml-auto">
                    <div className="w-2 h-2 rounded-full bg-brand-500 animate-ping"></div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AnalysisLoader;
