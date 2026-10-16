import { Types } from "mongoose";
import { connectDB } from "@/lib/db";
import Exam from "@/models/Exam";
import { apiHandler, ok, fail } from "@/lib/api";
import { requireUserId } from "@/lib/session";
import { examSchema } from "@/lib/validators";
import { cascadeDeleteExam } from "@/lib/cascade";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const PATCH = apiHandler(
  async (req: Request, ctx: { params: { id: string } }) => {
    const userId = await requireUserId();
    const { id } = ctx.params;
    if (!Types.ObjectId.isValid(id)) return fail("Not found.", 404);
    const body = await req.json();
    const data = examSchema.partial().parse(body);
    await connectDB();

    const update: Record<string, unknown> = { ...data };
    if (data.subjectId) update.subjectId = new Types.ObjectId(data.subjectId);

    const exam = await Exam.findOneAndUpdate({ _id: id, userId }, update, {
      new: true,
    });
    if (!exam) return fail("Not found.", 404);
    return ok({ _id: exam._id.toString() });
  }
);

export const DELETE = apiHandler(
  async (_req: Request, ctx: { params: { id: string } }) => {
    const userId = await requireUserId();
    const { id } = ctx.params;
    if (!Types.ObjectId.isValid(id)) return fail("Not found.", 404);
    await connectDB();

    const exam = await Exam.findOneAndDelete({ _id: id, userId });
    if (!exam) return fail("Not found.", 404);
    await cascadeDeleteExam(userId, id);
    return ok({ deleted: true });
  }
);
