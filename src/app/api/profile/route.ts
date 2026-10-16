import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { apiHandler, ok, fail, parseJson } from "@/lib/api";
import { requireUserId } from "@/lib/session";
import { profileSchema } from "@/lib/validators";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = apiHandler(async () => {
  const userId = await requireUserId();
  await connectDB();
  const user = await User.findById(userId).lean();
  if (!user) return fail("Not found.", 404);
  return ok({
    name: user.name,
    email: user.email,
    course: user.course ?? "",
    image: user.image ?? null,
    provider: user.provider,
    dailyGoalMinutes: user.dailyGoalMinutes,
    prefs: user.prefs,
  });
});

const patchSchema = profileSchema.partial().extend({
  prefs: profileSchema.shape.prefs,
});

export const PATCH = apiHandler(async (req: Request) => {
  const userId = await requireUserId();
  const data = await parseJson(req, patchSchema);
  await connectDB();

  const update: Record<string, unknown> = {};
  if (data.name !== undefined) update.name = data.name;
  if (data.course !== undefined) update.course = data.course;
  if (data.dailyGoalMinutes !== undefined)
    update.dailyGoalMinutes = data.dailyGoalMinutes;
  if (data.prefs) {
    for (const [k, v] of Object.entries(data.prefs)) {
      if (v !== undefined) update[`prefs.${k}`] = v;
    }
  }

  const user = await User.findByIdAndUpdate(userId, { $set: update }, { new: true });
  if (!user) return fail("Not found.", 404);
  return ok({ updated: true });
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z
    .string()
    .min(8, "Password must be at least 8 characters.")
    .max(100),
});

export const PUT = apiHandler(async (req: Request) => {
  const userId = await requireUserId();
  const data = await parseJson(req, passwordSchema);
  await connectDB();

  const user = await User.findById(userId).select("+passwordHash");
  if (!user) return fail("Not found.", 404);
  if (user.provider !== "credentials" || !user.passwordHash) {
    return fail("Password login isn't enabled for this account.", 400);
  }

  const bcrypt = (await import("bcryptjs")).default;
  const valid = await bcrypt.compare(data.currentPassword, user.passwordHash);
  if (!valid) return fail("Your current password is incorrect.", 400);

  user.passwordHash = await bcrypt.hash(data.newPassword, 12);
  await user.save();
  return ok({ updated: true });
});
