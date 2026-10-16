import { Types } from "mongoose";
import { connectDB } from "@/lib/db";
import Goal from "@/models/Goal";
import Subject from "@/models/Subject";
import { apiHandler, ok, parseJson } from "@/lib/api";
import { requireUserId } from "@/lib/session";
import { goalSchema } from "@/lib/validators";
import { toDateKey } from "@/lib/utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = apiHandler(async (req: Request) => {
  const userId = await requireUserId();
  await connectDB();

  const url = new URL(req.url);
  const dateKey = url.searchParams.get("date");

  const query: Record<string, unknown> = { userId };
  if (dateKey) query.dateKey = dateKey;

  const [goals, subjects] = await Promise.all([
    Goal.find(query).sort({ priority: -1, createdAt: 1 }).lean(),
    Subject.find({ userId }).lean(),
  ]);
  const subjectMap = new Map(
    subjects.map((s) => [String(s._id), { name: s.name, color: s.color }])
  );

  return ok(
    goals.map((g) => ({
      _id: String(g._id),
      kind: g.kind,
      title: g.title,
      targetMinutes: g.targetMinutes ?? 0,
      subjectId: g.subjectId ? String(g.subjectId) : null,
      subjectName: g.subjectId
        ? subjectMap.get(String(g.subjectId))?.name ?? null
        : null,
      subjectColor: g.subjectId
        ? subjectMap.get(String(g.subjectId))?.color ?? "#0d9488"
        : null,
      dateKey: g.dateKey,
      done: g.done,
      priority: g.priority,
    }))
  );
});

export const POST = apiHandler(async (req: Request) => {
  const userId = await requireUserId();
  const data = await parseJson(req, goalSchema);
  await connectDB();

  const goal = await Goal.create({
    userId: new Types.ObjectId(userId),
    kind: data.kind,
    title: data.title,
    targetMinutes: data.targetMinutes,
    subjectId: data.subjectId ? new Types.ObjectId(data.subjectId) : null,
    date: data.date,
    dateKey: toDateKey(data.date),
    priority: data.priority,
  });
  return ok({ _id: goal._id.toString() }, 201);
});
