import React from 'react';
import { AnalysisResult } from '../types';
import { 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, Tooltip
} from 'recharts';
import { Download, CheckCircle2, XCircle, AlertTriangle, BookOpen, ExternalLink, ChevronRight } from 'lucide-react';

interface DashboardProps {
  data: AnalysisResult;
}

const Dashboard: React.FC<DashboardProps> = ({ data }) => {
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

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* ATS Score Card */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col items-center justify-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-500 to-accent-500"></div>
          <h3 className="text-slate-500 font-medium mb-4 uppercase tracking-wider text-xs">ATS Compatibility</h3>
          <div className="relative w-32 h-32 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90">
              <circle cx="64" cy="64" r="56" stroke="#f1f5f9" strokeWidth="12" fill="none" />
              <circle 
                cx="64" cy="64" r="56" 
                className={`${getCircleStroke(data.atsScore)} transition-all duration-1000 ease-out`}
                strokeWidth="12" 
                strokeDasharray={351} 
                strokeDashoffset={351 - (351 * data.atsScore) / 100} 
                fill="none" 
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`text-4xl font-bold ${getScoreColor(data.atsScore)}`}>{data.atsScore}</span>
              <span className="text-xs text-slate-400">/ 100</span>
            </div>
          </div>
          <div className="mt-4 text-center">
             <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
               {data.atsScore > 75 ? "High Match" : "Optimization Needed"}
             </span>
          </div>
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
            <div className="flex justify-center gap-4 text-xs">
                <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-brand-500"></div> You</div>
                <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-slate-400"></div> Market Avg</div>
            </div>
        </div>
      </div>

      {/* 90 Day Roadmap */}
      <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
            <div>
                <h2 className="text-xl font-bold text-slate-900">90-Day Transformation Roadmap</h2>
                <p className="text-sm text-slate-500">Follow this plan to bridge your gaps.</p>
            </div>
            <button className="flex items-center gap-2 text-brand-600 hover:text-brand-700 font-medium text-sm bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-sm">
                <Download size={16} /> Export PDF
            </button>
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
};

export default Dashboard;
