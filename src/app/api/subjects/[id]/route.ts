import { connectDB } from "@/lib/db";
import Subject from "@/models/Subject";
import { apiHandler, ok, fail, parseJson } from "@/lib/api";
import { requireUserId } from "@/lib/session";
import { subjectSchema } from "@/lib/validators";
import { deleteSubjectCascade } from "@/lib/cascade";

export const runtime = "nodejs";

export const PATCH = apiHandler(
  async (req: Request, { params }: { params: { id: string } }) => {
    const userId = await requireUserId();
    const data = await parseJson(req, subjectSchema.partial());
    await connectDB();
    const subject = await Subject.findOneAndUpdate(
      { _id: params.id, userId },
      { $set: data },
      { new: true }
    ).lean();
    if (!subject) return fail("Subject not found.", 404);
    return ok({ ...subject, _id: String(subject._id) });
  }
);

export const DELETE = apiHandler(
  async (_req: Request, { params }: { params: { id: string } }) => {
    const userId = await requireUserId();
    await connectDB();
    const subject = await Subject.findOne({ _id: params.id, userId });
    if (!subject) return fail("Subject not found.", 404);
    await deleteSubjectCascade(userId, params.id);
    await Subject.deleteOne({ _id: params.id, userId });
    return ok({ deleted: true });
  }
);

export const GET = apiHandler(
  async (_req: Request, { params }: { params: { id: string } }) => {
    const userId = await requireUserId();
    await connectDB();
    const subject = await Subject.findOne({ _id: params.id, userId }).lean();
    if (!subject) return fail("Subject not found.", 404);
    return ok({ ...subject, _id: String(subject._id) });
  }
);
