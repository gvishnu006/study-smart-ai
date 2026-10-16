import type { QuestionType } from "@/models/Question";

export interface SubjectDTO {
  _id: string;
  name: string;
  color: string;
  description?: string;
  difficulty: "easy" | "medium" | "hard";
  chapterCount?: number;
}

export interface ChapterDTO {
  _id: string;
  subjectId: string;
  name: string;
  order: number;
  status: "not-started" | "in-progress" | "done";
  topics: string[];
}

export interface MaterialDTO {
  _id: string;
  subjectId: string;
  chapterId: string | null;
  title: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  charCount: number;
  status: "processing" | "ready" | "failed";
  createdAt: string;
  wordCount?: number;
  method?: string;
  pages?: number | null;
}

export interface QuestionDTO {
  _id: string;
  type: QuestionType;
  question: string;
  options: string[];
  answer: string;
  explanation: string;
  difficulty: "easy" | "medium" | "hard";
  marks: number;
  topic: string;
  importance: number;
}

export interface QuizDTO {
  _id: string;
  title: string;
  mode: "practice" | "quiz" | "important";
  subjectId: string;
  subjectName?: string;
  subjectColor?: string;
  questionIds: string[];
  questions?: QuestionDTO[];
  createdAt: string;
  attemptCount?: number;
  bestScore?: number;
}

export interface AttemptDTO {
  _id: string;
  quizId: string;
  title: string;
  subjectId: string;
  subjectName?: string;
  subjectColor?: string;
  score: number;
  totalMarks: number;
  percentage: number;
  weakTopics: string[];
  strongTopics: string[];
  durationSeconds: number;
  completedAt: string;
  answers?: {
    questionId: string;
    response: string;
    correct: boolean;
    topic: string;
    type: QuestionType;
  }[];
}

export interface StudySessionDTO {
  _id: string;
  subjectId: string | null;
  subjectName?: string;
  subjectColor?: string;
  startedAt: string;
  endedAt: string;
  durationSeconds: number;
  mode: "manual" | "pomodoro" | "focus" | "fiveMin";
  dateKey: string;
}

export interface ExamDTO {
  _id: string;
  subjectId: string;
  subjectName?: string;
  subjectColor?: string;
  title: string;
  examDate: string;
  difficulty: "easy" | "medium" | "hard";
  importance: number;
  syllabusTopics: { name: string; done: boolean; weight: number }[];
  topicsDone?: number;
  topicsTotal?: number;
  daysUntil?: number;
  notes?: string;
}

export interface TimetableEntryDTO {
  _id: string;
  subjectId: string;
  subjectName?: string;
  subjectColor?: string;
  examId: string | null;
  examTitle?: string | null;
  topic: string;
  date?: string;
  dateKey: string;
  startMinutes: number;
  endMinutes: number;
  done: boolean;
  source: "ai" | "manual";
}

export interface FlashcardDTO {
  _id: string;
  subjectId: string | null;
  chapterId: string | null;
  front: string;
  back: string;
  familiarity: number;
}

export interface GoalDTO {
  _id: string;
  kind: "goal" | "todo";
  title: string;
  targetMinutes: number;
  subjectId: string | null;
  subjectName?: string | null;
  subjectColor?: string | null;
  date?: string;
  dateKey: string;
  done: boolean;
  priority: "low" | "medium" | "high";
}

export interface DashboardData {
  streak: { current: number; longest: number };
  dailyGoalMinutes: number;
  todayMinutes: number;
  hoursThisWeek: number;
  weekly: { day: string; minutes: number }[];
  subjectDistribution: { name: string; value: number; color: string }[];
  upcomingExams: (ExamDTO & { daysLeft: number })[];
  recentAttempts: AttemptDTO[];
  weakTopics: { topic: string; subject: string; accuracy: number; attempts: number }[];
  todayPlan: GoalDTO[];
  todayTimetable: TimetableEntryDTO[];
  aiTip: string;
  hasData: boolean;
}
