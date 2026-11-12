// src/app/lists/[slug]/page.jsx
import React from "react";
import { getOfficialListBySlugOrId } from "@/lib/supabase/officialLists";
import ListDetailClient from "./ListDetailClient";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const { list } = await getOfficialListBySlugOrId(decodeURIComponent(slug || ""));
  if (!list) {
    return { title: "Official List | GrooveEstrella" };
  }
  return {
    title: `${list.title} | GrooveEstrella`,
    description:
      list.description || `Explore the official GrooveEstrella list: ${list.title}.`,
  };
}

export default async function OfficialListDetailPage({ params }) {
  const { slug } = await params;
  const { list, items } = await getOfficialListBySlugOrId(decodeURIComponent(slug || ""));
  return <ListDetailClient list={list} items={items} />;
}
