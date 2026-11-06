"use server";

import { draftMode } from "next/headers";
import { redirect } from "next/navigation";

export async function exitPreview(path: string) {
  (await draftMode()).disable();
  // Only a path inside this site, never an outside address.
  redirect(path.startsWith("/") && !path.startsWith("//") ? path : "/");
}
