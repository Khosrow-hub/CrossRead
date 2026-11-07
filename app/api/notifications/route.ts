import { NextResponse } from "next/server";
import { eq, and, desc, count } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  notifications,
  users,
  projects,
} from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth/session";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const rows = await db
    .select({
      id: notifications.id,
      type: notifications.type,
      isRead: notifications.isRead,
      createdAt: notifications.createdAt,
      projectId: notifications.projectId,
      projectName: projects.name,
      suggestionId: notifications.suggestionId,
      actorUsername: users.username,
      actorDisplayName: users.displayName,
    })
    .from(notifications)
    .innerJoin(users, eq(notifications.actorId, users.id))
    .leftJoin(projects, eq(notifications.projectId, projects.id))
    .where(eq(notifications.userId, user.id))
    .orderBy(desc(notifications.createdAt))
    .limit(20);

  return NextResponse.json({ notifications: rows });
}

export async function PATCH() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  await db
    .update(notifications)
    .set({ isRead: true })
    .where(
      and(eq(notifications.userId, user.id), eq(notifications.isRead, false))
    );

  return NextResponse.json({ ok: true });
}