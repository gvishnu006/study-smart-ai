import { Types } from "mongoose";
import { connectDB } from "@/lib/db";
import Chapter from "@/models/Chapter";
import Subject from "@/models/Subject";
import { apiHandler, ok, fail, parseJson } from "@/lib/api";
import { requireUserId } from "@/lib/session";
import { chapterSchema } from "@/lib/validators";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = apiHandler(async (req: Request) => {
  const userId = await requireUserId();
  const subjectId = new URL(req.url).searchParams.get("subjectId");
  await connectDB();
  const query: Record<string, unknown> = { userId };
  if (subjectId) query.subjectId = subjectId;
  const chapters = await Chapter.find(query).sort({ order: 1, createdAt: 1 }).lean();
  return ok(chapters.map((c) => ({ ...c, _id: String(c._id) })));
});

export const POST = apiHandler(async (req: Request) => {
  const userId = await requireUserId();
  const data = await parseJson(req, chapterSchema);
  await connectDB();

  const subject = await Subject.findOne({ _id: data.subjectId, userId });
  if (!subject) return fail("Subject not found.", 404);

  const exists = await Chapter.findOne({
    userId,
    subjectId: data.subjectId,
    name: data.name,
  });
  if (exists) return fail("This chapter already exists in the subject.", 409);

  const chapter = await Chapter.create({
    userId,
    subjectId: new Types.ObjectId(data.subjectId),
    name: data.name,
    order: data.order,
    status: data.status,
    topics: data.topics,
  });
  return ok({ ...chapter.toObject(), _id: chapter._id.toString() }, 201);
});
