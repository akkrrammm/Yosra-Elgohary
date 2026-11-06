import type { ActionResult } from "./admin";

/**
 * Runs a dashboard action from the browser. A lost connection rejects instead of returning
 * a result, which would leave a button spinning forever, so it becomes an ordinary message.
 */
export async function callAction<T>(action: () => Promise<ActionResult<T>>): Promise<ActionResult<T>> {
  try {
    return await action();
  } catch (error) {
    console.error("[cms]", error);
    return { ok: false, error: "Could not reach the website, so nothing was saved. Please check your connection and try again." };
  }
}
