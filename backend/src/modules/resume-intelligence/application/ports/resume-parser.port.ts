export type ExtractedWorkExperience = {
  company: string | null;
  role: string | null;
  startDate: string | null;
  endDate: string | null;
  description: string | null;
};

export type ExtractedCertification = {
  name: string | null;
  issuer: string | null;
  date: string | null;
};

export type ExtractedTechnicalSkill = {
  name: string | null;
  estimatedProficiency: number | null;
};

export type ExtractedResume = {
  workExperience: ExtractedWorkExperience[];
  certifications: ExtractedCertification[];
  technicalSkills: ExtractedTechnicalSkill[];
};

export const RESUME_PARSER = Symbol('RESUME_PARSER');

export interface ResumeParserPort {
  parse(resumeText: string): Promise<ExtractedResume>;
}
