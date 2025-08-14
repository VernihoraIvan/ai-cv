import { smoothStream, streamText } from "ai";
import { createSupabaseClient } from "@/lib/supabaseClient";
import { createVertex } from "@ai-sdk/google-vertex/edge";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const supabase = createSupabaseClient();
  const { messages, sessionId } = await req.json();

  if (!sessionId) {
    return new Response("Session ID is required", { status: 400 });
  }

  const userMessage = messages[messages.length - 1];
  if (userMessage.role !== "user") {
    return new Response("Invalid message role", { status: 400 });
  }

  // Save user message to Supabase
  const { error: userMessageError } = await supabase
    .from("chat_messages")
    .insert([
      {
        content: userMessage.content,
        role: "user",
        session_id: sessionId,
      },
    ]);

  if (userMessageError) {
    console.error("Error saving user message:", userMessageError);
    return new Response("Failed to save user message", { status: 500 });
  }

  // Fetch chat history from Supabase
  const { data: history, error: historyError } = await supabase
    .from("chat_messages")
    .select("content, role")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: true });

  if (historyError) {
    console.error("Error fetching chat history:", historyError);
    return new Response("Failed to fetch chat history", { status: 500 });
  }

  const googleProjectId = process.env.GOOGLE_CLOUD_PROJECT_ID;
  const googleRegion = process.env.GOOGLE_REGION;
  const googleClientEmail = process.env.GOOGLE_CLOUD_CLIENT_EMAIL;
  const googlePrivateKey = process.env.GOOGLE_CLOUD_PRIVATE_KEY;

  if (
    !googleProjectId ||
    !googleRegion ||
    !googleClientEmail ||
    !googlePrivateKey
  ) {
    return new Response("Google Cloud credentials are not set", {
      status: 500,
    });
  }

  const vertex = createVertex({
    project: googleProjectId,
    location: googleRegion,
    googleCredentials: {
      clientEmail: googleClientEmail,
      privateKey: googlePrivateKey.replace(/\\n/g, "\n"),
    },
  });
  const model = vertex("gemini-2.5-flash");

  const result = streamText({
    model,
    messages: history.map((msg: any) => ({
      role: msg.role,
      content: msg.content,
    })),
    experimental_transform: smoothStream() as any,
    onFinish: async ({ text }) => {
      // Save bot reply to Supabase
      const { error: botMessageError } = await supabase
        .from("chat_messages")
        .insert([
          {
            content: text,
            role: "assistant",
            session_id: sessionId,
          },
        ]);

      if (botMessageError) {
        console.error("Error saving bot message:", botMessageError);
      }
    },
  });

  return result.toTextStreamResponse();
}
