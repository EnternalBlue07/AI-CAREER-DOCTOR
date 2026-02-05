import { GoogleGenAI, Type, Schema } from "@google/genai";
import { AnalysisResult, TargetRole } from "../types";

// Define the response schema strictly to ensure consistent JSON output
const analysisSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    atsScore: { type: Type.NUMBER, description: "Overall ATS score out of 100" },
    atsBreakdown: {
      type: Type.OBJECT,
      properties: {
        skills: { type: Type.NUMBER, description: "Score for skills match (0-100)" },
        experience: { type: Type.NUMBER, description: "Score for experience relevance (0-100)" },
        projects: { type: Type.NUMBER, description: "Score for project quality (0-100)" },
        formatting: { type: Type.NUMBER, description: "Score for formatting/structure (0-100)" },
      },
      required: ["skills", "experience", "projects", "formatting"],
    },
    missingSkills: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          skill: { type: Type.STRING },
          priority: { type: Type.STRING, enum: ["High", "Medium", "Low"] },
          reason: { type: Type.STRING },
        },
        required: ["skill", "priority", "reason"],
      },
    },
    roleReadiness: {
      type: Type.OBJECT,
      properties: {
        percentage: { type: Type.NUMBER },
        status: { type: Type.STRING, enum: ["Not Ready", "Almost There", "Job Ready"] },
      },
      required: ["percentage", "status"],
    },
    skillRadar: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          subject: { type: Type.STRING, description: "Skill category name (e.g., Coding, System Design)" },
          A: { type: Type.NUMBER, description: "User score (0-100)" },
          B: { type: Type.NUMBER, description: "Market average (0-100)" },
          fullMark: { type: Type.NUMBER, description: "Always 100" },
        },
        required: ["subject", "A", "B", "fullMark"],
      },
    },
    roadmap: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          weekRange: { type: Type.STRING, description: "e.g., 'Week 1-2'" },
          theme: { type: Type.STRING },
          description: { type: Type.STRING },
          tasks: { type: Type.ARRAY, items: { type: Type.STRING } },
          resources: { type: Type.ARRAY, items: { type: Type.STRING } },
        },
        required: ["weekRange", "theme", "description", "tasks", "resources"],
      },
    },
    summary: { type: Type.STRING, description: "A brief executive summary of the profile." },
  },
  required: ["atsScore", "atsBreakdown", "missingSkills", "roleReadiness", "skillRadar", "roadmap", "summary"],
};

export const analyzeResume = async (
  resumeText: string,
  targetRole: TargetRole,
  experienceYears: number
): Promise<AnalysisResult> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key is missing");
  }

  const ai = new GoogleGenAI({ apiKey });

  const prompt = `
    You are an expert AI Career Doctor and ATS Algorithm Simulator.
    Analyze the following resume text for the target role of "${targetRole}".
    The candidate has ${experienceYears} years of experience.

    Resume Text:
    "${resumeText}"

    Perform the following:
    1. Calculate a simulated ATS score based on keywords, impact, and structure.
    2. Identify critical skill gaps compared to the current market standard for ${targetRole}.
    3. Assess role readiness percentage.
    4. Generate data for a radar chart comparing the user's skills vs market average in 5-6 key categories (e.g. Languages, Frameworks, Soft Skills, Tools, Architecture).
    5. Create a detailed 90-day learning roadmap (broken into 2-week sprints) to close gaps and get hired.
    
    Be strict and realistic. Do not hallucinate skills present in the resume.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: analysisSchema,
      },
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");

    return JSON.parse(text) as AnalysisResult;
  } catch (error) {
    console.error("Analysis failed:", error);
    throw error;
  }
};
