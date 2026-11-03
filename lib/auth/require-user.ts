import { redirect } from "next/navigation";
import { getCurrentUser } from "./session";
import type { User } from "@/lib/db/schema";

// ---------------------------------------------------------------------------
// Server side guard.
//
// Call this at the top of any page or server action that requires a logged in
// user. If there is no user, it redirects to /login. If there is, it returns
// the user object so the caller can use it.
//
// Usage in a page:
//
//   const user = await requireUser();
//   // user is guaranteed to be logged in here
//
// This is the only place a page should check for login status. Do not check
// cookies manually in pages. Use this helper.
// ---------------------------------------------------------------------------

export async function requireUser(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  return user;
}