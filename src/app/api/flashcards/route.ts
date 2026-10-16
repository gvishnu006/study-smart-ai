import { Types } from "mongoose";
import { connectDB } from "@/lib/db";
import Flashcard from "@/models/Flashcard";
import { apiHandler, ok, fail, parseJson } from "@/lib/api";
import { requireUserId } from "@/lib/session";
import { flashcardsSaveSchema } from "@/lib/validators";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = apiHandler(async (req: Request) => {
  const userId = await requireUserId();
  const subjectId = new URL(req.url).searchParams.get("subjectId");
  await connectDB();
  const query: Record<string, unknown> = { userId };
  if (subjectId) query.subjectId = subjectId;
  const cards = await Flashcard.find(query).sort({ createdAt: -1 }).limit(500).lean();
  return ok(
    cards.map((c) => ({
      _id: String(c._id),
      subjectId: c.subjectId ? String(c.subjectId) : null,
      chapterId: c.chapterId ? String(c.chapterId) : null,
      front: c.front,
      back: c.back,
      familiarity: c.familiarity,
    }))
  );
});

export const POST = apiHandler(async (req: Request) => {
  const userId = await requireUserId();
  const input = await parseJson(req, flashcardsSaveSchema);
  await connectDB();
  const created = await Flashcard.insertMany(
    input.cards.map((c) => ({
      userId: new Types.ObjectId(userId),
      subjectId: input.subjectId ? new Types.ObjectId(input.subjectId) : null,
      chapterId: input.chapterId ? new Types.ObjectId(input.chapterId) : null,
      front: c.front,
      back: c.back,
    }))
  );
  return ok({ saved: created.length }, 201);
});

const patchSchema = z.object({
  familiarity: z.coerce.number().int().min(0).max(5),
});

export const PATCH = apiHandler(async (req: Request) => {
  const userId = await requireUserId();
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return fail("Missing card id.", 400);
  const { familiarity } = await parseJson(req, patchSchema);
  await connectDB();
  const card = await Flashcard.findOneAndUpdate(
    { _id: id, userId },
    { $set: { familiarity, lastReviewed: new Date() } },
    { new: true }
  ).lean();
  if (!card) return fail("Flashcard not found.", 404);
  return ok({ _id: String(card._id), familiarity: card.familiarity });
});

export const DELETE = apiHandler(async (req: Request) => {
  const userId = await requireUserId();
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return fail("Missing card id.", 400);
  await connectDB();
  const res = await Flashcard.deleteOne({ _id: id, userId });
  if (!res.deletedCount) return fail("Flashcard not found.", 404);
  return ok({ deleted: true });
});
