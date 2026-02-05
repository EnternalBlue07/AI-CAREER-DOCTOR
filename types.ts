export enum AppStep {
  LANDING,
  UPLOAD,
  CONFIG,
  PROCESSING,
  DASHBOARD
}

export enum TargetRole {
  BACKEND_DEV = "Backend Engineer",
  FRONTEND_DEV = "Frontend Engineer",
  FULLSTACK_DEV = "Full Stack Engineer",
  DATA_SCIENTIST = "Data Scientist",
  AI_ENGINEER = "AI Engineer",
  DEVOPS = "DevOps Engineer",
  PRODUCT_MANAGER = "Product Manager"
}

export interface RoadmapWeek {
  weekRange: string;
  theme: string;
  description: string;
  tasks: string[];
  resources: string[];
}

export interface AnalysisResult {
  atsScore: number;
  atsBreakdown: {
    skills: number;
    experience: number;
    projects: number;
    formatting: number;
  };
  missingSkills: {
    skill: string;
    priority: "High" | "Medium" | "Low";
    reason: string;
  }[];
  roleReadiness: {
    percentage: number;
    status: "Not Ready" | "Almost There" | "Job Ready";
  };
  skillRadar: {
    subject: string;
    A: number; // User
    B: number; // Market Average
    fullMark: number;
  }[];
  roadmap: RoadmapWeek[];
  summary: string;
}

export interface UserConfig {
  name: string;
  resumeText: string;
  targetRole: TargetRole;
  experienceYears: number;
}
