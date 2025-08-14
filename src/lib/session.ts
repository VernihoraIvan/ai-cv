import { createSupabaseClient } from "./supabaseClient";
import { v4 as uuidv4 } from "uuid";

export const createNewSession = async () => {
  const supabase = createSupabaseClient();
  const sessionId = uuidv4();
  const { error } = await supabase
    .from("chat_sessions")
    .insert([{ id: sessionId, session_id: sessionId }]);

  if (error) {
    console.error("Error creating session:", error);
    throw new Error("Failed to create session");
  }

  return sessionId;
};
