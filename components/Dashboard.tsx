import React, { useState } from 'react';
import { AnalysisResult, InterviewQuestion, FixedResumeResult } from '../types';
import { 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer,
  Tooltip
} from 'recharts';
import { 
    Download, CheckCircle2, AlertTriangle, BookOpen, ExternalLink, 
    Wand2, MessageSquare, LayoutDashboard, Loader2, FileCheck, Copy,
    AlertOctagon, ThumbsUp, Activity, Target, AlertCircle
} from 'lucide-react';
import { fixResume, generateInterviewQuestions } from '../services/geminiService';
// @ts-ignore
import { jsPDF } from 'jspdf';

interface DashboardProps {
  data: AnalysisResult;
  userResume: string;
  targetRole: string;
}

type Tab = 'overview' | 'fixer' | 'interview';

const Dashboard: React.FC<DashboardProps> = ({ data, userResume, targetRole }) => {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  
  // Fixer State
  const [isFixing, setIsFixing] = useState(false);
  const [fixedResult, setFixedResult] = useState<FixedResumeResult | null>(null);

  // Interview State
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false);
  const [questions, setQuestions] = useState<InterviewQuestion[]>([]);

  const handleFixResume = async () => {
    setIsFixing(true);
    try {
        const missing = data.missingSkills.map(s => s.skill);
        const res = await fixResume(userResume, targetRole, missing);
        setFixedResult(res);
    } catch (e) {
        console.error(e);
        alert("Failed to fix resume. Try again.");
    } finally {
        setIsFixing(false);
    }
  };

  const downloadPDF = () => {
    if (!fixedResult) return;
    const doc = new jsPDF();
    
    // Simple text dump for reliability
    doc.setFont("helvetica");
    doc.setFontSize(10);
    
    const splitText = doc.splitTextToSize(fixedResult.markdown, 180);
    doc.text(splitText, 15, 15);
    
    doc.save("optimized_resume.pdf");
  };

  const handleGenerateQuestions = async () => {
    setIsGeneratingQuestions(true);
    try {
        const qs = await generateInterviewQuestions(userResume, targetRole);
        setQuestions(qs);
    } catch (e) {
        console.error(e);
        alert("Failed to generate questions.");
    } finally {
        setIsGeneratingQuestions(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getCircleStroke = (score: number) => {
    if (score >= 80) return "stroke-green-500";
    if (score >= 60) return "stroke-yellow-500";
    return "stroke-red-500";
  };
  
  const getLabelColor = (val: string) => {
      if (val === "Optimal" || val === "Strong") return "text-green-600 bg-green-50";
      if (val === "Moderate") return "text-yellow-600 bg-yellow-50";
      return "text-red-600 bg-red-50";
  };

  const renderOverview = () => (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* ATS Score Card - Detailed */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col items-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-500 to-accent-500"></div>
          <h3 className="text-slate-500 font-medium mb-4 uppercase tracking-wider text-xs w-full text-center">ATS Compatibility</h3>
          
          <div className="flex items-center gap-6 mb-4">
              <div className="relative w-24 h-24 flex items-center justify-center shrink-0">
                <svg className="w-full h-full transform -rotate-90">
                <circle cx="48" cy="48" r="42" stroke="#f1f5f9" strokeWidth="8" fill="none" />
                <circle 
                    cx="48" cy="48" r="42" 
                    className={`${getCircleStroke(data.atsScore)} transition-all duration-1000 ease-out`}
                    strokeWidth="8" 
                    strokeDasharray={263} 
                    strokeDashoffset={263 - (263 * data.atsScore) / 100} 
                    fill="none" 
                    strokeLinecap="round"
                />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className={`text-2xl font-bold ${getScoreColor(data.atsScore)}`}>{data.atsScore}</span>
                </div>
            </div>
            
            <div className="flex-1 space-y-2">
                 <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500 flex items-center gap-1"><Activity size={12}/> Keywords</span>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${getLabelColor(data.atsBreakdown.keywordDensity)}`}>
                        {data.atsBreakdown.keywordDensity}
                    </span>
                 </div>
                 <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500 flex items-center gap-1"><ThumbsUp size={12}/> Action Verbs</span>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${getLabelColor(data.atsBreakdown.actionVerbs)}`}>
                        {data.atsBreakdown.actionVerbs}
                    </span>
                 </div>
            </div>
          </div>
          
          {data.atsBreakdown.formattingIssues.length > 0 && (
            <div className="w-full bg-red-50 rounded-lg p-3 border border-red-100 mt-auto">
                <span className="text-xs font-bold text-red-700 flex items-center gap-1 mb-1">
                    <AlertOctagon size={12} /> Formatting Issues Detected
                </span>
                <ul className="text-xs text-red-600 space-y-1 list-disc pl-4">
                    {data.atsBreakdown.formattingIssues.slice(0, 3).map((issue, i) => (
                        <li key={i}>{issue}</li>
                    ))}
                </ul>
            </div>
          )}
        </div>

        {/* Role Readiness */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-accent-500 to-purple-500"></div>
          <h3 className="text-slate-500 font-medium mb-6 uppercase tracking-wider text-xs">Role Readiness</h3>
          
          <div className="flex-1 flex flex-col justify-center">
            <div className="flex justify-between items-end mb-2">
                <span className="text-3xl font-bold text-slate-900">{data.roleReadiness.percentage}%</span>
                <span className={`px-3 py-1 rounded-full text-sm font-semibold 
                    ${data.roleReadiness.status === 'Job Ready' ? 'bg-green-100 text-green-700' : 
                      data.roleReadiness.status === 'Almost There' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                    {data.roleReadiness.status}
                </span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-3 mb-6">
                <div 
                    className="bg-brand-600 h-3 rounded-full transition-all duration-1000" 
                    style={{ width: `${data.roleReadiness.percentage}%` }}
                ></div>
            </div>
            <div className="space-y-2">
                <div className="text-xs font-semibold text-slate-400 uppercase">Critical Gaps</div>
                {data.missingSkills.slice(0, 2).map((gap, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm text-slate-700">
                        <AlertTriangle size={14} className="text-amber-500" />
                        <span className="font-medium">{gap.skill}</span>
                        <span className="text-slate-400 text-xs">- {gap.reason}</span>
                    </div>
                ))}
            </div>
          </div>
        </div>

        {/* Skill Radar */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-pink-500"></div>
            <h3 className="text-slate-500 font-medium mb-2 uppercase tracking-wider text-xs text-center">Skill vs Market</h3>
            <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data.skillRadar}>
                        <PolarGrid stroke="#e2e8f0" />
                        <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 10 }} />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                        <Radar name="You" dataKey="A" stroke="#0ea5e9" fill="#0ea5e9" fillOpacity={0.3} />
                        <Radar name="Market" dataKey="B" stroke="#94a3b8" fill="#94a3b8" fillOpacity={0.1} />
                        <Tooltip />
                    </RadarChart>
                </ResponsiveContainer>
            </div>
        </div>
      </div>

      {/* JD Match Section (if available) */}
      {data.jdAnalysis && (
          <div className="bg-white rounded-2xl shadow-lg border border-indigo-100 overflow-hidden relative">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-500"></div>
              <div className="p-6 bg-gradient-to-r from-indigo-50 to-white border-b border-indigo-100 flex justify-between items-center">
                 <div className="flex items-center gap-3">
                     <div className="bg-indigo-100 p-2 rounded-lg text-indigo-600">
                         <Target size={24} /> 
                     </div>
                     <div>
                         <h3 className="text-lg font-bold text-indigo-900">Job Match Analysis</h3>
                         <p className="text-sm text-indigo-600">Compatibility with target JD</p>
                     </div>
                 </div>
                 <div className="text-right">
                     <span className="text-3xl font-bold text-indigo-600">{data.jdAnalysis.matchScore}%</span>
                     <span className="text-xs text-indigo-400 block font-medium uppercase tracking-wider">Match Score</span>
                 </div>
              </div>
              
              <div className="p-6">
                 <p className="text-slate-600 text-sm mb-6 bg-slate-50 p-4 rounded-xl border border-slate-100 italic">
                    "{data.jdAnalysis.summary}"
                 </p>
                 
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div>
                         <h4 className="text-xs font-bold text-green-600 uppercase tracking-wide flex items-center gap-2 mb-3">
                            <CheckCircle2 size={14} /> Matched Keywords
                         </h4>
                         <div className="flex flex-wrap gap-2">
                             {data.jdAnalysis.matchingKeywords.map((kw, i) => (
                                 <span key={i} className="px-2.5 py-1 bg-green-50 text-green-700 text-xs rounded-md border border-green-100 font-medium shadow-sm">
                                     {kw}
                                 </span>
                             ))}
                             {data.jdAnalysis.matchingKeywords.length === 0 && <span className="text-slate-400 text-xs italic">No direct keyword matches found.</span>}
                         </div>
                     </div>
                     
                     <div>
                         <h4 className="text-xs font-bold text-red-500 uppercase tracking-wide flex items-center gap-2 mb-3">
                            <AlertCircle size={14} /> Missing Keywords
                         </h4>
                         <div className="flex flex-wrap gap-2">
                             {data.jdAnalysis.missingKeywords.map((kw, i) => (
                                 <span key={i} className="px-2.5 py-1 bg-red-50 text-red-700 text-xs rounded-md border border-red-100 font-medium shadow-sm">
                                     {kw}
                                 </span>
                             ))}
                             {data.jdAnalysis.missingKeywords.length === 0 && <span className="text-slate-400 text-xs italic">No missing keywords detected. Great job!</span>}
                         </div>
                     </div>
                 </div>
              </div>
          </div>
      )}

      {/* 90 Day Roadmap */}
      <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
            <div>
                <h2 className="text-xl font-bold text-slate-900">90-Day Transformation Roadmap</h2>
                <p className="text-sm text-slate-500">Follow this plan to bridge your gaps.</p>
            </div>
        </div>
        
        <div className="p-6 space-y-8">
            {data.roadmap.map((week, idx) => (
                <div key={idx} className="relative pl-8 border-l-2 border-slate-200 last:border-0">
                    <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-brand-100 border-2 border-brand-500"></div>
                    
                    <div className="mb-1 flex items-center gap-3">
                        <span className="text-xs font-bold uppercase tracking-wider text-brand-600 bg-brand-50 px-2 py-1 rounded">
                            {week.weekRange}
                        </span>
                        <h3 className="text-lg font-bold text-slate-800">{week.theme}</h3>
                    </div>
                    
                    <p className="text-slate-600 text-sm mb-4">{week.description}</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-slate-50 rounded-lg p-4">
                            <h4 className="text-xs font-semibold text-slate-500 uppercase mb-3 flex items-center gap-2">
                                <CheckCircle2 size={14} /> Key Tasks
                            </h4>
                            <ul className="space-y-2">
                                {week.tasks.map((task, i) => (
                                    <li key={i} className="text-sm text-slate-700 flex items-start gap-2">
                                        <span className="block w-1 h-1 rounded-full bg-slate-400 mt-2 shrink-0"></span>
                                        {task}
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className="bg-indigo-50 rounded-lg p-4">
                            <h4 className="text-xs font-semibold text-indigo-500 uppercase mb-3 flex items-center gap-2">
                                <BookOpen size={14} /> Resources
                            </h4>
                            <ul className="space-y-2">
                                {week.resources.map((res, i) => (
                                    <li key={i} className="text-sm text-indigo-700 flex items-center gap-2 cursor-pointer hover:underline">
                                        <ExternalLink size={12} />
                                        {res}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            ))}
        </div>
      </div>
    </div>
  );

  const renderFixer = () => (
      <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden min-h-[500px] flex flex-col animate-in fade-in duration-500">
          <div className="p-6 border-b border-slate-100 bg-slate-50">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <Wand2 className="text-brand-600" size={24} /> AI Resume Smart-Fixer
              </h2>
              <p className="text-sm text-slate-500">Automatically rewrite your resume to include missing skills and improve ATS impact.</p>
          </div>
          
          <div className="p-8 flex-1 flex flex-col items-center">
             {!fixedResult ? (
                 <div className="text-center max-w-md space-y-6 my-auto">
                     <div className="p-6 bg-brand-50 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-4">
                        <FileCheck size={40} className="text-brand-600" />
                     </div>
                     <h3 className="text-lg font-semibold text-slate-900">Ready to Optimize?</h3>
                     <p className="text-slate-600">We will rewrite your bullet points, inject the missing skills ({data.missingSkills.length} identified), and fix formatting issues.</p>
                     
                     <button 
                        onClick={handleFixResume}
                        disabled={isFixing}
                        className="w-full py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-bold shadow-lg shadow-brand-500/30 transition-all flex items-center justify-center gap-2"
                     >
                        {isFixing ? <Loader2 className="animate-spin" /> : <Wand2 size={18} />}
                        {isFixing ? "Rewriting Resume..." : "Auto-Fix My Resume"}
                     </button>
                 </div>
             ) : (
                 <div className="w-full h-full flex flex-col gap-6">
                     <div className="bg-green-50 p-4 rounded-xl border border-green-100">
                         <h4 className="font-semibold text-green-800 mb-2 flex items-center gap-2">
                             <CheckCircle2 size={18} /> Improvements Made
                         </h4>
                         <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                             {fixedResult.improvements.map((imp, i) => (
                                 <li key={i} className="text-sm text-green-700 flex items-start gap-2">
                                     <span className="w-1.5 h-1.5 bg-green-500 rounded-full mt-1.5 shrink-0"></span>
                                     {imp}
                                 </li>
                             ))}
                         </ul>
                     </div>

                     <div className="flex-1 border rounded-xl bg-slate-50 p-4 font-mono text-sm overflow-auto whitespace-pre-wrap max-h-[500px]">
                         {fixedResult.markdown}
                     </div>

                     <div className="flex gap-4 justify-end">
                         <button 
                             onClick={() => {navigator.clipboard.writeText(fixedResult.markdown); alert("Copied!")}}
                             className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors flex items-center gap-2"
                         >
                             <Copy size={18} /> Copy Text
                         </button>
                         <button 
                             onClick={downloadPDF}
                             className="px-6 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg font-bold shadow-md transition-colors flex items-center gap-2"
                         >
                             <Download size={18} /> Download Optimized PDF
                         </button>
                     </div>
                 </div>
             )}
          </div>
      </div>
  );

  const renderInterview = () => (
    <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden min-h-[500px] animate-in fade-in duration-500">
        <div className="p-6 border-b border-slate-100 bg-slate-50">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <MessageSquare className="text-accent-600" size={24} /> Interview Simulator
            </h2>
            <p className="text-sm text-slate-500">AI-generated questions tailored to your resume gaps and target role.</p>
        </div>

        <div className="p-8">
            {questions.length === 0 ? (
                <div className="text-center max-w-md mx-auto py-12">
                     <div className="p-6 bg-accent-50 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-4">
                        <MessageSquare size={40} className="text-accent-600" />
                     </div>
                     <h3 className="text-lg font-semibold text-slate-900 mb-2">Prepare for {targetRole}</h3>
                     <p className="text-slate-600 mb-6">Generate behavioral and technical questions based on your specific profile.</p>
                     
                     <button 
                        onClick={handleGenerateQuestions}
                        disabled={isGeneratingQuestions}
                        className="px-8 py-3 bg-accent-600 hover:bg-accent-700 text-white rounded-xl font-bold shadow-lg shadow-accent-500/30 transition-all flex items-center justify-center gap-2 mx-auto"
                     >
                        {isGeneratingQuestions ? <Loader2 className="animate-spin" /> : <MessageSquare size={18} />}
                        {isGeneratingQuestions ? "Generating..." : "Generate Interview Questions"}
                     </button>
                </div>
            ) : (
                <div className="space-y-6">
                    {questions.map((q, i) => (
                        <div key={i} className="border border-slate-200 rounded-xl p-5 hover:border-brand-300 transition-colors">
                            <div className="flex items-start justify-between gap-4 mb-3">
                                <h3 className="font-semibold text-slate-900 text-lg">{q.question}</h3>
                                <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${q.type === 'Behavioral' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                                    {q.type}
                                </span>
                            </div>
                            <div className="bg-slate-50 p-4 rounded-lg">
                                <p className="text-xs font-bold text-slate-500 uppercase mb-2">Target Answer Key:</p>
                                <p className="text-sm text-slate-700">{q.expectedAnswerKey}</p>
                            </div>
                        </div>
                    ))}
                    <div className="flex justify-center pt-6">
                         <button 
                            onClick={handleGenerateQuestions}
                            className="text-brand-600 font-medium hover:underline text-sm"
                         >
                            Regenerate New Questions
                         </button>
                    </div>
                </div>
            )}
        </div>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20">
      
      {/* Navigation Tabs */}
      <div className="flex justify-center">
          <div className="bg-white p-1 rounded-xl shadow-sm border border-slate-200 inline-flex">
              <button 
                onClick={() => setActiveTab('overview')}
                className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${activeTab === 'overview' ? 'bg-brand-50 text-brand-700 shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}
              >
                  <LayoutDashboard size={16} /> Overview
              </button>
              <button 
                onClick={() => setActiveTab('fixer')}
                className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${activeTab === 'fixer' ? 'bg-brand-50 text-brand-700 shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}
              >
                  <Wand2 size={16} /> Smart Fixer
              </button>
              <button 
                onClick={() => setActiveTab('interview')}
                className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${activeTab === 'interview' ? 'bg-brand-50 text-brand-700 shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}
              >
                  <MessageSquare size={16} /> Interview Prep
              </button>
          </div>
      </div>

      {activeTab === 'overview' && renderOverview()}
      {activeTab === 'fixer' && renderFixer()}
      {activeTab === 'interview' && renderInterview()}

    </div>
  );
};

export default Dashboard;