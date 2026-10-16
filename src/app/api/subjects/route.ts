import { Types } from "mongoose";
import { connectDB } from "@/lib/db";
import Subject from "@/models/Subject";
import Chapter from "@/models/Chapter";
import { apiHandler, ok, fail, parseJson } from "@/lib/api";
import { requireUserId } from "@/lib/session";
import { subjectSchema } from "@/lib/validators";
import { rateLimit } from "@/lib/ratelimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = apiHandler(async () => {
  const userId = await requireUserId();
  await connectDB();
  const subjects = await Subject.find({ userId }).sort({ createdAt: 1 }).lean();
  const counts = await Chapter.aggregate([
    { $match: { userId: new Types.ObjectId(userId) } },
    { $group: { _id: "$subjectId", chapters: { $sum: 1 } } },
  ]);
  const countMap = new Map(counts.map((c) => [String(c._id), c.chapters]));
  return ok(
    subjects.map((s) => ({
      ...s,
      _id: String(s._id),
      chapterCount: countMap.get(String(s._id)) ?? 0,
    }))
  );
});

export const POST = apiHandler(async (req: Request) => {
  const userId = await requireUserId();
  const limit = rateLimit(`subject:${userId}`, 30, 60_000);
  if (!limit.success) return fail("Too many requests.", 429);
  const data = await parseJson(req, subjectSchema);
  await connectDB();

  const exists = await Subject.findOne({ userId, name: data.name });
  if (exists) return fail("You already have a subject with that name.", 409);

  const subject = await Subject.create({ ...data, userId });
  return ok({ ...subject.toObject(), _id: subject._id.toString() }, 201);
});
