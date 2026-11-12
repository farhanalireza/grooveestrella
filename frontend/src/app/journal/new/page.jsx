// src/app/journal/new/page.jsx
import React, { Suspense } from "react";
import JournalEditorClient from "./JournalEditorClient";

export const metadata = {
  title: "Log a Listen | GrooveEstrella",
  description: "Record your listen date, rating, thoughts, and listening context in your Music Journal.",
};

export default function NewJournalEntryPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[var(--theme-bg)] text-[var(--theme-muted)] flex items-center justify-center text-sm font-medium">
          Opening music journal...
        </div>
      }
    >
      <JournalEditorClient />
    </Suspense>
  );
}
