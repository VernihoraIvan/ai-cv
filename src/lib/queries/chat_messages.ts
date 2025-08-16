"use server";

import { createSupabaseClient } from "../supabaseClient";

export const getChatMessages = async (sessionId: string) => {
  const supabase = createSupabaseClient();
  const { data, error } = await supabase
    .from("chat_messages")
    .select("content, role")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error fetching messages:", error);
    return null;
  }

  return data;
};
