import { connectDB } from "@/lib/db";
import Material from "@/models/Material";
import Subject from "@/models/Subject";
import Chapter from "@/models/Chapter";
import { apiHandler, ok, fail } from "@/lib/api";
import { requireUserId } from "@/lib/session";
import { rateLimit } from "@/lib/ratelimit";
import {
  ACCEPTED_EXTENSIONS,
  MAX_FILE_BYTES,
  MAX_TEXT_CHARS,
  extractText,
} from "@/lib/extract";
import path from "path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export const GET = apiHandler(async (req: Request) => {
  const userId = await requireUserId();
  const params = new URL(req.url).searchParams;
  const subjectId = params.get("subjectId");
  const chapterId = params.get("chapterId");
  await connectDB();

  const query: Record<string, unknown> = { userId };
  if (subjectId) query.subjectId = subjectId;
  if (chapterId) query.chapterId = chapterId;

  const materials = await Material.find(query)
    .select("-text")
    .sort({ createdAt: -1 })
    .lean();

  return ok(
    materials.map((m) => ({
      ...m,
      _id: String(m._id),
      subjectId: String(m.subjectId),
      chapterId: m.chapterId ? String(m.chapterId) : null,
    }))
  );
});

export const POST = apiHandler(async (req: Request) => {
  const userId = await requireUserId();
  const limit = rateLimit(`upload:${userId}`, 20, 60_000);
  if (!limit.success) return fail("Too many uploads. Please wait a moment.", 429);

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return fail("Could not read the uploaded file.", 400);
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return fail("No file was provided.", 400);
  }
  if (file.size > MAX_FILE_BYTES) {
    return fail("File is too large. Maximum size is 15 MB.", 413);
  }
  const ext = path.extname(file.name).toLowerCase();
  if (!ACCEPTED_EXTENSIONS.includes(ext) && !file.type) {
    return fail("Unsupported file type.", 415);
  }

  const rawSubjectId = String(form.get("subjectId") || "").trim();
  const rawChapterId = String(form.get("chapterId") || "").trim();
  const subjectName = String(form.get("subjectName") || "").trim();
  const chapterName = String(form.get("chapterName") || "").trim();
  const title = (String(form.get("title") || "").trim() || file.name).slice(0, 160);
  const clientText = String(form.get("clientText") || "").trim();

  await connectDB();

  // Resolve or create subject
  let subject;
  if (rawSubjectId) {
    subject = await Subject.findOne({ _id: rawSubjectId, userId });
    if (!subject) return fail("Subject not found.", 404);
  } else if (subjectName) {
    subject =
      (await Subject.findOne({ userId, name: subjectName })) ??
      (await Subject.create({ userId, name: subjectName }));
  } else {
    return fail("Choose a subject or provide a new subject name.", 422);
  }

  // Resolve or create chapter
  let chapter = null;
  if (rawChapterId) {
    chapter = await Chapter.findOne({
      _id: rawChapterId,
      userId,
      subjectId: subject._id,
    });
    if (!chapter) return fail("Chapter not found.", 404);
  } else if (chapterName) {
    chapter =
      (await Chapter.findOne({
        userId,
        subjectId: subject._id,
        name: chapterName,
      })) ??
      (await Chapter.create({
        userId,
        subjectId: subject._id,
        name: chapterName,
      }));
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  try {
    const result = await extractText({
      buffer,
      fileName: file.name,
      mimeType: file.type || "",
      clientText: clientText || undefined,
    });

    let text = result.text;
    if (text.length > MAX_TEXT_CHARS) text = text.slice(0, MAX_TEXT_CHARS);

    const material = await Material.create({
      userId,
      subjectId: subject._id,
      chapterId: chapter ? chapter._id : null,
      title,
      fileName: file.name,
      fileType: file.type || ext,
      fileSize: file.size,
      text,
      charCount: text.length,
      status: "ready",
    });

    return ok(
      {
        ...material.toObject(),
        _id: material._id.toString(),
        subjectId: String(material.subjectId),
        chapterId: material.chapterId ? String(material.chapterId) : null,
        text: undefined,
        wordCount: text ? text.split(/\s+/).length : 0,
        method: result.method,
        pages: result.pages ?? null,
      },
      201
    );
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to read the file.";
    return fail(
      `We couldn't extract text from "${file.name}". ${message}`,
      422
    );
  }
});
