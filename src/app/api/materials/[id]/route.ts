import { Types } from "mongoose";
import { connectDB } from "@/lib/db";
import Material from "@/models/Material";
import Chapter from "@/models/Chapter";
import { apiHandler, ok, fail, parseJson } from "@/lib/api";
import { requireUserId } from "@/lib/session";
import { z } from "zod";

export const runtime = "nodejs";

const patchSchema = z.object({
  title: z.string().trim().min(1).max(160).optional(),
  chapterId: z.string().nullable().optional(),
});

export const GET = apiHandler(
  async (_req: Request, { params }: { params: { id: string } }) => {
    const userId = await requireUserId();
    await connectDB();
    const material = await Material.findOne({ _id: params.id, userId }).lean();
    if (!material) return fail("Material not found.", 404);
    return ok({
      ...material,
      _id: String(material._id),
      subjectId: String(material.subjectId),
      chapterId: material.chapterId ? String(material.chapterId) : null,
    });
  }
);

export const PATCH = apiHandler(
  async (req: Request, { params }: { params: { id: string } }) => {
    const userId = await requireUserId();
    const data = await parseJson(req, patchSchema);
    await connectDB();

    const update: Record<string, unknown> = {};
    if (data.title !== undefined) update.title = data.title;
    if (data.chapterId !== undefined) {
      if (data.chapterId) {
        const material = await Material.findOne({ _id: params.id, userId });
        if (!material) return fail("Material not found.", 404);
        const chapter = await Chapter.findOne({
          _id: data.chapterId,
          userId,
          subjectId: material.subjectId,
        });
        if (!chapter) return fail("Chapter not found in this subject.", 404);
        update.chapterId = new Types.ObjectId(data.chapterId);
      } else {
        update.chapterId = null;
      }
    }

    const material = await Material.findOneAndUpdate(
      { _id: params.id, userId },
      { $set: update },
      { new: true }
    )
      .select("-text")
      .lean();
    if (!material) return fail("Material not found.", 404);
    return ok({
      ...material,
      _id: String(material._id),
      subjectId: String(material.subjectId),
      chapterId: material.chapterId ? String(material.chapterId) : null,
    });
  }
);

export const DELETE = apiHandler(
  async (_req: Request, { params }: { params: { id: string } }) => {
    const userId = await requireUserId();
    await connectDB();
    const result = await Material.deleteOne({ _id: params.id, userId });
    if (!result.deletedCount) return fail("Material not found.", 404);
    return ok({ deleted: true });
  }
);
