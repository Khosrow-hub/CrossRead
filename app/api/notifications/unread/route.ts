import { NextResponse } from "next/server";
import { eq, and, count } from "drizzle-orm";
import { db } from "@/lib/db";
import { notifications } from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth/session";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const result = await db
    .select({ value: count() })
    .from(notifications)
    .where(
      and(eq(notifications.userId, user.id), eq(notifications.isRead, false))
    );

  return NextResponse.json({ count: result[0]?.value ?? 0 });
}