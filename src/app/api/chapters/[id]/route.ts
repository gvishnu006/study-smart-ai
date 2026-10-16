import { connectDB } from "@/lib/db";
import Chapter from "@/models/Chapter";
import Material from "@/models/Material";
import { apiHandler, ok, fail, parseJson } from "@/lib/api";
import { requireUserId } from "@/lib/session";
import { chapterSchema } from "@/lib/validators";

export const runtime = "nodejs";

export const PATCH = apiHandler(
  async (req: Request, { params }: { params: { id: string } }) => {
    const userId = await requireUserId();
    const data = await parseJson(req, chapterSchema.partial());
    await connectDB();
    const update: Record<string, unknown> = { ...data };
    delete update.subjectId;
    const chapter = await Chapter.findOneAndUpdate(
      { _id: params.id, userId },
      { $set: update },
      { new: true }
    ).lean();
    if (!chapter) return fail("Chapter not found.", 404);
    return ok({ ...chapter, _id: String(chapter._id) });
  }
);

export const DELETE = apiHandler(
  async (_req: Request, { params }: { params: { id: string } }) => {
    const userId = await requireUserId();
    await connectDB();
    const chapter = await Chapter.findOne({ _id: params.id, userId });
    if (!chapter) return fail("Chapter not found.", 404);
    await Material.updateMany(
      { userId, chapterId: params.id },
      { $set: { chapterId: null } }
    );
    await Chapter.deleteOne({ _id: params.id, userId });
    return ok({ deleted: true });
  }
);
