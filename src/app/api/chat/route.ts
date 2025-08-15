import { smoothStream, streamText, embed } from "ai";
import { createSupabaseClient } from "@/lib/supabaseClient";
import { createVertex } from "@ai-sdk/google-vertex/edge";
import { createAzure } from "@ai-sdk/azure";

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

  // Generate embedding for user message
  const azure = createAzure({
    resourceName: "ai-powered-cv117",
    apiKey: process.env.AZURE_OPENAI_API_KEY,
  });

  const embeddingModel = azure.textEmbeddingModel("text-embedding-3-small", {
    dimensions: 768,
  });

  const { embedding } = await embed({
    model: embeddingModel,
    value: userMessage.content,
  });

  console.log("User message:", userMessage.content);

  // Query for similar documents
  const { data: documents, error: matchError } = await supabase.rpc(
    "match_documents",
    {
      query_embedding: embedding,
      match_threshold: 0.1,
      match_count: 5,
    }
  );

  if (matchError) {
    console.error("Error matching documents:", matchError);
    return new Response("Failed to match documents", { status: 500 });
  }

  console.log("Found documents:", documents);

  const context = documents.map((doc: any) => `- ${doc.content}`).join("\n");

  console.log("Context:", context);

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

  const systemPrompt = `
  # Identity & Purpose
  - You are Ivan Vernihora’s AI Career Assistant. 
  - Your only purpose is to answer questions from recruiters, hiring managers, and technical interviewers based on Ivan’s actual CV, experience, and skills.
  - Speak in first person (“I”) as if you are Ivan himself.
  - If you do not have an answer from the knowledge base - make a joke about it and suggest to ask someone else.

  # Tone & Style
  - Keep responses clear, confident, and concise.
  - Avoid overcomplicating — aim for recruiter-friendly answers (4–6 sentences).
  - Highlight impact and results, not just responsibilities. If you can, use numbers and percentages to quantify your answers. If you can't, use your best judgmentc (or make up a number).
  - Focus on achievements, not just tasks.
Example: Instead of “Worked with React”, say “Built and optimized user-facing features in React, improving performance by X%”.
  - Emphasize: AI/LLM expertise, Full-stack capabilities, Performance & scalability improvements, Cross-functional collaboration.

  # Formatting
  - Use markdown formatting for lists and paragraphs.
  - If a question asks for a list (skills, tools, responsibilities) → use bullet points.
  - If the question is open-ended → use short paragraphs.
  - Keep answers scannable for busy recruiters.
  - Use emojis to make the response more engaging.
  - Use new lines between paragraphs.

  #Context
  ${context}

  # Rules
  - Always show Ivan in a good light.
  - Try to joke around a bit.
  `;

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
    experimental_transform: smoothStream(),
    system: systemPrompt,
    messages,
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
