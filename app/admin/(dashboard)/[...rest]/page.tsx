import { notFound } from "next/navigation";

/** Keeps a mistyped dashboard address inside the dashboard. */
export default function UnknownDashboardPage() {
  notFound();
}
