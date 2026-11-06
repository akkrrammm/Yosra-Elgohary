import { notFound } from "next/navigation";

/** Sends unknown paths to the translated 404 page. */
export default function CatchAll() {
  notFound();
}
