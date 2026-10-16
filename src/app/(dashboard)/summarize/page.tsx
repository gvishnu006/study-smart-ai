import type { Metadata } from "next";
import { connectDB } from "@/lib/db";
import { requireUserPage } from "@/lib/session";
import Subject from "@/models/Subject";
import Chapter from "@/models/Chapter";
import Flashcard from "@/models/Flashcard";
import { PageHeader } from "@/components/shared/page-header";
import { StudyTools } from "@/components/ai/study-tools";

export const metadata: Metadata = { title: "AI tools" };
export const dynamic = "force-dynamic";

export default async function SummarizePage() {
  const userId = await requireUserPage();
  await connectDB();

  const [subjects, chapters, flashcards] = await Promise.all([
    Subject.find({ userId }).sort({ createdAt: 1 }).lean(),
    Chapter.find({ userId }).sort({ order: 1 }).lean(),
    Flashcard.find({ userId }).sort({ createdAt: -1 }).limit(500).lean(),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="AI study tools"
        description="Turn any chapter into a summary, a list of key points, a mind map, flashcards, or a conversation. Everything is grounded in your own uploaded material."
      />
      <StudyTools
        subjects={subjects.map((s) => ({
          _id: String(s._id),
          name: s.name,
          color: s.color,
          difficulty: s.difficulty,
          description: s.description ?? "",
        }))}
        chapters={chapters.map((c) => ({
          _id: String(c._id),
          subjectId: String(c.subjectId),
          name: c.name,
          order: c.order,
          status: c.status,
          topics: c.topics ?? [],
        }))}
        initialFlashcards={flashcards.map((f) => ({
          _id: String(f._id),
          subjectId: f.subjectId ? String(f.subjectId) : null,
          chapterId: f.chapterId ? String(f.chapterId) : null,
          front: f.front,
          back: f.back,
          familiarity: f.familiarity,
        }))}
      />
    </div>
  );
}
