export type Page =
  | 'landing'
  | 'login'
  | 'register'
  | 'kandidat'
  | 'kandidat-portfolio'
  | 'kandidat-passport'
  | 'kandidat-applications'
  | 'kebutuhan-pribadi'
  | 'hrd'
  | 'hrd-candidates'
  | 'hrd-compliance'
  | 'hrd-post-job'
  | 'interview'
  | 'settings'
  | 'job-matching'
  | 'help'
  | 'feedback';

export type UserRole = 'kandidat' | 'hrd' | 'admin';

export type DisabilityType =
  | 'tunarungu'
  | 'tunadaksa'
  | 'tunanetra'
  | 'tunawicara'
  | 'autisme'
  | 'lainnya';

export type ApplicationStatus =
  | 'applied'
  | 'screening'
  | 'interview_requested'
  | 'interview_scheduled'
  | 'hired'
  | 'rejected';

export type InterviewMode =
  | 'voice_only'
  | 'text_only'
  | 'sign_language'
  | 'video_caption'
  | 'async_video';

export interface SkillScore {
  skill: string;
  score: number;
  verifiedAt: string;
}

export interface SkillPassport {
  id: string;
  anonymousId: string;
  skills: SkillScore[];
  blockchainHash: string;
  isMasked: boolean;
  verifiedBy: 'doctor' | 'community' | 'both';
}

export interface MaskedCandidate {
  anonymousId: string;
  passport: SkillPassport;
  appliedAt: string;
  status: ApplicationStatus;
}

export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  type: string;
  skills: string[];
  accessible: boolean;
  accommodations: string[];
  postedAt: string;
}

export interface Application {
  id: string;
  jobId: string;
  jobTitle: string;
  company: string;
  status: ApplicationStatus;
  appliedAt: string;
  maskedUntil?: string;
}

export interface AccessibilityNeeds {
  screenReader: boolean;
  signLanguageInterpreter: boolean;
  captioning: boolean;
  remote: boolean;
  flexibleSchedule: boolean;
  wheelchairAccess: boolean;
  assistiveTech: boolean;
}
