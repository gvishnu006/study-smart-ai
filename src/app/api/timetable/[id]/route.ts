import { Types } from "mongoose";
import { connectDB } from "@/lib/db";
import TimetableEntry from "@/models/TimetableEntry";
import { apiHandler, ok, fail, parseJson } from "@/lib/api";
import { requireUserId } from "@/lib/session";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const patchSchema = z.object({
  done: z.boolean().optional(),
  startMinutes: z.coerce.number().int().min(0).max(1439).optional(),
  endMinutes: z.coerce.number().int().min(1).max(1440).optional(),
  date: z.coerce.date().optional(),
  topic: z.string().trim().max(160).optional(),
});

export const PATCH = apiHandler(
  async (req: Request, { params }: { params: { id: string } }) => {
    const userId = await requireUserId();
    const data = await parseJson(req, patchSchema);
    await connectDB();

    const update: Record<string, unknown> = {};
    if (data.done !== undefined) update.done = data.done;
    if (data.startMinutes !== undefined) update.startMinutes = data.startMinutes;
    if (data.endMinutes !== undefined) update.endMinutes = data.endMinutes;
    if (data.topic !== undefined) update.topic = data.topic;
    if (data.date !== undefined) {
      update.date = data.date;
      update.dateKey = data.date.toISOString().slice(0, 10);
    }

    const entry = await TimetableEntry.findOneAndUpdate(
      { _id: params.id, userId },
      { $set: update },
      { new: true }
    );
    if (!entry) return fail("Entry not found.", 404);
    return ok({ _id: entry._id.toString() });
  }
);

export const DELETE = apiHandler(
  async (_req: Request, { params }: { params: { id: string } }) => {
    const userId = await requireUserId();
    if (!Types.ObjectId.isValid(params.id)) return fail("Entry not found.", 404);
    await connectDB();
    const result = await TimetableEntry.deleteOne({ _id: params.id, userId });
    if (!result.deletedCount) return fail("Entry not found.", 404);
    return ok({ deleted: true });
  }
);
