import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { apiHandler, ok, fail, parseJson } from "@/lib/api";
import { registerSchema } from "@/lib/validators";
import { rateLimit } from "@/lib/ratelimit";

export const runtime = "nodejs";

export const POST = apiHandler(async (req: Request) => {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const limit = rateLimit(`register:${ip}`, 8, 60_000);
  if (!limit.success) {
    return fail("Too many attempts. Please try again in a minute.", 429);
  }

  const { name, email, password, course } = await parseJson(req, registerSchema);

  await connectDB();

  const existing = await User.findOne({ email });
  if (existing) {
    return fail("An account with this email already exists.", 409);
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await User.create({
    name,
    email,
    passwordHash,
    course: course || "",
    provider: "credentials",
  });

  return ok(
    { id: user._id.toString(), name: user.name, email: user.email },
    201
  );
});
