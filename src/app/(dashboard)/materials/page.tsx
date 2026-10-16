import type { Metadata } from "next";
import { connectDB } from "@/lib/db";
import { requireUserPage } from "@/lib/session";
import Subject from "@/models/Subject";
import Chapter from "@/models/Chapter";
import Material from "@/models/Material";
import { PageHeader } from "@/components/shared/page-header";
import { MaterialsView } from "@/components/materials/materials-view";

export const metadata: Metadata = { title: "Materials" };
export const dynamic = "force-dynamic";

export default async function MaterialsPage() {
  const userId = await requireUserPage();
  await connectDB();

  const [subjects, chapters, materials] = await Promise.all([
    Subject.find({ userId }).sort({ createdAt: 1 }).lean(),
    Chapter.find({ userId }).sort({ order: 1, createdAt: 1 }).lean(),
    Material.find({ userId })
      .select("-text")
      .sort({ createdAt: -1 })
      .lean(),
  ]);

  const subjectsDTO = subjects.map((s) => ({
    _id: String(s._id),
    name: s.name,
    color: s.color,
    description: s.description ?? "",
    difficulty: s.difficulty,
  }));

  const chaptersDTO = chapters.map((c) => ({
    _id: String(c._id),
    subjectId: String(c.subjectId),
    name: c.name,
    order: c.order,
    status: c.status,
    topics: c.topics ?? [],
  }));

  const materialsDTO = materials.map((m) => ({
    _id: String(m._id),
    subjectId: String(m.subjectId),
    chapterId: m.chapterId ? String(m.chapterId) : null,
    title: m.title,
    fileName: m.fileName,
    fileType: m.fileType,
    fileSize: m.fileSize,
    charCount: m.charCount,
    status: m.status,
    createdAt: m.createdAt.toISOString(),
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Study materials"
        description="Upload notes, textbooks or a syllabus. We extract the text so the AI can quiz, summarize and answer questions from your own material."
      />
      <MaterialsView
        initialSubjects={subjectsDTO}
        initialChapters={chaptersDTO}
        initialMaterials={materialsDTO}
      />
    </div>
  );
}
