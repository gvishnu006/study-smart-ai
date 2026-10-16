import { Types } from "mongoose";
import { connectDB } from "@/lib/db";
import StudySession from "@/models/StudySession";
import { apiHandler, ok, fail, parseJson } from "@/lib/api";
import { requireUserId } from "@/lib/session";
import { studySessionSchema } from "@/lib/validators";
import { updateStreak } from "@/lib/queries";
import { getTrackerData } from "@/lib/tracker";
import { toDateKey } from "@/lib/utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = apiHandler(async () => {
  const userId = await requireUserId();
  await connectDB();
  const data = await getTrackerData(userId);
  return ok(data);
});

export const POST = apiHandler(async (req: Request) => {
  const userId = await requireUserId();
  const input = await parseJson(req, studySessionSchema);
  await connectDB();

  if (input.durationSeconds < 10) {
    return fail("That session was too short to record.", 400);
  }

  const session = await StudySession.create({
    userId: new Types.ObjectId(userId),
    subjectId: input.subjectId ? new Types.ObjectId(input.subjectId) : null,
    chapterId: input.chapterId ? new Types.ObjectId(input.chapterId) : null,
    startedAt: input.startedAt,
    endedAt: input.endedAt,
    durationSeconds: input.durationSeconds,
    mode: input.mode,
    note: input.note ?? "",
    dateKey: toDateKey(input.startedAt),
  });

  await updateStreak(userId);

  return ok({ _id: session._id.toString() }, 201);
});
