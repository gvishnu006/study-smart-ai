import { Types } from "mongoose";
import { connectDB } from "@/lib/db";
import Goal from "@/models/Goal";
import { apiHandler, ok, fail, parseJson } from "@/lib/api";
import { requireUserId } from "@/lib/session";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const patchSchema = z.object({
  title: z.string().trim().min(1).max(160).optional(),
  done: z.boolean().optional(),
  priority: z.enum(["low", "medium", "high"]).optional(),
  targetMinutes: z.coerce.number().int().min(0).max(1440).optional(),
});

export const PATCH = apiHandler(
  async (req: Request, { params }: { params: { id: string } }) => {
    const userId = await requireUserId();
    const data = await parseJson(req, patchSchema);
    await connectDB();

    const update: Record<string, unknown> = { ...data };
    if (data.done !== undefined) {
      update.completedAt = data.done ? new Date() : null;
    }

    const goal = await Goal.findOneAndUpdate({ _id: params.id, userId }, update, {
      new: true,
    });
    if (!goal) return fail("Goal not found.", 404);
    return ok({ _id: goal._id.toString() });
  }
);

export const DELETE = apiHandler(
  async (_req: Request, { params }: { params: { id: string } }) => {
    const userId = await requireUserId();
    if (!Types.ObjectId.isValid(params.id)) return fail("Goal not found.", 404);
    await connectDB();
    const result = await Goal.deleteOne({ _id: params.id, userId });
    if (!result.deletedCount) return fail("Goal not found.", 404);
    return ok({ deleted: true });
  }
);
