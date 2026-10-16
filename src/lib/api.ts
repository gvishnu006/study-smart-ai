import { NextResponse } from "next/server";
import { ZodError, type ZodType } from "zod";
import { UnauthorizedError } from "@/lib/session";

export function ok<T>(data: T, init?: number) {
  return NextResponse.json({ ok: true, data }, { status: init ?? 200 });
}

export function fail(message: string, status = 400, extra?: unknown) {
  return NextResponse.json({ ok: false, error: message, extra }, { status });
}

/** Wrap an API handler with consistent error mapping. */
export function apiHandler<Args extends unknown[]>(
  handler: (...args: Args) => Promise<NextResponse>
) {
  return async (...args: Args): Promise<NextResponse> => {
    try {
      return await handler(...args);
    } catch (err) {
      if (err instanceof UnauthorizedError) {
        return fail("You must be signed in.", 401);
      }
      if (err instanceof ZodError) {
        const first = err.issues[0];
        return fail(first?.message ?? "Invalid request.", 422, err.issues);
      }
      console.error("[api] error:", err);
      const message =
        err instanceof Error ? err.message : "Something went wrong.";
      return fail(message, 500);
    }
  };
}

export async function parseJson<T>(
  req: Request,
  schema: ZodType<T>
): Promise<T> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    throw new ZodError([
      {
        code: "custom",
        message: "Invalid JSON body.",
        path: [],
      },
    ]);
  }
  return schema.parse(body);
}
