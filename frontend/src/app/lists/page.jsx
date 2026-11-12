// src/app/lists/page.jsx
import React from "react";
import { getOfficialLists } from "@/lib/supabase/officialLists";
import ListsClient from "./ListsClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Official Curated Lists | GrooveEstrella",
  description:
    "Explore GrooveEstrella official curated rankings, genre essentials, and artist listening orders.",
};

export default async function OfficialListsPage() {
  const lists = await getOfficialLists();
  return <ListsClient initialLists={lists} />;
}
