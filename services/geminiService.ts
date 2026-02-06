import { GoogleGenAI, Type, Schema } from "@google/genai";
import { AnalysisResult, TargetRole, InterviewQuestion, FixedResumeResult } from "../types";

// --- Schema Definitions ---

const analysisSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    atsScore: { type: Type.NUMBER, description: "Overall ATS score out of 100" },
    atsBreakdown: {
      type: Type.OBJECT,
      properties: {
        skills: { type: Type.NUMBER },
        experience: { type: Type.NUMBER },
        projects: { type: Type.NUMBER },
        formatting: { type: Type.NUMBER },
        formattingIssues: { 
            type: Type.ARRAY, 
            items: { type: Type.STRING }, 
            description: "List of specific formatting problems (e.g., 'tables used', 'header missing', 'unreadable fonts', 'complex layout')" 
        },
        keywordDensity: { 
            type: Type.STRING, 
            enum: ["Low", "Optimal", "Excessive"], 
            description: "Assessment of relevant keyword frequency" 
        },
        actionVerbs: { 
            type: Type.STRING, 
            enum: ["Weak", "Moderate", "Strong"], 
            description: "Usage of strong action verbs in bullet points (e.g., 'Spearheaded', 'Optimized')" 
        },
      },
      required: ["skills", "experience", "projects", "formatting", "formattingIssues", "keywordDensity", "actionVerbs"],
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
          subject: { type: Type.STRING },
          A: { type: Type.NUMBER },
          B: { type: Type.NUMBER },
          fullMark: { type: Type.NUMBER },
        },
        required: ["subject", "A", "B", "fullMark"],
      },
    },
    roadmap: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          weekRange: { type: Type.STRING },
          theme: { type: Type.STRING },
          description: { type: Type.STRING },
          tasks: { type: Type.ARRAY, items: { type: Type.STRING } },
          resources: { type: Type.ARRAY, items: { type: Type.STRING } },
        },
        required: ["weekRange", "theme", "description", "tasks", "resources"],
      },
    },
    summary: { type: Type.STRING },
    jdAnalysis: {
        type: Type.OBJECT,
        properties: {
            matchScore: { type: Type.NUMBER, description: "Match percentage with provided JD (0-100)" },
            missingKeywords: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Keywords present in JD but missing in Resume" },
            matchingKeywords: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Keywords present in both" },
            summary: { type: Type.STRING, description: "Brief analysis of fit for this specific JD" }
        },
        required: ["matchScore", "missingKeywords", "matchingKeywords", "summary"]
    }
  },
  required: ["atsScore", "atsBreakdown", "missingSkills", "roleReadiness", "skillRadar", "roadmap", "summary"],
};

const interviewSchema: Schema = {
    type: Type.ARRAY,
    items: {
        type: Type.OBJECT,
        properties: {
            question: { type: Type.STRING },
            type: { type: Type.STRING, enum: ["Behavioral", "Technical"] },
            expectedAnswerKey: { type: Type.STRING, description: "Key points to mention in the answer" }
        },
        required: ["question", "type", "expectedAnswerKey"]
    }
};

const fixedResumeSchema: Schema = {
    type: Type.OBJECT,
    properties: {
        markdown: { type: Type.STRING, description: "The full rewritten resume content in Markdown format" },
        improvements: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List of key changes made" }
    },
    required: ["markdown", "improvements"]
};

// --- API Helpers ---

const getAI = () => {
    const apiKey = process.env.API_KEY;
    if (!apiKey) throw new Error("API Key is missing");
    return new GoogleGenAI({ apiKey });
}

// --- Services ---

export const analyzeResume = async (
  resumeText: string,
  targetRole: TargetRole,
  experienceYears: number,
  jdText: string = ""
): Promise<AnalysisResult> => {
  const ai = getAI();

  let prompt = `
    You are an expert AI Career Doctor and ATS Algorithm Simulator.
    Analyze the following resume text for the target role of "${targetRole}".
    The candidate has ${experienceYears} years of experience.

    Resume Text:
    "${resumeText}"
  `;

  if (jdText) {
      prompt += `
      
      JOB DESCRIPTION (JD) PROVIDED:
      "${jdText}"
      
      Compare the Resume specifically against this JD.
      `;
  }

  prompt += `
    Perform the following:
    1. Calculate a simulated ATS score based on keywords, impact, and structure.
    2. Analyze the resume specifically for:
       - Formatting issues (e.g. bad headers, confusing layout detection based on text flow).
       - Keyword density for the role (is it too sparse, optimal, or keyword stuffing?).
       - Usage of strong action verbs (Weak/Moderate/Strong).
    3. Identify critical skill gaps compared to the current market standard for ${targetRole}.
    4. Assess role readiness percentage.
    5. Generate data for a radar chart comparing the user's skills vs market average.
    6. Create a detailed 90-day learning roadmap.
    ${jdText ? `7. Perform a deep JD Match Analysis:
       - matchScore: Calculate a percentage (0-100) reflecting how well the candidate fits the requirements.
       - matchingKeywords: Extract specific hard skills and tools from the JD that appear in the resume.
       - missingKeywords: Extract specific hard skills and tools from the JD that are MISSING from the resume.
       - summary: concise analysis of the fit.` : ""}
    
    Be strict and realistic. Do not hallucinate skills present in the resume.
  `;

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
};

export const fixResume = async (resumeText: string, targetRole: string, missingSkills: string[]): Promise<FixedResumeResult> => {
    const ai = getAI();
    
    const prompt = `
        You are a top-tier Resume Writer. Rewrite the following resume to better target the role of "${targetRole}".
        
        Original Resume:
        ${resumeText}

        Instructions:
        1. Naturally incorporate these missing skills where relevant (do not lie, but frame related experience to highlight these if possible): ${missingSkills.join(", ")}.
        2. Rewrite bullet points to use the "Action + Context + Result" format. Use strong action verbs.
        3. Optimize for ATS readability (clean standard structure).
        4. Return the result in clean Markdown format.
    `;

    const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: fixedResumeSchema
        }
    });

    return JSON.parse(response.text!) as FixedResumeResult;
};

export const generateInterviewQuestions = async (resumeText: string, targetRole: string): Promise<InterviewQuestion[]> => {
    const ai = getAI();

    const prompt = `
        Generate 5 behavioral and 5 technical interview questions tailored for a ${targetRole} position, based on this resume:
        ${resumeText.substring(0, 3000)}... (truncated)

        For each question, provide "expectedAnswerKey" which lists bullet points of what a good candidate should mention.
    `;

    const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: interviewSchema
        }
    });

    return JSON.parse(response.text!) as InterviewQuestion[];
};