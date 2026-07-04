export type ProjectStatus =
  | "planning"
  | "interviewing"
  | "writing"
  | "reviewing"
  | "completed";

export type ChapterStatus = "pending" | "interviewing" | "drafting" | "done";

export interface ChapterBrief {
  id: string;
  order: number;
  title: string;
  status: ChapterStatus;
  summary?: string | null;
}

export interface ChapterDetail extends ChapterBrief {
  content_md?: string | null;
  interview_topics?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProjectBrief {
  id: string;
  title: string;
  status: ProjectStatus;
  created_at: string;
  updated_at: string;
}

export interface ProjectDetail extends ProjectBrief {
  style_notes?: string | null;
  is_published?: boolean;
  share_token?: string | null;
  published_at?: string | null;
  chapters: ChapterBrief[];
}

export interface PublishedChapter {
  order: number;
  title: string;
  content_md: string;
}

export interface PublishedProject {
  title: string;
  published_at?: string | null;
  chapters: PublishedChapter[];
}

export interface PublishResponse {
  is_published: boolean;
  share_token: string;
  published_at?: string | null;
  published_chapter_count: number;
}

export interface InterviewMessage {
  id: string;
  role: string;
  content: string;
  created_at: string;
}

export interface InterviewResult {
  question: string;
  intent?: string;
  suggested_action?: "continue" | "write_chapter";
  reason?: string;
  session_id?: string;
}

export interface EditPreview {
  revision_id: string;
  instruction: string;
  content_before: string;
  content_after: string;
  diff_text: string;
  patches: Array<{
    paragraph_id: string;
    operation: string;
    new_text?: string | null;
  }>;
}

export interface Revision {
  id: string;
  instruction: string;
  diff_json: string;
  content_before?: string | null;
  content_after?: string | null;
  applied: boolean;
  created_at: string;
}
