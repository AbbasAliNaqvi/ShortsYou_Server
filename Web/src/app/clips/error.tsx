"use client";

import { useEffect } from "react";

export default function ClipsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[ClipsError]", error);
  }, [error]);

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "#0a0a0c",
        color: "#ebe2e0",
        fontFamily: "system-ui, sans-serif",
        padding: 32,
        textAlign: "center",
      }}
    >
      <h2 style={{ fontSize: 20, marginBottom: 8 }}>
        Something went wrong loading Clips
      </h2>
      <p style={{ color: "#7a6f6c", fontSize: 14, maxWidth: 480, marginBottom: 4 }}>
        {error.message}
      </p>
      {error.digest && (
        <p style={{ color: "#5a504d", fontSize: 11, fontFamily: "monospace" }}>
          Digest: {error.digest}
        </p>
      )}
      <button
        onClick={reset}
        style={{
          marginTop: 20,
          padding: "10px 24px",
          background: "#80182a",
          color: "#fff",
          border: "none",
          borderRadius: 8,
          cursor: "pointer",
          fontSize: 13,
          fontWeight: 600,
        }}
      >
        Try again
      </button>
    </main>
  );
}
