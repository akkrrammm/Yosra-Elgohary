"use client";

import { useEffect } from "react";

const COLORS = { ink: "#17151f", soft: "#f5f0ff", lime: "#c5ff41" };

/**
 * Shown only if a page cannot be built at all, such as the database being unreachable with no
 * saved copy to serve. It replaces the whole page, so it brings its own styles and has no way
 * of knowing which language was open.
 */
export default function GlobalError({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100svh",
          display: "grid",
          placeItems: "center",
          padding: "1.5rem",
          background: COLORS.ink,
          color: COLORS.soft,
          fontFamily: "ui-sans-serif, system-ui, sans-serif",
          textAlign: "center",
        }}
      >
        <title>Something went wrong</title>
        <main>
          <h1 style={{ fontSize: "clamp(2rem, 6vw, 3.5rem)", margin: 0 }}>Something went wrong</h1>
          <p style={{ fontSize: "1.125rem", marginBlock: "1rem 0" }}>This page could not be loaded. Please try again in a moment.</p>
          <p lang="ar" dir="rtl" style={{ fontSize: "1.125rem", marginBlock: "0.5rem 2rem" }}>
            تعذر تحميل هذه الصفحة. حاول مرة أخرى بعد لحظات.
          </p>
          <button
            type="button"
            onClick={() => retry()}
            style={{ background: COLORS.lime, color: COLORS.ink, border: 0, borderRadius: 999, padding: "0.875rem 1.75rem", font: "inherit", fontWeight: 600, cursor: "pointer" }}
          >
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
